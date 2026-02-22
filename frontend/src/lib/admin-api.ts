import { fetchWithAuth } from './api';

export interface GameUser {
  user_id: string;
  wallet_address: string;
  name: string | null;
  pfp_image_url: string | null;
  pfp_nft_id: string | null;
  is_admin: boolean;
  user_created_at: string;
  current_node_id: string | null;
  location: string | null;
  game_state: Record<string, any> | null;
  inventory: string[] | null;
  last_played_at: string | null;
}

export interface GameMetadata {
  all_states: string[];
  all_inventory_items: string[];
}

/**
 * Check if the current authenticated user is an admin
 */
export async function checkAdminStatus(): Promise<boolean> {
  const response = await fetchWithAuth('users/check-admin');
  if (!response.ok) return false;
  const data = await response.json();
  return data.is_admin || false;
}

/**
 * Get all game users with their game state (admin only)
 */
export async function getGameUsers(): Promise<GameUser[]> {
  const response = await fetchWithAuth('game/users');
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch game users');
  }
  const data = await response.json();
  return data.users || [];
}

/**
 * Get game metadata - all distinct state keys and inventory items (admin only)
 */
export async function getGameMetadata(): Promise<GameMetadata> {
  const response = await fetchWithAuth('game/metadata');
  if (!response.ok) {
    return { all_states: [], all_inventory_items: [] };
  }
  return response.json();
}

/**
 * Admin: reset all players' game data (save, achievements, campaign wins)
 */
export async function resetAllPlayers(): Promise<{ playersReset: number }> {
  const response = await fetchWithAuth('game/admin/reset-all', { method: 'POST' });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to reset all players');
  }
  return response.json();
}

/**
 * Admin: reset a specific player's game data
 */
export async function resetPlayer(walletAddress: string): Promise<void> {
  const response = await fetchWithAuth(`game/admin/reset-player/${walletAddress}`, { method: 'POST' });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to reset player');
  }
}

/**
 * Get site maintenance status (public, no auth required)
 */
export async function getSiteStatus(): Promise<{ maintenance: boolean; message: string }> {
  const response = await fetch('/api/proxy/site/status');
  if (!response.ok) {
    return { maintenance: false, message: '' };
  }
  return response.json();
}

export interface SiteInfo {
  solanaNetwork: 'devnet' | 'mainnet-beta';
}

/**
 * Admin: get server environment info (Solana network, etc.)
 */
export async function getSiteInfo(): Promise<SiteInfo> {
  const response = await fetchWithAuth('site/info');
  if (!response.ok) return { solanaNetwork: 'mainnet-beta' };
  return response.json();
}

/**
 * Admin: update site settings (maintenance mode toggle + message)
 */
export async function updateSiteSettings(enabled: boolean, message: string): Promise<void> {
  const response = await fetchWithAuth('site/settings', {
    method: 'PUT',
    body: JSON.stringify({ enabled, message }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update site settings');
  }
}
