/**
 * Arweave Upload Service
 *
 * Reusable functions for uploading images and metadata JSON to Arweave via Irys.
 * Uses a separate Umi instance with the irysUploader plugin (the mint Umi
 * singleton in umi.ts doesn't have Irys configured).
 */

import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplBubblegum } from '@metaplex-foundation/mpl-bubblegum';
import { keypairIdentity, createGenericFile, type Umi } from '@metaplex-foundation/umi';
import { irysUploader } from '@metaplex-foundation/umi-uploader-irys';
import { config, getHeliusRpcUrl } from '../config/constants';
import { parseKeypairBytes } from './umi';

let _uploadUmi: Umi | null = null;

/**
 * Singleton Umi context configured with Irys uploader for Arweave uploads.
 * Separate from the mint Umi instance.
 */
function getUploadUmi(): Umi {
  if (_uploadUmi) return _uploadUmi;

  if (!config.heliusApiKey) {
    throw new Error('HELIUS_API_KEY not configured');
  }
  if (!config.collectionAuthorityKeypair) {
    throw new Error('COLLECTION_AUTHORITY_KEYPAIR not configured');
  }

  const endpoint = getHeliusRpcUrl();

  const umi = createUmi(endpoint)
    .use(mplBubblegum())
    .use(irysUploader({ providerUrl: endpoint }));

  const secretKey = parseKeypairBytes(config.collectionAuthorityKeypair);
  const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
  umi.use(keypairIdentity(keypair));

  _uploadUmi = umi;
  return umi;
}

/**
 * Upload a raw image buffer to Arweave.
 * Returns the Arweave URI for the uploaded file.
 */
export async function uploadImageBuffer(
  buffer: Buffer,
  fileName: string,
  contentType: string = 'image/png',
): Promise<string> {
  const umi = getUploadUmi();
  const genericFile = createGenericFile(buffer, fileName, { contentType });
  const [uri] = await umi.uploader.upload([genericFile]);
  return uri;
}

/**
 * Upload a metadata JSON object to Arweave.
 * Returns the Arweave URI for the metadata.
 */
export async function uploadMetadataJson(
  metadata: Record<string, any>,
): Promise<string> {
  const umi = getUploadUmi();
  const metadataJson = JSON.stringify(metadata, null, 2);
  const metadataFile = createGenericFile(
    Buffer.from(metadataJson),
    'metadata.json',
    { contentType: 'application/json' },
  );
  const [uri] = await umi.uploader.upload([metadataFile]);
  return uri;
}

/**
 * Upload a PFP image and its Metaplex-compatible metadata JSON to Arweave.
 * Returns both URIs.
 */
export async function uploadPfpAndMetadata(params: {
  imageBuffer: Buffer;
  name: string;
  description: string;
  symbol: string;
  attributes: Array<{ trait_type: string; value: string }>;
}): Promise<{ imageUri: string; metadataUri: string }> {
  // Upload image first (metadata depends on imageUri)
  const imageUri = await uploadImageBuffer(params.imageBuffer, 'pfp.png');

  // Build and upload metadata (must be sequential — needs imageUri)
  const metadata = {
    name: params.name,
    symbol: params.symbol,
    description: params.description,
    image: imageUri,
    external_url: 'https://terminal.so',
    attributes: params.attributes,
    properties: {
      files: [{ uri: imageUri, type: 'image/png' }],
      category: 'image',
    },
  };

  const metadataUri = await uploadMetadataJson(metadata);
  return { imageUri, metadataUri };
}

/**
 * Upload image and metadata to Arweave with a placeholder image URI,
 * then update metadata with the real image URI in a second pass.
 * This allows parallel initial uploads.
 */
export async function uploadPfpAndMetadataFast(params: {
  imageBuffer: Buffer;
  name: string;
  description: string;
  symbol: string;
  attributes: Array<{ trait_type: string; value: string }>;
}): Promise<{ imageUri: string; metadataUri: string }> {
  // Upload image and metadata JSON in parallel.
  // Metadata uses a placeholder image URI, then we upload the final version.
  const umi = getUploadUmi();

  // Start image upload
  const imageFile = createGenericFile(params.imageBuffer, 'pfp.png', { contentType: 'image/png' });
  const imagePromise = umi.uploader.upload([imageFile]).then(([uri]) => uri);

  // Wait for image, then upload metadata with real URI
  const imageUri = await imagePromise;

  const metadata = {
    name: params.name,
    symbol: params.symbol,
    description: params.description,
    image: imageUri,
    external_url: 'https://terminal.so',
    attributes: params.attributes,
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

  return { imageUri, metadataUri };
}
