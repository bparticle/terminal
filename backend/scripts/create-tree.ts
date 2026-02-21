/**
 * One-time script to create a Bubblegum V2 Merkle tree on-chain.
 *
 * Usage:
 *   npx ts-node scripts/create-tree.ts [--depth 14] [--devnet]
 *
 * Prerequisites:
 *   - COLLECTION_AUTHORITY_KEYPAIR set in .env (base58 secret key)
 *   - HELIUS_API_KEY set in .env
 *   - The authority keypair must have SOL for rent (~1.5 SOL for depth 14)
 *
 * On success, prints the tree public key to set as MERKLE_TREE in .env.
 */

import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplBubblegum, createTreeV2 } from '@metaplex-foundation/mpl-bubblegum';
import { generateSigner, keypairIdentity, sol } from '@metaplex-foundation/umi';
import { config } from '../src/config/constants';
import { parseKeypairBytes } from '../src/services/umi';

// Valid depth/buffer pairs from SPL Account Compression
// See: https://github.com/solana-labs/solana-program-library/blob/master/account-compression/programs/account-compression/src/state/concurrent_merkle_tree_header.rs
const BUFFER_SIZES: Record<number, number> = {
  3: 8,
  5: 8,
  6: 16,
  7: 16,
  8: 16,
  9: 16,
  10: 32,
  14: 64,
  15: 64,
  16: 64,
  17: 64,
  18: 256,
  19: 256,
  20: 256,
  24: 512,
  26: 512,
  30: 2048,
};

async function main() {
  const args = process.argv.slice(2);
  const useDevnet = args.includes('--devnet');
  const depthIdx = args.indexOf('--depth');
  const maxDepth = depthIdx !== -1 ? parseInt(args[depthIdx + 1], 10) : 14;
  // Canopy depth reduces proof size clients need to provide.
  // Higher = smaller proofs but more rent. A good default is maxDepth - 3.
  const canopyIdx = args.indexOf('--canopy');
  const canopyDepth = canopyIdx !== -1 ? parseInt(args[canopyIdx + 1], 10) : Math.min(maxDepth - 3, 17);

  const maxBufferSize = BUFFER_SIZES[maxDepth] || 64;
  const maxLeaves = Math.pow(2, maxDepth);

  console.log(`Creating Bubblegum V2 Merkle tree:`);
  console.log(`  Network:     ${useDevnet ? 'devnet' : 'mainnet'}`);
  console.log(`  Max depth:   ${maxDepth} (${maxLeaves.toLocaleString()} leaves)`);
  console.log(`  Buffer size: ${maxBufferSize}`);
  console.log(`  Canopy:      ${canopyDepth}`);
  console.log();

  if (!config.collectionAuthorityKeypair) {
    console.error('ERROR: COLLECTION_AUTHORITY_KEYPAIR not set in .env');
    process.exit(1);
  }
  if (!config.heliusApiKey && !useDevnet) {
    console.error('ERROR: HELIUS_API_KEY not set in .env (required for mainnet)');
    process.exit(1);
  }

  // Set up Umi
  const endpoint = useDevnet
    ? `https://devnet.helius-rpc.com/?api-key=${config.heliusApiKey}`
    : `https://mainnet.helius-rpc.com/?api-key=${config.heliusApiKey}`;

  const umi = createUmi(endpoint).use(mplBubblegum());

  const bs58 = require('bs58');
  const secretKey = parseKeypairBytes(config.collectionAuthorityKeypair);
  const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
  umi.use(keypairIdentity(keypair));

  // Check balance
  const balance = await umi.rpc.getBalance(umi.identity.publicKey);
  console.log(`Authority: ${umi.identity.publicKey}`);
  console.log(`Balance:   ${Number(balance.basisPoints) / 1e9} SOL`);
  console.log();

  if (Number(balance.basisPoints) < 0.1 * 1e9) {
    if (useDevnet) {
      console.log('Requesting devnet airdrop...');
      await umi.rpc.airdrop(umi.identity.publicKey, sol(2));
      console.log('Airdrop received.');
      console.log();
    } else {
      console.error('ERROR: Insufficient SOL balance for tree creation.');
      process.exit(1);
    }
  }

  // Create the tree
  const merkleTree = generateSigner(umi);
  console.log(`Merkle tree keypair generated: ${merkleTree.publicKey}`);
  console.log('Sending createTreeV2 transaction...');

  const builder = await createTreeV2(umi, {
    merkleTree,
    maxDepth,
    maxBufferSize,
    canopyDepth,
    public: false,
  });

  const { signature } = await builder.sendAndConfirm(umi);
  const sig = bs58.encode(signature);

  console.log();
  console.log('Tree created successfully!');
  console.log(`  Signature:   ${sig}`);
  console.log(`  Tree pubkey: ${merkleTree.publicKey}`);
  console.log();
  console.log('Add to your .env:');
  console.log(`  MERKLE_TREE=${merkleTree.publicKey}`);
}

main().catch((err) => {
  console.error('Failed to create tree:', err);
  process.exit(1);
});
