import fetch from 'node-fetch';
import { publicKey } from '@metaplex-foundation/umi';
import { mintV2, parseLeafFromMintV2Transaction } from '@metaplex-foundation/mpl-bubblegum';
import { transferSol } from '@metaplex-foundation/mpl-toolbox';
import { sol } from '@metaplex-foundation/umi';
import { config, getHeliusRpcUrl } from '../config/constants';
import { query, transaction } from '../config/database';
import { WhitelistEntry, MintLogEntry, MintParams, MintResult, MintLeafData } from '../types';
import { getUmi } from './umi';

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
): Promise<{ added: number; updated: number; skipped: number }> {
  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const entry of entries) {
    try {
      const result = await query(
        `INSERT INTO mint_whitelist (wallet_address, max_mints, added_by, notes)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (wallet_address) DO UPDATE
           SET max_mints = EXCLUDED.max_mints,
               updated_at = NOW()
         RETURNING (xmax = 0) AS inserted`,
        [entry.wallet, entry.maxMints, addedBy, entry.notes || null]
      );

      if (result.rows[0]?.inserted) {
        added++;
      } else {
        updated++;
      }
    } catch {
      skipped++;
    }
  }

  return { added, updated, skipped };
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
  // Devnet indexing is significantly slower, so use more retries with longer delays
  const maxAttempts = config.solanaNetwork === 'devnet' ? 15 : 5;
  const retryDelay = config.solanaNetwork === 'devnet' ? 4000 : 2000;
  let leaf;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      leaf = await parseLeafFromMintV2Transaction(umi, sigBytes);
      break;
    } catch {
      if (attempt === maxAttempts) throw new Error(`Could not parse asset ID from mint transaction after ${maxAttempts} attempts`);
      await new Promise((r) => setTimeout(r, retryDelay));
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
  // Atomically check whitelist + reserve a mint slot + create log entry
  const { mintLogId } = await transaction(async (client) => {
    // Lock the whitelist row to prevent concurrent reads
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

    // Reserve the mint slot immediately
    await client.query(
      'UPDATE mint_whitelist SET mints_used = mints_used + 1 WHERE wallet_address = $1',
      [wallet]
    );

    // Create pending log entry
    const logResult = await client.query(
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

    return { mintLogId: logResult.rows[0].id };
  });

  try {
    // Execute the mint (outside transaction — on-chain call can be slow)
    const { assetId, signature, leafData } = await mintCompressedNFT({
      name: mintConfig.name,
      uri: mintConfig.uri,
      symbol: mintConfig.symbol,
      ownerWallet: wallet,
      sellerFeeBasisPoints: mintConfig.sellerFeeBasisPoints,
      collection: mintConfig.collection,
      soulbound: mintConfig.soulbound,
    });

    // Update log with confirmed status
    await query(
      `UPDATE mint_log SET asset_id = $1, signature = $2, status = 'confirmed', confirmed_at = NOW()
       WHERE id = $3`,
      [assetId, signature, mintLogId]
    );

    return { assetId, signature, mintLogId, leafData };
  } catch (error: any) {
    // Mark log as failed and release the reserved mint slot
    await query(
      `UPDATE mint_log SET status = 'failed', error_message = $1 WHERE id = $2`,
      [error.message || 'Unknown error', mintLogId]
    );
    await query(
      'UPDATE mint_whitelist SET mints_used = GREATEST(mints_used - 1, 0) WHERE wallet_address = $1',
      [wallet]
    );
    throw error;
  }
}

// ── User-Paid Minting (Partial-Sign Flow) ─────

/**
 * Build a mintV2 transaction + treasury fee transfer, partially signed by the authority.
 * The user's wallet is set as fee payer. Returns the serialized transaction for
 * the user to co-sign and submit client-side.
 */
export async function prepareMintTransaction(params: {
  name: string;
  uri: string;
  symbol?: string;
  ownerWallet: string;
  sellerFeeBasisPoints?: number;
  collection?: 'pfp' | 'items';
}): Promise<{ transactionBase64: string }> {
  const umi = getUmi();

  if (!config.treasuryWallet) {
    throw new Error('TREASURY_WALLET not configured');
  }

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
  const userPubkey = publicKey(params.ownerWallet);
  const treasuryPubkey = publicKey(config.treasuryWallet);

  // Build mintV2 instruction
  const mintBuilder = mintV2(umi, {
    merkleTree,
    leafOwner,
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

  // Build treasury fee transfer instruction
  const feeBuilder = transferSol(umi, {
    source: { publicKey: userPubkey, signMessage: async () => new Uint8Array(), signTransaction: async (tx: any) => tx, signAllTransactions: async (txs: any[]) => txs },
    destination: treasuryPubkey,
    amount: sol(config.mintFeeLamports / 1_000_000_000),
  });

  // Combine into a single transaction builder
  const combinedBuilder = mintBuilder.add(feeBuilder);

  // Build the transaction with the user as fee payer
  const tx = await combinedBuilder.setFeePayer({
    publicKey: userPubkey,
    signMessage: async () => new Uint8Array(),
    signTransaction: async (t: any) => t,
    signAllTransactions: async (txs: any[]) => txs,
  }).buildWithLatestBlockhash(umi);

  // Partially sign with the authority keypair (satisfies treeCreatorOrDelegate)
  const signedTx = await umi.identity.signTransaction(tx);

  // Serialize to base64
  const serialized = umi.transactions.serialize(signedTx);
  const transactionBase64 = Buffer.from(serialized).toString('base64');

  return { transactionBase64 };
}

/**
 * Submit a user-signed transaction to the chain via backend's Helius connection.
 * Returns the base58 signature.
 */
export async function submitSignedTransaction(transactionBase64: string): Promise<string> {
  const endpoint = getHeliusRpcUrl();

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'sendTransaction',
      params: [
        transactionBase64,
        { encoding: 'base64', skipPreflight: false, maxRetries: 5 },
      ],
    }),
  });

  const result: any = await resp.json();

  if (result.error) {
    throw new Error(result.error.message || 'Transaction submission failed');
  }

  const signature = result.result;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const statusResp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getSignatureStatuses',
        params: [[signature], { searchTransactionHistory: true }],
      }),
    });
    const statusResult: any = await statusResp.json();
    const status = statusResult.result?.value?.[0];
    if (status?.confirmationStatus === 'confirmed' || status?.confirmationStatus === 'finalized') {
      if (status.err) {
        throw new Error('Transaction confirmed but failed on-chain');
      }
      return signature;
    }
  }

  throw new Error('Transaction not confirmed after 60 seconds');
}

