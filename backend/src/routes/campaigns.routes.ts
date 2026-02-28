import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import {
  findActiveCampaigns,
  findAllCampaigns,
  findCampaignById,
  getCampaignWinners,
  getCampaignWinnerCount,
  getUserAchievements,
  getUserCampaignWins,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  evaluateCampaigns,
  evaluateCampaignForAllUsers,
  recordAchievement,
} from '../services/campaign.service';
import { query } from '../config/database';
import { isValidSolanaAddress } from '../services/auth.service';
import { AppError } from '../middleware/errorHandler';
import { validateString, validateStringArray } from '../middleware/validate';

const router = Router();

/**
 * GET /api/v1/campaigns
 * List all active campaigns
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const campaigns = await findActiveCampaigns();

    // Enrich with winner counts
    const enriched = await Promise.all(
      campaigns.map(async (campaign) => {
        const winnerCount = await getCampaignWinnerCount(campaign.id);
        return {
          ...campaign,
          winner_count: winnerCount,
          is_full: campaign.max_winners > 0 && winnerCount >= campaign.max_winners,
        };
      })
    );

    res.json({ campaigns: enriched });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

/**
 * GET /api/v1/campaigns/all (admin only)
 * List ALL campaigns (active, inactive, expired) for admin management
 */
router.get('/all', requireAuth, requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const campaigns = await findAllCampaigns();

    const enriched = await Promise.all(
      campaigns.map(async (campaign) => {
        const winnerCount = await getCampaignWinnerCount(campaign.id);
        return {
          ...campaign,
          winner_count: winnerCount,
          is_full: campaign.max_winners > 0 && winnerCount >= campaign.max_winners,
        };
      })
    );

    res.json({ campaigns: enriched });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

/**
 * GET /api/v1/campaigns/user/progress
 * Get the authenticated user's achievements and campaign wins
 */
router.get('/user/progress', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const achievements = await getUserAchievements(req.user!.walletAddress);
    const campaignWins = await getUserCampaignWins(req.user!.walletAddress);

    res.json({
      progress: {
        achievements,
        campaign_wins: campaignWins,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

/**
 * GET /api/v1/campaigns/:id
 * Get a single campaign
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const campaign = await findCampaignById(req.params.id);
    if (!campaign) {
      throw new AppError('Campaign not found', 404);
    }

    const winnerCount = await getCampaignWinnerCount(campaign.id);

    res.json({
      campaign: {
        ...campaign,
        winner_count: winnerCount,
        is_full: campaign.max_winners > 0 && winnerCount >= campaign.max_winners,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to fetch campaign' });
    }
  }
});

/**
 * GET /api/v1/campaigns/:id/leaderboard
 * Get campaign winners/leaderboard
 */
router.get('/:id/leaderboard', async (req: Request, res: Response) => {
  try {
    const campaign = await findCampaignById(req.params.id);
    if (!campaign) {
      throw new AppError('Campaign not found', 404);
    }

    const leaderboard = await getCampaignWinners(req.params.id);

    res.json({ campaign, leaderboard });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  }
});

/**
 * POST /api/v1/campaigns (admin only)
 * Create a new campaign
 */
router.post('/', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Whitelist allowed fields -- no mass assignment
    const campaign = await createCampaign({
      name: validateString(req.body.name, 'name', { required: true, maxLength: 200 })!,
      description: validateString(req.body.description, 'description', { maxLength: 1000 }),
      skin_id: validateString(req.body.skin_id, 'skin_id', { maxLength: 64 }),
      target_states: validateStringArray(req.body.target_states, 'target_states', { required: true, maxItems: 20 })!,
      target_value: validateString(req.body.target_value, 'target_value', { maxLength: 200 }),
      require_all: typeof req.body.require_all === 'boolean' ? req.body.require_all : true,
      max_winners: typeof req.body.max_winners === 'number' ? Math.floor(req.body.max_winners) : 0,
      reward_description: validateString(req.body.reward_description, 'reward_description', { required: true, maxLength: 500 })!,
      reward_nft_mint: validateString(req.body.reward_nft_mint, 'reward_nft_mint', { maxLength: 100 }),
      sets_state: validateString(req.body.sets_state, 'sets_state', { maxLength: 200 }),
      expires_at: req.body.expires_at ? (() => {
        const d = new Date(req.body.expires_at);
        if (isNaN(d.getTime())) throw new AppError('Invalid expires_at date', 400);
        return d.toISOString();
      })() : undefined,
      is_active: typeof req.body.is_active === 'boolean' ? req.body.is_active : true,
      created_by: req.user!.walletAddress,
    });

    res.json({ campaign });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Create campaign error:', error);
      res.status(500).json({ error: 'Failed to create campaign' });
    }
  }
});

/**
 * PUT /api/v1/campaigns/:id (admin only)
 * Update a campaign
 */
router.put('/:id', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate inputs the same way as POST to prevent mass assignment
    const validatedData: Partial<any> = {};

    if (req.body.name !== undefined) validatedData.name = validateString(req.body.name, 'name', { required: true, maxLength: 200 });
    if (req.body.description !== undefined) validatedData.description = validateString(req.body.description, 'description', { maxLength: 1000 });
    if (req.body.skin_id !== undefined) {
      if (req.body.skin_id === null || req.body.skin_id === '') {
        validatedData.skin_id = null;
      } else {
        validatedData.skin_id = validateString(req.body.skin_id, 'skin_id', { maxLength: 64 });
      }
    }
    if (req.body.target_states !== undefined) validatedData.target_states = validateStringArray(req.body.target_states, 'target_states', { maxItems: 20 });
    if (req.body.target_value !== undefined) validatedData.target_value = validateString(req.body.target_value, 'target_value', { maxLength: 200 });
    if (req.body.require_all !== undefined && typeof req.body.require_all === 'boolean') validatedData.require_all = req.body.require_all;
    if (req.body.max_winners !== undefined && typeof req.body.max_winners === 'number') validatedData.max_winners = Math.floor(req.body.max_winners);
    if (req.body.reward_description !== undefined) validatedData.reward_description = validateString(req.body.reward_description, 'reward_description', { maxLength: 500 });
    if (req.body.reward_nft_mint !== undefined) validatedData.reward_nft_mint = validateString(req.body.reward_nft_mint, 'reward_nft_mint', { maxLength: 100 });
    if (req.body.sets_state !== undefined) validatedData.sets_state = validateString(req.body.sets_state, 'sets_state', { maxLength: 200 });
    if (req.body.is_active !== undefined && typeof req.body.is_active === 'boolean') validatedData.is_active = req.body.is_active;
    if (req.body.expires_at !== undefined) {
      if (req.body.expires_at) {
        const d = new Date(req.body.expires_at);
        if (isNaN(d.getTime())) throw new AppError('Invalid expires_at date', 400);
        validatedData.expires_at = d.toISOString();
      } else {
        validatedData.expires_at = null;
      }
    }

    const campaign = await updateCampaign(req.params.id, validatedData);
    if (!campaign) {
      throw new AppError('Campaign not found', 404);
    }

    res.json({ campaign });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update campaign' });
    }
  }
});

