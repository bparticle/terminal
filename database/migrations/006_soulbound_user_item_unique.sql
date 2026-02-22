-- Migration 006: Add unique constraint on (user_id, item_name) in soulbound_items
-- Prevents duplicate soulbound mints for the same user+item via race conditions

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS idx_soulbound_items_user_item
  ON soulbound_items(user_id, item_name);

COMMIT;
