# Terminal Text Adventure Game

Retro CRT terminal-themed text adventure game gated by Solana cNFT ownership. Features persistent cloud saves, achievement/campaign tracking, real-time multiplayer chat, embedded mini-games, and an admin panel.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Socket.IO client
- **Backend**: Express.js 4, TypeScript, PostgreSQL (pg), Socket.IO 4, JWT
- **Blockchain**: Solana (`@solana/web3.js`), Helius DAS API (compressed NFTs), Bubblegum V2 (`@metaplex-foundation/mpl-bubblegum` + `mpl-core` + Umi), Arweave (via `umi-uploader-irys`), Solflare wallet adapter
- **Database**: PostgreSQL 14+ with pgcrypto, JSONB for game state

## Project Structure

```
terminal/
├── CLAUDE.md
├── database/                    # PostgreSQL schema & migrations
│   ├── migrations/
│   │   ├── 001_initial_schema.sql   # All tables, indexes, triggers
│   │   ├── 002_add_last_active.sql  # Online presence column
│   │   ├── 003_mint_whitelist_and_log.sql  # Mint whitelist + mint log tables
│   │   └── 004_soulbound_items.sql         # Soulbound items table
│   ├── schema.sql               # Full schema reference
│   ├── seed.sql                 # Sample campaign data
│   └── run-migration.js         # Migration runner script
├── backend/                     # Express API server (port 3001)
│   ├── scripts/
│   │   ├── create-tree.ts           # Create Bubblegum V2 Merkle tree on-chain
│   │   ├── create-collection.ts     # Create MPL-Core collection with BubblegumV2 plugin
│   │   ├── test-mint.ts             # Test cNFT mint + DAS verification
│   │   ├── test-soulbound.ts        # Test soulbound mint + freeze pipeline
│   │   └── upload-to-arweave.ts     # Upload file + metadata JSON to Arweave via Irys
│   └── src/
│       ├── index.ts             # Entry: Express + Socket.IO setup, CORS, routes
│       ├── config/
│       │   ├── constants.ts     # Env vars, production validation
│       │   └── database.ts      # PG pool, query helper, transaction wrapper
│       ├── middleware/
│       │   ├── auth.ts          # requireAuth (JWT), requireAdmin (DB check)
│       │   ├── errorHandler.ts  # AppError class, global error handler
│       │   ├── rateLimiter.ts   # auth/api/write rate limiters
│       │   └── validate.ts      # Input validation helpers
│       ├── routes/
│       │   ├── auth.routes.ts       # POST request-message, verify-wallet
│       │   ├── users.routes.ts      # Profile CRUD, online players, heartbeat
│       │   ├── game.routes.ts       # Load/new/save game, admin: users/metadata
│       │   ├── campaigns.routes.ts  # Campaign CRUD, leaderboards, evaluation
│       │   ├── wallet.routes.ts     # NFT collections via Helius
│       │   ├── mint.routes.ts       # cNFT minting (whitelist-gated) + admin whitelist CRUD
│       │   └── soulbound.routes.ts  # Soulbound mint+freeze, verify, list items
│       ├── services/
│       │   ├── auth.service.ts      # Solana sig verify, nonce mgmt, JWT
│       │   ├── game.service.ts      # Game save CRUD (JSONB operations)
│       │   ├── campaign.service.ts  # Achievements, campaign eval, winners
│       │   ├── helius.service.ts    # Helius RPC: searchAssets, getAsset
│       │   ├── umi.ts               # Singleton Umi context + parseKeypairBytes utility
│       │   ├── mint.service.ts      # cNFT minting via Bubblegum V2 mintV2, whitelist CRUD
│       │   └── soulbound.service.ts # Soulbound mint+freeze (mintV2 w/ leafDelegate → freezeV2)
│       ├── sockets/
│       │   └── chat.socket.ts   # Room-based chat with per-socket rate limits
│       └── types/
│           └── index.ts         # User, GameSave, Campaign, etc. interfaces
├── frontend/                    # Next.js 14 app (port 3000)
│   └── src/
│       ├── app/
│       │   ├── providers.tsx        # Solana wallet + auth context providers
│       │   ├── terminal/
│       │   │   ├── page.tsx         # Terminal page wrapper
│       │   │   ├── GameTerminal.tsx  # Main game UI (terminal I/O, sidebar)
│       │   │   ├── game-terminal.css # CRT effects, scanlines, layout
│       │   │   └── components/
│       │   │       ├── Monitor.tsx       # Matrix rain canvas
│       │   │       ├── StatsBox.tsx      # Campaign progress dots
│       │   │       ├── InventoryBox.tsx  # Paginated item slots
│       │   │       ├── PlayersPanel.tsx  # Online presence list
│       │   │       └── ChatModeToggle.tsx # Command/chat mode switch
│       │   ├── admin/
│       │   │   ├── page.tsx             # Admin dashboard (wallet-gated)
│       │   │   └── components/
│       │   │       ├── Campaigns.tsx     # Campaign CRUD + leaderboards
│       │   │       └── GameUserStatus.tsx # Player search/filter/export
│       │   └── api/
│       │       ├── proxy/[...path]/route.ts  # Backend proxy (allowlisted paths)
│       │       └── rpc/route.ts              # Helius RPC proxy (allowlisted methods)
│       ├── components/terminal/
│       │   ├── SnakeGame.tsx    # Canvas snake mini-game
│       │   └── IframeGame.tsx   # External game iframe wrapper
│       ├── context/
│       │   └── AuthProvider.tsx # JWT session mgmt, wallet signing, fingerprint
│       ├── data/
│       │   └── game-nodes.ts   # Story content: all game nodes (Record<string, GameNode>)
│       ├── lib/
│       │   ├── api.ts           # Base fetch wrapper with auth retry
│       │   ├── game-api.ts      # loadGame, startNewGame, saveGame
│       │   ├── campaign-api.ts  # Campaign & achievement endpoints
│       │   ├── admin-api.ts     # Admin status check, user/metadata queries
│       │   ├── nft-helius.ts    # fetchOwnedNFTs, getNFTDetails
│       │   ├── mint-api.ts      # Mint execute, soulbound mint/background, whitelist admin
│       │   ├── game-engine.ts   # Core game logic: nodes, state, effects, quizzes
│       │   ├── terminal-commands.ts # help, save, load, theme, inventory, etc.
│       │   ├── useSocket.ts     # Socket.IO hook: room chat, reconnection
│       │   └── types/
│       │       └── game.ts      # GameNode, GameSave, OwnedNFT interfaces
│       └── styles/
│           └── terminal-themes.css  # 3 themes: green, blue, red (CSS vars)
```