/**
 * DELETE /api/v1/campaigns/:id (admin only)
 * Delete a campaign
 */
router.delete('/:id', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await deleteCampaign(req.params.id);
    res.json({ success: true });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to delete campaign' });
    }
  }
});

/**
 * POST /api/v1/campaigns/:id/evaluate (admin only)
 * Retroactively evaluate a campaign against all users
 */
router.post('/:id/evaluate', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const campaign = await findCampaignById(req.params.id);
    if (!campaign) {
      throw new AppError('Campaign not found', 404);
    }

    const result = await evaluateCampaignForAllUsers(campaign);

    res.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Evaluate campaign error:', error);
      res.status(500).json({ error: 'Failed to evaluate campaign' });
    }
  }
});

/**
 * POST /api/v1/campaigns/simulate-achievement (admin, for testing)
 * Simulate recording an achievement
 */
router.post('/simulate-achievement', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const wallet_address = validateString(req.body.wallet_address, 'wallet_address', { required: true, maxLength: 50 })!;
    const state_name = validateString(req.body.state_name, 'state_name', { required: true, maxLength: 200 })!;
    const state_value = validateString(req.body.state_value, 'state_value', { maxLength: 200 }) || 'true';

    if (!isValidSolanaAddress(wallet_address)) {
      throw new AppError('Invalid wallet address', 400);
    }

    // Find user by wallet
    const targetUser = await query('SELECT id FROM users WHERE wallet_address = $1', [wallet_address]);
    if (targetUser.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    await recordAchievement(targetUser.rows[0].id, wallet_address, state_name, state_value);
    await evaluateCampaigns(targetUser.rows[0].id, wallet_address);

    res.json({ success: true });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to simulate achievement' });
    }
  }
});

export default router;
