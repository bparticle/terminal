import { fetchWithAuth } from './api';

export type GalleryCollectionType = 'pfp' | 'items' | 'core' | 'other';

export interface GalleryAttribute {
  trait_type: string;
  value: string;
}

export interface GalleryNft {
  assetId: string;
  name: string;
  image: string;
  attributes: GalleryAttribute[];
  collectionId: string;
  owner: string;
  mintType: string;
  isCurrentPfp: boolean;
  isSoulbound: boolean;
  compression?: {
    compressed: boolean;
    leafId: number | null;
    seq: number | null;
    tree: string | null;
  };
  terminalMetadata?: Record<string, unknown> | null;
}

export interface GalleryCollection {
  collectionId: string;
  label: string;
  type: GalleryCollectionType;
  nfts: GalleryNft[];
}

export interface WalletGalleryResponse {
  wallet: string;
  currentPfpAssetId: string | null;
  collections: GalleryCollection[];
}

export async function getWalletGallery(walletAddress: string): Promise<WalletGalleryResponse> {
  const response = await fetchWithAuth(`wallet/${walletAddress}/gallery`);
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Authentication required — please reconnect your wallet.');
    }
    throw new Error('Failed to load NFT gallery');
  }
  return response.json();
}

export async function prepareNftTransfer(assetId: string, toWallet: string): Promise<{
  transactionBase64: string;
  transferToken: string;
  assetId: string;
  toWallet: string;
}> {
  const response = await fetchWithAuth('wallet/transfer/prepare', {
    method: 'POST',
    body: JSON.stringify({ assetId, toWallet }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: 'Failed to prepare transfer transaction' }));
    throw new Error(data.error || 'Failed to prepare transfer transaction');
  }
  return response.json();
}

export async function confirmNftTransfer(assetId: string, transferToken: string, signedTransactionBase64: string): Promise<{
  assetId: string;
  signature: string;
  status: 'confirmed';
}> {
  const response = await fetchWithAuth('wallet/transfer/confirm', {
    method: 'POST',
    body: JSON.stringify({ assetId, transferToken, signedTransactionBase64 }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: 'Failed to confirm transfer transaction' }));
    throw new Error(data.error || 'Failed to confirm transfer transaction');
  }
  return response.json();
}
