# Multi-PFP Mint: Architecture Analysis for Backend Review

## Context

We want to let players mint 1-10 PFPs in a single session with one wallet approval instead of N separate approvals. This document analyzes the payment flow, failure scenarios, and proposes two approaches for handling the edge case where a server-side mint fails after the user has already paid.

## Current Single-Mint Flow (for reference)

```
User wallet signs 1 tx:
  ├── transferSol(0.05 SOL → treasury)   ← payment
  └── mintV2(metadata → merkle tree)      ← NFT creation
Both instructions are atomic — either both land on-chain or neither does.
```

**Backend files involved:**
- `backend/src/services/pfp.service.ts` — `preparePfpMint()` builds the tx, `confirmPfpMint()` submits+confirms
- `backend/src/services/mint.service.ts` — `prepareMintTransaction()` builds mintV2+transferSol, `submitSignedTransaction()` submits to Helius, `confirmUserMint()` parses asset ID
- `backend/src/routes/pfp.routes.ts` — `/pfp/prepare` and `/pfp/confirm` endpoints

**Timing per mint:**
- `preparePfpMint`: generate PFP + Arweave upload = ~30-35s
- Wallet approval: user-dependent
- `confirmPfpMint`: submit tx + confirm + parse asset ID = ~10-30s
- **Total: ~40-65s per PFP**

## Proposed Multi-Mint Flow

```
Step 1 — ONE wallet approval:
  User signs 1 tx: transferSol(N × 0.05 SOL → treasury)
  Backend confirms payment on-chain.

Step 2 — N server-paid mints (no more wallet popups):
  For each of N PFPs:
    1. Generate random PFP (crypto seed → pixel art → CRT effects)
    2. Upload image + metadata to Arweave (~30-35s)
    3. mintCompressedNFT() — server-paid via authority keypair (~10-20s)
    4. Record in mint_log, update user profile

Frontend loops through step 2, showing progress per mint.
```

**Key change:** Payment is decoupled from minting. The user pays upfront via `transferSol` only. The actual NFT minting uses `mintCompressedNFT()` (server-paid) — the server's authority keypair pays the negligible Solana tx fee (~0.000005 SOL per mint).

### New backend pieces needed

1. **`POST /pfp/prepare-batch`** — takes `{ quantity: N }`, checks eligibility, reserves N whitelist slots, builds a payment-only tx (`transferSol(N * 0.05 SOL)`), partially signs, returns serialized tx + batchId
2. **`POST /pfp/confirm-batch`** — takes `{ batchId, signedTransactionBase64 }`, submits payment tx, confirms it, marks batch as paid
3. **`POST /pfp/mint-from-batch`** — takes `{ batchId }`, generates+uploads+mints ONE PFP server-paid, deducting from the batch. Frontend calls this N times in a loop, showing progress per mint.

---

## Failure Scenarios

### Scenario 1: Payment tx fails to land on-chain
- `submitSignedTransaction()` throws after 60s of polling
- **Impact:** User paid nothing. Whitelist slots were reserved at prepare time.
- **Required action:** Release the N reserved whitelist slots (same pattern as existing `preparePfpMint` catch block: `mints_used -= N`)
- **Risk level:** Low — this is the same failure mode as today's single mint

### Scenario 2: User rejects wallet approval
- Frontend catches "User rejected the request"
- **Impact:** Nothing happened. No tx submitted.
- **Required action:** Release reserved whitelist slots (frontend could call a cancel endpoint, or slots expire after TTL)
- **Risk level:** Low

### Scenario 3: Payment succeeds, mint K of N fails (the hard one)
- User paid N × 0.05 SOL. Payment is confirmed on-chain and irreversible.
- Mints 1 through K-1 succeeded. Mint K fails (RPC error, Arweave upload timeout, tree full, etc.)
- **Impact:** User overpaid by `(N - K + 1) × 0.05 SOL` for PFPs they didn't receive.
- **This is the scenario that needs a design decision.**

### Scenario 4: User disconnects mid-batch
- Payment already confirmed. Mints 1-3 of 5 completed. User closes browser.
- **Impact:** Same as Scenario 3 — user overpaid for mints 4-5.
- **Required action:** Whatever mechanism handles Scenario 3 must also survive disconnection.

