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
import { executeMint, checkWhitelist, prepareMintTransaction, confirmUserMint } from './mint.service';
import { query, transaction } from '../config/database';
import type { FaceTraits as FaceTraitsType } from 'scanlines-pfp-generator';
import { config } from '../config/constants';
import { getNFTDetails } from './helius.service';

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

export interface GlobalPfpOwner {
  assetId: string;
  image: string;
  pfpName: string;
  mintedAt: string;
  ownerName: string | null;
  ownerWallet: string;
  ownerUserId: string;
}

async function resolveNetworkSeparatedPfps<T extends { asset_id: string; nft_metadata: any }>(rows: T[]): Promise<T[]> {
  const directMatches: T[] = [];
  const needsVerification: T[] = [];

  for (const row of rows) {
    const rowNetwork = row.nft_metadata?.network;
    if (typeof rowNetwork === 'string') {
      if (rowNetwork === config.solanaNetwork) {
        directMatches.push(row);
      }
      continue;
    }
    // Legacy rows without explicit network metadata are verified against the active RPC.
    needsVerification.push(row);
  }

  if (needsVerification.length === 0) {
    return directMatches;
  }

  const verified = await Promise.all(
    needsVerification.map(async (row) => {
      const asset = await getNFTDetails(row.asset_id);
      return asset ? row : null;
    }),
  );
  const verifiedMatches: T[] = [];
  for (const row of verified) {
    if (row) verifiedMatches.push(row);
  }

  return [...directMatches, ...verifiedMatches];
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

  const networkRows = await resolveNetworkSeparatedPfps(pfpResult.rows as Array<{ asset_id: string; nft_metadata: any }>);
  const pfps = networkRows.map((row: any) => ({
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
 * Get confirmed PFP mints across all users with owner identity.
 * Authenticated-only read model for the global gallery tab.
 */
export async function getGlobalPfpOwners(limit = 200): Promise<GlobalPfpOwner[]> {
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Math.floor(limit), 1), 500) : 200;

  const result = await query(
    `SELECT
       ml.asset_id,
       ml.nft_name,
       ml.nft_metadata,
       ml.created_at,
       u.id AS owner_user_id,
       u.wallet_address AS owner_wallet,
       u.name AS owner_name
     FROM mint_log ml
     INNER JOIN users u ON u.id = ml.user_id
     WHERE ml.mint_type = 'pfp'
       AND ml.status = 'confirmed'
       AND ml.asset_id IS NOT NULL
     ORDER BY ml.created_at DESC
     LIMIT $1`,
    [safeLimit],
  );

  const networkRows = await resolveNetworkSeparatedPfps(result.rows as Array<{ asset_id: string; nft_metadata: any }>);
  return networkRows.map((row: any) => ({
    assetId: row.asset_id,
    image: row.nft_metadata?.imageUri || '',
    pfpName: row.nft_metadata?.name || row.nft_name || 'Scanlines PFP',
    mintedAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    ownerName: row.owner_name || null,
    ownerWallet: row.owner_wallet,
    ownerUserId: row.owner_user_id,
  }));
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

  const attributes = rawAttributes.map((a: { trait_type: string; value: unknown }) => ({
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
      network: config.solanaNetwork,
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

export interface PfpPrepareResult {
  transactionBase64: string;
  mintLogId: string;
  pfpData: {
    seed: number;
    imageUri: string;
    metadataUri: string;
    name: string;
    traits: FaceTraits;
  };
}

/**
 * Prepare a PFP mint: generate → upload to Arweave → build partially-signed tx.
 * Returns the serialized transaction for the user to co-sign, plus PFP metadata for the reveal.
 */
export async function preparePfpMint(userId: string, wallet: string): Promise<PfpPrepareResult> {
  // Atomically check eligibility and reserve a mint slot
  await transaction(async (client) => {
    const wlResult = await client.query(
      'SELECT * FROM mint_whitelist WHERE wallet_address = $1 FOR UPDATE',
      [wallet]
    );
    const entry = wlResult.rows[0];
    if (!entry || !entry.is_active) {
      throw new Error('Wallet not whitelisted for minting');
    }
    if (entry.max_mints > 0 && entry.mints_used >= entry.max_mints) {
      throw new Error('Mint limit reached');
    }
    // Reserve the slot so concurrent requests see the updated count
    await client.query(
      'UPDATE mint_whitelist SET mints_used = mints_used + 1 WHERE wallet_address = $1',
      [wallet]
    );
  });

  try {
    const seed = randomInt(0, 2147483647);

    const { pngBuffer, traits, attributes: rawAttributes } = renderPfp(PFP_SIZE, seed);

    const attributes = rawAttributes.map((a: { trait_type: string; value: unknown }) => ({
      trait_type: a.trait_type,
      value: String(a.value),
    }));

    const pfpName = `Scanlines #${seed.toString(36).toUpperCase()}`;

    // Upload to Arweave (server-paid)
    const { imageUri, metadataUri } = await uploadPfpAndMetadata({
      imageBuffer: pngBuffer,
      name: pfpName,
      description: 'A unique procedurally generated Scanlines pixel-art PFP from Terminal.',
      symbol: 'SCAN',
      attributes,
    });

    // Create prepared mint_log entry
    const logResult = await query(
      `INSERT INTO mint_log (user_id, wallet_address, mint_type, nft_name, nft_metadata, status)
       VALUES ($1, $2, 'pfp', $3, $4, 'prepared')
       RETURNING id`,
      [userId, wallet, pfpName, JSON.stringify({
        network: config.solanaNetwork,
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
      })]
    );
    const mintLogId = logResult.rows[0].id;

    // Build partially-signed transaction
    const { transactionBase64 } = await prepareMintTransaction({
      name: pfpName,
      uri: metadataUri,
      symbol: 'SCAN',
      ownerWallet: wallet,
      collection: 'pfp',
    });

    return {
      transactionBase64,
      mintLogId,
      pfpData: {
        seed,
        imageUri,
        metadataUri,
        name: pfpName,
        traits,
      },
    };
  } catch (error) {
    // Release the reserved mint slot on failure
    await query(
      'UPDATE mint_whitelist SET mints_used = GREATEST(mints_used - 1, 0) WHERE wallet_address = $1',
      [wallet]
    );
    throw error;
  }
}

/**
 * Confirm a user-submitted PFP mint transaction.
 * Updates mint_log, whitelist, and user profile.
 */
export async function confirmPfpMint(
  mintLogId: string,
  signatureBase58: string,
  userId: string,
  wallet: string,
): Promise<PfpMintResult> {
  // Get the stored PFP data from the mint_log
  const logResult = await query(
    `SELECT nft_metadata FROM mint_log WHERE id = $1 AND user_id = $2 AND status IN ('prepared', 'pending')`,
    [mintLogId, userId]
  );
  if (!logResult.rows[0]) {
    throw new Error('Mint log entry not found or not in prepared state');
  }

  const metadata = logResult.rows[0].nft_metadata;

  // Confirm the on-chain transaction (slot already reserved at prepare time)
  const result = await confirmUserMint(mintLogId, signatureBase58, userId, wallet, { skipWhitelistIncrement: true });

  // Update mint_log with PFP type (confirmUserMint already updated status)
  await query(
    `UPDATE mint_log SET mint_type = 'pfp' WHERE id = $1`,
    [mintLogId]
  );

  // Update user profile with latest PFP
  await query(
    'UPDATE users SET pfp_image_url = $1, pfp_nft_id = $2 WHERE id = $3',
    [metadata.imageUri, result.assetId, userId]
  );

  return {
    assetId: result.assetId,
    signature: result.signature,
    mintLogId: result.mintLogId,
    imageUri: metadata.imageUri,
    metadataUri: metadata.metadataUri,
    traits: metadata.traits,
    seed: metadata.seed,
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
