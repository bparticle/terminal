import fetch from 'node-fetch';
import { publicKey } from '@metaplex-foundation/umi';
import { mintV2, parseLeafFromMintV2Transaction } from '@metaplex-foundation/mpl-bubblegum';
import { config } from '../config/constants';
import { query, transaction } from '../config/database';
import { WhitelistEntry, MintLogEntry, MintParams, MintResult, MintLeafData } from '../types';
import { getUmi } from './umi';

const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${config.heliusApiKey}`;

// ── Whitelist CRUD ─────────────────────────────

export async function checkWhitelist(wallet: string): Promise<WhitelistEntry | null> {
  const result = await query(
    'SELECT * FROM mint_whitelist WHERE wallet_address = $1',
    [wallet]
  );
  return result.rows[0] || null;
}

export async function addToWhitelist(
  wallet: string,
  maxMints: number,
  addedBy: string,
  notes?: string
): Promise<WhitelistEntry> {
  const result = await query(
    `INSERT INTO mint_whitelist (wallet_address, max_mints, added_by, notes)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [wallet, maxMints, addedBy, notes || null]
  );
  return result.rows[0];
}

export async function removeFromWhitelist(wallet: string): Promise<void> {
  await query('DELETE FROM mint_whitelist WHERE wallet_address = $1', [wallet]);
}

