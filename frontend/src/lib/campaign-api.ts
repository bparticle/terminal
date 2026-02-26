import { fetchWithAuth } from './api';

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  target_states: string[];
  target_value: string;
  require_all: boolean;
  sets_state: string | null;
  max_winners: number;
  reward_description: string;
  reward_nft_mint: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  created_by?: string;
  winner_count?: number;
  is_full?: boolean;
}

export interface CampaignLeaderboardEntry {
  rank: number;
  wallet_address: string;
  achieved_at: string;
  name: string | null;
  pfp_image_url: string | null;
  pfp_nft_id: string | null;
}

export interface CampaignProgress {
  achievements: Array<{
    state_name: string;
    state_value: string;
    achieved_at: string;
  }>;
  campaign_wins: Array<{
    campaign_id: string;
    campaign_name: string;
    rank: number;
    reward_description: string;
    achieved_at: string;
  }>;
}

export interface CreateCampaignInput {
  name: string;
  description?: string;
  target_states: string[];
  target_value?: string;
  require_all?: boolean;
  sets_state?: string;
  max_winners?: number;
  reward_description: string;
  reward_nft_mint?: string;
  is_active?: boolean;
  expires_at?: string;
}

// =============================================
// Public endpoints
// =============================================

/**
 * Get all active campaigns
 */
export async function getCampaigns(): Promise<Campaign[]> {
  const response = await fetch('/api/proxy/campaigns');
  if (!response.ok) return [];
  const data = await response.json();
  return data.campaigns || [];
}

/**
 * Get a single campaign
 */
export async function getCampaign(id: string): Promise<Campaign | null> {
  const response = await fetch(`/api/proxy/campaigns/${id}`);
  if (!response.ok) return null;
  const data = await response.json();
  return data.campaign;
}

/**
 * Get campaign leaderboard
 */
export async function getCampaignLeaderboard(id: string): Promise<{
  campaign: Campaign | null;
  leaderboard: CampaignLeaderboardEntry[];
}> {
  const response = await fetch(`/api/proxy/campaigns/${id}/leaderboard`);
  if (!response.ok) return { campaign: null, leaderboard: [] };
  return response.json();
}

/**
 * Get user's progress (achievements + campaign wins)
 */
export async function getUserProgress(): Promise<CampaignProgress> {
  const response = await fetchWithAuth('campaigns/user/progress');
  if (!response.ok) return { achievements: [], campaign_wins: [] };
  const data = await response.json();
  return data.progress;
}

// =============================================
// Admin endpoints
// =============================================

/**
 * Get ALL campaigns (active, inactive, expired) - admin only
 */
export async function getAllCampaigns(): Promise<Campaign[]> {
  const response = await fetchWithAuth('campaigns/all');
  if (!response.ok) return [];
  const data = await response.json();
  return data.campaigns || [];
}

/**
 * Create a new campaign - admin only
 */
export async function createCampaign(data: CreateCampaignInput): Promise<Campaign> {
  const response = await fetchWithAuth('campaigns', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create campaign');
  }
  const result = await response.json();
  return result.campaign;
}

/**
 * Update a campaign - admin only
 */
export async function updateCampaign(id: string, data: Partial<CreateCampaignInput>): Promise<Campaign> {
  const response = await fetchWithAuth(`campaigns/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update campaign');
  }
  const result = await response.json();
  return result.campaign;
}

/**
 * Delete a campaign - admin only
 */
export async function deleteCampaign(id: string): Promise<void> {
  const response = await fetchWithAuth(`campaigns/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete campaign');
  }
}

/**
 * Retroactively evaluate a campaign against all users - admin only
 */
export async function evaluateCampaign(id: string): Promise<{ winners_awarded: number; users_scanned: number; users_qualified: number }> {
  const response = await fetchWithAuth(`campaigns/${id}/evaluate`, {
    method: 'POST',
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to evaluate campaign');
  }
  return response.json();
}

/**
 * Simulate recording an achievement for a user - admin only
 */
export async function simulateAchievement(data: {
  wallet_address: string;
  state_name: string;
  state_value?: string;
}): Promise<void> {
  const response = await fetchWithAuth('campaigns/simulate-achievement', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to simulate achievement');
  }
}
