const COLLECTION_MINT = process.env.NEXT_PUBLIC_COLLECTION_MINT || '';

export interface OwnedNFT {
  id: string;
  name: string;
  attributes: Array<{ trait_type: string; value: string }>;
  image?: string;
  data_hash?: string;
}

/**
 * Fetch all cNFTs owned by a wallet from the configured collection
 */
export async function fetchOwnedNFTs(walletAddress: string): Promise<OwnedNFT[]> {
  if (!COLLECTION_MINT) {
    console.warn('Collection mint not configured');
    return [];
  }

  try {
    const response = await fetch('/api/rpc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'fetch-nfts',
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

    const data = await response.json();
    const assets = (data.result?.items || []).filter((asset: any) => asset?.burnt !== true);

    return assets.map((asset: any) => ({
      id: asset.id,
      name: asset.content?.metadata?.name || 'Unknown',
      attributes: asset.content?.metadata?.attributes || [],
      image: asset.content?.links?.image,
      data_hash: asset.compression?.data_hash,
    }));
  } catch (error) {
    console.error('Error fetching owned NFTs:', error);
    return [];
  }
}

/**
 * Get details for a specific NFT
 */
export async function getNFTDetails(assetId: string): Promise<any | null> {
  try {
    const response = await fetch('/api/rpc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'get-asset',
        method: 'getAsset',
        params: { id: assetId },
      }),
    });

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Error fetching NFT details:', error);
    return null;
  }
}
