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
  winner_count?: number;
  is_full?: boolean;
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
export async function getCampaignLeaderboard(id: string): Promise<any> {
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
