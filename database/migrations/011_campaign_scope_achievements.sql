-- Campaign-scope the achievements table (phase 2: per-campaign achievement tracking)
--
-- Safe backfill strategy:
--   1. Add campaign_id as nullable (no constraint changes yet)
--   2. Assign campaign based on game_save state match (most accurate)
--   3. Fallback to earliest campaign save for unmatched rows
--   4. Delete orphaned achievements (users with zero game saves)
--   5. Drop old (wallet, state_name) unique constraint
--   6. Insert additional per-campaign rows for users with multiple saves
--   7. Set NOT NULL, add new (wallet, campaign_id, state_name) unique constraint
--   8. Add indexes

-- Step 1: Add campaign_id column
ALTER TABLE achievements
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE;

-- Step 2: Match achievements to the correct campaign by inspecting game_state.
-- For each achievement, pick the earliest game_save that has the matching
-- state_name=state_value in its JSONB game_state column.
UPDATE achievements a
SET campaign_id = (
  SELECT gs.campaign_id
  FROM game_saves gs
  WHERE gs.wallet_address = a.wallet_address
    AND gs.game_state ? a.state_name
    AND gs.game_state->>a.state_name = a.state_value
  ORDER BY gs.created_at ASC
  LIMIT 1
)
WHERE a.campaign_id IS NULL;

-- Step 3: Fallback — assign to the user's earliest campaign save for any
-- achievement whose state_name is no longer in any game_save (reset saves, etc.)
UPDATE achievements a
SET campaign_id = (
  SELECT gs.campaign_id
  FROM game_saves gs
  WHERE gs.wallet_address = a.wallet_address
  ORDER BY gs.created_at ASC
  LIMIT 1
)
WHERE a.campaign_id IS NULL;

-- Step 4: Remove achievements whose users have no game_saves at all.
-- These are orphaned rows that can't be attributed to any campaign.
DELETE FROM achievements WHERE campaign_id IS NULL;

-- Step 5: Drop the old (wallet, state_name) unique constraint so we can have
-- one row per campaign for the same wallet+state_name combination.
ALTER TABLE achievements
  DROP CONSTRAINT IF EXISTS achievements_wallet_address_state_name_key;

-- Step 6: For users with multiple campaign saves, insert achievement rows for
-- each additional campaign where that state is also true in that campaign's
-- game_save. This covers players who have meaningful progress in multiple
-- campaigns. Uses NOT EXISTS to avoid inserting duplicates (no constraint yet).
INSERT INTO achievements (user_id, wallet_address, state_name, state_value, campaign_id, achieved_at)
SELECT DISTINCT
  a.user_id,
  a.wallet_address,
  a.state_name,
  a.state_value,
  gs.campaign_id,
  a.achieved_at
FROM achievements a
JOIN game_saves gs
  ON gs.wallet_address = a.wallet_address
WHERE gs.campaign_id != a.campaign_id
  AND gs.game_state ? a.state_name
  AND gs.game_state->>a.state_name = a.state_value
  AND NOT EXISTS (
    SELECT 1 FROM achievements a2
    WHERE a2.wallet_address = a.wallet_address
      AND a2.campaign_id   = gs.campaign_id
      AND a2.state_name    = a.state_name
  );

-- Step 7: Make campaign_id required and add the new per-campaign unique constraint.
ALTER TABLE achievements
  ALTER COLUMN campaign_id SET NOT NULL;

ALTER TABLE achievements
  ADD CONSTRAINT achievements_wallet_campaign_state_unique
    UNIQUE (wallet_address, campaign_id, state_name);

-- Step 8: Indexes for common query patterns.
-- idx_achievements_wallet already exists — keep it for non-campaign queries.
CREATE INDEX IF NOT EXISTS idx_achievements_wallet_campaign
  ON achievements(wallet_address, campaign_id);

CREATE INDEX IF NOT EXISTS idx_achievements_campaign
  ON achievements(campaign_id);