## Database Schema

8 tables in PostgreSQL:

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `users` | Player accounts | `wallet_address` (unique), `name`, `is_admin`, `pfp_image_url`, `last_active_at` |
| `game_saves` | Persistent game state | `wallet_address` (unique), `current_node_id`, `game_state` (JSONB), `inventory` (JSONB) |
| `achievements` | State flags earned | `wallet_address` + `state_name` (unique), `state_value` |
| `campaigns` | Challenge definitions | `target_states[]`, `require_all`, `max_winners`, `sets_state`, `expires_at` |
| `campaign_winners` | Campaign completions | `campaign_id` + `wallet_address` (unique), `rank` |
| `mint_whitelist` | Allowed minters | `wallet_address` (unique), `max_mints`, `mints_used`, `is_active`, `added_by` |
| `mint_log` | Mint transaction audit trail | `wallet_address`, `mint_type`, `asset_id`, `signature`, `status` |
| `soulbound_items` | Frozen soulbound cNFTs | `wallet_address`, `asset_id`, `item_name`, `is_frozen`, `freeze_signature` |

All tables use UUID primary keys (pgcrypto), `updated_at` triggers, and proper FK cascades.

## Authentication Flow

1. Client requests nonce: `POST /api/v1/auth/request-message` with wallet address
2. Backend generates 32-byte nonce (5-min TTL, stored in memory Map)
3. Client signs message with Solana wallet (Ed25519 via tweetnacl)
4. Client verifies: `POST /api/v1/auth/verify-wallet` with address + message + signature
5. Backend verifies nonce + Ed25519 signature, creates/updates user, returns JWT (24h expiry)
6. Frontend stores JWT in sessionStorage with browser fingerprint validation
7. All authenticated requests use `Authorization: Bearer <token>` via `fetchWithAuth()`

## API Endpoints

All routes prefixed with `/api/v1/`. Frontend proxies through Next.js `/api/proxy/[...path]`.

