import fetch from 'node-fetch';
import { publicKey, some } from '@metaplex-foundation/umi';
import { freezeV2 } from '@metaplex-foundation/mpl-bubblegum';
import { getActiveCollectionMint, getHeliusRpcUrl } from '../config/constants';
import { query } from '../config/database';
import { SoulboundItem, MintParams, MintLeafData } from '../types';
import { executeMint } from './mint.service';
import { getNFTDetails } from './helius.service';
import { getUmi } from './umi';

/**
 * Get the asset proof needed for Bubblegum instructions
 */
async function getAssetProof(assetId: string): Promise<any> {
  const response = await fetch(getHeliusRpcUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'get-asset-proof',
      method: 'getAssetProof',
      params: { id: assetId },
    }),
  });

  const data = await response.json() as any;
  if (data.error) {
    throw new Error(data.error.message || 'Failed to get asset proof');
  }
  return data.result;
}

/**
 * Freeze a compressed NFT as soulbound via Bubblegum V2 freezeV2 instruction.
 * Uses leaf data from the mint transaction (not DAS) for accurate hash computation.
 * Retries on stale proof errors (DAS indexing lag after mint).
 */
export async function freezeAsset(
  assetId: string,
  ownerWallet: string,
  leafData?: MintLeafData
): Promise<{ signature: string }> {
  const umi = getUmi();
  const bs58 = require('bs58');

  const collectionAddr = getActiveCollectionMint('items');

  for (let attempt = 1; attempt <= 5; attempt++) {
    if (attempt > 1) {
      await new Promise((r) => setTimeout(r, 5000));
    }

    // Get proof from DAS (only thing we need from DAS)
    let proof;
    try {
      proof = await getAssetProof(assetId);
    } catch {
      if (attempt < 5) {
        console.log(`Freeze attempt ${attempt}/5: proof not available yet, retrying...`);
        continue;
      }
      throw new Error('Could not get asset proof after 5 attempts');
    }

    try {
      const freezeArgs: any = {
        leafOwner: publicKey(leafData?.owner || ownerWallet),
        leafDelegate: publicKey(leafData?.delegate || umi.identity.publicKey.toString()),
        merkleTree: publicKey(proof.tree_id),
        ...(collectionAddr ? { coreCollection: publicKey(collectionAddr) } : {}),
        root: new Uint8Array(Buffer.from(proof.root.replace('0x', ''), 'hex')),
        nonce: leafData ? BigInt(leafData.nonce) : 0n,
        index: leafData ? leafData.nonce : 0,
        proof: proof.proof.map((p: string) => publicKey(p)),
      };

      if (leafData) {
        // Use leaf data from mint transaction (accurate)
        freezeArgs.dataHash = leafData.dataHash;
        freezeArgs.creatorHash = leafData.creatorHash;
        if (leafData.assetDataHash) {
          freezeArgs.assetDataHash = some(leafData.assetDataHash);
        }
        if (leafData.flags !== undefined) {
          freezeArgs.flags = some(leafData.flags);
        }
      } else {
        // Fallback: fetch from DAS (may have V1-only fields)
        const asset = await getNFTDetails(assetId);
        if (!asset) throw new Error('Asset not found');
        freezeArgs.dataHash = new Uint8Array(Buffer.from(asset.compression.data_hash.replace('0x', ''), 'hex'));
        freezeArgs.creatorHash = new Uint8Array(Buffer.from(asset.compression.creator_hash.replace('0x', ''), 'hex'));
        freezeArgs.nonce = BigInt(asset.compression.leaf_id);
        freezeArgs.index = asset.compression.leaf_id;
      }

      const { signature: sigBytes } = await freezeV2(umi, freezeArgs).sendAndConfirm(umi);
      return { signature: bs58.encode(sigBytes) };
    } catch (err: any) {
      const isStaleProof = err.transactionLogs?.some((l: string) =>
        l.includes('does not match the supplied proof')
      );
      if (isStaleProof && attempt < 5) {
        console.log(`Freeze attempt ${attempt}/5 failed (stale proof), retrying...`);
        continue;
      }
      throw err;
    }
  }

  throw new Error('Failed to freeze after 5 attempts');
}

/**
 * Register a soulbound item in the database
 */
