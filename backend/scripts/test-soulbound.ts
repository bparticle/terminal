/**
 * Test script to mint a soulbound cNFT (mint + freeze) and verify on-chain.
 *
 * Usage:
 *   npx ts-node scripts/test-soulbound.ts [--devnet]
 *
 * Prerequisites:
 *   - COLLECTION_AUTHORITY_KEYPAIR, HELIUS_API_KEY, MERKLE_TREE,
 *     ITEMS_COLLECTION_MINT set in .env
 *
 * Mints a test "Cold Room Key" cNFT with leafDelegate set to authority,
 * then freezes it via freezeV2 using leaf data from the mint transaction,
 * and verifies frozen status via Helius DAS.
 */

import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplBubblegum, mintV2, parseLeafFromMintV2Transaction, freezeV2 } from '@metaplex-foundation/mpl-bubblegum';
import { keypairIdentity, publicKey, some } from '@metaplex-foundation/umi';
import fetch from 'node-fetch';
import { config } from '../src/config/constants';
import { parseKeypairBytes } from '../src/services/umi';

async function main() {
  const args = process.argv.slice(2);
  const useDevnet = args.includes('--devnet');

  if (!config.collectionAuthorityKeypair) {
    console.error('ERROR: COLLECTION_AUTHORITY_KEYPAIR not set');
    process.exit(1);
  }
  if (!config.heliusApiKey) {
    console.error('ERROR: HELIUS_API_KEY not set');
    process.exit(1);
  }
  if (!config.merkleTree) {
    console.error('ERROR: MERKLE_TREE not set');
    process.exit(1);
  }
  if (!config.itemsCollectionMint) {
    console.error('ERROR: ITEMS_COLLECTION_MINT not set');
    process.exit(1);
  }

  const endpoint = useDevnet
    ? `https://devnet.helius-rpc.com/?api-key=${config.heliusApiKey}`
    : `https://mainnet.helius-rpc.com/?api-key=${config.heliusApiKey}`;

  const umi = createUmi(endpoint).use(mplBubblegum());

  const secretKey = parseKeypairBytes(config.collectionAuthorityKeypair);
  const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
  umi.use(keypairIdentity(keypair));

  const bs58 = require('bs58');
  const ownerAddress = umi.identity.publicKey;
  const merkleTree = publicKey(config.merkleTree);
  const coreCollection = publicKey(config.itemsCollectionMint);

  console.log('Test Soulbound Mint + Freeze (Bubblegum V2)');
  console.log(`  Network:    ${useDevnet ? 'devnet' : 'mainnet'}`);
  console.log(`  Authority:  ${ownerAddress}`);
  console.log(`  Tree:       ${config.merkleTree}`);
  console.log(`  Collection: ${config.itemsCollectionMint}`);
  console.log();

  // ── Step 1: Mint with leafDelegate set to authority ──
  console.log('Step 1: Minting soulbound cNFT (leafDelegate = authority)...');
  const builder = mintV2(umi, {
    merkleTree,
    leafOwner: ownerAddress,
    leafDelegate: umi.identity.publicKey,
    coreCollection,
    metadata: {
      name: 'Cold Room Key',
      symbol: 'SCAN',
      uri: 'https://gateway.irys.xyz/27zv62z1d9L5xLpHZvXHuxJSmX36z63J21XH86WmyTr1',
      sellerFeeBasisPoints: 0,
      creators: [{ address: ownerAddress, verified: true, share: 100 }],
      collection: coreCollection,
    },
  });

  const { signature: mintSigBytes } = await builder.sendAndConfirm(umi);
  const mintSignature = bs58.encode(mintSigBytes);
  console.log(`  Mint signature: ${mintSignature}`);

  // ── Step 2: Parse leaf data from mint transaction ──
  console.log('Step 2: Parsing leaf from mint transaction...');
  let leaf: any;
  for (let attempt = 1; attempt <= 10; attempt++) {
    await new Promise((r) => setTimeout(r, 3000));
    try {
      leaf = await parseLeafFromMintV2Transaction(umi, mintSigBytes);
      break;
    } catch {
      console.log(`  Attempt ${attempt}/10 — not available yet, retrying...`);
    }
  }
  if (!leaf) {
    throw new Error('Could not parse leaf after 10 attempts.');
  }

  const assetId = leaf.id.toString();
  console.log(`  Asset ID:  ${assetId}`);
  console.log(`  Leaf kind: ${leaf.__kind}`);
  console.log(`  Owner:     ${leaf.owner}`);
  console.log(`  Delegate:  ${leaf.delegate}`);
  console.log(`  Nonce:     ${leaf.nonce}`);

  if (leaf.__kind === 'V2') {
    console.log(`  Flags:     ${leaf.flags}`);
    console.log(`  dataHash:  ${Buffer.from(leaf.dataHash).toString('hex').slice(0, 16)}...`);
    console.log(`  creatorH:  ${Buffer.from(leaf.creatorHash).toString('hex').slice(0, 16)}...`);
    console.log(`  collectH:  ${Buffer.from(leaf.collectionHash).toString('hex').slice(0, 16)}...`);
    console.log(`  assetDH:   ${Buffer.from(leaf.assetDataHash).toString('hex').slice(0, 16)}...`);
  }

  // ── Step 3: Get proof and freeze ──
  // Use leaf data from the mint (accurate) instead of DAS (may lag).
  // Only need the proof from DAS.
  console.log('Step 3: Freezing asset...');

  let freezeSignature = '';
  for (let freezeAttempt = 1; freezeAttempt <= 5; freezeAttempt++) {
    const waitSecs = freezeAttempt === 1 ? 15 : 10;
    console.log(`  Waiting ${waitSecs}s for DAS proof indexing (attempt ${freezeAttempt}/5)...`);
    await new Promise((r) => setTimeout(r, waitSecs * 1000));

    // Get asset proof from DAS
    console.log('  Fetching asset proof...');
    const proofResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'get-proof',
        method: 'getAssetProof',
        params: { id: assetId },
      }),
    });
    const proofData = await proofResponse.json() as any;
    if (proofData.error || !proofData.result) {
      console.log(`  Proof not available yet, retrying...`);
      continue;
    }
    const proof = proofData.result;

    try {
      console.log('  Sending freezeV2 transaction...');
      // Use leaf data from mint tx (not DAS) + proof from DAS + coreCollection account
      const freezeArgs: any = {
        leafOwner: publicKey(leaf.owner),
        leafDelegate: publicKey(leaf.delegate),
        merkleTree,
        coreCollection,
        root: new Uint8Array(Buffer.from(proof.root.replace('0x', ''), 'hex')),
        dataHash: leaf.dataHash,
        creatorHash: leaf.creatorHash,
        nonce: leaf.nonce,
        index: Number(leaf.nonce),
        proof: proof.proof.map((p: string) => publicKey(p)),
      };

      // V2 leaves have additional fields
      if (leaf.__kind === 'V2') {
        freezeArgs.assetDataHash = some(leaf.assetDataHash);
        freezeArgs.flags = some(leaf.flags);
      }

      const { signature: freezeSigBytes } = await freezeV2(umi, freezeArgs).sendAndConfirm(umi);

      freezeSignature = bs58.encode(freezeSigBytes);
      console.log(`  Freeze signature: ${freezeSignature}`);
      break;
    } catch (err: any) {
      const isStaleProof = err.transactionLogs?.some((l: string) =>
        l.includes('does not match the supplied proof')
      );
      if (isStaleProof && freezeAttempt < 5) {
        console.log('  Stale proof — DAS not fully synced yet, retrying...');
        continue;
      }
      throw err;
    }
  }

  if (!freezeSignature) {
    throw new Error('Failed to freeze after 5 attempts');
  }

  // ── Step 4: Verify frozen status ──
  console.log('Step 4: Verifying frozen status (waiting 5s for indexing)...');
  await new Promise((r) => setTimeout(r, 5000));

  const verifyResponse = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'verify',
      method: 'getAsset',
      params: { id: assetId },
    }),
  });
  const verifyData = await verifyResponse.json() as any;

  if (verifyData.result) {
    const v = verifyData.result;
    console.log();
    console.log('Soulbound verification:');
    console.log(`  Name:       ${v.content?.metadata?.name || '(none)'}`);
    console.log(`  Owner:      ${v.ownership?.owner}`);
    console.log(`  Delegate:   ${v.ownership?.delegate || '(none)'}`);
    console.log(`  Frozen:     ${v.ownership?.frozen}`);
    console.log(`  Compressed: ${v.compression?.compressed}`);

    if (v.ownership?.frozen === true) {
      console.log();
      console.log('SUCCESS: Asset is frozen (soulbound). Full pipeline works!');
    } else {
      console.log();
      console.log('WARNING: Asset does not appear frozen yet. DAS may need more time to index.');
    }
  } else {
    console.log('DAS verification returned no result — check manually later.');
  }

  console.log();
  console.log('Summary:');
  console.log(`  Asset ID:         ${assetId}`);
  console.log(`  Mint signature:   ${mintSignature}`);
  console.log(`  Freeze signature: ${freezeSignature}`);
}

main().catch((err) => {
  console.error('Test soulbound failed:', err);
  process.exit(1);
});
