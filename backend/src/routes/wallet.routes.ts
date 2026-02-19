import { Router, Response } from 'express';
import { fetchWalletCollections, getNFTDetails } from '../services/helius.service';
import { isValidSolanaAddress } from '../services/auth.service';
import { requireAuth } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

const router = Router();

/**
 * GET /api/v1/wallet/:address/collections
 * Get all NFT collections owned by a wallet (auth required, own wallet only)
 */
router.get('/:address/collections', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { address } = req.params;

    if (!isValidSolanaAddress(address)) {
      throw new AppError('Invalid wallet address', 400);
    }

    // Users can only query their own wallet's collections
    if (req.user!.walletAddress !== address) {
      throw new AppError('Forbidden', 403);
    }

    const collections = await fetchWalletCollections(address);
    res.json(collections);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Wallet collections error:', error);
      res.status(500).json({ error: 'Failed to fetch collections' });
    }
  }
});

/**
 * GET /api/v1/nft/:id
 * Get details for a specific NFT (auth required)
 */
router.get('/nft/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Validate asset ID format (base58, reasonable length)
    if (!id || id.length > 50 || !/^[1-9A-HJ-NP-Za-km-z]+$/.test(id)) {
      throw new AppError('Invalid NFT ID', 400);
    }

    const nft = await getNFTDetails(id);

    if (!nft) {
      throw new AppError('NFT not found', 404);
    }

    res.json(nft);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to fetch NFT details' });
    }
  }
});

export default router;
