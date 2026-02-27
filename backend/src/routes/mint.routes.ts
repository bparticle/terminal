import { Router, Response } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { isValidSolanaAddress } from '../services/auth.service';
import { validateString } from '../middleware/validate';
import {
  checkWhitelist,
  checkMintEligibility,
  addToWhitelist,
  removeFromWhitelist,
  updateWhitelist,
  getAllWhitelist,
  bulkAddToWhitelist,
  executeMint,
  prepareMintTransaction,
  confirmUserMint,
  submitSignedTransaction,
  confirmMintTransaction,
  getMintHistory,
  getMintLog,
} from '../services/mint.service';
import { query, transaction } from '../config/database';

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
    const mintKey = validateString(req.body.mintKey, 'mintKey', { maxLength: 200 });
    const maxSupply = typeof req.body.maxSupply === 'number' ? Math.floor(req.body.maxSupply) : 0;
    const oncePerPlayer = typeof req.body.oncePerPlayer === 'boolean' ? req.body.oncePerPlayer : false;

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
      mintKey,
      maxSupply,
      oncePerPlayer,
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
 * POST /api/v1/mint/prepare
 * Build a partially-signed mint transaction for the user to co-sign and submit.
 * User pays the transaction fee + a treasury fee. Authority co-signs.
 */
router.post('/prepare', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const name = validateString(req.body.name, 'name', { required: true, maxLength: 200 })!;
    const uri = validateString(req.body.uri, 'uri', { required: true, maxLength: 2048 })!;
    const symbol = validateString(req.body.symbol, 'symbol', { maxLength: 10 });
    const collection = req.body.collection === 'pfp' ? 'pfp' as const : 'items' as const;
    const mintKey = validateString(req.body.mintKey, 'mintKey', { maxLength: 200 });
    const maxSupply = typeof req.body.maxSupply === 'number' ? Math.floor(req.body.maxSupply) : 0;
    const oncePerPlayer = typeof req.body.oncePerPlayer === 'boolean' ? req.body.oncePerPlayer : false;

    // Atomic supply/dedup checks + log entry creation
    const mintLogId = await transaction(async (client) => {
      if (mintKey) {
        // mintKey path: supply/dedup only, no whitelist
        if (oncePerPlayer) {
          const dup = await client.query(
            `SELECT COUNT(*)::int AS cnt FROM mint_log
             WHERE wallet_address = $1 AND nft_metadata->>'mintKey' = $2
               AND status IN ('confirmed', 'pending', 'prepared')
               AND (status != 'prepared' OR created_at > NOW() - INTERVAL '10 minutes')`,
            [req.user!.walletAddress, mintKey],
          );
          if (dup.rows[0].cnt > 0) {
            throw new AppError('Already minted', 409);
          }
        }
        if (maxSupply > 0) {
          const supply = await client.query(
            `SELECT COUNT(*)::int AS cnt FROM mint_log
             WHERE nft_metadata->>'mintKey' = $1
               AND status IN ('confirmed', 'pending', 'prepared')
               AND (status != 'prepared' OR created_at > NOW() - INTERVAL '10 minutes')`,
            [mintKey],
          );
          if (supply.rows[0].cnt >= maxSupply) {
            throw new AppError('Supply exhausted', 409);
          }
        }
      } else {
        // Legacy whitelist path
        const entry = await checkWhitelist(req.user!.walletAddress);
        if (!entry || !entry.is_active) {
          throw new AppError('Wallet not whitelisted for minting', 403);
        }
        if (entry.max_mints > 0 && entry.mints_used >= entry.max_mints) {
          throw new AppError('Mint limit reached', 403);
        }
      }

      const logResult = await client.query(
        `INSERT INTO mint_log (user_id, wallet_address, mint_type, nft_name, nft_metadata, status)
         VALUES ($1, $2, 'standard', $3, $4, 'prepared')
         RETURNING id`,
        [req.user!.userId, req.user!.walletAddress, name, JSON.stringify({
          symbol, uri, collection,
          ...(mintKey ? { mintKey } : {}),
        })],
      );
      return logResult.rows[0].id;
    });

    // Build partially-signed transaction
    const { transactionBase64 } = await prepareMintTransaction({
      name,
      uri,
      symbol: symbol || undefined,
      ownerWallet: req.user!.walletAddress,
      collection,
    });

    res.json({ transactionBase64, mintLogId });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Mint prepare error:', error);
      res.status(400).json({ error: error.message || 'Failed to prepare mint transaction' });
    }
  }
});

