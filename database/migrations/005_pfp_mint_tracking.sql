-- Migration 005: PFP mint tracking index
--
-- Adds an index for efficient PFP mint count lookups per user.
-- No unique constraint — users can mint multiple PFPs based on their
-- whitelist tier (1/3/10 mints). The existing mint_whitelist.max_mints /
-- mints_used columns enforce per-tier limits at the application level.

CREATE INDEX IF NOT EXISTS idx_mint_log_pfp_user
  ON mint_log (user_id) WHERE mint_type = 'pfp' AND status = 'confirmed';
