# Campaign Dev/Prod Workflow

This runbook covers the full lifecycle of campaigns: creating them, testing them locally, publishing to production, and managing the moving parts that must stay in sync.

Use this as the source of truth for all campaign-related work.

---

## Core Rules

- Never run production DB commands without a fresh backup/snapshot.
- Never run `seed.sql` in production by default — prefer targeted SQL.
- Always run `npm run extract-states` after adding or changing `set_state` effects in any node file.
- Keep production data safe: treat seed updates as content changes, not schema changes.

---

## Campaign Anatomy

A campaign has **five moving parts** that must all align:

| Part | Where it lives | What it controls |
|---|---|---|
| **DB record** | `campaigns` table (`seed.sql`) | name, skin, node set, target states, winner cap, completion flag |
| **Node set** | `frontend/src/data/campaign-nodes/<id>.nodes.ts` | story graph players navigate |
| **Node set registry** | `frontend/src/data/campaign-nodes/registry.ts` | maps node_set_id → node map |
| **Skin** | `frontend/src/skins/registry.ts` + `terminal-skins.css` | visual theme |
| **Achievement allowlist** | `backend/src/data/valid-achievement-states.json` | which `set_state` keys can be recorded as achievements |

All five must be consistent. Missing or mismatched pieces cause silent failures.

---

## Creating a New Campaign

### Step 1: Author the node set

Create `frontend/src/data/campaign-nodes/<your-id>.nodes.ts`:

```typescript
import type { GameNode } from '@/lib/types/game';

export const myNewNodes: Record<string, GameNode> = {
  start: {
    id: 'start',
    type: 'story',
    location: 'HUB',
    content: 'Campaign begins here.',
    next_node: 'hub_main',
  },

  // ... your story nodes ...

  campaign_complete: {
    id: 'campaign_complete',
    type: 'story',
    location: 'HUB',
    content: '[ Campaign complete. ]',
    effects: {
      set_state: { my_campaign_goal_reached: true },
    },
    next_node: 'campaign_complete', // terminal — stays here
  },
};
```

**Node set rules:**
- Every node set MUST have a `start` node (this is where new saves begin).
- The completion node should loop to itself (not back to choices) to give players a clear terminal state.
- State keys set via `set_state` become achievement flags — name them descriptively.
- Use `_` prefix for internal state (`_step_counter`) — these are excluded from achievement tracking.

### Step 2: Register the node set

Add to `frontend/src/data/campaign-nodes/registry.ts`:

```typescript
import { myNewNodes } from './my-new-campaign.nodes';

const NODE_SET_REGISTRY: Record<string, NodeSetMap> = {
  'terminal-core': terminalCoreNodes,
  'newsroom-demo': newsroomDemoNodes,
  'my-new-campaign': myNewNodes,   // <-- add this
};

const NODE_SET_META: CampaignNodeSetInfo[] = [
  // ...existing entries...
  {
    id: 'my-new-campaign',
    displayName: 'My New Campaign',
    description: 'One-line description shown in admin UI.',
  },
];
```

### Step 3: Regenerate the achievement allowlist

**This step is mandatory after any node set changes.** Run from the repo root:

```bash
node scripts/extract-achievement-states.js
```

Or via the npm script:

```bash
npm run extract-states
```

This scans `game-nodes.ts` and all `campaign-nodes/*.ts` files for `set_state` keys and writes `backend/src/data/valid-achievement-states.json`. Without this step, achievements are silently dropped and campaigns never complete.

Verify the output includes all states your new campaign uses before continuing.

### Step 4: Author the skin (if needed)

If your campaign needs a custom visual theme:

1. Add a patch to `frontend/src/skins/registry.ts`:

```typescript
'my-new-campaign': {
  displayName: 'My New Campaign',
  title: { mode: 'text', text: 'CAMPAIGN TITLE' },
  palette: {
    primaryColor: '#ff6600',
    primaryRgb: '255, 102, 0',
    primaryDim: '#cc5200',
    primaryDark: '#993d00',
    primaryLight: '#ff944d',
    primaryGlow: 'rgba(255, 102, 0, 0.5)',
  },
},
```

2. If your skin inverts the light/dark scheme (like newsroom), add class-level overrides in `frontend/src/styles/terminal-skins.css` scoped to `:root[data-skin="my-new-campaign"]`.

3. Test it using the admin Skin Testing panel or the terminal command `admin skin set my-new-campaign`.

**Skin fields reference:**

| Group | Key fields | Notes |
|---|---|---|
| `title` | `mode`, `text`, `imageSrc`, `animatedVariant` | `mode: 'text'` for plain text; `'animatedCanvas'` for the animated scanlines canvas |
| `palette` | `primaryColor`, `primaryRgb`, `primaryGlow` | All six fields if changing color |
| `background` | `page`, `terminal`, `panel`, `monitor` | Only override what differs from default dark theme |
| `typography` | `fontFamily`, `titleTextSize` | Font must be available (system or imported in CSS) |
| `layout` | `sidebarWidth`, `terminalBorderRadius` | Optional tweaks |

