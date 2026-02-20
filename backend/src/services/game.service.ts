import { query } from '../config/database';
import { GameSave, CreateGameSaveInput } from '../types';

/**
 * Find a game save by wallet address
 */
export async function findGameSave(walletAddress: string): Promise<GameSave | null> {
  const result = await query(
    'SELECT * FROM game_saves WHERE wallet_address = $1',
    [walletAddress]
  );
  return result.rows[0] || null;
}

/**
 * Create a new game save
 */
export async function createGameSave(data: CreateGameSaveInput): Promise<GameSave> {
  const result = await query(
    `INSERT INTO game_saves (user_id, wallet_address, current_node_id, location, game_state, inventory, name)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      data.user_id,
      data.wallet_address,
      data.current_node_id,
      data.location,
      JSON.stringify(data.game_state),
      JSON.stringify(data.inventory),
      data.name,
    ]
  );
  return result.rows[0];
}

/**
 * Update an existing game save
 */
export async function updateGameSave(
  walletAddress: string,
  data: Partial<Pick<GameSave, 'current_node_id' | 'location' | 'game_state' | 'inventory' | 'name'>>
): Promise<GameSave> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.current_node_id !== undefined) {
    updates.push(`current_node_id = $${paramIndex++}`);
    values.push(data.current_node_id);
  }
  if (data.location !== undefined) {
    updates.push(`location = $${paramIndex++}`);
    values.push(data.location);
  }
  if (data.game_state !== undefined) {
    updates.push(`game_state = $${paramIndex++}`);
    values.push(JSON.stringify(data.game_state));
  }
  if (data.inventory !== undefined) {
    updates.push(`inventory = $${paramIndex++}`);
    values.push(JSON.stringify(data.inventory));
  }
  if (data.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(data.name);
  }

  values.push(walletAddress);

  const result = await query(
    `UPDATE game_saves SET ${updates.join(', ')} WHERE wallet_address = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0];
}

/**
 * Update specific keys in game_state JSONB
 */
export async function updateGameSaveState(
  walletAddress: string,
  stateUpdates: Record<string, any>
): Promise<void> {
  await query(
    `UPDATE game_saves SET game_state = game_state || $1::jsonb WHERE wallet_address = $2`,
    [JSON.stringify(stateUpdates), walletAddress]
  );
}

/**
 * Reset a single player's game save (node, state, inventory).
 * Achievements and campaign wins are preserved as immutable records.
 */
export async function resetPlayerData(walletAddress: string): Promise<void> {
  await query(
    `UPDATE game_saves SET
      current_node_id = 'start',
      location = 'HUB',
      game_state = '{}'::jsonb,
      inventory = '[]'::jsonb
     WHERE wallet_address = $1`,
    [walletAddress]
  );
}

/**
 * Reset all players' game saves (node, state, inventory).
 * Achievements and campaign wins are preserved as immutable records.
 * Used when deploying a new story/world.
 */
export async function resetAllPlayerData(): Promise<{ playersReset: number }> {
  const result = await query(
    `UPDATE game_saves SET
      current_node_id = 'start',
      location = 'HUB',
      game_state = '{}'::jsonb,
      inventory = '[]'::jsonb`
  );
  return { playersReset: result.rowCount || 0 };
}
