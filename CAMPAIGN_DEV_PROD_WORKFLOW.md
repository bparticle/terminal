# Campaign Dev/Prod Workflow

This runbook is the safe, repeatable process for:

- moving database and code changes from development to production
- adding new campaigns
- testing campaigns before release
- publishing campaigns without risking existing production data

Use this as the source of truth for campaign-related releases.

## Core Rules

- Never run production DB commands without a fresh backup/snapshot.
- Never run `seed.sql` in production by default.
- Prefer targeted migrations (`--file=...`) over running all migrations blindly.
- Keep production data safe by treating seed updates as content changes, not schema changes.

## Quick Decision Matrix

- `database/migrations/*.sql` changed -> Run pending migration file(s) in order.
- `database/seed.sql` changed only -> Usually do **not** run on production; apply targeted SQL only if intentionally publishing those content changes.
- both changed -> Run migrations first, validate, then decide if any seed/content updates should be manually applied.

---

## 1) Environment Setup and Verification

All migration/seed scripts read `DATABASE_URL` from `backend/.env`.

Before any run:

1. Confirm you are pointing to the intended DB in `backend/.env`.
2. For production, set the real production `DATABASE_URL`.
3. Run commands from repo root (`terminal/`).

### Verify target before writing

Use the built-in script output to verify DB target:

```bash
node database/run-migration.js --env=production --file=013_add_site_settings.sql --yes
```

This script prints `Database target: host:port/dbname` before it runs.
If target is wrong, stop immediately and fix `backend/.env`.

> Note: The above command is an example of target verification + migration. Do not run it unless that file is actually pending.

---

## 2) Safe Dev -> Prod Database Workflow

### Step A: Backup production

Take a full DB backup/snapshot (provider-native snapshot or `pg_dump`) before any write operation.

### Step B: Identify DB changes in your release

Check changed files:

```bash
git status --short
git diff --cached -- database/migrations database/seed.sql
```

### Step C: Apply schema changes (migrations) first

If migrations are included, run only the new files in numeric order:

```bash
node database/run-migration.js --env=production --file=011_campaign_scope_achievements.sql --yes
node database/run-migration.js --env=production --file=012_campaign_soulbound_items.sql --yes
node database/run-migration.js --env=production --file=013_add_site_settings.sql --yes
```

Why targeted files?

- This project does not track applied migrations in a dedicated migration-history table.
- Running "all migrations" repeatedly can be risky depending on legacy migration idempotency.

### Step D: Handle seed/content changes deliberately

`seed.sql` is idempotent but can still modify production campaign configuration (`is_active`, descriptions, winner caps, etc.).

Production recommendation:

- Do **not** run full seed unless you intentionally want every seed-defined content update.
- For publishing one campaign change, run a targeted SQL statement directly (or via an explicit one-off script).

If you intentionally need full production seed:

```bash
node database/run-seed.js --env=production --confirm-production-seed --yes
```

Only do this when you explicitly want all seed effects.

### Step E: Validate post-migration state

Run sanity checks in SQL client:

- required tables/columns exist
- expected campaigns are active/inactive
- no accidental campaign configuration drift

Example checks:

```sql
SELECT key, value FROM site_settings ORDER BY key;

SELECT name, node_set_id, skin_id, is_active, max_winners
FROM campaigns
ORDER BY created_at DESC;
```

---

## 3) Campaign Lifecycle (Create -> Test -> Publish)

### Phase 1: Define campaign in code

1. Add/update campaign node content in:
   - `frontend/src/data/campaign-nodes/<campaign>.nodes.ts`
2. Register the node set in:
   - `frontend/src/data/campaign-nodes/registry.ts`
3. Ensure game routing and campaign references are correct:
   - `frontend/src/lib/game-engine.ts`
   - `frontend/src/lib/game-api.ts`

### Phase 2: Define campaign metadata in DB seed (dev/staging baseline)

Update `database/seed.sql` campaign row with:

- `name` (stable identifier)
- `node_set_id` (must match registry key)
- `skin_id`
- target state logic (`target_states`, `target_value`, `require_all`)
- completion state (`sets_state`)
- winner limits and active flag

Use idempotent pattern already present in `seed.sql`:

- `UPDATE ... WHERE name = ...`
- `INSERT ... WHERE NOT EXISTS (...)`

### Phase 3: Local/dev test cycle

1. Point `backend/.env` to dev DB.
2. Run pending migrations (targeted files).
3. Run seed on dev:

```bash
node database/run-seed.js --env=development --yes
```

4. Start apps:

```bash
pnpm run dev
```

5. Validate gameplay:
   - campaign loads with expected node set + skin
   - progress states save correctly
   - achievements/campaign progress evaluate correctly
   - winner constraints behave as expected

### Phase 4: Staging/UAT (recommended)

Repeat the same DB + app process in staging:

- run targeted migrations
- run seed only if staging should reflect full seeded content
- test end-to-end with realistic wallets/accounts

### Phase 5: Publish to production

1. Backup production DB.
2. Deploy code.
3. Run pending migrations (targeted).
4. Publish campaign content:
   - preferred: targeted SQL for the specific campaign row(s)
   - optional: full `run-seed.js` only with explicit intent
5. Verify campaign is visible and active only when intended.

---

## 4) How to Publish a New Campaign Safely

For production publish, prefer this pattern:

1. Keep campaign in code and seed with `is_active = false` while testing.
2. Deploy code and DB migrations first.
3. Activate campaign with a targeted SQL update at release time:

```sql
UPDATE campaigns
SET is_active = true
WHERE name = 'Your Campaign Name';
```

4. Confirm activation:

```sql
SELECT name, is_active FROM campaigns WHERE name = 'Your Campaign Name';
```

This avoids unintended side effects from running full seed.

---

## 5) Rollback Strategy

If something is wrong after release:

- content issue only -> deactivate campaign:

```sql
UPDATE campaigns
SET is_active = false
WHERE name = 'Your Campaign Name';
```

- schema/data corruption risk -> restore from backup/snapshot.
- code issue -> redeploy previous backend/frontend build.

---

## 6) Pre-Release Checklist

- [ ] Production DB backup completed and verified.
- [ ] `backend/.env` points to correct production DB.
- [ ] Pending migration files identified.
- [ ] Migrations run in order using `--file`.
- [ ] Seed decision made explicitly (skip full seed unless required).
- [ ] Campaign activation done intentionally (targeted SQL preferred).
- [ ] Post-release queries validated campaign and site settings.
- [ ] Smoke test completed in production (load/save/progress/campaign visibility).

---

## 7) Notes for This Repository

- `database/run-migration.js` can also run seed with `--seed`, but in production keep migration and seed actions separate for clarity.
- `database/run-seed.js` and `run-migration.js --seed` both require production confirmation flags for safety.
- Current `seed.sql` updates existing campaigns by name, so it can change live content even when no schema changes exist.
