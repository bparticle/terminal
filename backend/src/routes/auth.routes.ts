import { Router, Request, Response } from 'express';
import {
  generateAuthMessage,
  verifySignature,
  validateAndConsumeNonce,
  isValidSolanaAddress,
  generateToken,
} from '../services/auth.service';
import { query } from '../config/database';
import { config } from '../config/constants';
import { AppError } from '../middleware/errorHandler';

const router = Router();

/**
 * POST /api/v1/auth/request-message
 * Generate a message for the user to sign with their wallet
 */
router.post('/request-message', async (req: Request, res: Response) => {
  try {
    const { wallet_address } = req.body;

    if (!wallet_address || !isValidSolanaAddress(wallet_address)) {
      throw new AppError('Invalid wallet address', 400);
    }

    const message = generateAuthMessage(wallet_address);
    res.json({ message });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to generate auth message' });
    }
  }
});

/**
 * POST /api/v1/auth/verify-wallet
 * Verify a signed message and return JWT + user
 */
router.post('/verify-wallet', async (req: Request, res: Response) => {
  try {
    const { wallet_address, message, signature } = req.body;

    if (!wallet_address || !message || !signature) {
      throw new AppError('Missing required fields', 400);
    }

    if (!isValidSolanaAddress(wallet_address)) {
      throw new AppError('Invalid wallet address', 400);
    }

    // Validate nonce (replay protection, bound to wallet)
    if (!validateAndConsumeNonce(message, wallet_address)) {
      throw new AppError('Authentication failed', 401);
    }

    // Verify the signature
    const isValid = verifySignature(message, signature, wallet_address);
    if (!isValid) {
      throw new AppError('Authentication failed', 401);
    }

    // Find or create user
    // ADMIN_WALLETS env var can grant admin on creation or promote existing users,
    // but never revokes DB-level admin status (database is the source of truth)
    const isAdminWallet = config.adminWallets.includes(wallet_address);

    let userResult = await query(
      'SELECT * FROM users WHERE wallet_address = $1',
      [wallet_address]
    );

    let user;
    if (userResult.rows.length === 0) {
      const createResult = await query(
        'INSERT INTO users (wallet_address, is_admin, last_active_at) VALUES ($1, $2, NOW()) RETURNING *',
        [wallet_address, isAdminWallet]
      );
      user = createResult.rows[0];
    } else {
      // Env var can promote to admin but never demote — DB is source of truth
      const updateResult = await query(
        'UPDATE users SET is_admin = is_admin OR $1, last_active_at = NOW() WHERE id = $2 RETURNING *',
        [isAdminWallet, userResult.rows[0].id]
      );
      user = updateResult.rows[0];
    }

    // Generate JWT
    const token = generateToken(user.id, wallet_address);

    res.json({
      token,
      user: {
        id: user.id,
        wallet_address: user.wallet_address,
        name: user.name,
        is_admin: user.is_admin,
        pfp_image_url: user.pfp_image_url,
        pfp_nft_id: user.pfp_nft_id,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Auth verify error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  }
});

export default router;
