import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplBubblegum } from '@metaplex-foundation/mpl-bubblegum';
import { Keypair } from '@solana/web3.js';
import { keypairIdentity, publicKey, type Umi } from '@metaplex-foundation/umi';
import { config, getHeliusRpcUrl } from '../config/constants';

let _umi: Umi | null = null;

/**
 * Parse a secret key from env var. Accepts:
 * - JSON byte array: [174,47,154,...] (64 bytes, from solana-keygen)
 * - Base58 string of 64-byte full keypair
 * - Base58 string of 32-byte seed (derives full keypair)
 * Returns a 64-byte Uint8Array.
 */
export function parseKeypairBytes(raw: string): Uint8Array {
  const trimmed = raw.trim();

  // JSON array format: [1,2,3,...]
  if (trimmed.startsWith('[')) {
    const bytes = JSON.parse(trimmed);
    if (!Array.isArray(bytes) || bytes.length !== 64) {
      throw new Error(`Expected 64-byte JSON array, got ${Array.isArray(bytes) ? bytes.length : 'non-array'}`);
    }
    return new Uint8Array(bytes);
  }

  // Base58 format
  const bs58 = require('bs58');
  const decoded: Uint8Array = bs58.decode(trimmed);

  if (decoded.length === 64) {
    return decoded;
  }

  if (decoded.length === 32) {
    // 32-byte seed — derive the full 64-byte keypair
    const kp = Keypair.fromSeed(decoded);
    return kp.secretKey;
  }

  throw new Error(`Invalid secret key: expected 32 or 64 bytes, got ${decoded.length}`);
}

/**
 * Singleton Umi context configured with:
 * - Helius RPC endpoint
 * - mpl-bubblegum plugin
 * - Collection authority keypair as identity/payer
 */
export function getUmi(): Umi {
  if (_umi) return _umi;

  if (!config.heliusApiKey) {
    throw new Error('HELIUS_API_KEY not configured');
  }
  if (!config.collectionAuthorityKeypair) {
    throw new Error('COLLECTION_AUTHORITY_KEYPAIR not configured');
  }

  const endpoint = getHeliusRpcUrl();
  const umi = createUmi(endpoint).use(mplBubblegum());

  const secretKey = parseKeypairBytes(config.collectionAuthorityKeypair);
  const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
  umi.use(keypairIdentity(keypair));

  _umi = umi;
  return umi;
}
