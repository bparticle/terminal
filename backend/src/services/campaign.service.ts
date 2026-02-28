import { query } from '../config/database';
import { Achievement, Campaign, CampaignWinner } from '../types';
import { updateGameSaveState } from './game.service';
import validAchievementStates from '../data/valid-achievement-states.json';

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
 * Allowlist of state keys that can be recorded as achievements.
 * Auto-generated from game-nodes.ts by scripts/extract-achievement-states.js.
 * Run `npm run extract-states` at the project root to regenerate.
 */
const VALID_ACHIEVEMENT_STATES: ReadonlySet<string> = new Set(validAchievementStates);

/**
 * Scan game_state for achievement-worthy flags and record them.
 * Only allowlisted state keys are processed to prevent client-side forgery.
 */
export async function processAchievements(
  userId: string,
  wallet: string,
  gameState: Record<string, any>
): Promise<void> {
  for (const [stateName, stateValue] of Object.entries(gameState)) {
    // Only process allowlisted achievement state keys
    if (!VALID_ACHIEVEMENT_STATES.has(stateName)) continue;
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
 * Find ALL campaigns (active, inactive, expired) for admin management
 */
export async function findAllCampaigns(): Promise<Campaign[]> {
  const result = await query(
    'SELECT * FROM campaigns ORDER BY created_at DESC'
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
): Promise<boolean> {
  // Atomic insert: compute rank and enforce max_winners in a single query
  const result = await query(
    `INSERT INTO campaign_winners (campaign_id, user_id, wallet_address, rank)
     SELECT $1, $2, $3, COALESCE(
       (SELECT COUNT(*) + 1 FROM campaign_winners WHERE campaign_id = $1), 1
     )
     WHERE (
       (SELECT max_winners FROM campaigns WHERE id = $1) = 0
       OR (SELECT COUNT(*) FROM campaign_winners WHERE campaign_id = $1) <
          (SELECT max_winners FROM campaigns WHERE id = $1)
     )
     ON CONFLICT (campaign_id, wallet_address) DO NOTHING
     RETURNING id`,
    [campaignId, userId, wallet]
  );
  return result.rows.length > 0;
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
 * Evaluate only the active campaign for a user
 * Called after every game save
 */
export async function evaluateCampaigns(
  userId: string,
  wallet: string,
  activeCampaignId: string
): Promise<void> {
  const campaign = await findCampaignById(activeCampaignId);
  if (!campaign) return;
  if (!campaign.is_active) return;
  if (campaign.expires_at && new Date(campaign.expires_at).getTime() <= Date.now()) return;

  const userAchievements = await getUserAchievements(wallet);
  const alreadyWon = await hasWonCampaign(campaign.id, wallet);
  if (alreadyWon) return;

  // Check if user meets requirements for the active campaign only
  const meetsRequirements = checkCampaignRequirements(campaign, userAchievements);
  if (!meetsRequirements) return;

  // Atomically award campaign win (enforces max_winners in the query)
  const awarded = await recordCampaignWin(campaign.id, userId, wallet);
  if (!awarded) return;

  // Set state flag on the active campaign save if configured
  if (campaign.sets_state) {
    await updateGameSaveState(wallet, campaign.id, {
      [campaign.sets_state]: 'true',
    });
  }
}

/**
 * Create a new campaign (admin)
 */
export async function createCampaign(data: Partial<Campaign>): Promise<Campaign> {
  const result = await query(
    `INSERT INTO campaigns (name, description, skin_id, node_set_id, target_states, target_value, require_all, sets_state, max_winners, reward_description, reward_nft_mint, is_active, expires_at, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING *`,
    [
      data.name,
      data.description || null,
      data.skin_id || null,
      data.node_set_id || 'terminal-core',
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

  const allowedFields = ['name', 'description', 'skin_id', 'node_set_id', 'target_states', 'target_value', 'require_all', 'sets_state', 'max_winners', 'reward_description', 'reward_nft_mint', 'is_active', 'expires_at'];

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

/**
 * Retroactively evaluate a specific campaign against ALL users.
 * Queries from game_saves (not achievements) so players who never had
 * their achievements recorded are still covered. Backfills any missing
 * achievement rows for each user before checking requirements.
 * Returns the number of new winners awarded.
 */
export async function evaluateCampaignForAllUsers(campaign: Campaign): Promise<{
  winners_awarded: number;
  users_scanned: number;
  users_qualified: number;
}> {
  // Use game_saves as the user source so players whose achievements were
  // never written (played before the pipeline was working) are included.
  const usersResult = await query(
    `SELECT u.id, u.wallet_address, gs.game_state
     FROM users u
     JOIN game_saves gs ON gs.user_id = u.id
     WHERE gs.campaign_id = $1`,
    [campaign.id]
  );

  let winnersAwarded = 0;
  let usersQualified = 0;

  for (const user of usersResult.rows) {
    // Skip if already won
    const alreadyWon = await hasWonCampaign(campaign.id, user.wallet_address);
    if (alreadyWon) continue;

    // Backfill any missing achievement rows from this user's current game_state
    // before checking requirements. Uses ON CONFLICT DO NOTHING so existing
    // records are untouched.
    if (user.game_state) {
      await processAchievements(user.id, user.wallet_address, user.game_state);
    }

    // Get user's achievements (now backfilled) and check requirements
    const userAchievements = await getUserAchievements(user.wallet_address);
    const meetsRequirements = checkCampaignRequirements(campaign, userAchievements);

    if (meetsRequirements) {
      usersQualified++;

      // Atomically award (enforces max_winners)
      const awarded = await recordCampaignWin(campaign.id, user.id, user.wallet_address);
      if (!awarded) break; // campaign is full

      if (campaign.sets_state) {
        await updateGameSaveState(user.wallet_address, campaign.id, {
          [campaign.sets_state]: 'true',
        });
      }

      winnersAwarded++;
    }
  }

  return {
    winners_awarded: winnersAwarded,
    users_scanned: usersResult.rows.length,
    users_qualified: usersQualified,
  };
}

/**
 * Re-scan all game saves and backfill any missing achievement records.
 * Safe to run multiple times — uses INSERT ... ON CONFLICT DO NOTHING,
 * so existing achievements are never modified or deleted.
 * Returns the number of users processed and net new achievements written.
 */
export async function resyncAchievementsFromGameSaves(): Promise<{
  users_processed: number;
  achievements_added: number;
}> {
  const usersResult = await query(
    `SELECT u.id, u.wallet_address, gs.game_state
     FROM users u
     JOIN game_saves gs ON gs.user_id = u.id
     WHERE gs.game_state != '{}'::jsonb`
  );

  const before = await query('SELECT COUNT(*) as count FROM achievements');
  const beforeCount = parseInt(before.rows[0].count, 10);

  for (const user of usersResult.rows) {
    if (user.game_state) {
      await processAchievements(user.id, user.wallet_address, user.game_state);
    }
  }

  const after = await query('SELECT COUNT(*) as count FROM achievements');
  const afterCount = parseInt(after.rows[0].count, 10);

  return {
    users_processed: usersResult.rows.length,
    achievements_added: afterCount - beforeCount,
  };
}
