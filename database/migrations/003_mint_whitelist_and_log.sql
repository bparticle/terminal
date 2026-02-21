-- Migration 003: Mint Whitelist & Mint Log
-- cNFT minting support: whitelist controls + audit trail

BEGIN;

-- mint_whitelist: controls who can mint, with per-wallet limits
CREATE TABLE IF NOT EXISTS mint_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(44) NOT NULL UNIQUE,
  max_mints INTEGER NOT NULL DEFAULT 1,   -- 0 = unlimited
  mints_used INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  added_by VARCHAR(44) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mint_whitelist_wallet ON mint_whitelist(wallet_address);
CREATE INDEX IF NOT EXISTS idx_mint_whitelist_active ON mint_whitelist(is_active);

-- mint_log: audit trail of every mint attempt
CREATE TABLE IF NOT EXISTS mint_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address VARCHAR(44) NOT NULL,
  mint_type VARCHAR(20) NOT NULL DEFAULT 'standard',  -- 'standard' | 'soulbound'
  asset_id VARCHAR(64),
  signature VARCHAR(128),
  nft_name VARCHAR(200) NOT NULL,
  nft_metadata JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',       -- 'pending' | 'confirmed' | 'failed'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_mint_log_user ON mint_log(user_id);
CREATE INDEX IF NOT EXISTS idx_mint_log_wallet ON mint_log(wallet_address);
CREATE INDEX IF NOT EXISTS idx_mint_log_status ON mint_log(status);

-- Triggers
CREATE TRIGGER update_mint_whitelist_updated_at
  BEFORE UPDATE ON mint_whitelist
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
