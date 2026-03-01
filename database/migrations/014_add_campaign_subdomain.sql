-- Migration 014: Add optional campaign subdomain namespace
-- Run: psql terminal_game_db < database/migrations/014_add_campaign_subdomain.sql

ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS subdomain VARCHAR(63);

-- Case-insensitive uniqueness so "Newsroom" and "newsroom" cannot coexist
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaigns_subdomain_unique
  ON campaigns (LOWER(subdomain))
  WHERE subdomain IS NOT NULL;