export async function registerSoulboundItem(params: {
  userId: string;
  wallet: string;
  assetId: string;
  itemName: string;
  mintLogId?: string;
  freezeSignature?: string;
  metadata?: Record<string, any>;
}): Promise<SoulboundItem> {
  const result = await query(
    `INSERT INTO soulbound_items (user_id, wallet_address, asset_id, item_name, mint_log_id, is_frozen, freeze_signature, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      params.userId,
      params.wallet,
      params.assetId,
      params.itemName,
      params.mintLogId || null,
      !!params.freezeSignature,
      params.freezeSignature || null,
      JSON.stringify(params.metadata || {}),
    ]
  );
  return result.rows[0];
}

/**
 * Verify an asset is still frozen on-chain
 */
export async function verifySoulbound(assetId: string): Promise<{
  isFrozen: boolean;
  delegate: string | null;
  owner: string | null;
}> {
  const asset = await getNFTDetails(assetId);
  if (!asset) {
    return { isFrozen: false, delegate: null, owner: null };
  }

  const frozen = asset.ownership?.frozen === true;
  const delegate = asset.ownership?.delegate || null;
  const owner = asset.ownership?.owner || null;

  // Verify the freeze delegate is our authority — if not, the item could be unfrozen by someone else
  const umi = getUmi();
  const authorityKey = umi.identity.publicKey.toString();
  const delegateValid = delegate === authorityKey;
  const isFrozen = frozen && delegateValid;

  return { isFrozen, delegate, owner };
}

/**
 * Get soulbound items for a wallet.
 * When campaignId is provided, returns campaign-scoped items from
 * campaign_soulbound_items, with a fallback to global soulbound_items for
 * any items not yet recorded in the campaign mapping (e.g. pre-migration items).
 * Without campaignId, returns from the global soulbound_items table (legacy path).
 */
export async function getSoulboundItems(
  wallet: string,
  campaignId?: string
): Promise<SoulboundItem[]> {
  if (!campaignId) {
    const result = await query(
      'SELECT * FROM soulbound_items WHERE wallet_address = $1 ORDER BY created_at DESC',
      [wallet]
    );
    return result.rows;
  }

  // Campaign-scoped: union campaign mapping + global fallback for unmapped items.
  // ORDER BY is placed after the full UNION (via subquery) so it sorts the combined result.
  const result = await query(
    `SELECT * FROM (
       SELECT
         csi.item_name,
         csi.asset_id,
         csi.is_frozen,
         csi.freeze_signature,
         csi.created_at,
         csi.updated_at,
         'campaign' as source
       FROM campaign_soulbound_items csi
       WHERE csi.wallet_address = $1 AND csi.campaign_id = $2

       UNION ALL

       -- Global fallback: items not yet in campaign_soulbound_items for this campaign
       SELECT
         si.item_name,
         si.asset_id,
         si.is_frozen,
         si.freeze_signature,
         si.created_at,
         si.updated_at,
         'global' as source
       FROM soulbound_items si
       WHERE si.wallet_address = $1
         AND NOT EXISTS (
           SELECT 1 FROM campaign_soulbound_items csi2
           WHERE csi2.wallet_address = $1
             AND csi2.campaign_id = $2
             AND csi2.item_name = si.item_name
         )
     ) combined
     ORDER BY created_at DESC`,
    [wallet, campaignId]
  );
  return result.rows;
}

/**
 * Check if a soulbound item has already been minted for this user+item combo.
 * When campaignId is provided, checks the campaign mapping first, then
 * the global table. Returns the existing record if found, null otherwise.
 */
export async function checkSoulboundExists(
  userId: string,
  itemName: string,
  campaignId?: string
): Promise<SoulboundItem | null> {
  if (campaignId) {
    // Check campaign-specific mapping first
    const campaignResult = await query(
      `SELECT csi.item_name, csi.asset_id, csi.is_frozen, csi.freeze_signature,
              csi.created_at, csi.updated_at
       FROM campaign_soulbound_items csi
       JOIN users u ON u.wallet_address = csi.wallet_address
       WHERE u.id = $1 AND csi.item_name = $2 AND csi.campaign_id = $3
       LIMIT 1`,
      [userId, itemName, campaignId]
    );
    if (campaignResult.rows.length > 0) {
      return campaignResult.rows[0];
    }
  }

  // Fall back to global soulbound_items (covers pre-migration items)
  const result = await query(
    'SELECT * FROM soulbound_items WHERE user_id = $1 AND item_name = $2 LIMIT 1',
    [userId, itemName]
  );
  return result.rows[0] || null;
}

/**
 * Write a campaign_soulbound_items mapping row.
 * Used after minting to associate the on-chain asset with a campaign context,
 * and also to create a mapping when a pre-existing global item is "adopted"
 * into a campaign without re-minting.
 */
async function upsertCampaignSoulboundItem(
  wallet: string,
  campaignId: string,
  itemName: string,
  assetId: string,
  isFrozen: boolean,
  freezeSignature?: string | null
): Promise<void> {
  await query(
    `INSERT INTO campaign_soulbound_items
       (wallet_address, campaign_id, item_name, asset_id, is_frozen, freeze_signature)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (wallet_address, campaign_id, item_name)
     DO UPDATE SET
       asset_id        = EXCLUDED.asset_id,
       is_frozen       = EXCLUDED.is_frozen,
       freeze_signature = EXCLUDED.freeze_signature`,
    [wallet, campaignId, itemName, assetId, isFrozen, freezeSignature || null]
  );
}

/**
 * Mint and freeze a soulbound item in one operation.
 * Skips if item already minted for this user (deduplication).
 *
 * When campaignId is provided:
 *   • Checks campaign_soulbound_items first for dedup.
 *   • If the item exists globally (soulbound_items) but not in this campaign,
 *     creates the campaign mapping and returns alreadyMinted=true (no re-mint).
 *   • On successful mint, writes to BOTH soulbound_items and campaign_soulbound_items.
 */
export async function mintAndFreezeSoulbound(
  userId: string,
  wallet: string,
  mintConfig: MintParams,
  campaignId?: string
): Promise<{
  assetId: string;
  mintSignature: string;
  freezeSignature: string;
  mintLogId: string;
  alreadyMinted?: boolean;
}> {
  const itemName = mintConfig.itemName || mintConfig.name;

  // Campaign-specific dedup: if already in campaign mapping, short-circuit.
  if (campaignId) {
    const campaignExisting = await query(
      `SELECT csi.asset_id, csi.is_frozen, csi.freeze_signature
       FROM campaign_soulbound_items csi
       JOIN users u ON u.wallet_address = csi.wallet_address
       WHERE u.id = $1 AND csi.item_name = $2 AND csi.campaign_id = $3
       LIMIT 1`,
      [userId, itemName, campaignId]
    );
    if (campaignExisting.rows.length > 0) {
      const row = campaignExisting.rows[0];
      return {
        assetId: row.asset_id,
        mintSignature: '',
        freezeSignature: row.freeze_signature || '',
        mintLogId: '',
        alreadyMinted: true,
      };
    }

    // Item exists globally (minted in another campaign context) — adopt it into
    // this campaign without re-minting. Creates the campaign mapping only.
    const globalExisting = await query(
      'SELECT * FROM soulbound_items WHERE user_id = $1 AND item_name = $2 LIMIT 1',
      [userId, itemName]
    );
    if (globalExisting.rows.length > 0) {
      const g = globalExisting.rows[0];
      await upsertCampaignSoulboundItem(
        wallet, campaignId, itemName, g.asset_id, g.is_frozen, g.freeze_signature
      );
      return {
        assetId: g.asset_id,
        mintSignature: '',
        freezeSignature: g.freeze_signature || '',
        mintLogId: g.mint_log_id || '',
        alreadyMinted: true,
      };
    }
  }

  // Global dedup: atomically reserve the user+item slot before minting.
  const reserveResult = await query(
    `INSERT INTO soulbound_items (user_id, wallet_address, asset_id, item_name, is_frozen, metadata)
     VALUES ($1, $2, $3, $4, FALSE, $5)
     ON CONFLICT (user_id, item_name) DO NOTHING
     RETURNING id`,
    [userId, wallet, `pending-${userId}-${itemName}`, itemName, JSON.stringify({})]
  );

  if (reserveResult.rowCount === 0) {
    // Already exists globally — create campaign mapping if needed
    const existing = await checkSoulboundExists(userId, itemName);
    if (existing) {
      if (campaignId) {
        await upsertCampaignSoulboundItem(
          wallet, campaignId, itemName, existing.asset_id, existing.is_frozen, existing.freeze_signature
        );
      }
      return {
        assetId: existing.asset_id,
        mintSignature: '',
        freezeSignature: existing.freeze_signature || '',
        mintLogId: existing.mint_log_id || '',
        alreadyMinted: true,
      };
    }
    throw new Error('Soulbound item already being minted');
  }

  const reservationId = reserveResult.rows[0].id;

  try {
    // Step 1: Mint the cNFT (returns leaf data for freeze)
    const mintResult = await executeMint(userId, wallet, { ...mintConfig, soulbound: true });

    // Step 2: Wait for DAS to index the proof, then freeze
    await new Promise((r) => setTimeout(r, 10000));

    let freezeSignature: string;
    try {
      const freezeResult = await freezeAsset(mintResult.assetId, wallet, mintResult.leafData);
      freezeSignature = freezeResult.signature;
    } catch (error: any) {
      console.error('Freeze failed after mint:', error);
      throw new Error(`Minted successfully (${mintResult.assetId}) but freeze failed: ${error.message}`);
    }

    const metadata = JSON.stringify({
      name: mintConfig.name,
      description: mintConfig.description,
      image: mintConfig.image,
      attributes: mintConfig.attributes,
    });

    // Step 3: Update global reservation with real data
    await query(
      `UPDATE soulbound_items
       SET asset_id = $1, mint_log_id = $2, is_frozen = TRUE, freeze_signature = $3, metadata = $4
       WHERE id = $5`,
      [mintResult.assetId, mintResult.mintLogId, freezeSignature, metadata, reservationId]
    );

    // Step 4: Write campaign mapping if campaign context was provided
    if (campaignId) {
      await upsertCampaignSoulboundItem(
        wallet, campaignId, itemName, mintResult.assetId, true, freezeSignature
      );
    }

    return {
      assetId: mintResult.assetId,
      mintSignature: mintResult.signature,
      freezeSignature,
      mintLogId: mintResult.mintLogId,
    };
  } catch (error) {
    // Clean up the global reservation on failure so the user can retry
    await query('DELETE FROM soulbound_items WHERE id = $1', [reservationId]);
    throw error;
  }
}
