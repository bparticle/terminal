# Subdomain Campaign Rollout Guide (Dev -> Production)

This guide explains how to safely test and roll out campaign subdomain routing so:

- `newsroom.scanlines.io` opens the newsroom campaign directly
- `scanlines.io` behavior remains unchanged for existing players
- rollout is reversible with minimal risk

---

## 1) Current behavior (important baseline)

Subdomain campaign selection now works with this priority:

1. Campaign mapped to current host subdomain (if any)
2. User's last played campaign
3. First active campaign

### Impact on `scanlines.io`
At apex (`scanlines.io`), there is no campaign subdomain label, so behavior is unchanged from before:
- returning users: last played campaign
- otherwise: first active campaign

If you want **everyone** on apex to always get one fixed default campaign (ignoring last played), that would be a separate code change.

---

## 2) Safe rollout strategy

Use a "dark launch" approach:

- Deploy schema + code first
- Do **not** set any campaign subdomain initially
- Verify everything behaves exactly as before
- Then assign subdomains one-by-one (starting with newsroom)
- Validate traffic on subdomain URLs
- Keep apex untouched

Because `subdomain` is optional (`NULL` by default), no live behavior changes until you assign values.

---

## 3) Prerequisites checklist

- Wildcard domain configured and verified in Render: `*.scanlines.io`
- Namecheap DNS records for wildcard verification/proxy in place (`*`, `_acme-challenge`, `_cf-custom-hostname`)
- Backend and frontend can be deployed independently
- DB access for migration execution on dev and prod

---

## 4) Development test plan

### 4.1 Run migration in dev DB

Apply migration:

- `database/migrations/014_add_campaign_subdomain.sql`

This adds:
- `campaigns.subdomain` (nullable)
- unique index on `LOWER(subdomain)` when not null

### 4.2 Start app in dev as usual

Use your current dev env creds (`backend/.env`, `frontend/.env.local`).

### 4.3 Assign one test campaign subdomain (admin UI)

In Admin -> Campaigns:
- open newsroom campaign
- set `Subdomain` to `newsroom`
- save

Do not set subdomain on your default apex campaign.

### 4.4 Test subdomain locally

For local dev, use a host with at least 3 labels so subdomain parsing works (for example):
- `newsroom.lvh.me` (resolves to localhost)
- or hosts-file entries for a custom local domain

Expected:
- `newsroom.<domain>/terminal` lands on newsroom campaign
- `<apex>/terminal` still follows last-played/first-active behavior

### 4.5 Negative tests

- Unknown subdomain (e.g. `foo.<domain>`) should show fallback warning and load default resolution path
- Duplicate subdomain assignment in admin should fail with conflict
- Invalid subdomain format should be rejected by validation

---

## 5) Production rollout plan (low risk)

### Phase A: Infrastructure verify (no app behavior change)
1. Confirm wildcard domain remains verified in Render.
2. Confirm DNS records in Namecheap are correct and propagated.

### Phase B: Database first
1. Run migration `014_add_campaign_subdomain.sql` on production DB.
2. Verify column/index exists.

### Phase C: Deploy code (still no behavior change)
1. Deploy backend with subdomain-aware campaign CRUD.
2. Deploy frontend with hostname-based campaign resolution.
3. Do not assign any campaign subdomain yet.

At this point, player behavior on `scanlines.io` remains unchanged.

### Phase D: Controlled activation
1. Set only `newsroom` subdomain on newsroom campaign in Admin.
2. Validate `https://newsroom.scanlines.io/terminal`.
3. Validate `https://scanlines.io/terminal` still behaves as before.
4. Add more campaign subdomains gradually.

---

## 6) Validation checklist (prod)

- [ ] `scanlines.io` opens same experience as pre-rollout
- [ ] `www.scanlines.io` redirect behavior still correct
- [ ] `newsroom.scanlines.io` selects newsroom campaign
- [ ] Campaign save/load works under subdomain-selected campaign
- [ ] Campaign overlay switch still works
- [ ] No auth/session regressions after moving between subdomain and apex
- [ ] Admin create/edit campaign still works with/without subdomain

---

## 7) Rollback plan

Fast rollback options:

1. **Disable campaign mapping only**
   - In Admin, clear `subdomain` for affected campaign(s)
   - subdomain hosts fall back to normal campaign selection behavior

2. **Disable wildcard entry**
   - Remove/disable `*.scanlines.io` in Render or DNS
   - subdomain traffic stops routing

3. **Full app rollback**
   - Roll back frontend/backend deployment
   - DB migration can remain (column is additive and safe)

---

## 8) Operational recommendations

- Reserve system labels and avoid using them as campaign subdomains:
  - `www`, `api`, `admin`, `app`
- Keep a documented mapping table:
  - `subdomain -> campaign_id -> node_set_id`
- Roll out one campaign at a time, monitor logs and player reports
- Keep apex campaign strategy explicit:
  - "unchanged" (current behavior), or
  - future enhancement to force a fixed default campaign for all apex visitors

---

## 9) QA scenarios to run before announcing

1. New user on apex
2. Returning user on apex with prior last-played campaign
3. New user on `newsroom.scanlines.io`
4. Returning user on `newsroom.scanlines.io`
5. Unknown subdomain behavior
6. Campaign with expired/inactive status
7. Admin duplicate subdomain attempt
8. Campaign switch from overlay after subdomain auto-selection

---

## 10) Notes on "no change for apex users"

This rollout preserves existing apex behavior.
If your exact requirement is: "everyone on `scanlines.io` must always land on one fixed default campaign regardless of last played," we should add a small follow-up change for apex-only forced campaign selection.
