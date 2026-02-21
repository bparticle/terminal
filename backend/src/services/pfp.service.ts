/**
 * PFP Service — Orchestrates generation → upload → mint
 *
 * Each call produces a unique, randomly-generated Scanlines pixel-art face
 * minted as a cNFT on Solana. The player has no control over traits — the
 * seed is generated server-side via crypto.randomInt().
 */

import { randomInt } from 'crypto';
import { generateFace } from '../scanlines/generator';
import { applyEffectsPipeline } from '../scanlines/effects';
import { getDefaultParams, scaleParamsForResolution, PREVIEW_SIZE } from '../scanlines/effect-types';
import type { FaceTraits } from '../scanlines/traits';
import { uploadPfpAndMetadata } from './arweave.service';
import { executeMint, checkWhitelist } from './mint.service';
import { query } from '../config/database';

const PFP_SIZE = 512;

export interface PfpMintResult {
  assetId: string;
  signature: string;
  mintLogId: string;
  imageUri: string;
  metadataUri: string;
  traits: FaceTraits;
  seed: number;
}

export interface PfpStatus {
  whitelisted: boolean;
  canMint: boolean;
  pfpCount: number;
  maxMints: number;
  mintsRemaining: number;
  pfps: Array<{ assetId: string; imageUri: string; name: string }>;
}

/**
 * Check PFP mint status for a wallet.
 */
export async function getPfpStatus(userId: string, wallet: string): Promise<PfpStatus> {
  const entry = await checkWhitelist(wallet);

  if (!entry || !entry.is_active) {
    return {
      whitelisted: false,
      canMint: false,
      pfpCount: 0,
      maxMints: 0,
      mintsRemaining: 0,
      pfps: [],
    };
  }

  // Get existing PFP mints from mint_log
  const pfpResult = await query(
    `SELECT asset_id, nft_metadata FROM mint_log
     WHERE user_id = $1 AND mint_type = 'pfp' AND status = 'confirmed'
     ORDER BY created_at DESC`,
    [userId],
  );

  const pfps = pfpResult.rows.map((row: any) => ({
    assetId: row.asset_id,
    imageUri: row.nft_metadata?.imageUri || '',
    name: row.nft_metadata?.name || 'Scanlines PFP',
  }));

  const pfpCount = pfps.length;
  const mintsRemaining = entry.max_mints > 0
    ? Math.max(0, entry.max_mints - entry.mints_used)
    : Infinity;

  return {
    whitelisted: true,
    canMint: mintsRemaining > 0,
    pfpCount,
    maxMints: entry.max_mints,
    mintsRemaining: entry.max_mints > 0 ? mintsRemaining : -1,
    pfps,
  };
}

/**
 * Generate, upload, and mint a PFP cNFT.
 *
 * Flow:
 * 1. Generate cryptographic random seed
 * 2. Render PFP at 512px with CRT effects
 * 3. Upload image + metadata to Arweave
 * 4. Mint cNFT via Bubblegum V2 (whitelist enforced by executeMint)
 * 5. Update user profile with latest PFP
 * 6. Store seed in mint_log metadata for reproducibility
 */
export async function mintPfp(userId: string, wallet: string): Promise<PfpMintResult> {
  // 1. Generate seed — cryptographic randomness, player has zero control
  const seed = randomInt(0, 2147483647);

  // 2. Render the PFP
  const { canvas, traits } = generateFace(PFP_SIZE, seed);

  // Apply CRT effects pipeline
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, PFP_SIZE, PFP_SIZE);
  const effectParams = scaleParamsForResolution(getDefaultParams(), PFP_SIZE);
  applyEffectsPipeline(imageData, effectParams);
  ctx.putImageData(imageData, 0, 0);

  // Export to PNG buffer
  const pngBuffer = canvas.toBuffer('image/png');

  // Build trait attributes for NFT metadata
  const attributes = [
    { trait_type: 'Palette', value: traits.paletteName },
    { trait_type: 'Face', value: traits.faceShape },
    { trait_type: 'Eyes', value: traits.eyeType },
    { trait_type: 'Mouth', value: traits.mouthStyle },
    { trait_type: 'Hair', value: traits.hairStyle },
    { trait_type: 'Accessory', value: traits.accessory },
    { trait_type: 'Clothing', value: traits.clothing },
    { trait_type: 'Background', value: traits.bgPattern },
    { trait_type: 'Pixel Style', value: traits.pixelStyle },
  ];

  const pfpName = `Scanlines #${seed.toString(36).toUpperCase()}`;

  // 3. Upload to Arweave
  const { imageUri, metadataUri } = await uploadPfpAndMetadata({
    imageBuffer: pngBuffer,
    name: pfpName,
    description: 'A unique procedurally generated Scanlines pixel-art PFP from Terminal.',
    symbol: 'SCAN',
    attributes,
  });

  // 4. Mint cNFT — executeMint handles whitelist check & limit enforcement
  const mintResult = await executeMint(userId, wallet, {
    name: pfpName,
    uri: metadataUri,
    symbol: 'SCAN',
    description: 'Scanlines PFP',
    image: imageUri,
    attributes,
    collection: 'pfp',
  });

  // 5. Store seed + image URI in the mint_log metadata for reproducibility
  await query(
    `UPDATE mint_log SET mint_type = 'pfp', nft_metadata = $1 WHERE id = $2`,
    [JSON.stringify({
      seed,
      imageUri,
      metadataUri,
      name: pfpName,
      traits: {
        paletteName: traits.paletteName,
        faceShape: traits.faceShape,
        eyeType: traits.eyeType,
        mouthStyle: traits.mouthStyle,
        hairStyle: traits.hairStyle,
        accessory: traits.accessory,
        clothing: traits.clothing,
        bgPattern: traits.bgPattern,
        pixelStyle: traits.pixelStyle,
      },
    }), mintResult.mintLogId],
  );

  // 6. Update user profile with latest PFP
  await query(
    'UPDATE users SET pfp_image_url = $1, pfp_nft_id = $2 WHERE id = $3',
    [imageUri, mintResult.assetId, userId],
  );

  return {
    assetId: mintResult.assetId,
    signature: mintResult.signature,
    mintLogId: mintResult.mintLogId,
    imageUri,
    metadataUri,
    traits,
    seed,
  };
}

/**
 * Render a test PFP as a PNG buffer (no mint, no upload).
 * Admin testing only.
 */
export function renderTestPfp(seed: number): Buffer {
  const { canvas } = generateFace(PFP_SIZE, seed);

  // Apply CRT effects
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, PFP_SIZE, PFP_SIZE);
  const effectParams = scaleParamsForResolution(getDefaultParams(), PFP_SIZE);
  applyEffectsPipeline(imageData, effectParams);
  ctx.putImageData(imageData, 0, 0);

  return canvas.toBuffer('image/png');
}
