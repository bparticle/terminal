/**
 * PFP Routes — Generate, upload, and mint Scanlines PFP cNFTs
 */

import { Router, Response } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { mintPfp, getPfpStatus, renderTestPfp } from '../services/pfp.service';

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