### Auth (`/auth`) - 10 req/15min
- `POST /request-message` - Get signing nonce
- `POST /verify-wallet` - Verify signature, get JWT

### Users (`/users`) - 100 req/min
- `GET /check-wallet?wallet=` - Check if wallet has account
- `GET /profile` | `PUT /profile` - Auth'd profile CRUD
- `GET /online` - Recently active players (5-min window)
- `POST /heartbeat` - Update presence
- `GET /check-admin` - Admin status check

### Game (`/game`) - 30 req/min (write limiter)
- `GET /load/:wallet_address` - Load game save
- `POST /new` - Create new game save
- `POST /save` - Save state (triggers achievement + campaign evaluation)
- `GET /users` - [Admin] All players with game state
- `GET /metadata` - [Admin] All distinct states and items

### Campaigns (`/campaigns`) - 100 req/min
- `GET /` - Active campaigns | `GET /all` - [Admin] All campaigns
- `GET /:id` | `GET /:id/leaderboard` - Campaign details
- `GET /user/progress` - User achievements + campaign wins
- `POST /` | `PUT /:id` | `DELETE /:id` - [Admin] CRUD
- `POST /:id/evaluate` - [Admin] Retroactive evaluation
- `POST /simulate-achievement` - [Admin] Testing

### Mint (`/mint`) - write limiter
- `POST /execute` - Mint a cNFT (whitelist-enforced, requires `name` + `uri`)
- `GET /status/:signature` - Check transaction confirmation
- `GET /history` - User's mint history
- `GET /whitelist/check` - Check if user is whitelisted
- `GET /admin/whitelist` | `POST /admin/whitelist` - [Admin] List/add whitelist
- `POST /admin/whitelist/bulk` - [Admin] Bulk add wallets
- `PUT /admin/whitelist/:wallet` | `DELETE /admin/whitelist/:wallet` - [Admin] Update/remove
- `GET /admin/log` - [Admin] Mint audit log (filterable)

### Soulbound (`/soulbound`)
- `POST /mint` - Mint + freeze a soulbound cNFT (requires `name` + `uri`)
- `POST /mint-background` - Fire-and-forget soulbound mint (returns immediately, deduplicates by user+itemName)
- `GET /items` - User's soulbound items
- `GET /verify/:assetId` - Verify on-chain freeze status

### Wallet (`/wallet`) - 100 req/min
- `GET /:address/collections` - cNFTs from Helius
- `GET /nft/:id` - Single NFT details

## Game Engine Architecture

The game engine (`frontend/src/lib/game-engine.ts`) processes a graph of **GameNodes** defined in `frontend/src/data/game-nodes.ts`.

### Node Types
- **story** - Narrative text, auto-advance to `next_node`
- **choice** - Text + numbered choices (filtered by requirements)
- **quiz** - Question with `correct_answer`, max attempts, success/failure nodes
- **nft_check** - Gates content behind cNFT ownership (owned/missing branches)
- **godot_game** - Triggers embedded mini-game (Snake), score tracked in state
- **mint_action** - Triggers cNFT mint via `mint_config` (name, uri, etc.), branches to success/failure/not-whitelisted nodes

### Game State Flow
```
User input → terminal-commands.ts (if system command)
           → game-engine.processInput() (if game input)
             → choice selection / quiz answer / minigame / auto-advance
             → applyEffects() (add/remove items, set state flags)
             → moveToNode(nextNodeId)
             → displayCurrentNode()
             → autoSave() every 30s
```

### Save → Achievement → Campaign Pipeline
1. `POST /game/save` updates `game_saves` table
2. `processAchievements()` scans `game_state` for boolean flags → inserts into `achievements`
3. `evaluateCampaigns()` checks active campaigns against user achievements
4. If campaign requirements met → `campaign_winners` entry + optional `sets_state` flag

## Real-Time Chat (Socket.IO)

- JWT authenticated in handshake
- Room-based: players join `room:{nodeId}` on location change
- Per-socket rate limits: 10 joins/min, 10 messages/5s
- IP connection limit: 10 per IP
- Frontend hook: `useSocket.ts` with auto-reconnect (10 attempts, exponential backoff)

## Environment Variables

