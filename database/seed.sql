-- Canonical SQL seed for local/dev/staging bootstrap.
-- Run via: node database/run-seed.js --yes
--
-- Design:
--   - Idempotent updates by stable campaign name.
--   - Compatible with campaign-scoped saves/achievements/items schema.
--   - Includes node_set_id + skin_id so frontend campaign routing resolves correctly.

BEGIN;

-- Baseline site setting used by /api/v1/site/status in production.
INSERT INTO site_settings (key, value)
VALUES ('maintenance_mode', '{"enabled": false, "message": "COMING SOON"}')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;

-- Campaign 1: core production storyline race.
UPDATE campaigns
SET
  description = 'Complete the SCANLINES story. Enter the Temple of Null, discover what you truly are, and choose how this iteration ends. The first 100 players to finish will be recorded permanently on the leaderboard.',
  skin_id = 'terminal-default',
  node_set_id = 'terminal-core',
  target_states = ARRAY['temple_entered', 'knows_player_role', 'ending_reached'],
  target_value = 'true',
  require_all = true,
  sets_state = 'campaign_scanlines_first_100',
  max_winners = 100,
  reward_description = 'SCANLINES Pioneer - Proof of being among the first 100 to complete the story',
  reward_nft_mint = NULL,
  is_active = true,
  expires_at = '2026-12-31T23:59:59Z',
  created_by = 'system-seed'
WHERE name = 'SCANLINES: First 100';

INSERT INTO campaigns (
  name,
  description,
  skin_id,
  node_set_id,
  target_states,
  target_value,
  require_all,
  sets_state,
  max_winners,
  reward_description,
  reward_nft_mint,
  is_active,
  expires_at,
  created_by
)
SELECT
  'SCANLINES: First 100',
  'Complete the SCANLINES story. Enter the Temple of Null, discover what you truly are, and choose how this iteration ends. The first 100 players to finish will be recorded permanently on the leaderboard.',
  'terminal-default',
  'terminal-core',
  ARRAY['temple_entered', 'knows_player_role', 'ending_reached'],
  'true',
  true,
  'campaign_scanlines_first_100',
  100,
  'SCANLINES Pioneer - Proof of being among the first 100 to complete the story',
  NULL,
  true,
  '2026-12-31T23:59:59Z',
  'system-seed'
WHERE NOT EXISTS (
  SELECT 1 FROM campaigns WHERE name = 'SCANLINES: First 100'
);

-- Campaign 2: seeded demo campaign for the newsroom node set/skin.
UPDATE campaigns
SET
  description = 'Demonstration campaign for the newsroom node set. Useful for testing campaign scoping and skin/node-set routing in non-production environments.',
  skin_id = 'newsroom',
  node_set_id = 'newsroom-demo',
  target_states = ARRAY['temple_entered'],
  target_value = 'true',
  require_all = true,
  sets_state = 'campaign_newsroom_demo_complete',
  max_winners = 0,
  reward_description = 'Newsroom Demo Complete',
  reward_nft_mint = NULL,
  is_active = false,
  expires_at = NULL,
  created_by = 'system-seed'
WHERE name = 'Newsroom Demo Campaign';

INSERT INTO campaigns (
  name,
  description,
  skin_id,
  node_set_id,
  target_states,
  target_value,
  require_all,
  sets_state,
  max_winners,
  reward_description,
  reward_nft_mint,
  is_active,
  expires_at,
  created_by
)
SELECT
  'Newsroom Demo Campaign',
  'Demonstration campaign for the newsroom node set. Useful for testing campaign scoping and skin/node-set routing in non-production environments.',
  'newsroom',
  'newsroom-demo',
  ARRAY['temple_entered'],
  'true',
  true,
  'campaign_newsroom_demo_complete',
  0,
  'Newsroom Demo Complete',
  NULL,
  false,
  NULL,
  'system-seed'
WHERE NOT EXISTS (
  SELECT 1 FROM campaigns WHERE name = 'Newsroom Demo Campaign'
);

COMMIT;
