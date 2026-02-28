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
  campaign_id: string;
  current_node_id: string;
  location: string;
  game_state: Record<string, any>;
  inventory: string[];
  name: string;
  save_version: number;
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
  skin_id: string | null;
  node_set_id: string | null;
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
  campaign_id: string;
  current_node_id: string;
  location: string;
  game_state: Record<string, any>;
  inventory: string[];
  name: string;
}

// ── Mint / Soulbound Types ─────────────────────

export interface WhitelistEntry {
  id: string;
  wallet_address: string;
  max_mints: number;
  mints_used: number;
  is_active: boolean;
  added_by: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MintLogEntry {
  id: string;
  user_id: string;
  wallet_address: string;
  mint_type: 'standard' | 'soulbound';
  asset_id: string | null;
  signature: string | null;
  nft_name: string;
  nft_metadata: Record<string, any>;
  status: 'pending' | 'prepared' | 'confirmed' | 'failed' | 'expired';
  error_message: string | null;
  created_at: string;
  confirmed_at: string | null;
}

export interface SoulboundItem {
  id: string;
  user_id: string;
  wallet_address: string;
  asset_id: string;
  item_name: string;
  mint_log_id: string | null;
  is_frozen: boolean;
  freeze_signature: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MintParams {
  name: string;
  uri: string;
  symbol?: string;
  description?: string;
  image?: string;
  externalUrl?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
  sellerFeeBasisPoints?: number;
  collection?: 'pfp' | 'items';
  soulbound?: boolean;
  itemName?: string;
  mintKey?: string;
  maxSupply?: number;
  oncePerPlayer?: boolean;
}

export interface MintEligibility {
  alreadyMinted: boolean;
  globalMinted: number;
  maxSupply: number;
  supplyRemaining: number;
}

export interface MintLeafData {
  owner: string;
  delegate: string;
  nonce: number;
  dataHash: Uint8Array;
  creatorHash: Uint8Array;
  collectionHash?: Uint8Array;
  assetDataHash?: Uint8Array;
  flags?: number;
}

export interface MintResult {
  assetId: string;
  signature: string;
  mintLogId: string;
  leafData?: MintLeafData;
}
