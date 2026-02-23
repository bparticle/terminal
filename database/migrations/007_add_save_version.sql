-- Adds optimistic locking to game_saves.
-- save_version is incremented on admin/player resets and checked on every save
-- to prevent stale in-memory data from overwriting a reset.

ALTER TABLE game_saves ADD COLUMN save_version INTEGER NOT NULL DEFAULT 1;