Skin patches are deep-merged — only specify what changes. Everything else inherits from `DEFAULT_SKIN`.

### Step 5: Add the campaign DB record to seed.sql

Use the idempotent pattern already in `seed.sql` (UPDATE + INSERT WHERE NOT EXISTS):

```sql
-- My New Campaign
UPDATE campaigns
SET
  description = 'Short player-facing description.',
  skin_id = 'my-new-campaign',
  node_set_id = 'my-new-campaign',
  target_states = ARRAY['my_campaign_goal_reached'],
  target_value = 'true',
  require_all = true,
  sets_state = 'campaign_my_new_campaign_complete',
  max_winners = 50,
  reward_description = 'Proof of completing My New Campaign',
  reward_nft_mint = NULL,
  is_active = false,                  -- start inactive; activate manually at release
  expires_at = '2027-01-01T00:00:00Z',
  created_by = 'system-seed'
WHERE name = 'My New Campaign';

INSERT INTO campaigns (
  name, description, skin_id, node_set_id,
  target_states, target_value, require_all, sets_state,
  max_winners, reward_description, reward_nft_mint,
  is_active, expires_at, created_by
)
SELECT
  'My New Campaign',
  'Short player-facing description.',
  'my-new-campaign', 'my-new-campaign',
  ARRAY['my_campaign_goal_reached'], 'true', true,
  'campaign_my_new_campaign_complete',
  50, 'Proof of completing My New Campaign', NULL,
  false, '2027-01-01T00:00:00Z', 'system-seed'
WHERE NOT EXISTS (SELECT 1 FROM campaigns WHERE name = 'My New Campaign');
```

**Field alignment rules:**

| DB field | Must match |
|---|---|
| `node_set_id` | Key in `NODE_SET_REGISTRY` in registry.ts |
| `skin_id` | Key in `SKIN_REGISTRY` in skins/registry.ts (or null for default) |
| `target_states` | State keys that appear in your node set's `set_state` effects AND in `valid-achievement-states.json` |
| `sets_state` | Must start with `campaign_` prefix (auto-allowed by the backend) |
| `is_active` | Start `false`; flip to `true` at release time via targeted SQL |

---

## Inventory Management Across Campaigns

### How inventory works per campaign

Each campaign has its own isolated game save, including its own inventory. A player's items from one campaign do not appear in another. Soulbound on-chain assets are global (one cNFT per wallet per item), but the `campaign_soulbound_items` table maps them into the correct campaign context.

### Consumable items

Some items are consumed or transformed during gameplay and should NOT be minted as soulbound cNFTs. Add them to the `CONSUMABLE_ITEMS` set in `frontend/src/lib/game-engine.ts`:

```typescript
const CONSUMABLE_ITEMS = new Set([
  'glass_vial',
  'phosphor_residue',
  // ... add your campaign's consumables here
]);
```

Items in this set are tracked in game saves but never trigger the background soulbound mint.

### Per-item metadata

By default, all inventory items share one generic metadata URI (`INVENTORY_ITEM_URI` in `game-engine.ts`). For campaigns with distinct items (unique art/name), upload per-item metadata:

```bash
cd backend
npx ts-node scripts/upload-to-arweave.ts --file public/items/my-item.png --name "My Item"
```

Then reference the returned Arweave URI in the node's `mint_config.uri` field, or update `INVENTORY_ITEM_URI` to a campaign-specific default.

### Shared items across campaigns

If a future item should appear across multiple campaigns (e.g. a persistent identity token), the `soulbound_items` global table is the anchor — a new `campaign_soulbound_items` mapping row is created at mint time. No special setup is needed; the `mint-background` endpoint handles deduplication automatically.

---

## Dev/Test Cycle

### Step A: Confirm your dev DB target

```bash
# Check which DB backend/.env points to
grep DATABASE_URL backend/.env
```

### Step B: Run pending migrations

Only run new files you haven't applied yet, in numeric order:

```bash
node database/run-migration.js --env=development --file=013_add_site_settings.sql --yes
```

### Step C: Seed dev DB

```bash
node database/run-seed.js --env=development --yes
```

This is safe on dev — run it freely. It prints a campaign summary after completion.

### Step D: Start the apps

```bash
pnpm run dev
```

### Step E: Test skin without touching DB

In the admin panel (`/admin` → Skin Testing tab), set an override for your skin. This applies immediately on the terminal page without changing any DB data. Clear it when done.

Alternatively, from the terminal in-game (admin wallets only):

```
admin skin set my-new-campaign
admin skin clear
```

### Step F: Validate gameplay

- Campaign loads with the correct node set and skin.
- `set_state` effects save and persist across page reloads.
- Achievement records appear in DB for earned states.
- Campaign win triggers correctly at the target states.
- `sets_state` flag (`campaign_<name>_complete`) is written to game_state on win.
- Inventory items appear in the sidebar and trigger background soulbound mints.
- Consumable items do NOT trigger soulbound mints.

### Step G: Admin tools for testing

All available in `/admin` → Campaigns tab:

