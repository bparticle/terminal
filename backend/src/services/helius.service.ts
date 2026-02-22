import fetch from 'node-fetch';
import { config, getHeliusRpcUrl } from '../config/constants';
const COLLECTION_MINT = config.collectionMintAddress;

export interface NFTAsset {
  id: string;
  name: string;
  data_hash?: string;
  attributes: Array<{ trait_type: string; value: string }>;
  image?: string;
}

/**
 * Fetch all cNFTs owned by a wallet from the configured collection
 */
export async function fetchWalletCollections(walletAddress: string) {
  if (!config.heliusApiKey || !COLLECTION_MINT) {
    console.warn('Helius API key or collection mint not configured');
    return [{ collection_id: COLLECTION_MINT || 'not-configured', nfts: [] }];
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
          grouping: ['collection', COLLECTION_MINT],
          page: 1,
          limit: 1000,
          compressed: true,
        },
      }),
    });

    const data = await response.json() as any;
    const assets = data.result?.items || [];

    const nfts: NFTAsset[] = assets.map((asset: any) => ({
      id: asset.id,
      name: asset.content?.metadata?.name || 'Unknown',
      data_hash: asset.compression?.data_hash,
      attributes: asset.content?.metadata?.attributes || [],
      image: asset.content?.links?.image,
    }));

    return [
      {
        collection_id: COLLECTION_MINT,
        nfts,
      },
    ];
  } catch (error) {
    console.error('Error fetching wallet collections:', error);
    return [{ collection_id: COLLECTION_MINT, nfts: [] }];
  }
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
