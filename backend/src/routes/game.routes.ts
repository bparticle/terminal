import { Router, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { findGameSave, createGameSave, updateGameSave } from '../services/game.service';
import { processAchievements, evaluateCampaigns } from '../services/campaign.service';
import { AppError } from '../middleware/errorHandler';

const router = Router();

/**
 * GET /api/v1/game/load/:wallet_address
 * Load existing game save
 */
router.get('/load/:wallet_address', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wallet_address } = req.params;

    // Security: verify user owns this wallet
    if (req.user!.walletAddress !== wallet_address) {
      throw new AppError('Forbidden', 403);
    }

    const save = await findGameSave(wallet_address);
    if (!save) {
      throw new AppError('No save found', 404);
    }

    res.json({ save });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Game load error:', error);
      res.status(500).json({ error: 'Failed to load game' });
    }
  }
});

/**
 * POST /api/v1/game/new
 * Create a new game save
 */
router.post('/new', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { starting_node_id, name } = req.body;
    const wallet_address = req.user!.walletAddress;

    // Check if save already exists
    const existing = await findGameSave(wallet_address);
    if (existing) {
      throw new AppError('Save already exists. Use /game/save to update.', 409);
    }

    const save = await createGameSave({
      user_id: req.user!.userId,
      wallet_address,
      current_node_id: starting_node_id || 'start',
      location: 'HUB',
      game_state: {},
      inventory: [],
      name: name || 'Wanderer',
    });

    res.json({ save });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Game new error:', error);
      res.status(500).json({ error: 'Failed to create new game' });
    }
  }
});

/**
 * POST /api/v1/game/save
 * Save/update game state. Triggers achievement/campaign evaluation.
 */
router.post('/save', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { current_node_id, location, game_state, inventory, name } = req.body;
    const wallet_address = req.user!.walletAddress;

    // 1. Update game save
    const save = await updateGameSave(wallet_address, {
      current_node_id,
      location,
      game_state,
      inventory,
      name,
    });

    if (!save) {
      throw new AppError('No save found to update', 404);
    }

    // 2. Process achievements (scan game_state for new flags)
    if (game_state) {
      await processAchievements(req.user!.userId, wallet_address, game_state);
    }

    // 3. Evaluate campaigns
    await evaluateCampaigns(req.user!.userId, wallet_address);

    res.json({ save });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Game save error:', error);
      res.status(500).json({ error: 'Failed to save game' });
    }
  }
});

/**
 * POST /api/v1/game/action
 * Perform a game action (optional server-side validation)
 */
router.post('/action', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { action_type, action_data } = req.body;

    // For now, most game logic runs client-side
    // This endpoint is available for future server-side validation
    res.json({
      success: true,
      action_type,
      message: 'Action acknowledged',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process action' });
  }
});

export default router;
