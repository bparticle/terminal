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
  animationUrl?: string;
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

export interface GlobalPfpOwner {
  assetId: string;
  image: string;
  pfpName: string;
  mintedAt: string;
  ownerName: string | null;
  ownerWallet: string;
  ownerUserId: string;
}

// --- Short-lived client-side cache (#9) ---

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
}

const GALLERY_CACHE_TTL_MS = 60_000;
const GLOBAL_PFP_CACHE_TTL_MS = 120_000;

const galleryCache = new Map<string, CacheEntry<WalletGalleryResponse>>();
let globalPfpCache: CacheEntry<GlobalPfpOwner[]> | null = null;

export function invalidateGalleryCache(walletAddress: string): void {
  galleryCache.delete(walletAddress);
}

export function invalidateGlobalPfpCache(): void {
  globalPfpCache = null;
}

// ------------------------------------------

export async function getWalletGallery(walletAddress: string): Promise<WalletGalleryResponse> {
  const cached = galleryCache.get(walletAddress);
  if (cached && Date.now() - cached.fetchedAt < GALLERY_CACHE_TTL_MS) {
    return cached.data;
  }

  const response = await fetchWithAuth(`wallet/${walletAddress}/gallery`);
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Authentication required — please reconnect your wallet.');
    }
    throw new Error('Failed to load NFT gallery');
  }
  const data: WalletGalleryResponse = await response.json();
  galleryCache.set(walletAddress, { data, fetchedAt: Date.now() });
  return data;
}

export async function getGlobalPfpOwners(limit = 200): Promise<GlobalPfpOwner[]> {
  if (globalPfpCache && Date.now() - globalPfpCache.fetchedAt < GLOBAL_PFP_CACHE_TTL_MS) {
    return globalPfpCache.data;
  }

  const response = await fetchWithAuth(`users/pfp-owners?limit=${limit}`);
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Authentication required — please reconnect your wallet.');
    }
    throw new Error('Failed to load global PFP owners');
  }
  const data = await response.json();
  const owners: GlobalPfpOwner[] = Array.isArray(data?.owners) ? data.owners : [];
  globalPfpCache = { data: owners, fetchedAt: Date.now() };
  return owners;
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