export async function updateWhitelist(
  wallet: string,
  updates: Partial<Pick<WhitelistEntry, 'max_mints' | 'is_active' | 'notes'>>
): Promise<WhitelistEntry | null> {
  const setClauses: string[] = [];
  const values: any[] = [];
  let paramIdx = 1;

  if (updates.max_mints !== undefined) {
    setClauses.push(`max_mints = $${paramIdx++}`);
    values.push(updates.max_mints);
  }
  if (updates.is_active !== undefined) {
    setClauses.push(`is_active = $${paramIdx++}`);
    values.push(updates.is_active);
  }
  if (updates.notes !== undefined) {
    setClauses.push(`notes = $${paramIdx++}`);
    values.push(updates.notes);
  }

  if (setClauses.length === 0) return checkWhitelist(wallet);

  values.push(wallet);
  const result = await query(
    `UPDATE mint_whitelist SET ${setClauses.join(', ')} WHERE wallet_address = $${paramIdx} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function getAllWhitelist(): Promise<WhitelistEntry[]> {
  const result = await query('SELECT * FROM mint_whitelist ORDER BY created_at DESC');
  return result.rows;
}

export async function bulkAddToWhitelist(
  entries: Array<{ wallet: string; maxMints: number; notes?: string }>,
  addedBy: string
): Promise<{ added: number; skipped: number }> {
  let added = 0;
  let skipped = 0;

  for (const entry of entries) {
    try {
      await query(
        `INSERT INTO mint_whitelist (wallet_address, max_mints, added_by, notes)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (wallet_address) DO NOTHING`,
        [entry.wallet, entry.maxMints, addedBy, entry.notes || null]
      );
      added++;
    } catch {
      skipped++;
    }
  }

  return { added, skipped };
}

// ── Minting ────────────────────────────────────

/**
 * Mint a compressed NFT via Bubblegum V2 mintV2 instruction.
 * Callers must provide a pre-uploaded metadata URI.
 */
export async function mintCompressedNFT(params: {
  name: string;
  uri: string;
  symbol?: string;
  ownerWallet: string;
  sellerFeeBasisPoints?: number;
  collection?: 'pfp' | 'items';
  soulbound?: boolean;
}): Promise<{ assetId: string; signature: string; leafData?: MintLeafData }> {
  const umi = getUmi();

  // Single tree, collection resolved from param
  const merkleTreeAddr = config.merkleTree;
  const collectionAddr = params.collection === 'pfp'
    ? config.pfpCollectionMint
    : config.itemsCollectionMint;

  if (!merkleTreeAddr) {
    throw new Error('MERKLE_TREE not configured');
  }

  const merkleTree = publicKey(merkleTreeAddr);
  const leafOwner = publicKey(params.ownerWallet);
  const creatorAddress = config.mintCreatorAddress || umi.identity.publicKey;

  // Build and send the mintV2 transaction
  // For soulbound mints, set leafDelegate to authority so we can freeze without owner signature
  const builder = mintV2(umi, {
    merkleTree,
    leafOwner,
    ...(params.soulbound ? { leafDelegate: umi.identity.publicKey } : {}),
    ...(collectionAddr ? { coreCollection: publicKey(collectionAddr) } : {}),
    metadata: {
      name: params.name,
      symbol: params.symbol || '',
      uri: params.uri,
      sellerFeeBasisPoints: params.sellerFeeBasisPoints || 0,
      creators: [{ address: publicKey(creatorAddress), verified: true, share: 100 }],
      collection: collectionAddr ? publicKey(collectionAddr) : null,
    },
  });

  const { signature: sigBytes } = await builder.sendAndConfirm(umi);

  // Parse the asset ID from the on-chain transaction logs (retry for RPC indexing delay)
  let leaf;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      leaf = await parseLeafFromMintV2Transaction(umi, sigBytes);
      break;
    } catch {
      if (attempt === 5) throw new Error('Could not parse asset ID from mint transaction after 5 attempts');
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  const parsedLeaf = leaf!;
  const assetId = parsedLeaf.id;

  // Convert the raw signature bytes to base58
  const bs58 = require('bs58');
  const signature = bs58.encode(sigBytes);

  // Build leaf data for downstream use (e.g., freezeV2 for soulbound)
  const leafData: MintLeafData = {
    owner: parsedLeaf.owner.toString(),
    delegate: parsedLeaf.delegate.toString(),
    nonce: Number(parsedLeaf.nonce),
    dataHash: parsedLeaf.dataHash,
    creatorHash: parsedLeaf.creatorHash,
    ...(parsedLeaf.__kind === 'V2' ? {
      collectionHash: parsedLeaf.collectionHash,
      assetDataHash: parsedLeaf.assetDataHash,
      flags: parsedLeaf.flags,
    } : {}),
  };

  return { assetId: assetId.toString(), signature, leafData };
}

export async function executeMint(
  userId: string,
  wallet: string,
  mintConfig: MintParams
): Promise<MintResult> {
  // Check whitelist
  const entry = await checkWhitelist(wallet);
  if (!entry || !entry.is_active) {
    throw new Error('Wallet not whitelisted for minting');
  }
  if (entry.max_mints > 0 && entry.mints_used >= entry.max_mints) {
    throw new Error('Mint limit reached');
  }

  // Create pending log entry
  const logResult = await query(
    `INSERT INTO mint_log (user_id, wallet_address, mint_type, nft_name, nft_metadata, status)
     VALUES ($1, $2, $3, $4, $5, 'pending')
     RETURNING id`,
    [userId, wallet, mintConfig.soulbound ? 'soulbound' : 'standard', mintConfig.name, JSON.stringify({
      symbol: mintConfig.symbol,
      description: mintConfig.description,
      image: mintConfig.image,
      attributes: mintConfig.attributes,
    })]
  );
  const mintLogId = logResult.rows[0].id;

  try {
    // Execute the mint
    const { assetId, signature, leafData } = await mintCompressedNFT({
      name: mintConfig.name,
      uri: mintConfig.uri,
      symbol: mintConfig.symbol,
      ownerWallet: wallet,
      sellerFeeBasisPoints: mintConfig.sellerFeeBasisPoints,
      collection: mintConfig.collection,
      soulbound: mintConfig.soulbound,
    });

    // Update log and whitelist atomically
    await transaction(async (client) => {
      await client.query(
        `UPDATE mint_log SET asset_id = $1, signature = $2, status = 'confirmed', confirmed_at = NOW()
         WHERE id = $3`,
        [assetId, signature, mintLogId]
      );
      await client.query(
        'UPDATE mint_whitelist SET mints_used = mints_used + 1 WHERE wallet_address = $1',
        [wallet]
      );
    });

    return { assetId, signature, mintLogId, leafData };
  } catch (error: any) {
    // Mark log as failed
    await query(
      `UPDATE mint_log SET status = 'failed', error_message = $1 WHERE id = $2`,
      [error.message || 'Unknown error', mintLogId]
    );
    throw error;
  }
}

export async function confirmMintTransaction(signature: string): Promise<{
  confirmed: boolean;
  status: string;
}> {
  if (!config.heliusApiKey) {
    throw new Error('Helius API key not configured');
  }

  const response = await fetch(HELIUS_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'check-sig',
      method: 'getSignatureStatuses',
      params: [[signature], { searchTransactionHistory: true }],
    }),
  });

  const data = await response.json() as any;
  const statuses = data.result?.value || [];
  const txStatus = statuses[0];

  if (!txStatus) {
    return { confirmed: false, status: 'not_found' };
  }

  const confirmed = txStatus.confirmationStatus === 'finalized' || txStatus.confirmationStatus === 'confirmed';
  return { confirmed, status: txStatus.confirmationStatus || 'unknown' };
}

export async function getMintHistory(wallet: string): Promise<MintLogEntry[]> {
  const result = await query(
    'SELECT * FROM mint_log WHERE wallet_address = $1 ORDER BY created_at DESC',
    [wallet]
  );
  return result.rows;
}

export async function getMintLog(filters?: {
  status?: string;
  mintType?: string;
  wallet?: string;
}): Promise<MintLogEntry[]> {
  let sql = 'SELECT * FROM mint_log WHERE 1=1';
  const params: any[] = [];
  let idx = 1;

  if (filters?.status) {
    sql += ` AND status = $${idx++}`;
    params.push(filters.status);
  }
  if (filters?.mintType) {
    sql += ` AND mint_type = $${idx++}`;
    params.push(filters.mintType);
  }
  if (filters?.wallet) {
    sql += ` AND wallet_address = $${idx++}`;
    params.push(filters.wallet);
  }

  sql += ' ORDER BY created_at DESC LIMIT 500';
  const result = await query(sql, params);
  return result.rows;
}