### Scenario 5: Arweave upload succeeds but on-chain mint fails
- PFP was generated and uploaded to Arweave (costs server money via Irys), but `mintCompressedNFT()` fails.
- **Impact:** Arweave upload cost is wasted (small, server-absorbed). User's PFP exists on Arweave but not on-chain.
- **Required action:** Could retry mint with the same Arweave URI. Or discard and move on.

---

## Approach A: Persistent Credits

**Concept:** Store unused mint credits in the database. If a mint fails after retries, the credit persists for future use.

**DB change:** Add `pfp_credits INTEGER DEFAULT 0` column to `mint_whitelist` (new migration).

**Flow:**
1. `prepare-batch`: calculates payment as `(quantity - existing_credits) × 0.05 SOL` (clamped to >= 0). If user has enough credits, payment tx can be 0 SOL (skip wallet approval entirely).
2. `confirm-batch`: on payment confirmation, set `pfp_credits += quantity` (or just the paid portion if credits were used).
3. `mint-from-batch`: on each successful mint, decrement `pfp_credits -= 1`. On failure after 3 retries, leave the credit untouched — it stays for next time.
4. On disconnect: credits remain in DB. Next session, `prepare-batch` sees existing credits and reduces the payment.

**Pros:**
- User never loses money — overpayment becomes future credit
- Survives disconnections naturally
- Enables a nice UX: "2 credits remaining from last session" on return visit
- Credits also work if we later add other mint types

**Cons:**
- Requires a DB migration (one column, trivial)
- Slightly more complex accounting logic
- Credits could accumulate if minting is persistently broken (unlikely)

**Edge case:** What if the user has 3 credits and wants to mint 5? Payment = `(5-3) × 0.05 = 0.10 SOL`. If the payment tx fails, the 3 existing credits are unaffected.

### Approach B: Aggressive Retry Only

**Concept:** No credit system. Retry each failed mint up to 3 times. If all retries fail, that mint is lost.

**DB change:** None.

**Flow:**
1. `prepare-batch`: payment = `quantity × 0.05 SOL` (always).
2. `confirm-batch`: confirms payment.
3. `mint-from-batch`: on failure, retry up to 3 times with exponential backoff. If all retries fail, return `{ success: false, reason: "..." }` for that mint.
4. On disconnect: any remaining unminted PFPs are lost. User overpaid.

**Pros:**
- Simpler implementation — no credit tracking, no migration
- In practice, mint failures are rare (mostly Arweave timeouts or RPC hiccups, which retries fix)
- 3 retries × 3 failure types covers ~99% of transient errors

**Cons:**
- If a mint genuinely fails after 3 retries, user loses 0.05 SOL per failed mint
- Disconnect mid-batch = lost mints with no recovery
- No way to "resume" a batch later

---

## Recommendation

**Approach A (Credits) + Approach B (Retries) combined:**
- Retry each failed mint up to 3 times (handles transient errors)
- If still failing, preserve the credit in DB (handles persistent errors + disconnections)
- Best of both worlds: retries catch 99% of issues, credits catch the rest

The migration is a single `ALTER TABLE mint_whitelist ADD COLUMN pfp_credits INTEGER DEFAULT 0` — trivial cost for significant robustness.

---

## Summary of Backend Work

| Item | Scope |
|------|-------|
| New migration: `pfp_credits` column | 1 ALTER TABLE |
| `POST /pfp/prepare-batch` | New endpoint: eligibility check, reserve slots, build payment-only tx |
| `POST /pfp/confirm-batch` | New endpoint: submit payment tx, record credits |
| `POST /pfp/mint-from-batch` | New endpoint: generate+upload+mint 1 PFP server-paid, deduct 1 credit, retry up to 3× |
| `POST /pfp/cancel-batch` (optional) | Release reserved slots if user abandons before payment |
| Modify `prepareMintTransaction` or new fn | Build a payment-only tx (transferSol only, no mintV2) |
| Modify `getPfpStatus` | Include `pfp_credits` in status response |

**Frontend work** (separate from backend):
- Quantity prompt in game engine before minting
- Loop calling `mint-from-batch` N times with progress/flavor UI
- Handle credits display ("2 credits from last session")