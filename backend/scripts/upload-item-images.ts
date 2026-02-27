/**
 * Bulk-upload item images to Arweave and write the resulting metadata URIs
 * to src/config/item-uris.ts.
 *
 * Usage:
 *   cd backend && npx ts-node scripts/upload-item-images.ts [--devnet] [--dry-run]
 *
 * - Reads every *.png from frontend/public/items/ whose name does NOT start with _
 * - For each file: uploads the PNG image, then builds and uploads a Metaplex-
 *   compatible metadata JSON that references it
 * - Writes (or overwrites) src/config/item-uris.ts with the complete map
 *
 * Prerequisites:
 *   - COLLECTION_AUTHORITY_KEYPAIR and HELIUS_API_KEY set in backend/.env
 *   - Authority wallet must have enough SOL to fund the Irys uploads
 *
 * Re-run at any time to upload newly added images. Already-uploaded items
 * whose names still match will simply be overwritten with fresh URIs, which
 * is safe (old URIs remain valid on Arweave forever).
 */

import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { keypairIdentity, createGenericFile } from '@metaplex-foundation/umi';
import { irysUploader } from '@metaplex-foundation/umi-uploader-irys';
import { mplBubblegum } from '@metaplex-foundation/mpl-bubblegum';
import { config } from '../src/config/constants';
import { parseKeypairBytes } from '../src/services/umi';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const isDryRun = process.argv.includes('--dry-run');
const isDevnet = process.argv.includes('--devnet');

const ITEMS_DIR = path.resolve(__dirname, '../../frontend/public/items');
const OUT_FILE  = path.resolve(__dirname, '../src/config/item-uris.ts');

function toDisplayName(snake: string): string {
  return snake
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

async function main() {
  // Collect candidate images
  const files = fs.readdirSync(ITEMS_DIR)
    .filter((f) => f.endsWith('.png') && !f.startsWith('_'))
    .sort();

  if (files.length === 0) {
    console.log('No item PNG files found in', ITEMS_DIR);
    process.exit(0);
  }

  console.log(`Found ${files.length} item image(s) in ${ITEMS_DIR}:`);
  files.forEach((f) => console.log(`  ${f}`));

  if (isDryRun) {
    console.log('\n--dry-run: no uploads performed.');
    process.exit(0);
  }

  if (!config.collectionAuthorityKeypair) {
    console.error('COLLECTION_AUTHORITY_KEYPAIR is not set in .env');
    process.exit(1);
  }
  if (!config.heliusApiKey) {
    console.error('HELIUS_API_KEY is not set in .env');
    process.exit(1);
  }

  // Set up Umi with Irys uploader
  const network = isDevnet ? 'devnet' : 'mainnet-beta';
  const rpcUrl = isDevnet
    ? `https://devnet.helius-rpc.com/?api-key=${config.heliusApiKey}`
    : `https://mainnet.helius-rpc.com/?api-key=${config.heliusApiKey}`;

  const umi = createUmi(rpcUrl)
    .use(mplBubblegum())
    .use(irysUploader({ address: isDevnet ? 'https://devnet.irys.xyz' : 'https://node1.irys.xyz' }));

  const keypairBytes = parseKeypairBytes(config.collectionAuthorityKeypair);
  const umiKeypair = umi.eddsa.createKeypairFromSecretKey(keypairBytes.secretKey);
  umi.use(keypairIdentity(umiKeypair));

  console.log(`\nUploading to Arweave (${network})...\n`);

  const results: Record<string, string> = {};

  for (const file of files) {
    const itemName = path.basename(file, '.png'); // e.g. "cold_room_key"
    const displayName = toDisplayName(itemName);
    const filePath = path.join(ITEMS_DIR, file);
    const imageBuffer = fs.readFileSync(filePath);

    try {
      process.stdout.write(`  [${itemName}] uploading image...`);

      const imageFile = createGenericFile(imageBuffer, file, { contentType: 'image/png' });
      const [imageUri] = await umi.uploader.upload([imageFile]);
      process.stdout.write(` done\n`);

      process.stdout.write(`  [${itemName}] uploading metadata...`);

      const metadata = {
        name: displayName,
        symbol: 'SCAN',
        description: 'A soulbound inventory item from Terminal.',
        image: imageUri,
        external_url: 'https://scanlines.io',
        attributes: [],
        properties: {
          files: [{ uri: imageUri, type: 'image/png' }],
          category: 'image',
        },
      };

      const metadataJson = JSON.stringify(metadata, null, 2);
      const metadataFile = createGenericFile(
        Buffer.from(metadataJson),
        'metadata.json',
        { contentType: 'application/json' },
      );
      const [metadataUri] = await umi.uploader.upload([metadataFile]);
      process.stdout.write(` done\n`);

      console.log(`  [${itemName}] → ${metadataUri}\n`);
      results[itemName] = metadataUri;
    } catch (err: any) {
      console.error(`\n  [${itemName}] FAILED: ${err?.message || err}`);
    }
  }

  if (Object.keys(results).length === 0) {
    console.error('No items uploaded successfully. item-uris.ts not updated.');
    process.exit(1);
  }

  // Write item-uris.ts
  const entries = Object.entries(results)
    .map(([k, v]) => `  ${k}: '${v}',`)
    .join('\n');

  const output = `/**
 * Maps item_name (snake_case) to pre-uploaded Arweave metadata URIs.
 *
 * Populated by running:
 *   cd backend && npx ts-node scripts/upload-item-images.ts [--devnet]
 *
 * When a soulbound mint is triggered for an item whose name appears here,
 * the item-specific URI is used instead of the generic INVENTORY_ITEM_URI
 * so the on-chain NFT displays the correct artwork.
 *
 * Items not in this map fall back to the generic URI passed by the caller.
 */
export const ITEM_METADATA_URIS: Record<string, string> = {
${entries}
};
`;

  fs.writeFileSync(OUT_FILE, output, 'utf8');
  console.log(`\nWrote ${Object.keys(results).length} URI(s) to ${OUT_FILE}`);
  console.log('Restart the backend server to pick up the new URIs.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
