/**
 * Upload an image + metadata JSON to Arweave via Irys.
 *
 * Usage:
 *   npx ts-node scripts/upload-to-arweave.ts --file <path> [--devnet] [--name "Item Name"] [--description "..."]
 *
 * Uploads the file to Arweave, then creates and uploads a Metaplex-compatible
 * metadata JSON referencing it. Prints the metadata URI to use as the `uri`
 * field in minting calls.
 *
 * Prerequisites:
 *   - COLLECTION_AUTHORITY_KEYPAIR, HELIUS_API_KEY set in .env
 *   - Authority wallet must have SOL to fund the upload
 */

import * as fs from 'fs';
import * as path from 'path';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplBubblegum } from '@metaplex-foundation/mpl-bubblegum';
import { keypairIdentity, createGenericFile } from '@metaplex-foundation/umi';
import { irysUploader } from '@metaplex-foundation/umi-uploader-irys';
import { config } from '../src/config/constants';
import { parseKeypairBytes } from '../src/services/umi';

function parseArgs(argv: string[]) {
  const args = argv.slice(2);
  let file = '';
  let name = 'Inventory Item';
  let description = 'A soulbound inventory item from Terminal.';
  let symbol = 'TERM';
  let useDevnet = false;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--file': file = args[++i]; break;
      case '--name': name = args[++i]; break;
      case '--description': description = args[++i]; break;
      case '--symbol': symbol = args[++i]; break;
      case '--devnet': useDevnet = true; break;
    }
  }

  return { file, name, description, symbol, useDevnet };
}

async function main() {
  const { file, name, description, symbol, useDevnet } = parseArgs(process.argv);

  if (!file) {
    console.error('Usage: npx ts-node scripts/upload-to-arweave.ts --file <path> [--devnet] [--name "..."] [--description "..."]');
    process.exit(1);
  }

  if (!fs.existsSync(file)) {
    console.error(`File not found: ${file}`);
    process.exit(1);
  }

  if (!config.collectionAuthorityKeypair) {
    console.error('ERROR: COLLECTION_AUTHORITY_KEYPAIR not set');
    process.exit(1);
  }
  if (!config.heliusApiKey) {
    console.error('ERROR: HELIUS_API_KEY not set');
    process.exit(1);
  }

  const endpoint = useDevnet
    ? `https://devnet.helius-rpc.com/?api-key=${config.heliusApiKey}`
    : `https://mainnet.helius-rpc.com/?api-key=${config.heliusApiKey}`;

  // Set up Umi with Irys uploader
  const umi = createUmi(endpoint)
    .use(mplBubblegum())
    .use(irysUploader({
      providerUrl: endpoint,
    }));

  const secretKey = parseKeypairBytes(config.collectionAuthorityKeypair);
  const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
  umi.use(keypairIdentity(keypair));

  console.log('Upload to Arweave via Irys');
  console.log(`  Network:   ${useDevnet ? 'devnet' : 'mainnet'}`);
  console.log(`  Authority: ${umi.identity.publicKey}`);
  console.log(`  File:      ${file}`);
  console.log();

  // Read the file
  const fileBuffer = fs.readFileSync(file);
  const ext = path.extname(file).toLowerCase();

  // Detect content type
  const contentTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.mp4': 'video/mp4',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };
  // Handle compound extensions like .gif.mp4
  const contentType = ext === '.mp4' ? 'video/mp4' : (contentTypes[ext] || 'application/octet-stream');
  const isVideo = contentType.startsWith('video/');

  console.log(`  Type:      ${contentType} (${(fileBuffer.length / 1024).toFixed(1)} KB)`);
  console.log();

  // Step 1: Upload the image/video file
  console.log('Step 1: Uploading file to Arweave...');
  const genericFile = createGenericFile(fileBuffer, path.basename(file), {
    contentType,
  });
  const [fileUri] = await umi.uploader.upload([genericFile]);
  console.log(`  File URI: ${fileUri}`);

  // Step 2: Create and upload metadata JSON
  console.log('Step 2: Uploading metadata JSON...');
  const metadata: Record<string, any> = {
    name,
    symbol,
    description,
    ...(isVideo
      ? { image: '', animation_url: fileUri }
      : { image: fileUri }),
    external_url: 'https://scanlines.io',
    attributes: [
      { trait_type: 'Type', value: 'Inventory Item' },
    ],
    properties: {
      files: [
        { uri: fileUri, type: contentType },
      ],
      category: isVideo ? 'video' : 'image',
    },
  };

  const metadataJson = JSON.stringify(metadata, null, 2);
  const metadataFile = createGenericFile(
    Buffer.from(metadataJson),
    'metadata.json',
    { contentType: 'application/json' }
  );
  const [metadataUri] = await umi.uploader.upload([metadataFile]);

  console.log(`  Metadata URI: ${metadataUri}`);
  console.log();
  console.log('Done! Use this URI for minting:');
  console.log();
  console.log(`  uri: "${metadataUri}"`);
  console.log();
  console.log('Metadata contents:');
  console.log(metadataJson);
}

main().catch((err) => {
  console.error('Upload failed:', err);
  process.exit(1);
});
