-- Migration 004: Soulbound Items
-- Maps frozen on-chain cNFTs to game inventory items

BEGIN;

CREATE TABLE IF NOT EXISTS soulbound_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address VARCHAR(44) NOT NULL,
  asset_id VARCHAR(64) NOT NULL UNIQUE,
  item_name VARCHAR(200) NOT NULL,
  mint_log_id UUID REFERENCES mint_log(id),
  is_frozen BOOLEAN DEFAULT FALSE,
  freeze_signature VARCHAR(128),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_soulbound_items_user ON soulbound_items(user_id);
CREATE INDEX IF NOT EXISTS idx_soulbound_items_wallet ON soulbound_items(wallet_address);
CREATE INDEX IF NOT EXISTS idx_soulbound_items_asset ON soulbound_items(asset_id);

-- Trigger
CREATE TRIGGER update_soulbound_items_updated_at
  BEFORE UPDATE ON soulbound_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
