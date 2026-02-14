-- Migration 002: Add last_active_at to users for online presence tracking
BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Index for efficient "online users" queries
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active_at DESC);

COMMIT;
