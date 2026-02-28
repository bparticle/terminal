import fetch from 'node-fetch';
import { config, getActiveCollectionMint, getHeliusRpcUrl } from '../config/constants';

export interface NFTAsset {
  id: string;
  name: string;
  data_hash?: string;
  attributes: Array<{ trait_type: string; value: string }>;
  image?: string;
}

export interface GalleryCollectionConfig {
  collectionId: string;
  label: string;
  type: 'pfp' | 'items' | 'core' | 'other';
}

export interface GalleryAsset {
  assetId: string;
  name: string;
  image: string;
  animationUrl: string;
  attributes: Array<{ trait_type: string; value: string }>;
  collectionId: string;
  owner: string;
  compression: {
    compressed: boolean;
    leafId: number | null;
    seq: number | null;
    tree: string | null;
  };
}

async function heliusRpc<T = any>(method: string, params: Record<string, any>): Promise<T> {
  const response = await fetch(getHeliusRpcUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: `${method}-${Date.now()}`,
      method,
      params,
    }),
  });

  const data = await response.json() as any;
  if (data.error) {
    throw new Error(data.error.message || `Helius ${method} failed`);
  }
  return data.result as T;
}

function normalizeAttributes(raw: any): Array<{ trait_type: string; value: string }> {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((attr) => attr && typeof attr.trait_type === 'string')
    .map((attr) => ({
      trait_type: attr.trait_type,
      value: String(attr.value ?? ''),
    }));
}

export function buildGalleryAsset(item: any, collectionId: string): GalleryAsset {
  return {
    assetId: item.id,
    name: item.content?.metadata?.name || 'Unknown',
    image: item.content?.links?.image || item.content?.files?.[0]?.uri || '',
    animationUrl: item.content?.links?.animation_url || '',
    attributes: normalizeAttributes(item.content?.metadata?.attributes),
    collectionId,
    owner: item.ownership?.owner || '',
    compression: {
      compressed: item.compression?.compressed === true,
      leafId: typeof item.compression?.leaf_id === 'number' ? item.compression.leaf_id : null,
      seq: typeof item.compression?.seq === 'number' ? item.compression.seq : null,
      tree: typeof item.compression?.tree === 'string' ? item.compression.tree : null,
    },
  };
}

/**
 * Fetch all cNFTs owned by a wallet from the configured collection
 */
export async function fetchWalletCollections(walletAddress: string) {
  const collectionMint = getActiveCollectionMint('core');

  if (!config.heliusApiKey || !collectionMint) {
    console.warn('Helius API key or collection mint not configured');
    return [{ collection_id: collectionMint || 'not-configured', nfts: [] }];
  }

  try {
    const response = await fetch(getHeliusRpcUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'get-assets',
        method: 'searchAssets',
        params: {
          ownerAddress: walletAddress,
          grouping: ['collection', collectionMint],
          page: 1,
          limit: 1000,
          compressed: true,
        },
      }),
    });

    const data = await response.json() as any;
    const assets = (data.result?.items || []).filter((asset: any) => asset?.burnt !== true);

    const nfts: NFTAsset[] = assets.map((asset: any) => ({
      id: asset.id,
      name: asset.content?.metadata?.name || 'Unknown',
      data_hash: asset.compression?.data_hash,
      attributes: asset.content?.metadata?.attributes || [],
      image: asset.content?.links?.image,
    }));

    return [
      {
        collection_id: collectionMint,
        nfts,
      },
    ];
  } catch (error) {
    console.error('Error fetching wallet collections:', error);
    return [{ collection_id: collectionMint, nfts: [] }];
  }
}

/**
 * Fetch owned compressed assets grouped by a provided list of collection IDs.
 * Deduplicates by leaf_id using highest seq (latest ownership state).
 */
export async function fetchOwnedAssetsByCollections(
  walletAddress: string,
  collections: GalleryCollectionConfig[],
): Promise<Array<GalleryCollectionConfig & { nfts: GalleryAsset[] }>> {
  if (!config.heliusApiKey || collections.length === 0) {
    return collections.map((collection) => ({ ...collection, nfts: [] }));
  }

  // Fetch all collections in parallel instead of sequentially (#5)
  return Promise.all(
    collections.map(async (collection) => {
      try {
        const result = await heliusRpc<any>('searchAssets', {
          ownerAddress: walletAddress,
          grouping: ['collection', collection.collectionId],
          page: 1,
          limit: 1000,
          compressed: true,
        });

        const items: any[] = Array.isArray(result?.items) ? result.items : [];
        const byLeaf = new Map<string, any>();

        for (const item of items) {
          if (item?.burnt === true || item?.compression?.compressed !== true) continue;

          const leafKey = item.compression?.leaf_id != null
            ? String(item.compression.leaf_id)
            : item.id;
          const existing = byLeaf.get(leafKey);
          const nextSeq = typeof item.compression?.seq === 'number' ? item.compression.seq : 0;
          const existingSeq = typeof existing?.compression?.seq === 'number' ? existing.compression.seq : -1;
          if (!existing || nextSeq >= existingSeq) {
            byLeaf.set(leafKey, item);
          }
        }

        const nfts = Array.from(byLeaf.values()).map((item) => buildGalleryAsset(item, collection.collectionId));
        return { ...collection, nfts };
      } catch (error) {
        console.error(`Error fetching owned assets for collection ${collection.collectionId}:`, error);
        return { ...collection, nfts: [] };
      }
    }),
  );
}

/**
 * Get details for a specific NFT by asset ID
 */
export async function getNFTDetails(assetId: string) {
  if (!config.heliusApiKey) {
    return null;
  }

  try {
    const response = await fetch(getHeliusRpcUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'get-asset',
        method: 'getAsset',
        params: { id: assetId },
      }),
    });

    const data = await response.json() as any;
    return data.result;
  } catch (error) {
    console.error('Error fetching NFT details:', error);
    return null;
  }
}

export async function getAssetProof(assetId: string): Promise<any | null> {
  if (!config.heliusApiKey) return null;
  try {
    return await heliusRpc<any>('getAssetProof', { id: assetId });
  } catch (error) {
    console.error('Error fetching NFT proof:', error);
    return null;
  }
}
