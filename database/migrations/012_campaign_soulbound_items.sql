-- Campaign-scoped soulbound item mapping table (phase 2: per-campaign inventory)
--
-- Design notes:
--   • On-chain ownership stays global — a cNFT is minted ONCE per wallet.
--   • This table is a MAPPING layer that associates an existing on-chain asset
--     with a specific campaign context for a player.
--   • Read path: campaign_soulbound_items → fallback to global soulbound_items
--   • Write path: new mints write to BOTH this table AND soulbound_items (global).
--     If an asset already exists in soulbound_items, only the mapping row is
--     created here (no on-chain re-mint).
--   • Cascades on campaign delete so orphaned mappings are cleaned up automatically.

CREATE TABLE IF NOT EXISTS campaign_soulbound_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address    VARCHAR(44) NOT NULL,
  campaign_id       UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  item_name         VARCHAR(200) NOT NULL,
  asset_id          VARCHAR(44),          -- null while on-chain mint is in flight
  is_frozen         BOOLEAN NOT NULL DEFAULT FALSE,
  freeze_signature  VARCHAR(100),
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(wallet_address, campaign_id, item_name)
);

CREATE INDEX IF NOT EXISTS idx_csb_wallet_campaign
  ON campaign_soulbound_items(wallet_address, campaign_id);

CREATE INDEX IF NOT EXISTS idx_csb_campaign
  ON campaign_soulbound_items(campaign_id);

-- Trigger to keep updated_at current (DROP first — no IF NOT EXISTS for triggers in PG14)
DROP TRIGGER IF EXISTS update_campaign_soulbound_items_updated_at ON campaign_soulbound_items;
CREATE TRIGGER update_campaign_soulbound_items_updated_at
  BEFORE UPDATE ON campaign_soulbound_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Backfill: for every existing soulbound_item, create a mapping row for the
-- user's most-recently-played campaign save (best-effort attribution).
-- New mints going forward will write the correct campaign_id at mint time.
INSERT INTO campaign_soulbound_items
  (wallet_address, campaign_id, item_name, asset_id, is_frozen, freeze_signature, created_at)
SELECT DISTINCT ON (si.wallet_address, si.item_name)
  si.wallet_address,
  gs.campaign_id,
  si.item_name,
  si.asset_id,
  si.is_frozen,
  si.freeze_signature,
  si.created_at
FROM soulbound_items si
JOIN game_saves gs ON gs.wallet_address = si.wallet_address
ORDER BY si.wallet_address, si.item_name, gs.updated_at DESC
ON CONFLICT (wallet_address, campaign_id, item_name) DO NOTHING;
