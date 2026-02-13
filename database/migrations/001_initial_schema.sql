-- Migration 001: Initial Schema
-- Terminal Text Adventure Game
-- Run this against a fresh PostgreSQL database

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(44) NOT NULL UNIQUE,
  name VARCHAR(100),
  is_admin BOOLEAN DEFAULT FALSE,
  pfp_image_url TEXT,
  pfp_nft_id VARCHAR(44),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);

-- Game saves
CREATE TABLE IF NOT EXISTS game_saves (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address VARCHAR(44) NOT NULL UNIQUE,
  current_node_id VARCHAR(100) NOT NULL DEFAULT 'start',
  location VARCHAR(100) NOT NULL DEFAULT 'HUB',
  game_state JSONB NOT NULL DEFAULT '{}',
  inventory JSONB NOT NULL DEFAULT '[]',
  name VARCHAR(100) DEFAULT 'Wanderer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_saves_wallet ON game_saves(wallet_address);
CREATE INDEX IF NOT EXISTS idx_game_saves_user ON game_saves(user_id);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address VARCHAR(44) NOT NULL,
  state_name VARCHAR(200) NOT NULL,
  state_value VARCHAR(200) NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(wallet_address, state_name)
);

CREATE INDEX IF NOT EXISTS idx_achievements_wallet ON achievements(wallet_address);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  target_states TEXT[] NOT NULL,
  target_value VARCHAR(200) DEFAULT 'true',
  require_all BOOLEAN DEFAULT TRUE,
  sets_state VARCHAR(200),
  max_winners INTEGER NOT NULL DEFAULT 0,
  reward_description TEXT NOT NULL,
  reward_nft_mint VARCHAR(44),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by VARCHAR(44) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_campaigns_active ON campaigns(is_active);

-- Campaign winners
CREATE TABLE IF NOT EXISTS campaign_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address VARCHAR(44) NOT NULL,
  rank INTEGER NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, wallet_address)
);

CREATE INDEX IF NOT EXISTS idx_campaign_winners_campaign ON campaign_winners(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_winners_wallet ON campaign_winners(wallet_address);

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_saves_updated_at
  BEFORE UPDATE ON game_saves
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
