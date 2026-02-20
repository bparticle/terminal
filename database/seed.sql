-- Seed data for SCANLINES campaign
-- Run via: node database/run-seed.js

BEGIN;

-- SCANLINES: First 100
-- The inaugural campaign for the first 100 players to complete SCANLINES.
-- Requires entering the Temple, discovering the truth, and reaching an ending.
INSERT INTO campaigns (
  name,
  description,
  target_states,
  target_value,
  require_all,
  sets_state,
  max_winners,
  reward_description,
  is_active,
  expires_at,
  created_by
) VALUES (
  'SCANLINES: First 100',
  'Complete the SCANLINES story. Enter the Temple of Null, discover what you truly are, and choose how this iteration ends. The first 100 players to finish will be recorded permanently on the leaderboard.',
  ARRAY['temple_entered', 'knows_player_role', 'ending_reached'],
  'true',
  true,
  'campaign_scanlines_first_100',
  100,
  'SCANLINES Pioneer — Proof of being among the first 100 to complete the story',
  true,
  '2026-12-31T23:59:59Z',
  'ADMIN_WALLET_ADDRESS'
);

COMMIT;
