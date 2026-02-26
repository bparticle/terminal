import { Router, Response } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { findGameSave, createGameSave, updateGameSave, resetPlayerData, resetAllPlayerData } from '../services/game.service';
import { processAchievements, evaluateCampaigns, resyncAchievementsFromGameSaves } from '../services/campaign.service';
import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { validateString, validateJsonObject, validateJsonArray } from '../middleware/validate';

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
    const starting_node_id = validateString(req.body.starting_node_id, 'starting_node_id', { maxLength: 100 });
    const name = validateString(req.body.name, 'name', { minLength: 2, maxLength: 20 });
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
    const wallet_address = req.user!.walletAddress;

    // Validate inputs
    const current_node_id = validateString(req.body.current_node_id, 'current_node_id', { maxLength: 100 });
    const location = validateString(req.body.location, 'location', { maxLength: 100 });
    const game_state = validateJsonObject(req.body.game_state, 'game_state', { maxSizeBytes: 50_000 });
    const inventory = validateJsonArray(req.body.inventory, 'inventory', { maxItems: 100, maxSizeBytes: 10_000 }) as string[] | undefined;
    const name = validateString(req.body.name, 'name', { minLength: 2, maxLength: 20 });
    const save_version = typeof req.body.save_version === 'number' ? req.body.save_version : undefined;

    // 1. Update game save (with optimistic locking when save_version is provided)
    const save = await updateGameSave(wallet_address, {
      current_node_id,
      location,
      game_state,
      inventory,
      name,
    }, save_version);

    if (!save && save_version !== undefined) {
      throw new AppError('Save version mismatch — game data was reset externally. Please reload.', 409);
    }
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
    const action_type = validateString(req.body.action_type, 'action_type', { maxLength: 50 });

    // For now, most game logic runs client-side
    // This endpoint is available for future server-side validation
    res.json({
      success: true,
      action_type: action_type || 'unknown',
      message: 'Action acknowledged',
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to process action' });
    }
  }
});

/**
 * GET /api/v1/game/users (admin only)
 * List all game users with game state, inventory, location
 */
router.get('/users', requireAuth, requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT
        u.id as user_id,
        u.wallet_address,
        u.name,
        u.pfp_image_url,
        u.pfp_nft_id,
        u.is_admin,
        u.created_at as user_created_at,
        gs.current_node_id,
        gs.location,
        gs.game_state,
        gs.inventory,
        gs.updated_at as last_played_at,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'state_name', a.state_name,
            'state_value', a.state_value,
            'achieved_at', a.achieved_at
          ) ORDER BY a.achieved_at ASC)
          FROM achievements a WHERE a.wallet_address = u.wallet_address),
          '[]'::json
        ) as achievements
      FROM users u
      LEFT JOIN game_saves gs ON gs.user_id = u.id
      ORDER BY gs.updated_at DESC NULLS LAST`
    );

    res.json({ users: result.rows });
  } catch (error) {
    console.error('Get game users error:', error);
    res.status(500).json({ error: 'Failed to fetch game users' });
  }
});

/**
 * GET /api/v1/game/metadata (admin only)
 * Return all distinct game state keys and inventory items across all saves
 */
router.get('/metadata', requireAuth, requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    // Get all distinct game state keys
    const statesResult = await query(
      `SELECT DISTINCT jsonb_object_keys(game_state) as state_key
       FROM game_saves
       WHERE game_state != '{}'::jsonb
       ORDER BY state_key`
    );

    // Get all distinct inventory items
    const inventoryResult = await query(
      `SELECT DISTINCT item
       FROM game_saves, jsonb_array_elements_text(inventory) as item
       ORDER BY item`
    );

    res.json({
      all_states: statesResult.rows.map((r: any) => r.state_key),
      all_inventory_items: inventoryResult.rows.map((r: any) => r.item),
    });
  } catch (error) {
    console.error('Get game metadata error:', error);
    res.status(500).json({ error: 'Failed to fetch game metadata' });
  }
});

/**
 * POST /api/v1/game/reset
 * Player resets their own game data (save + achievements + campaign wins)
 */
router.post('/reset', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const wallet_address = req.user!.walletAddress;
    await resetPlayerData(wallet_address);
    res.json({ success: true });
  } catch (error) {
    console.error('Player reset error:', error);
    res.status(500).json({ error: 'Failed to reset game data' });
  }
});

/**
 * POST /api/v1/game/admin/reset-all
 * Admin: reset all players' game data (for new story deployments)
 */
router.post('/admin/reset-all', requireAuth, requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await resetAllPlayerData();
    res.json(result);
  } catch (error) {
    console.error('Admin reset-all error:', error);
    res.status(500).json({ error: 'Failed to reset all player data' });
  }
});

/**
 * POST /api/v1/game/admin/reset-player/:wallet_address
 * Admin: reset a specific player's game data
 */
router.post('/admin/reset-player/:wallet_address', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wallet_address } = req.params;
    await resetPlayerData(wallet_address);
    res.json({ success: true });
  } catch (error) {
    console.error('Admin reset-player error:', error);
    res.status(500).json({ error: 'Failed to reset player data' });
  }
});

/**
 * POST /api/v1/game/admin/resync-achievements
 * Admin: re-scan all game saves and backfill missing achievement records.
 * Idempotent — safe to run multiple times.
 */
router.post('/admin/resync-achievements', requireAuth, requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await resyncAchievementsFromGameSaves();
    res.json(result);
  } catch (error) {
    console.error('Resync achievements error:', error);
    res.status(500).json({ error: 'Failed to resync achievements' });
  }
});

export default router;
