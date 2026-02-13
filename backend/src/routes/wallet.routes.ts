import { Router, Request, Response } from 'express';
import { fetchWalletCollections, getNFTDetails } from '../services/helius.service';
import { isValidSolanaAddress } from '../services/auth.service';
import { AppError } from '../middleware/errorHandler';

const router = Router();

/**
 * GET /api/v1/wallet/:address/collections
 * Get all NFT collections owned by a wallet
 */
router.get('/:address/collections', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    if (!isValidSolanaAddress(address)) {
      throw new AppError('Invalid wallet address', 400);
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
 * Get details for a specific NFT
 */
router.get('/nft/:id', async (req: Request, res: Response) => {
  try {
    const nft = await getNFTDetails(req.params.id);

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
