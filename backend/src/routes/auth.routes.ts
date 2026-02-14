import { Router, Request, Response } from 'express';
import {
  generateAuthMessage,
  verifySignature,
  validateAndConsumeNonce,
  isValidSolanaAddress,
  generateToken,
} from '../services/auth.service';
import { query } from '../config/database';
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

    const message = generateAuthMessage();
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

    // Validate nonce (replay protection)
    if (!validateAndConsumeNonce(message)) {
      throw new AppError('Authentication failed', 401);
    }

    // Verify the signature
    const isValid = verifySignature(message, signature, wallet_address);
    if (!isValid) {
      throw new AppError('Authentication failed', 401);
    }

    // Find or create user
    let userResult = await query(
      'SELECT * FROM users WHERE wallet_address = $1',
      [wallet_address]
    );

    let user;
    if (userResult.rows.length === 0) {
      // Create new user
      const createResult = await query(
        'INSERT INTO users (wallet_address, last_active_at) VALUES ($1, NOW()) RETURNING *',
        [wallet_address]
      );
      user = createResult.rows[0];
    } else {
      // Update last active
      const updateResult = await query(
        'UPDATE users SET last_active_at = NOW() WHERE id = $1 RETURNING *',
        [userResult.rows[0].id]
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
