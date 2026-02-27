import { Router, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { validateString } from '../middleware/validate';
import {
  mintAndFreezeSoulbound,
  checkSoulboundExists,
  getSoulboundItems,
  verifySoulbound,
} from '../services/soulbound.service';
import { ITEM_METADATA_URIS } from '../config/item-uris';

const router = Router();

/**
 * POST /api/v1/soulbound/mint
 * Mint + freeze a soulbound item
 */
router.post('/mint', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const name = validateString(req.body.name, 'name', { required: true, maxLength: 200 })!;
    const uri = validateString(req.body.uri, 'uri', { required: true, maxLength: 2048 })!;
    const symbol = validateString(req.body.symbol, 'symbol', { maxLength: 10 });
    const description = validateString(req.body.description, 'description', { maxLength: 1000 });
    const image = validateString(req.body.image, 'image', { maxLength: 2048 });
    const externalUrl = validateString(req.body.externalUrl, 'externalUrl', { maxLength: 2048 });
    const itemName = validateString(req.body.itemName, 'itemName', { maxLength: 200 });
    const attributes = Array.isArray(req.body.attributes) ? req.body.attributes : [];

    const result = await mintAndFreezeSoulbound(req.user!.userId, req.user!.walletAddress, {
      name,
      uri,
      symbol,
      description,
      image,
      externalUrl,
      attributes,
      soulbound: true,
      itemName,
    });

    res.json({ success: true, ...result });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Soulbound mint error:', error);
      res.status(400).json({ error: error.message || 'Soulbound minting failed' });
    }
  }
});

/**
 * POST /api/v1/soulbound/mint-background
 * Fire-and-forget soulbound mint for inventory items.
 * Returns immediately with { queued: true } while mint runs in background.
 * Deduplicates — won't mint the same item twice for the same user.
 */
router.post('/mint-background', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const itemName = validateString(req.body.itemName, 'itemName', { required: true, maxLength: 200 })!;
  const fallbackUri = validateString(req.body.uri, 'uri', { required: true, maxLength: 2048 })!;
  // Prefer item-specific Arweave metadata if available, otherwise use the caller's generic URI
  const uri = ITEM_METADATA_URIS[itemName] || fallbackUri;
  const name = validateString(req.body.name, 'name', { maxLength: 200 }) || itemName;
  const symbol = validateString(req.body.symbol, 'symbol', { maxLength: 10 });
  const description = validateString(req.body.description, 'description', { maxLength: 1000 });

  // Quick dedup check — return immediately if already minted
  try {
    const existing = await checkSoulboundExists(req.user!.userId, itemName);
    if (existing) {
      res.json({ queued: false, alreadyMinted: true, assetId: existing.asset_id });
      return;
    }
  } catch {
    // Non-fatal — let the mint attempt handle errors
  }

  // Return immediately, mint in background
  res.json({ queued: true });

  // Fire-and-forget mint+freeze
  mintAndFreezeSoulbound(req.user!.userId, req.user!.walletAddress, {
    name,
    uri,
    symbol,
    description,
    soulbound: true,
    itemName,
  }).then((result) => {
    if (!result.alreadyMinted) {
      console.log(`Background soulbound mint complete: ${itemName} → ${result.assetId}`);
    }
  }).catch((error) => {
    console.error(`Background soulbound mint failed for ${itemName}:`, error.message);
  });
});

/**
 * GET /api/v1/soulbound/items
 * User's soulbound items
 */
router.get('/items', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const items = await getSoulboundItems(req.user!.walletAddress);
    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch soulbound items' });
  }
});

/**
 * GET /api/v1/soulbound/verify/:assetId
 * Verify on-chain freeze status
 */
router.get('/verify/:assetId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const assetId = req.params.assetId;
    if (!assetId || assetId.length > 64) {
      throw new AppError('Invalid asset ID', 400);
    }

    const status = await verifySoulbound(assetId);
    res.json(status);
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to verify soulbound status' });
    }
  }
});

export default router;