### Backend `.env`
```
DATABASE_URL=postgresql://user:pass@localhost:5432/terminal_game_db
JWT_SECRET=<min 32 chars in production>
API_KEY=<internal API key>
HELIUS_API_KEY=<helius api key>
COLLECTION_MINT_ADDRESS=<cnft collection mint>
PORT=3001
NODE_ENV=development
ADMIN_WALLETS=wallet1,wallet2
FRONTEND_URL=<required in production for CORS>

# Minting (required only when mint endpoints are used)
COLLECTION_AUTHORITY_KEYPAIR=<base58-encoded Ed25519 secret key>
MINT_CREATOR_ADDRESS=<pubkey listed as creator on minted cNFTs>
MERKLE_TREE=<pubkey of the Bubblegum Merkle tree (shared by all collections)>
PFP_COLLECTION_MINT=<pubkey of the PFP MPL-Core collection>
ITEMS_COLLECTION_MINT=<pubkey of the inventory items MPL-Core collection>
```

### Frontend `.env.local`
```
API_BASE_URL=http://localhost:3001/api/v1
API_KEY=<must match backend>
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_COLLECTION_MINT=<cnft collection mint>
NEXT_PUBLIC_HELIUS_RPC_URL=<helius rpc url>
```

## Development

```bash
# Database
createdb terminal_game_db
psql terminal_game_db < database/migrations/001_initial_schema.sql
psql terminal_game_db < database/migrations/002_add_last_active.sql
psql terminal_game_db < database/migrations/003_mint_whitelist_and_log.sql
psql terminal_game_db < database/migrations/004_soulbound_items.sql
psql terminal_game_db < database/seed.sql

# Backend (port 3001)
cd backend && cp .env.example .env && npm install && npm run dev

# Frontend (port 3000)
cd frontend && npm install && npm run dev
```

Build: `npm run build` in both dirs. Backend compiles to `dist/` via tsc. Frontend uses Next.js build.

## Minting Architecture (Bubblegum V2)

cNFT minting uses `@metaplex-foundation/mpl-bubblegum` v5 with the Umi framework. The server holds a collection authority keypair and signs mint transactions directly.

### Umi Singleton (`backend/src/services/umi.ts`)
Lazily initialized on first use. Configured with Helius RPC endpoint, mpl-bubblegum plugin, and the collection authority keypair as identity/payer. Server starts without error even if minting env vars are unset — `getUmi()` only throws when actually called.

Also exports `parseKeypairBytes(raw)` — handles three secret key formats:
- JSON byte array `[174,47,154,...]` (64 bytes, from `solana-keygen`)
- Base58 string of 64-byte full keypair
- Base58 string of 32-byte seed (derives full keypair via `Keypair.fromSeed`)

### Mint Flow
1. `POST /mint/execute` validates whitelist, creates pending `mint_log` entry
2. `mintCompressedNFT()` calls Bubblegum V2 `mintV2()` — requires a pre-uploaded metadata `uri`
3. `parseLeafFromMintV2Transaction()` extracts the asset ID + full leaf data from on-chain logs (retries up to 5 times with 2s delay for RPC indexing)
4. On success: updates `mint_log` + increments `mint_whitelist.mints_used` atomically
5. Returns `MintResult` with `assetId`, `signature`, `mintLogId`, and `leafData` (V2 leaf hashes)

### Soulbound Flow (mint with delegate → freeze)
1. Mint with `leafDelegate` set to authority keypair — this embeds the delegate into the on-chain leaf, allowing the authority to freeze without the player's signature
2. Wait ~10s for DAS to index the proof
3. Call `freezeV2` using leaf data captured from the mint transaction (NOT from DAS — see gotchas below)
4. `freezeV2` needs: `coreCollection` account, V2-specific `assetDataHash` + `flags` fields, and the proof from DAS
5. Retries up to 5 times on stale proof errors (DAS indexing lag)
6. Records in `soulbound_items` table with freeze signature

### Background Auto-Mint for Inventory Items
When `applyEffects()` in `game-engine.ts` adds an inventory item, it automatically fires a background soulbound mint:
- Calls `POST /soulbound/mint-background` (fire-and-forget, returns immediately)
- Backend deduplicates by `user_id` + `item_name` in `soulbound_items` table
- Frontend also checks the `soulboundItemNames` set (loaded at init) to avoid duplicate calls
- Uses a shared generic metadata URI (`INVENTORY_ITEM_URI` constant in game-engine.ts)
- Completely silent — player sees nothing, game continues unblocked

