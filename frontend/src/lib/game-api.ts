import { fetchWithAuth } from './api';

export interface GameSave {
  id: number;
  user_id: string;
  wallet_address: string;
  current_node_id: string;
  location: string;
  game_state: Record<string, any>;
  inventory: string[];
  name: string;
  save_version: number;
  created_at: string;
  updated_at: string;
}

/**
 * Load an existing game save
 * Returns null if no save exists (404)
 */
export async function loadGame(walletAddress: string): Promise<{ save: GameSave } | null> {
  try {
    const response = await fetchWithAuth(`game/load/${walletAddress}`);

    if (response.status === 404 || response.status === 403 || response.status === 401) {
      return null;
    }

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error: any) {
    if (error.name === 'AbortError') throw error;
    console.error('Failed to load game:', error);
    return null;
  }
}

/**
 * Create a new game save
 */
export async function startNewGame(
  startingNodeId: string = 'start',
  name: string = 'Wanderer'
): Promise<{ save: GameSave }> {
  const response = await fetchWithAuth('game/new', {
    method: 'POST',
    body: JSON.stringify({
      starting_node_id: startingNodeId,
      name,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create new game');
  }

  return response.json();
}

/**
 * Save current game state
 * This triggers achievement/campaign evaluation on the backend
 */
/**
 * Fully reset the player's game data (save, achievements, campaign wins)
 */
export async function resetGame(): Promise<void> {
  const response = await fetchWithAuth('game/reset', { method: 'POST' });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to reset game');
  }
}

export async function saveGame(data: {
  current_node_id: string;
  location: string;
  game_state: Record<string, any>;
  inventory: string[];
  name: string;
  save_version?: number;
}): Promise<{ save: GameSave }> {
  const response = await fetchWithAuth('game/save', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (response.status === 409) {
    throw new Error('Save version mismatch');
  }

  if (!response.ok) {
    throw new Error('Failed to save game');
  }

  return response.json();
}
