/**
 * PFP Routes — Generate, upload, and mint Scanlines PFP cNFTs
 */

import { Router, Response } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { mintPfp, getPfpStatus, renderTestPfp, preparePfpMint, confirmPfpMint } from '../services/pfp.service';
import { submitSignedTransaction } from '../services/mint.service';
import { query, transaction } from '../config/database';
import { validateString } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';

const router = Router();

/**
 * POST /pfp/mint
 * Generate a random PFP, upload to Arweave, mint as cNFT.
 * Returns the result only after mint confirms — no preview.
 */
router.post('/mint', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await mintPfp(req.user.userId, req.user.walletAddress);

    res.json({
      assetId: result.assetId,
      signature: result.signature,
      imageUri: result.imageUri,
      seed: result.seed,
      traits: {
        race: result.traits.race,
        paletteName: result.traits.paletteName,
        faceShape: result.traits.faceShape,
        earStyle: result.traits.earStyle,
        eyeType: result.traits.eyeType,
        mouthStyle: result.traits.mouthStyle,
        hairStyle: result.traits.hairStyle,
        accessory: result.traits.accessory,
        clothing: result.traits.clothing,
        bgPattern: result.traits.bgPattern,
        pixelStyle: result.traits.pixelStyle,
      },
    });
  } catch (error: any) {
    const message = error.message || 'PFP mint failed';

    if (message === 'Wallet not whitelisted for minting') {
      return res.status(403).json({ error: message, code: 'NOT_WHITELISTED' });
    }
    if (message === 'Mint limit reached') {
      return res.status(403).json({ error: message, code: 'LIMIT_REACHED' });
    }

    console.error('PFP mint error:', error);
    res.status(500).json({ error: message });
  }
});

/**
 * POST /pfp/prepare
 * Generate a PFP, upload to Arweave, build a partially-signed mint transaction.
 * User co-signs and submits client-side, then calls /pfp/confirm.
 */
router.post('/prepare', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await preparePfpMint(req.user.userId, req.user.walletAddress);

    res.json({
      transactionBase64: result.transactionBase64,
      mintLogId: result.mintLogId,
      pfpData: {
        seed: result.pfpData.seed,
        imageUri: result.pfpData.imageUri,
        name: result.pfpData.name,
        traits: {
          race: result.pfpData.traits.race,
          paletteName: result.pfpData.traits.paletteName,
          faceShape: result.pfpData.traits.faceShape,
          earStyle: result.pfpData.traits.earStyle,
          eyeType: result.pfpData.traits.eyeType,
          mouthStyle: result.pfpData.traits.mouthStyle,
          hairStyle: result.pfpData.traits.hairStyle,
          accessory: result.pfpData.traits.accessory,
          clothing: result.pfpData.traits.clothing,
          bgPattern: result.pfpData.traits.bgPattern,
          pixelStyle: result.pfpData.traits.pixelStyle,
        },
      },
    });
  } catch (error: any) {
    const message = error.message || 'PFP prepare failed';

    if (message === 'Wallet not whitelisted for minting') {
      return res.status(403).json({ error: message, code: 'NOT_WHITELISTED' });
    }
    if (message === 'Mint limit reached') {
      return res.status(403).json({ error: message, code: 'LIMIT_REACHED' });
    }

    console.error('PFP prepare error:', error);
    res.status(500).json({ error: message });
  }
});

/**
 * POST /pfp/confirm
 * Accept a user-signed transaction, submit it to the chain via Helius,
 * then confirm the PFP mint and update records.
 */
router.post('/confirm', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

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

    const result = await confirmPfpMint(mintLogId, signature, req.user!.userId, req.user!.walletAddress);

    res.json({
      assetId: result.assetId,
      signature: result.signature,
      imageUri: result.imageUri,
      seed: result.seed,
      traits: result.traits,
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('PFP confirm error:', error);
      res.status(400).json({ error: error.message || 'Failed to confirm PFP mint' });
    }
  }
});

/**
 * GET /pfp/status
 * Check PFP mint eligibility and existing PFPs for the authenticated user.
 */
router.get('/status', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const status = await getPfpStatus(req.user.userId, req.user.walletAddress);
    res.json(status);
  } catch (error: any) {
    console.error('PFP status error:', error);
    res.status(500).json({ error: 'Failed to check PFP status' });
  }
});

/**
 * GET /pfp/preview-test/:seed
 * Render a test PFP PNG without minting. Admin only.
 */
router.get('/preview-test/:seed', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const seed = parseInt(req.params.seed, 10);
    if (isNaN(seed)) {
      return res.status(400).json({ error: 'Invalid seed — must be an integer' });
    }

    const pngBuffer = renderTestPfp(seed);

    res.set({
      'Content-Type': 'image/png',
      'Content-Length': String(pngBuffer.length),
      'Cache-Control': 'no-store',
    });
    res.send(pngBuffer);
  } catch (error: any) {
    console.error('PFP preview error:', error);
    res.status(500).json({ error: 'Failed to render preview' });
  }
});

export default router;