### One Tree, Two Collections
All mints go to a single Merkle tree (`MERKLE_TREE`). The `collection` param selects which MPL-Core collection to associate:
- `'pfp'` → `PFP_COLLECTION_MINT`
- `'items'` (default) → `ITEMS_COLLECTION_MINT`

Collections must be created with the `BubblegumV2` plugin (create-only, cannot be added after). If the tree fills up, create a new one and swap `MERKLE_TREE`. Existing assets are unaffected — DAS queries by collection, not tree.

### MintParams (callers must provide)
- `name` (required) — NFT display name
- `uri` (required) — Pre-uploaded Arweave/IPFS metadata JSON URI
- `collection` — `'pfp'` or `'items'` (defaults to `'items'`)
- `symbol`, `sellerFeeBasisPoints`, `soulbound`, `itemName` — optional

### Scripts (`backend/scripts/`)
- `create-tree.ts` — Create a Bubblegum V2 Merkle tree. `npx ts-node scripts/create-tree.ts --devnet --depth 7`
- `create-collection.ts` — Create an MPL-Core collection with BubblegumV2 plugin. `npx ts-node scripts/create-collection.ts --devnet --name "Terminal"`
- `test-mint.ts` — Mint a test cNFT and verify via Helius DAS. `npx ts-node scripts/test-mint.ts --devnet`
- `test-soulbound.ts` — Full soulbound pipeline: mint with delegate → freeze → verify. `npx ts-node scripts/test-soulbound.ts --devnet`
- `upload-to-arweave.ts` — Upload image + metadata JSON to Arweave via Irys. `npx ts-node scripts/upload-to-arweave.ts --file <path> --devnet --name "Item Name"`

### Bubblegum V2 Gotchas (Learned the Hard Way)
- **V2 leaf hash includes extra fields**: `collectionHash`, `assetDataHash`, `flags` — if you omit these from `freezeV2`, the on-chain leaf hash won't match and you get "leaf value does not match the supplied proof's leaf value"
- **Use leaf data from `parseLeafFromMintV2Transaction`, not DAS**: DAS is slow to index and may not return V2-specific fields. The parsed leaf from the mint tx has accurate `dataHash`, `creatorHash`, `collectionHash`, `assetDataHash`, `flags`
- **Pass `coreCollection` account to `freezeV2`**: Required when the cNFT was minted with a collection
- **`parseLeafFromMintV2Transaction` needs retries**: RPC may not have indexed the tx yet. Use 3-5 retries with 2-3s delays
- **BubblegumV2 is a create-only plugin on MPL-Core collections**: Cannot be added to existing collections — must include `plugins: [{ type: 'BubblegumV2' }]` at creation time
- **Valid Merkle tree depth/buffer pairs**: Not all combinations work. Examples: depth 7 = buffer 16, depth 14 = buffer 64, depth 20 = buffer 256
- **`COLLECTION_AUTHORITY_KEYPAIR` format**: `parseKeypairBytes()` handles JSON arrays from `solana-keygen`, base58 64-byte, and base58 32-byte seed formats
- **DAS stale proof race condition**: After minting, the tree root changes. DAS may return proofs based on the old root for 10-30s. Always retry freeze operations on "leaf value does not match" errors

### Remaining Setup (TODO)
- **Admin UI for mint whitelist** — `MintWhitelist.tsx` component exists but needs wiring into the admin page
- **Per-item metadata** — Currently all inventory items share one generic metadata URI. For distinct items (unique name/image), upload per-item metadata via `upload-to-arweave.ts` and set the `uri` in the game node's `mint_config`
- **Mainnet deployment** — Create mainnet tree (depth 14+ recommended), collection, fund authority with SOL, set mainnet env vars

## Key Conventions

- All SQL uses parameterized queries (no string interpolation)
- Backend validation via custom `validate.ts` helpers (not a validation library)
- Frontend API calls go through Next.js proxy (`/api/proxy/`) with allowlisted paths
- Game content is authored in `frontend/src/data/game-nodes.ts` as a TypeScript Record
- Three color themes controlled by CSS custom properties on `:root[data-theme]`
- Admin access determined by `is_admin` column in DB (seeded from `ADMIN_WALLETS` env var)
- No test suite currently configured