| Tool | When to use |
|---|---|
| **Simulate Achievement** | Force-set an achievement for a wallet without playing through |
| **Evaluate** | Retroactively scan all saves for a campaign and award wins |
| **Resync Achievements** | Backfill missing achievement rows from existing game_saves |
| **Toggle Active** | Flip is_active without a DB migration |

---

## Safe Dev → Prod Database Workflow

### Decision matrix

| Changed files | Action |
|---|---|
| `database/migrations/*.sql` | Run new files in order before deploying code |
| `database/seed.sql` only | Usually do NOT run on prod; use targeted SQL instead |
| Both changed | Migrations first, validate, then decide on seed content |

### Step 1: Backup production

Take a provider snapshot or `pg_dump` before any write.

### Step 2: Set `backend/.env` to production

Confirm the target database:

```bash
node database/run-migration.js --env=production --file=013_add_site_settings.sql --yes
# prints "Database target: host:port/dbname" before running
```

If the target is wrong, stop and fix `backend/.env` before proceeding.

### Step 3: Run pending migrations in order

```bash
node database/run-migration.js --env=production --file=011_campaign_scope_achievements.sql --yes
node database/run-migration.js --env=production --file=012_campaign_soulbound_items.sql --yes
node database/run-migration.js --env=production --file=013_add_site_settings.sql --yes
```

Run only files that haven't been applied yet. Running already-applied migrations is mostly safe (most use `IF NOT EXISTS` / `IF EXISTS`) but not guaranteed.

> **Note:** This project does not have a migration history table. Track applied migrations manually (e.g. in a deploy log or git tag). This is a known gap — if the project grows, consider adding `schema_migrations` tracking.

### Step 4: Deploy code

Deploy the new backend and frontend builds. Node sets and skins are compiled into the frontend — they take effect on next deploy.

### Step 5: Apply campaign content

**Preferred: targeted SQL at release time**

```sql
-- Activate a new campaign
UPDATE campaigns
SET is_active = true
WHERE name = 'My New Campaign';

-- Confirm
SELECT name, node_set_id, skin_id, is_active, max_winners
FROM campaigns ORDER BY created_at DESC;
```

**Full seed (only when intentional):**

```bash
node database/run-seed.js --env=production --confirm-production-seed --yes
```

Only do this when you explicitly want every seed-defined update to apply (including `is_active` changes on existing campaigns).

### Step 6: Post-deploy validation

```sql
-- Verify site settings
SELECT key, value FROM site_settings ORDER BY key;

-- Verify campaigns
SELECT name, node_set_id, skin_id, is_active, max_winners
FROM campaigns ORDER BY created_at DESC;
```

Smoke test in production: load the game, confirm the campaign skin loads, make a choice, verify save succeeds.

---

## Campaign Release Checklist

- [ ] Node set file created and has a `start` node.
- [ ] Node set registered in `registry.ts`.
- [ ] `npm run extract-states` run and output verified (new states are present).
- [ ] Skin patch added to `skins/registry.ts` (if needed).
- [ ] CSS overrides added to `terminal-skins.css` (if skin inverts light/dark).
- [ ] `seed.sql` updated with correct `node_set_id`, `skin_id`, and `target_states`.
- [ ] `target_states` values all exist in `valid-achievement-states.json`.
- [ ] `sets_state` uses `campaign_` prefix.
- [ ] Campaign seeded as `is_active = false` for safe deploy.
- [ ] Dev test cycle completed (gameplay, achievements, win, skin).
- [ ] Production DB backup taken.
- [ ] Pending migrations applied to production.
- [ ] Code deployed.
- [ ] Campaign activated via targeted SQL: `UPDATE campaigns SET is_active = true WHERE name = '...'`.
- [ ] Post-deploy SQL checks run.
- [ ] Smoke test completed in production.

---

## Rollback Strategy

| Problem | Action |
|---|---|
| Content issue (wrong text, wrong states) | `UPDATE campaigns SET is_active = false WHERE name = '...';` — deactivates immediately, no data loss |
| Skin rendering broken | Clear the skin_id in DB (`UPDATE campaigns SET skin_id = NULL WHERE name = '...';`) to fall back to default |
| Schema/data corruption | Restore from backup/snapshot |
| Code bug | Redeploy previous backend/frontend build |

---

## Pre-Release Checklist (condensed)

- [ ] Production DB backup completed and verified.
- [ ] `backend/.env` points to correct production DB.
- [ ] New migration files applied in order.
- [ ] `npm run extract-states` was run and committed.
- [ ] Campaign activated intentionally (targeted SQL preferred).
- [ ] Post-release SQL checks passed.
- [ ] Smoke test passed in production.

---

## Reference: npm Scripts

Run from repo root:

| Command | What it does |
|---|---|
| `npm run extract-states` | Regenerate `valid-achievement-states.json` from all node files |
| `node database/run-migration.js --file=<name> --yes` | Apply a specific migration to dev DB |
| `node database/run-seed.js --yes` | Seed dev DB |
| `node database/run-seed.js --env=production --confirm-production-seed --yes` | Seed production DB (explicit intent required) |
