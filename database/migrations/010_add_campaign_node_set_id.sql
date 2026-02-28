ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS node_set_id VARCHAR(64);

UPDATE campaigns
SET node_set_id = 'terminal-core'
WHERE node_set_id IS NULL OR node_set_id = '';
