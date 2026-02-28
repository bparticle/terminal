-- Add campaign context to player saves (phase 1: campaign-scoped saves/inventory)
ALTER TABLE game_saves
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE;

-- Backfill existing saves to a default campaign.
-- Priority:
--   1) oldest active campaign
--   2) oldest campaign
--   3) create a fallback campaign if table is empty
DO $$
DECLARE
  default_campaign_id UUID;
BEGIN
  SELECT id
  INTO default_campaign_id
  FROM campaigns
  WHERE is_active = true
  ORDER BY created_at ASC
  LIMIT 1;

  IF default_campaign_id IS NULL THEN
    SELECT id
    INTO default_campaign_id
    FROM campaigns
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  IF default_campaign_id IS NULL THEN
    INSERT INTO campaigns (
      name,
      description,
      skin_id,
      target_states,
      target_value,
      require_all,
      sets_state,
      max_winners,
      reward_description,
      reward_nft_mint,
      is_active,
      created_by
    ) VALUES (
      'Default Campaign',
      'Auto-created fallback campaign for legacy save migration.',
      NULL,
      ARRAY['campaign_bootstrapped'],
      'true',
      true,
      NULL,
      0,
      'Legacy progress retained',
      NULL,
      true,
      'system'
    )
    RETURNING id INTO default_campaign_id;
  END IF;

  UPDATE game_saves
  SET campaign_id = default_campaign_id
  WHERE campaign_id IS NULL;
END $$;

ALTER TABLE game_saves
ALTER COLUMN campaign_id SET NOT NULL;

-- Replace single-save-per-wallet with one-save-per-wallet-per-campaign
ALTER TABLE game_saves
DROP CONSTRAINT IF EXISTS game_saves_wallet_address_key;

ALTER TABLE game_saves
ADD CONSTRAINT game_saves_wallet_campaign_unique UNIQUE (wallet_address, campaign_id);

CREATE INDEX IF NOT EXISTS idx_game_saves_wallet_campaign
  ON game_saves(wallet_address, campaign_id);

CREATE INDEX IF NOT EXISTS idx_game_saves_user_campaign
  ON game_saves(user_id, campaign_id);

