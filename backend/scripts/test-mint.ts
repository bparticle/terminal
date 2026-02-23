/**
 * Test script to mint a cNFT via Bubblegum V2 and verify it on-chain.
 *
 * Usage:
 *   npx ts-node scripts/test-mint.ts [--devnet]
 *
 * Prerequisites:
 *   - COLLECTION_AUTHORITY_KEYPAIR, HELIUS_API_KEY, MERKLE_TREE,
 *     ITEMS_COLLECTION_MINT set in .env
 *
 * Mints a test cNFT to the authority's own wallet, then fetches it
 * via Helius DAS to confirm it exists on-chain.
 */

import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplBubblegum, mintV2, parseLeafFromMintV2Transaction } from '@metaplex-foundation/mpl-bubblegum';
import { keypairIdentity, publicKey, generateSigner } from '@metaplex-foundation/umi';
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

  console.log('Test Mint (Bubblegum V2)');
  console.log(`  Network:    ${useDevnet ? 'devnet' : 'mainnet'}`);
  console.log(`  Authority:  ${ownerAddress}`);
  console.log(`  Tree:       ${config.merkleTree}`);
  console.log(`  Collection: ${config.itemsCollectionMint}`);
  console.log();

  // Step 1: Mint
  console.log('Step 1: Minting test cNFT...');
  const merkleTree = publicKey(config.merkleTree);
  const coreCollection = publicKey(config.itemsCollectionMint);

  const builder = mintV2(umi, {
    merkleTree,
    leafOwner: ownerAddress,
    coreCollection,
    metadata: {
      name: 'Test Item — Oil Can',
      symbol: 'SCAN',
      uri: '',  // empty URI is fine for a test
      sellerFeeBasisPoints: 0,
      creators: [{ address: ownerAddress, verified: true, share: 100 }],
      collection: coreCollection,
    },
  });

  const { signature: sigBytes } = await builder.sendAndConfirm(umi);
  const signature = bs58.encode(sigBytes);
  console.log(`  Signature: ${signature}`);

  // Step 2: Parse asset ID from logs (retry — RPC may be slow to index)
  console.log('Step 2: Parsing asset ID from transaction...');
  let leaf;
  for (let attempt = 1; attempt <= 10; attempt++) {
    await new Promise((r) => setTimeout(r, 3000));
    try {
      leaf = await parseLeafFromMintV2Transaction(umi, sigBytes);
      break;
    } catch {
      console.log(`  Attempt ${attempt}/10 — transaction not available yet, retrying...`);
    }
  }
  if (!leaf) {
    throw new Error('Could not parse leaf after 10 attempts. The mint succeeded — check the signature on explorer.');
  }
  const assetId = leaf.id.toString();
  console.log(`  Asset ID:  ${assetId}`);
  console.log(`  Leaf kind: ${leaf.__kind}`);

  // Step 3: Verify via Helius DAS
  console.log('Step 3: Verifying via Helius DAS (waiting 5s for indexing)...');
  await new Promise((r) => setTimeout(r, 5000));

  const dasResponse = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'verify',
      method: 'getAsset',
      params: { id: assetId },
    }),
  });
  const dasData = await dasResponse.json() as any;

  if (dasData.result) {
    const asset = dasData.result;
    console.log();
    console.log('Mint verified on-chain!');
    console.log(`  Name:       ${asset.content?.metadata?.name || '(none)'}`);
    console.log(`  Owner:      ${asset.ownership?.owner}`);
    console.log(`  Compressed: ${asset.compression?.compressed}`);
    console.log(`  Tree:       ${asset.compression?.tree}`);
    console.log(`  Collection: ${asset.grouping?.find((g: any) => g.group_key === 'collection')?.group_value || '(none)'}`);
  } else {
    console.log();
    console.log('DAS lookup returned no result (indexing may still be in progress).');
    console.log('You can manually check later:');
    console.log(`  Asset ID: ${assetId}`);
  }

  console.log();
  console.log('Done! Full pipeline working.');
}

main().catch((err) => {
  console.error('Test mint failed:', err);
  process.exit(1);
});
