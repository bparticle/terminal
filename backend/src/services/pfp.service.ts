/**
 * PFP Service — Orchestrates generation → upload → mint
 *
 * Uses the standalone scanlines-pfp-generator package which includes
 * the full race-aware pipeline, CRT effects, and AI filters with
 * baked preset settings from the scanlines playground.
 */

import { randomInt } from 'crypto';
import { renderPfp, buildTraitAttributes, type FaceTraits } from 'scanlines-pfp-generator';
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
 * 2. Render PFP at 512px with full pipeline (face + AI filter + CRT effects)
 * 3. Upload image + metadata to Arweave
 * 4. Mint cNFT via Bubblegum V2 (whitelist enforced by executeMint)
 * 5. Update user profile with latest PFP
 * 6. Store seed in mint_log metadata for reproducibility
 */
export async function mintPfp(userId: string, wallet: string): Promise<PfpMintResult> {
  const seed = randomInt(0, 2147483647);

  const { pngBuffer, traits, attributes: rawAttributes } = renderPfp(PFP_SIZE, seed);

  const attributes = rawAttributes.map(a => ({
    trait_type: a.trait_type,
    value: String(a.value),
  }));

  const pfpName = `Scanlines #${seed.toString(36).toUpperCase()}`;

  const { imageUri, metadataUri } = await uploadPfpAndMetadata({
    imageBuffer: pngBuffer,
    name: pfpName,
    description: 'A unique procedurally generated Scanlines pixel-art PFP from Terminal.',
    symbol: 'SCAN',
    attributes,
  });

  const mintResult = await executeMint(userId, wallet, {
    name: pfpName,
    uri: metadataUri,
    symbol: 'SCAN',
    description: 'Scanlines PFP',
    image: imageUri,
    attributes,
    collection: 'pfp',
  });

  await query(
    `UPDATE mint_log SET mint_type = 'pfp', nft_metadata = $1 WHERE id = $2`,
    [JSON.stringify({
      seed,
      imageUri,
      metadataUri,
      name: pfpName,
      traits: {
        race: traits.race,
        paletteName: traits.paletteName,
        faceShape: traits.faceShape,
        earStyle: traits.earStyle,
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
  const { pngBuffer } = renderPfp(PFP_SIZE, seed);
  return pngBuffer;
}
