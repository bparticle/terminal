-- Migration 003: Add site_settings table for maintenance mode
-- Run: psql terminal_game_db < database/migrations/003_add_site_settings.sql

-- Site settings: key-value store for global configuration
CREATE TABLE IF NOT EXISTS site_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reuse existing trigger function
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed default maintenance mode setting
INSERT INTO site_settings (key, value)
VALUES ('maintenance_mode', '{"enabled": false, "message": "COMING SOON"}')
ON CONFLICT (key) DO NOTHING;
