/**
 * Item URI Service
 *
 * Resolves Arweave metadata URIs for inventory items on the fly.
 * On first mint of a given item type, uploads the matching local PNG
 * (frontend/public/items/{itemName}.png) to Arweave and caches the URI.
 * Subsequent mints of the same item reuse the cached URI.
 *
 * Falls back to the caller-supplied fallbackUri if no local image exists.
 */

import * as fs from 'fs';
import * as path from 'path';
import { uploadImageBuffer, uploadMetadataJson } from './arweave.service';

const ITEMS_DIR = path.resolve(__dirname, '../../../frontend/public/items');
const CACHE_FILE = path.resolve(__dirname, '../../item-uris-cache.json');

// In-memory cache: item_name → Arweave metadata URI
const uriCache = new Map<string, string>();

// Track in-flight uploads so concurrent mints of the same item don't
// trigger duplicate Arweave uploads.
const pendingUploads = new Map<string, Promise<string>>();

/** Load persisted URIs from disk into the in-memory cache on startup. */
function loadCacheFromDisk(): void {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf8');
      const saved: Record<string, string> = JSON.parse(raw);
      for (const [k, v] of Object.entries(saved)) {
        uriCache.set(k, v);
      }
      console.log(`[item-uri] Loaded ${uriCache.size} cached URI(s) from disk.`);
    }
  } catch (err: any) {
    console.warn('[item-uri] Could not load URI cache from disk:', err.message);
  }
}

/** Persist the current in-memory cache to disk. */
function saveCacheToDisk(): void {
  try {
    const obj: Record<string, string> = {};
    for (const [k, v] of uriCache.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(obj, null, 2), 'utf8');
  } catch (err: any) {
    console.warn('[item-uri] Could not save URI cache to disk:', err.message);
  }
}

/** Convert snake_case item name to Title Case display name. */
function toDisplayName(itemName: string): string {
  return itemName
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Upload the local PNG for an item and return its Arweave metadata URI. */
async function uploadItemToArweave(itemName: string): Promise<string> {
  const pngPath = path.join(ITEMS_DIR, `${itemName}.png`);
  const imageBuffer = fs.readFileSync(pngPath);
  const displayName = toDisplayName(itemName);

  const imageUri = await uploadImageBuffer(imageBuffer, `${itemName}.png`, 'image/png');

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

  const metadataUri = await uploadMetadataJson(metadata);
  return metadataUri;
}

/**
 * Resolve the Arweave metadata URI for an inventory item.
 *
 * Priority:
 * 1. In-memory cache (fastest — already uploaded this session or previously)
 * 2. Upload local PNG on the fly, cache the result
 * 3. fallbackUri if no local image exists
 *
 * The upload (step 2) happens in the background — callers await only the
 * first mint; subsequent concurrent mints join the same in-flight Promise.
 */
export async function resolveItemUri(itemName: string, fallbackUri: string): Promise<string> {
  // 1. Cache hit
  const cached = uriCache.get(itemName);
  if (cached) return cached;

  // 2. Check for local PNG
  const pngPath = path.join(ITEMS_DIR, `${itemName}.png`);
  if (!fs.existsSync(pngPath)) {
    return fallbackUri;
  }

  // 3. Deduplicate concurrent uploads for the same item
  const existing = pendingUploads.get(itemName);
  if (existing) return existing;

  const uploadPromise = uploadItemToArweave(itemName)
    .then((uri) => {
      uriCache.set(itemName, uri);
      saveCacheToDisk();
      pendingUploads.delete(itemName);
      console.log(`[item-uri] Uploaded "${itemName}" → ${uri}`);
      return uri;
    })
    .catch((err: any) => {
      pendingUploads.delete(itemName);
      console.error(`[item-uri] Upload failed for "${itemName}":`, err.message);
      return fallbackUri;
    });

  pendingUploads.set(itemName, uploadPromise);
  return uploadPromise;
}

// Load persisted cache on module init
loadCacheFromDisk();
