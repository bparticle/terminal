import { Router, Response } from 'express';
import { fetchOwnedAssetsByCollections, fetchWalletCollections, getNFTDetails, buildGalleryAsset } from '../services/helius.service';
import { isValidSolanaAddress } from '../services/auth.service';
import { requireAuth } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { query } from '../config/database';
import { getActiveCollectionMint } from '../config/constants';
import { validateString } from '../middleware/validate';
import { confirmCompressedNftTransfer, prepareCompressedNftTransfer } from '../services/cnft-transfer.service';
import { writeLimiter } from '../middleware/rateLimiter';

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
 * GET /api/v1/wallet/:address/gallery
 * Get normalized collection gallery data for the authenticated wallet.
 */
router.get('/:address/gallery', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { address } = req.params;
    if (!isValidSolanaAddress(address)) {
      throw new AppError('Invalid wallet address', 400);
    }
    if (req.user!.walletAddress !== address) {
      throw new AppError('Forbidden', 403);
    }

    const activePfpCollection = getActiveCollectionMint('pfp');
    const activeItemsCollection = getActiveCollectionMint('items');
    const collectionConfigs = [
      activePfpCollection ? { collectionId: activePfpCollection, label: 'Scanlines PFPs', type: 'pfp' as const } : null,
      activeItemsCollection ? { collectionId: activeItemsCollection, label: 'Terminal Items', type: 'items' as const } : null,
    ].filter((entry): entry is { collectionId: string; label: string; type: 'pfp' | 'items' } => entry !== null);

    const collections = await fetchOwnedAssetsByCollections(address, collectionConfigs);

    const pfpResult = await query(
      'SELECT pfp_nft_id FROM users WHERE id = $1 LIMIT 1',
      [req.user!.userId]
    );
    const currentPfpAssetId = pfpResult.rows[0]?.pfp_nft_id || null;

    const [metadataRows, soulboundRows] = await Promise.all([
      query(
        `SELECT asset_id, mint_type, nft_metadata
         FROM mint_log
         WHERE wallet_address = $1
           AND status = 'confirmed'
           AND asset_id IS NOT NULL`,
        [address]
      ),
      query(
        `SELECT asset_id, item_name FROM soulbound_items WHERE wallet_address = $1`,
        [address]
      ),
    ]);

    const byAsset = new Map<string, { mint_type: string; nft_metadata: Record<string, unknown> | null }>();
    for (const row of metadataRows.rows) {
      if (!row.asset_id) continue;
      byAsset.set(row.asset_id, {
        mint_type: row.mint_type || 'standard',
        nft_metadata: row.nft_metadata || null,
      });
    }

    const soulboundAssetIds = new Set<string>(
      soulboundRows.rows.map((row: any) => row.asset_id).filter(Boolean)
    );

    const normalized = collections.map((collection) => ({
      collectionId: collection.collectionId,
      label: collection.label,
      type: collection.type,
      nfts: collection.nfts.map((nft) => {
        const metadata = byAsset.get(nft.assetId);
        return {
          assetId: nft.assetId,
          name: nft.name,
          image: nft.image,
          attributes: nft.attributes,
          collectionId: nft.collectionId,
          owner: nft.owner,
          compression: nft.compression,
          mintType: metadata?.mint_type || 'standard',
          terminalMetadata: metadata?.nft_metadata || null,
          isCurrentPfp: currentPfpAssetId === nft.assetId,
          isSoulbound: soulboundAssetIds.has(nft.assetId),
        };
      }),
    }));

    // DAS fallback: searchAssets can miss frozen/soulbound cNFTs due to indexing lag.
    // For any soulbound item that's in the DB but absent from the Helius response,
    // fetch it directly via getAsset (which is more reliable for individual lookups)
    // and inject it into the Items collection.
    if (activeItemsCollection) {
      const heliusAssetIds = new Set(normalized.flatMap((c) => c.nfts.map((n) => n.assetId)));
      const missing = soulboundRows.rows.filter(
        (row: any) => row.asset_id && !heliusAssetIds.has(row.asset_id)
      ).slice(0, 20); // cap to avoid excessive API calls

      if (missing.length > 0) {
        const fallbackAssets = await Promise.all(
          missing.map(async (row: any) => {
            const asset = await getNFTDetails(row.asset_id);
            if (!asset) return null;
            const ga = buildGalleryAsset(asset, activeItemsCollection);
            const metadata = byAsset.get(row.asset_id);
            return {
              ...ga,
              mintType: metadata?.mint_type || 'items',
              terminalMetadata: metadata?.nft_metadata || null,
              isCurrentPfp: currentPfpAssetId === row.asset_id,
              isSoulbound: true,
            };
          })
        );

        const valid = fallbackAssets.filter(Boolean) as typeof normalized[number]['nfts'];
        if (valid.length > 0) {
          const itemsCollection = normalized.find((c) => c.type === 'items');
          if (itemsCollection) {
            itemsCollection.nfts.push(...valid);
          }
        }
      }
    }

    res.json({
      wallet: address,
      currentPfpAssetId,
      collections: normalized,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Wallet gallery error:', error);
      res.status(500).json({ error: 'Failed to fetch wallet gallery' });
    }
  }
});

/**
 * POST /api/v1/wallet/transfer/prepare
 * Build a user-signed compressed NFT transfer transaction.
 */
router.post('/transfer/prepare', writeLimiter, requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const assetId = validateString(req.body.assetId, 'assetId', { required: true, maxLength: 80 })!;
    const toWallet = validateString(req.body.toWallet, 'toWallet', { required: true, maxLength: 80 })!;

    if (!isValidSolanaAddress(toWallet)) {
      throw new AppError('Invalid recipient wallet address', 400);
    }

    const prepared = await prepareCompressedNftTransfer({
      assetId,
      ownerWallet: req.user.walletAddress,
      toWallet,
    });

    res.json(prepared);
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      const message = error?.message || 'Failed to prepare transfer';
      const statusCode = message.includes('own') || message.includes('cannot') ? 403 : 400;
      res.status(statusCode).json({ error: message });
    }
  }
});

/**
 * POST /api/v1/wallet/transfer/confirm
 * Submit a wallet-signed transfer transaction and wait for confirmation.
 */
router.post('/transfer/confirm', writeLimiter, requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const assetId = validateString(req.body.assetId, 'assetId', { required: true, maxLength: 80 })!;
    const transferToken = validateString(req.body.transferToken, 'transferToken', { required: true, maxLength: 128 })!;
    const signedTransactionBase64 = validateString(req.body.signedTransactionBase64, 'signedTransactionBase64', { required: true, maxLength: 10000 })!;

    const result = await confirmCompressedNftTransfer({
      transferToken,
      assetId,
      ownerWallet: req.user.walletAddress,
      signedTransactionBase64,
    });

    res.json(result);
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(400).json({ error: error?.message || 'Failed to confirm transfer' });
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
