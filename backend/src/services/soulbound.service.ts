import fetch from 'node-fetch';
import { publicKey, some } from '@metaplex-foundation/umi';
import { freezeV2 } from '@metaplex-foundation/mpl-bubblegum';
import { config, getHeliusRpcUrl } from '../config/constants';
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

  const collectionAddr = config.itemsCollectionMint;

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

  const isFrozen = asset.ownership?.frozen === true;
  const delegate = asset.ownership?.delegate || null;
  const owner = asset.ownership?.owner || null;

  return { isFrozen, delegate, owner };
}

/**
 * Get all soulbound items for a wallet
 */
export async function getSoulboundItems(wallet: string): Promise<SoulboundItem[]> {
  const result = await query(
    'SELECT * FROM soulbound_items WHERE wallet_address = $1 ORDER BY created_at DESC',
    [wallet]
  );
  return result.rows;
}

/**
 * Check if a soulbound item has already been minted for this user+item combo.
 * Returns the existing record if found, null otherwise.
 */
export async function checkSoulboundExists(
  userId: string,
  itemName: string
): Promise<SoulboundItem | null> {
  const result = await query(
    'SELECT * FROM soulbound_items WHERE user_id = $1 AND item_name = $2 LIMIT 1',
    [userId, itemName]
  );
  return result.rows[0] || null;
}

/**
 * Mint and freeze a soulbound item in one operation.
 * Skips if item already minted for this user (deduplication).
 */
export async function mintAndFreezeSoulbound(
  userId: string,
  wallet: string,
  mintConfig: MintParams
): Promise<{
  assetId: string;
  mintSignature: string;
  freezeSignature: string;
  mintLogId: string;
  alreadyMinted?: boolean;
}> {
  // Deduplication: skip if already minted for this user
  const itemName = mintConfig.itemName || mintConfig.name;
  const existing = await checkSoulboundExists(userId, itemName);
  if (existing) {
    return {
      assetId: existing.asset_id,
      mintSignature: '',
      freezeSignature: existing.freeze_signature || '',
      mintLogId: existing.mint_log_id || '',
      alreadyMinted: true,
    };
  }

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

  // Step 3: Register in database
  await registerSoulboundItem({
    userId,
    wallet,
    assetId: mintResult.assetId,
    itemName: mintConfig.itemName || mintConfig.name,
    mintLogId: mintResult.mintLogId,
    freezeSignature,
    metadata: {
      name: mintConfig.name,
      description: mintConfig.description,
      image: mintConfig.image,
      attributes: mintConfig.attributes,
    },
  });

  return {
    assetId: mintResult.assetId,
    mintSignature: mintResult.signature,
    freezeSignature,
    mintLogId: mintResult.mintLogId,
  };
}