/**
 * Confirm a user-submitted mint transaction.
 * Parses the asset ID from on-chain logs and updates the mint_log + whitelist.
 */
export async function confirmUserMint(
  mintLogId: string,
  signatureBase58: string,
  userId: string,
  wallet: string,
  options?: { skipWhitelistIncrement?: boolean },
): Promise<MintResult> {
  const umi = getUmi();
  const bs58 = require('bs58');
  const sigBytes: Uint8Array = bs58.decode(signatureBase58);

  // Parse the asset ID from the on-chain transaction logs (retry for RPC indexing delay)
  // Mainnet needs more retries since tx is already confirmed but logs may not be indexed yet
  const maxAttempts = config.solanaNetwork === 'devnet' ? 15 : 12;
  const retryDelay = config.solanaNetwork === 'devnet' ? 4000 : 3000;
  let leaf;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      leaf = await parseLeafFromMintV2Transaction(umi, sigBytes);
      break;
    } catch {
      if (attempt === maxAttempts) throw new Error(`Could not parse asset ID from mint transaction after ${maxAttempts} attempts`);
      await new Promise((r) => setTimeout(r, retryDelay));
    }
  }
  const parsedLeaf = leaf!;
  const assetId = parsedLeaf.id.toString();

  // Build leaf data
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

  // Update mint_log and whitelist atomically with row lock
  await transaction(async (client) => {
    await client.query(
      `UPDATE mint_log SET asset_id = $1, signature = $2, status = 'confirmed', confirmed_at = NOW()
       WHERE id = $3 AND user_id = $4 AND status IN ('prepared', 'pending')`,
      [assetId, signatureBase58, mintLogId, userId]
    );
    // Skip whitelist increment if already reserved at prepare time (e.g. PFP flow)
    if (!options?.skipWhitelistIncrement) {
      await client.query(
        'SELECT id FROM mint_whitelist WHERE wallet_address = $1 FOR UPDATE',
        [wallet]
      );
      await client.query(
        'UPDATE mint_whitelist SET mints_used = mints_used + 1 WHERE wallet_address = $1',
        [wallet]
      );
    }
  });

  return { assetId, signature: signatureBase58, mintLogId, leafData };
}

export async function confirmMintTransaction(signature: string): Promise<{
  confirmed: boolean;
  status: string;
}> {
  if (!config.heliusApiKey) {
    throw new Error('Helius API key not configured');
  }

  const response = await fetch(getHeliusRpcUrl(), {
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
