import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { query } from '../config/database';
import { AuthenticatedRequest } from '../types';
import { isValidSolanaAddress } from '../services/auth.service';
import { AppError } from '../middleware/errorHandler';

const router = Router();

/**
 * GET /api/v1/users/check-wallet?wallet=<address>
 * Check if a wallet has an existing user account
 */
router.get('/check-wallet', async (req: Request, res: Response) => {
  try {
    const { wallet } = req.query;

    if (!wallet || typeof wallet !== 'string' || !isValidSolanaAddress(wallet)) {
      throw new AppError('Invalid wallet address', 400);
    }

    const result = await query(
      'SELECT id FROM users WHERE wallet_address = $1',
      [wallet]
    );

    res.json({ exists: result.rows.length > 0 });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to check wallet' });
    }
  }
});

/**
 * GET /api/v1/users/profile
 * Get the authenticated user's profile
 */
router.get('/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT id, wallet_address, name, is_admin, pfp_image_url, pfp_nft_id, created_at, updated_at FROM users WHERE id = $1',
      [req.user!.userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    res.json(result.rows[0]);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }
});

/**
 * PUT /api/v1/users/profile
 * Update profile fields
 */
router.put('/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, pfp_image_url, pfp_nft_id } = req.body;
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (pfp_image_url !== undefined) {
      updates.push(`pfp_image_url = $${paramIndex++}`);
      values.push(pfp_image_url);
    }
    if (pfp_nft_id !== undefined) {
      updates.push(`pfp_nft_id = $${paramIndex++}`);
      values.push(pfp_nft_id);
    }

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    values.push(req.user!.userId);

    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, wallet_address, name, is_admin, pfp_image_url, pfp_nft_id, created_at, updated_at`,
      values
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    res.json(result.rows[0]);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
});

/**
 * GET /api/v1/users/online
 * Get recently active players (active in last 5 minutes)
 */
router.get('/online', async (_req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT wallet_address, name, last_active_at
       FROM users
       WHERE last_active_at > NOW() - INTERVAL '5 minutes'
         AND name IS NOT NULL
       ORDER BY last_active_at DESC
       LIMIT 50`,
      []
    );

    const players = result.rows.map((row: any) => ({
      wallet_address: row.wallet_address,
      name: row.name,
      last_active_at: row.last_active_at,
    }));

    res.json({ players });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch online players' });
  }
});

/**
 * POST /api/v1/users/heartbeat
 * Update last_active_at for the authenticated user
 */
router.post('/heartbeat', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await query(
      'UPDATE users SET last_active_at = NOW() WHERE id = $1',
      [req.user!.userId]
    );
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Heartbeat failed' });
  }
});

/**
 * GET /api/v1/users/check-admin
 * Check if the authenticated user is an admin
 */
router.get('/check-admin', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT is_admin FROM users WHERE id = $1',
      [req.user!.userId]
    );

    res.json({ is_admin: result.rows[0]?.is_admin || false });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check admin status' });
  }
});

export default router;