/**
 * POST /api/v1/mint/confirm
 * Accept a user-signed transaction, submit it to the chain via Helius,
 * then confirm the mint and update records.
 */
router.post('/confirm', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const mintLogId = validateString(req.body.mintLogId, 'mintLogId', { required: true, maxLength: 100 })!;
    const signedTransactionBase64 = validateString(req.body.signedTransactionBase64, 'signedTransactionBase64', { required: true, maxLength: 10000 })!;

    // Atomically lock and claim the prepared mint_log entry
    await transaction(async (client) => {
      const logCheck = await client.query(
        `SELECT id, user_id, status FROM mint_log WHERE id = $1 FOR UPDATE`,
        [mintLogId]
      );
      if (!logCheck.rows[0]) {
        throw new AppError('Mint log entry not found', 404);
      }
      if (logCheck.rows[0].user_id !== req.user!.userId) {
        throw new AppError('Unauthorized', 403);
      }
      if (logCheck.rows[0].status !== 'prepared') {
        throw new AppError(`Mint log entry has status '${logCheck.rows[0].status}', expected 'prepared'`, 400);
      }
      // Mark as in-flight so concurrent requests are rejected
      await client.query(
        `UPDATE mint_log SET status = 'pending' WHERE id = $1`,
        [mintLogId]
      );
    });

    // Submit the signed transaction to Helius from the backend
    const signature = await submitSignedTransaction(signedTransactionBase64);

    const result = await confirmUserMint(mintLogId, signature, req.user!.userId, req.user!.walletAddress);

    res.json({ success: true, ...result });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Mint confirm error:', error);
      res.status(400).json({ error: error.message || 'Failed to confirm mint transaction' });
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

/**
 * GET /api/v1/mint/check-eligibility
 * Check eligibility for a specific mintKey (supply + per-player dedup)
 */
router.get('/check-eligibility', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const mintKey = validateString(req.query.mintKey as string | undefined, 'mintKey', { required: true, maxLength: 200 })!;
    const maxSupply = typeof req.query.maxSupply === 'string' ? parseInt(req.query.maxSupply, 10) : 0;
    if (isNaN(maxSupply) || maxSupply < 0) {
      throw new AppError('maxSupply must be a non-negative integer', 400);
    }

    const eligibility = await checkMintEligibility(req.user!.walletAddress, mintKey, maxSupply);
    res.json(eligibility);
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to check mint eligibility' });
    }
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
    if (maxMints < 1) {
      throw new AppError('max_mints must be at least 1', 400);
    }
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
    if (maxMints < 1) {
      throw new AppError('max_mints must be at least 1', 400);
    }

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
      const maxMints = Math.floor(req.body.max_mints);
      if (maxMints < 1) {
        throw new AppError('max_mints must be at least 1', 400);
      }
      updates.max_mints = maxMints;
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
 * GET /api/v1/mint/admin/health
 * Stuck/failed mints and unfrozen soulbound items across all players.
 * "Stuck" = pending older than 5 min, or prepared older than 10 min.
 */
router.get('/admin/health', requireAuth, requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const [mintRows, soulboundRows] = await Promise.all([
      query(
        `SELECT ml.id, ml.wallet_address, ml.mint_type, ml.nft_name, ml.status,
                ml.asset_id, ml.signature, ml.error_message, ml.created_at, ml.confirmed_at,
                u.name AS user_name
         FROM mint_log ml
         LEFT JOIN users u ON u.id = ml.user_id
         WHERE ml.status = 'failed'
            OR (ml.status = 'pending'  AND ml.created_at < NOW() - INTERVAL '5 minutes')
            OR (ml.status = 'prepared' AND ml.created_at < NOW() - INTERVAL '10 minutes')
         ORDER BY ml.created_at DESC
         LIMIT 200`,
        [],
      ),
      query(
        `SELECT si.id, si.wallet_address, si.item_name, si.asset_id,
                si.is_frozen, si.freeze_signature, si.created_at, si.updated_at,
                u.name AS user_name
         FROM soulbound_items si
         LEFT JOIN users u ON u.id = si.user_id
         WHERE si.is_frozen = false
         ORDER BY si.created_at DESC
         LIMIT 200`,
        [],
      ),
    ]);

    res.json({
      stuckMints: mintRows.rows,
      unFrozenSoulbound: soulboundRows.rows,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch mint health data' });
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
