-- Seed data for testing
-- Run after schema migration

BEGIN;

-- Sample campaign: "Terminal Explorer"
-- Players must achieve 3 state flags to complete it
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
  created_by
) VALUES (
  'Terminal Explorer',
  'Complete the core quest line: solve the riddle, find the key, and defeat the guardian.',
  ARRAY['riddle_solved', 'ancient_key_found', 'guardian_defeated'],
  'true',
  true,
  'campaign_terminal_explorer_complete',
  50,
  'Terminal Explorer Badge - Proof of completing the core quest',
  true,
  'ADMIN_WALLET_ADDRESS'
);

COMMIT;
