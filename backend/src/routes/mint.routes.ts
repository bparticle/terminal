import { Router, Response } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { isValidSolanaAddress } from '../services/auth.service';
import { validateString } from '../middleware/validate';
import {
  checkWhitelist,
  addToWhitelist,
  removeFromWhitelist,
  updateWhitelist,
  getAllWhitelist,
  bulkAddToWhitelist,
  executeMint,
  confirmMintTransaction,
  getMintHistory,
  getMintLog,
} from '../services/mint.service';

const router = Router();

// ── User endpoints ─────────────────────────────

/**
 * POST /api/v1/mint/execute
 * Mint a cNFT (whitelist enforced)
 */
router.post('/execute', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const name = validateString(req.body.name, 'name', { required: true, maxLength: 200 })!;
    const uri = validateString(req.body.uri, 'uri', { required: true, maxLength: 2048 })!;
    const symbol = validateString(req.body.symbol, 'symbol', { maxLength: 10 });
    const description = validateString(req.body.description, 'description', { maxLength: 1000 });
    const image = validateString(req.body.image, 'image', { maxLength: 2048 });
    const externalUrl = validateString(req.body.externalUrl, 'externalUrl', { maxLength: 2048 });
    const soulbound = typeof req.body.soulbound === 'boolean' ? req.body.soulbound : false;
    const itemName = validateString(req.body.itemName, 'itemName', { maxLength: 200 });
    const collection = req.body.collection === 'pfp' ? 'pfp' as const : 'items' as const;

    const attributes = Array.isArray(req.body.attributes) ? req.body.attributes : [];

    const result = await executeMint(req.user!.userId, req.user!.walletAddress, {
      name,
      uri,
      symbol,
      description,
      image,
      externalUrl,
      attributes,
      collection,
      soulbound,
      itemName,
    });

    res.json({ success: true, ...result });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Mint error:', error);
      res.status(400).json({ error: error.message || 'Minting failed' });
    }
  }
});

/**
 * GET /api/v1/mint/status/:signature
 * Check transaction confirmation status
 */
router.get('/status/:signature', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const signature = req.params.signature;
    if (!signature || signature.length > 128) {
      throw new AppError('Invalid signature', 400);
    }

    const status = await confirmMintTransaction(signature);
    res.json(status);
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to check mint status' });
    }
  }
});

/**
 * GET /api/v1/mint/history
 * User's mint history
 */
router.get('/history', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const history = await getMintHistory(req.user!.walletAddress);
    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch mint history' });
  }
});

/**
 * GET /api/v1/mint/whitelist/check
 * Check if user is whitelisted
 */
router.get('/whitelist/check', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const entry = await checkWhitelist(req.user!.walletAddress);
    if (!entry || !entry.is_active) {
      res.json({ whitelisted: false });
      return;
    }

    const remaining = entry.max_mints === 0 ? -1 : entry.max_mints - entry.mints_used;
    res.json({
      whitelisted: true,
      max_mints: entry.max_mints,
      mints_used: entry.mints_used,
      remaining,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check whitelist' });
  }
});

// ── Admin endpoints ────────────────────────────

/**
 * GET /api/v1/mint/admin/whitelist
 * List all whitelist entries
 */
router.get('/admin/whitelist', requireAuth, requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const entries = await getAllWhitelist();
    res.json({ entries });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch whitelist' });
  }
});

/**
 * POST /api/v1/mint/admin/whitelist
 * Add wallet to whitelist
 */
router.post('/admin/whitelist', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const wallet = validateString(req.body.wallet_address, 'wallet_address', { required: true, maxLength: 50 })!;
    if (!isValidSolanaAddress(wallet)) {
      throw new AppError('Invalid wallet address', 400);
    }

    const maxMints = typeof req.body.max_mints === 'number' ? Math.floor(req.body.max_mints) : 1;
    const notes = validateString(req.body.notes, 'notes', { maxLength: 500 });

    const entry = await addToWhitelist(wallet, maxMints, req.user!.walletAddress, notes);
    res.json({ entry });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else if (error.code === '23505') {
      res.status(409).json({ error: 'Wallet already whitelisted' });
    } else {
      console.error('Add whitelist error:', error);
      res.status(500).json({ error: 'Failed to add to whitelist' });
    }
  }
});

/**
 * POST /api/v1/mint/admin/whitelist/bulk
 * Bulk add wallets to whitelist
 */
router.post('/admin/whitelist/bulk', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const wallets = req.body.wallets;
    if (!Array.isArray(wallets) || wallets.length === 0) {
      throw new AppError('wallets must be a non-empty array', 400);
    }
    if (wallets.length > 500) {
      throw new AppError('Maximum 500 wallets per bulk add', 400);
    }

    const maxMints = typeof req.body.max_mints === 'number' ? Math.floor(req.body.max_mints) : 1;

    const entries = wallets
      .filter((w: unknown) => typeof w === 'string' && isValidSolanaAddress(w as string))
      .map((w: string) => ({ wallet: w, maxMints }));

    const result = await bulkAddToWhitelist(entries, req.user!.walletAddress);
    res.json(result);
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to bulk add to whitelist' });
    }
  }
});

/**
 * PUT /api/v1/mint/admin/whitelist/:wallet
 * Update a whitelist entry
 */
router.put('/admin/whitelist/:wallet', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const wallet = req.params.wallet;
    if (!isValidSolanaAddress(wallet)) {
      throw new AppError('Invalid wallet address', 400);
    }

    const updates: any = {};
    if (req.body.max_mints !== undefined && typeof req.body.max_mints === 'number') {
      updates.max_mints = Math.floor(req.body.max_mints);
    }
    if (req.body.is_active !== undefined && typeof req.body.is_active === 'boolean') {
      updates.is_active = req.body.is_active;
    }
    if (req.body.notes !== undefined) {
      updates.notes = validateString(req.body.notes, 'notes', { maxLength: 500 });
    }

    const entry = await updateWhitelist(wallet, updates);
    if (!entry) {
      throw new AppError('Whitelist entry not found', 404);
    }

    res.json({ entry });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update whitelist entry' });
    }
  }
});

/**
 * DELETE /api/v1/mint/admin/whitelist/:wallet
 * Remove wallet from whitelist
 */
router.delete('/admin/whitelist/:wallet', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const wallet = req.params.wallet;
    if (!isValidSolanaAddress(wallet)) {
      throw new AppError('Invalid wallet address', 400);
    }

    await removeFromWhitelist(wallet);
    res.json({ success: true });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to remove from whitelist' });
    }
  }
});

/**
 * GET /api/v1/mint/admin/log
 * View all mint logs (with optional filters)
 */
router.get('/admin/log', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters: any = {};
    if (typeof req.query.status === 'string') filters.status = req.query.status;
    if (typeof req.query.mint_type === 'string') filters.mintType = req.query.mint_type;
    if (typeof req.query.wallet === 'string') filters.wallet = req.query.wallet;

    const logs = await getMintLog(filters);
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch mint log' });
  }
});

export default router;
