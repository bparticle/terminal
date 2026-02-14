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
import { AppError } from '../middleware/errorHandler';

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
    const campaign = await createCampaign({
      ...req.body,
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
    const campaign = await updateCampaign(req.params.id, req.body);
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

    const winnersAwarded = await evaluateCampaignForAllUsers(campaign);

    res.json({ success: true, winners_awarded: winnersAwarded });
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
    const { wallet_address, state_name, state_value } = req.body;

    // Find user by wallet
    const targetUser = await query('SELECT id FROM users WHERE wallet_address = $1', [wallet_address]);
    if (targetUser.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    await recordAchievement(targetUser.rows[0].id, wallet_address, state_name, state_value || 'true');
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
