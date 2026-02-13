import { query } from '../config/database';
import { Achievement, Campaign, CampaignWinner } from '../types';
import { updateGameSaveState } from './game.service';

/**
 * Record a single achievement if not already recorded
 */
export async function recordAchievement(
  userId: string,
  wallet: string,
  stateName: string,
  stateValue: string
): Promise<void> {
  await query(
    `INSERT INTO achievements (user_id, wallet_address, state_name, state_value)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (wallet_address, state_name) DO NOTHING`,
    [userId, wallet, stateName, stateValue]
  );
}

/**
 * Get all achievements for a wallet
 */
export async function getUserAchievements(wallet: string): Promise<Achievement[]> {
  const result = await query(
    'SELECT * FROM achievements WHERE wallet_address = $1 ORDER BY achieved_at ASC',
    [wallet]
  );
  return result.rows;
}

/**
 * Scan game_state for achievement-worthy flags and record them
 */
export async function processAchievements(
  userId: string,
  wallet: string,
  gameState: Record<string, any>
): Promise<void> {
  for (const [stateName, stateValue] of Object.entries(gameState)) {
    // Skip internal/system state keys
    if (stateName.startsWith('_') || stateName.startsWith('quiz_')) continue;
    // Skip complex objects (only record simple true/false flags)
    if (typeof stateValue === 'object') continue;

    // Record "true" flags as achievements
    if (stateValue === 'true' || stateValue === true) {
      await recordAchievement(userId, wallet, stateName, String(stateValue));
    }
  }
}

/**
 * Find all active campaigns
 */
export async function findActiveCampaigns(): Promise<Campaign[]> {
  const result = await query(
    `SELECT * FROM campaigns
     WHERE is_active = true
     AND (expires_at IS NULL OR expires_at > NOW())
     ORDER BY created_at ASC`
  );
  return result.rows;
}

/**
 * Find a campaign by ID
 */
export async function findCampaignById(id: string): Promise<Campaign | null> {
  const result = await query('SELECT * FROM campaigns WHERE id = $1', [id]);
  return result.rows[0] || null;
}

/**
 * Get the winner count for a campaign
 */
export async function getCampaignWinnerCount(campaignId: string): Promise<number> {
  const result = await query(
    'SELECT COUNT(*) as count FROM campaign_winners WHERE campaign_id = $1',
    [campaignId]
  );
  return parseInt(result.rows[0].count, 10);
}

/**
 * Check if a user has already won a campaign
 */
export async function hasWonCampaign(campaignId: string, wallet: string): Promise<boolean> {
  const result = await query(
    'SELECT id FROM campaign_winners WHERE campaign_id = $1 AND wallet_address = $2',
    [campaignId, wallet]
  );
  return result.rows.length > 0;
}

/**
 * Record a campaign win
 */
export async function recordCampaignWin(
  campaignId: string,
  userId: string,
  wallet: string
): Promise<void> {
  // Get current winner count for rank
  const count = await getCampaignWinnerCount(campaignId);
  const rank = count + 1;

  await query(
    `INSERT INTO campaign_winners (campaign_id, user_id, wallet_address, rank)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (campaign_id, wallet_address) DO NOTHING`,
    [campaignId, userId, wallet, rank]
  );
}

/**
 * Get campaign winners/leaderboard
 */
export async function getCampaignWinners(campaignId: string): Promise<any[]> {
  const result = await query(
    `SELECT cw.rank, cw.wallet_address, cw.achieved_at,
            u.name, u.pfp_image_url, u.pfp_nft_id
     FROM campaign_winners cw
     JOIN users u ON cw.user_id = u.id
     WHERE cw.campaign_id = $1
     ORDER BY cw.rank ASC`,
    [campaignId]
  );
  return result.rows;
}

/**
 * Get a user's campaign wins
 */
export async function getUserCampaignWins(wallet: string): Promise<any[]> {
  const result = await query(
    `SELECT cw.campaign_id, c.name as campaign_name, cw.rank,
            c.reward_description, cw.achieved_at
     FROM campaign_winners cw
     JOIN campaigns c ON cw.campaign_id = c.id
     WHERE cw.wallet_address = $1
     ORDER BY cw.achieved_at ASC`,
    [wallet]
  );
  return result.rows;
}

/**
 * Check if user's achievements satisfy a campaign's requirements
 */
function checkCampaignRequirements(
  campaign: Campaign,
  achievements: Achievement[]
): boolean {
  const achievedStates = new Set(
    achievements
      .filter(a => a.state_value === campaign.target_value)
      .map(a => a.state_name)
  );

  if (campaign.require_all) {
    return campaign.target_states.every(state => achievedStates.has(state));
  } else {
    return campaign.target_states.some(state => achievedStates.has(state));
  }
}

/**
 * Evaluate all active campaigns for a user
 * Called after every game save
 */
export async function evaluateCampaigns(
  userId: string,
  wallet: string
): Promise<void> {
  const activeCampaigns = await findActiveCampaigns();
  const userAchievements = await getUserAchievements(wallet);

  for (const campaign of activeCampaigns) {
    // Skip if already won
    const alreadyWon = await hasWonCampaign(campaign.id, wallet);
    if (alreadyWon) continue;

    // Skip if campaign is full
    if (campaign.max_winners > 0) {
      const winnerCount = await getCampaignWinnerCount(campaign.id);
      if (winnerCount >= campaign.max_winners) continue;
    }

    // Check if user meets requirements
    const meetsRequirements = checkCampaignRequirements(campaign, userAchievements);

    if (meetsRequirements) {
      // Award campaign win
      await recordCampaignWin(campaign.id, userId, wallet);

      // Set state flag on user's game save if configured
      if (campaign.sets_state) {
        await updateGameSaveState(wallet, {
          [campaign.sets_state]: 'true',
        });
      }
    }
  }
}

/**
 * Create a new campaign (admin)
 */
export async function createCampaign(data: Partial<Campaign>): Promise<Campaign> {
  const result = await query(
    `INSERT INTO campaigns (name, description, target_states, target_value, require_all, sets_state, max_winners, reward_description, reward_nft_mint, is_active, expires_at, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      data.name,
      data.description || null,
      data.target_states,
      data.target_value || 'true',
      data.require_all !== undefined ? data.require_all : true,
      data.sets_state || null,
      data.max_winners || 0,
      data.reward_description,
      data.reward_nft_mint || null,
      data.is_active !== undefined ? data.is_active : true,
      data.expires_at || null,
      data.created_by,
    ]
  );
  return result.rows[0];
}

/**
 * Update a campaign (admin)
 */
export async function updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign | null> {
  const fields = [];
  const values: any[] = [];
  let idx = 1;

  const allowedFields = ['name', 'description', 'target_states', 'target_value', 'require_all', 'sets_state', 'max_winners', 'reward_description', 'reward_nft_mint', 'is_active', 'expires_at'];

  for (const field of allowedFields) {
    if ((data as any)[field] !== undefined) {
      fields.push(`${field} = $${idx++}`);
      values.push((data as any)[field]);
    }
  }

  if (fields.length === 0) return null;

  values.push(id);
  const result = await query(
    `UPDATE campaigns SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

/**
 * Delete a campaign (admin)
 */
export async function deleteCampaign(id: string): Promise<void> {
  await query('DELETE FROM campaigns WHERE id = $1', [id]);
}
