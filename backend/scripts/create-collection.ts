/**
 * One-time script to create an MPL-Core collection on-chain.
 *
 * Usage:
 *   npx ts-node scripts/create-collection.ts [--devnet] [--name "Terminal"] [--uri "https://..."]
 *
 * Prerequisites:
 *   - COLLECTION_AUTHORITY_KEYPAIR set in .env
 *   - HELIUS_API_KEY set in .env
 *   - The authority keypair must have SOL for rent
 *
 * On success, prints the collection public key to set as
 * ITEMS_COLLECTION_MINT or PFP_COLLECTION_MINT in .env.
 */

import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplCore, createCollection } from '@metaplex-foundation/mpl-core';
import { mplBubblegum } from '@metaplex-foundation/mpl-bubblegum';
import { generateSigner, keypairIdentity } from '@metaplex-foundation/umi';
import { config } from '../src/config/constants';
import { parseKeypairBytes } from '../src/services/umi';

async function main() {
  const args = process.argv.slice(2);
  const useDevnet = args.includes('--devnet');

  const nameIdx = args.indexOf('--name');
  const name = nameIdx !== -1 ? args[nameIdx + 1] : 'Terminal';

  const uriIdx = args.indexOf('--uri');
  const uri = uriIdx !== -1 ? args[uriIdx + 1] : '';

  console.log(`Creating MPL-Core collection:`);
  console.log(`  Network:    ${useDevnet ? 'devnet' : 'mainnet'}`);
  console.log(`  Name:       ${name}`);
  console.log(`  URI:        ${uri || '(empty — can be updated later)'}`);
  console.log();

  if (!config.collectionAuthorityKeypair) {
    console.error('ERROR: COLLECTION_AUTHORITY_KEYPAIR not set in .env');
    process.exit(1);
  }
  if (!config.heliusApiKey) {
    console.error('ERROR: HELIUS_API_KEY not set in .env');
    process.exit(1);
  }

  const endpoint = useDevnet
    ? `https://devnet.helius-rpc.com/?api-key=${config.heliusApiKey}`
    : `https://mainnet.helius-rpc.com/?api-key=${config.heliusApiKey}`;

  const umi = createUmi(endpoint).use(mplCore()).use(mplBubblegum());

  const secretKey = parseKeypairBytes(config.collectionAuthorityKeypair);
  const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
  umi.use(keypairIdentity(keypair));

  const balance = await umi.rpc.getBalance(umi.identity.publicKey);
  console.log(`Authority: ${umi.identity.publicKey}`);
  console.log(`Balance:   ${Number(balance.basisPoints) / 1e9} SOL`);
  console.log();

  const collectionSigner = generateSigner(umi);
  console.log(`Collection keypair generated: ${collectionSigner.publicKey}`);
  console.log('Sending createCollection transaction...');

  const { signature } = await createCollection(umi, {
    collection: collectionSigner,
    name,
    uri,
    plugins: [{ type: 'BubblegumV2' }],
  }).sendAndConfirm(umi);

  const bs58 = require('bs58');
  const sig = bs58.encode(signature);

  console.log();
  console.log('Collection created successfully!');
  console.log(`  Signature:       ${sig}`);
  console.log(`  Collection mint: ${collectionSigner.publicKey}`);
  console.log();
  console.log('Add to your .env (use for either):');
  console.log(`  ITEMS_COLLECTION_MINT=${collectionSigner.publicKey}`);
  console.log(`  PFP_COLLECTION_MINT=${collectionSigner.publicKey}`);
}

main().catch((err) => {
  console.error('Failed to create collection:', err);
  process.exit(1);
});
