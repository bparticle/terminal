export interface Requirements {
  has_item?: string[];
  has_item_negate?: boolean[];
  state?: Record<string, any>;
  has_nft?: string;
  has_nft_negate?: boolean;
}

export interface GameEffects {
  add_item?: string[];
  remove_item?: string[];
  set_state?: Record<string, any>;
  modify_state?: Record<string, number>;
}

export interface GameChoice {
  id: number;
  text: string;
  next_node: string;
  requirements?: Requirements;
  visibilityRequirements?: Requirements;
  lockedText?: string;
}

export interface GameNode {
  id: string;
  type: 'story' | 'choice' | 'puzzle' | 'nft_check' | 'item_check' | 'location' | 'quiz' | 'godot_game';
  content: string;
  location?: string;
  choices?: GameChoice[];
  effects?: GameEffects;
  next_node?: string;

  conditionalContent?: Array<{
    requirements: Requirements;
    content: string;
  }>;

  // NFT Check fields
  nft_id?: string;
  item_name?: string;
  nft_owned_content?: string;
  nft_missing_content?: string;
  nft_owned_next_node?: string;
  nft_missing_next_node?: string;

  // Quiz fields
  question?: string;
  correct_answer?: string | number;
  correct_answers?: string[];
  hint?: string;
  max_attempts?: number;
  success_node?: string;
  failure_node?: string;
  exit_node?: string;
  success_message?: string;
  failure_messages?: string[];
  final_failure_message?: string;
  success_effects?: GameEffects;
  failure_effects?: GameEffects;

  // Godot/mini-game fields
  game_id?: string;
  start_prompt?: string;
  end_event?: string;
  end_message?: string;
  payload_store?: {
    mode: 'last' | 'history';
    state_key?: string;
  };
  payload_state_map?: Record<string, {
    state_key: string;
    mode?: 'set' | 'increment';
    multiplier?: number;
  }>;
  payload_rules?: Array<{
    when?: {
      event?: string;
      metric?: string;
      op?: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'exists';
      value?: number;
    };
    effects?: GameEffects;
    message?: string;
    next_node?: string;
  }>;
}

export interface GameSave {
  id?: number;
  user_id?: string;
  wallet_address: string;
  current_node_id: string;
  location: string;
  game_state: Record<string, any>;
  inventory: string[];
  name?: string;
  created_at?: string;
  updated_at?: string;
}
