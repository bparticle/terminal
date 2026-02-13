import { Request } from 'express';

export interface User {
  id: string;
  wallet_address: string;
  name: string | null;
  is_admin: boolean;
  pfp_image_url: string | null;
  pfp_nft_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface GameSave {
  id: number;
  user_id: string;
  wallet_address: string;
  current_node_id: string;
  location: string;
  game_state: Record<string, any>;
  inventory: string[];
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  wallet_address: string;
  state_name: string;
  state_value: string;
  achieved_at: string;
}

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
  created_by: string;
}

export interface CampaignWinner {
  id: string;
  campaign_id: string;
  user_id: string;
  wallet_address: string;
  rank: number;
  achieved_at: string;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    walletAddress: string;
  };
}

export interface CreateGameSaveInput {
  user_id: string;
  wallet_address: string;
  current_node_id: string;
  location: string;
  game_state: Record<string, any>;
  inventory: string[];
  name: string;
}
