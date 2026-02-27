import { fetchWithAuth } from './api';

// ── Eligibility ───────────────────────────────

export interface MintEligibility {
  alreadyMinted: boolean;
  globalMinted: number;
  maxSupply: number;
  supplyRemaining: number;
}

export async function checkMintEligibility(mintKey: string, maxSupply: number = 0): Promise<MintEligibility> {
  const params = new URLSearchParams({ mintKey });
  if (maxSupply > 0) params.set('maxSupply', String(maxSupply));
  const response = await fetchWithAuth(`mint/check-eligibility?${params}`);
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Authentication required — please reconnect your wallet.');
    }
    return { alreadyMinted: false, globalMinted: 0, maxSupply: 0, supplyRemaining: 0 };
  }
  return response.json();
}

// ── User endpoints ─────────────────────────────

export async function checkWhitelistStatus(): Promise<{
  whitelisted: boolean;
  max_mints?: number;
  mints_used?: number;
  remaining?: number;
}> {
  const response = await fetchWithAuth('mint/whitelist/check');
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Authentication required — please reconnect your wallet.');
    }
    return { whitelisted: false };
  }
  return response.json();
}

export async function executeMint(config: {
  name: string;
  uri: string;
  symbol?: string;
  description?: string;
  image?: string;
  externalUrl?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
  collection?: 'pfp' | 'items';
  soulbound?: boolean;
  itemName?: string;
  mintKey?: string;
  maxSupply?: number;
  oncePerPlayer?: boolean;
}): Promise<{
  success: boolean;
  assetId: string;
  signature: string;
  mintLogId: string;
}> {
  const response = await fetchWithAuth('mint/execute', {
    method: 'POST',
    body: JSON.stringify(config),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Minting failed');
  }
  return response.json();
}

// ── User-paid mint (prepare/confirm flow) ─────

export async function prepareMint(config: {
  name: string;
  uri: string;
  symbol?: string;
  collection?: 'pfp' | 'items';
  mintKey?: string;
  maxSupply?: number;
  oncePerPlayer?: boolean;
}): Promise<{
  transactionBase64: string;
  mintLogId: string;
}> {
  const response = await fetchWithAuth('mint/prepare', {
    method: 'POST',
    body: JSON.stringify(config),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to prepare mint transaction');
  }
  return response.json();
}

export async function confirmMint(mintLogId: string, signedTransactionBase64: string): Promise<{
  success: boolean;
  assetId: string;
  signature: string;
  mintLogId: string;
}> {
  const response = await fetchWithAuth('mint/confirm', {
    method: 'POST',
    body: JSON.stringify({ mintLogId, signedTransactionBase64 }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to confirm mint transaction');
  }
  return response.json();
}

export async function checkMintStatus(signature: string): Promise<{
  confirmed: boolean;
  status: string;
}> {
  const response = await fetchWithAuth(`mint/status/${signature}`);
  if (!response.ok) {
    throw new Error('Failed to check mint status');
  }
  return response.json();
}

export async function getMintHistory(): Promise<{
  history: Array<{
    id: string;
    mint_type: string;
    asset_id: string | null;
    signature: string | null;
    nft_name: string;
    status: string;
    error_message: string | null;
    created_at: string;
    confirmed_at: string | null;
  }>;
}> {
  const response = await fetchWithAuth('mint/history');
  if (!response.ok) return { history: [] };
  return response.json();
}

// ── Soulbound endpoints ────────────────────────

export async function mintSoulbound(config: {
  name: string;
  uri: string;
  symbol?: string;
  description?: string;
  image?: string;
  externalUrl?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
  itemName?: string;
}): Promise<{
  success: boolean;
  assetId: string;
  mintSignature: string;
  freezeSignature: string;
  mintLogId: string;
}> {
  const response = await fetchWithAuth('soulbound/mint', {
    method: 'POST',
    body: JSON.stringify(config),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Soulbound minting failed');
  }
  return response.json();
}

/**
 * Background soulbound mint for inventory items.
 * Returns queue/dedup status so callers can reconcile UI state.
 */
export async function mintSoulboundBackground(itemName: string, uri: string): Promise<{
  queued: boolean;
  alreadyMinted?: boolean;
  assetId?: string;
  error?: string;
}> {
  try {
    const response = await fetchWithAuth('soulbound/mint-background', {
      method: 'POST',
      body: JSON.stringify({ itemName, uri, name: itemName }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const message = err.error || 'Background soulbound mint request failed';
      console.error(`Background soulbound mint failed for ${itemName}: ${message}`);
      return { queued: false, error: message };
    }

    const data = await response.json().catch(() => ({}));
    return {
      queued: Boolean(data.queued),
      alreadyMinted: Boolean(data.alreadyMinted),
      assetId: typeof data.assetId === 'string' ? data.assetId : undefined,
    };
  } catch (error) {
    console.error(`Background soulbound mint failed for ${itemName}:`, error);
    return {
      queued: false,
      error: error instanceof Error ? error.message : 'Unknown background mint error',
    };
  }
}

export async function getSoulboundItems(): Promise<{
  items: Array<{
    id: string;
    asset_id: string;
    item_name: string;
    is_frozen: boolean;
    freeze_signature: string | null;
    metadata: Record<string, any>;
    created_at: string;
  }>;
}> {
  const response = await fetchWithAuth('soulbound/items');
  if (!response.ok) return { items: [] };
  return response.json();
}

export async function verifySoulbound(assetId: string): Promise<{
  isFrozen: boolean;
  delegate: string | null;
  owner: string | null;
}> {
  const response = await fetchWithAuth(`soulbound/verify/${assetId}`);
  if (!response.ok) {
    throw new Error('Failed to verify soulbound status');
  }
  return response.json();
}

// ── Admin endpoints ────────────────────────────

export async function getWhitelist(): Promise<{
  entries: Array<{
    id: string;
    wallet_address: string;
    max_mints: number;
    mints_used: number;
    is_active: boolean;
    added_by: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
  }>;
}> {
  const response = await fetchWithAuth('mint/admin/whitelist');
  if (!response.ok) return { entries: [] };
  return response.json();
}

export async function addToWhitelist(
  walletAddress: string,
  maxMints: number,
  notes?: string
): Promise<any> {
  const response = await fetchWithAuth('mint/admin/whitelist', {
    method: 'POST',
    body: JSON.stringify({ wallet_address: walletAddress, max_mints: maxMints, notes }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to add to whitelist');
  }
  return response.json();
}

export async function bulkAddToWhitelist(
  wallets: string[],
  maxMints: number
): Promise<{ added: number; updated: number; skipped: number }> {
  const response = await fetchWithAuth('mint/admin/whitelist/bulk', {
    method: 'POST',
    body: JSON.stringify({ wallets, max_mints: maxMints }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to bulk add');
  }
  return response.json();
}

export async function updateWhitelistEntry(
  wallet: string,
  updates: { max_mints?: number; is_active?: boolean; notes?: string }
): Promise<any> {
  const response = await fetchWithAuth(`mint/admin/whitelist/${wallet}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update whitelist entry');
  }
  return response.json();
}

export async function removeFromWhitelist(wallet: string): Promise<void> {
  const response = await fetchWithAuth(`mint/admin/whitelist/${wallet}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to remove from whitelist');
  }
}

export async function getMintLog(filters?: {
  status?: string;
  mint_type?: string;
  wallet?: string;
}): Promise<{
  logs: Array<{
    id: string;
    wallet_address: string;
    mint_type: string;
    asset_id: string | null;
    signature: string | null;
    nft_name: string;
    status: string;
    error_message: string | null;
    created_at: string;
    confirmed_at: string | null;
  }>;
}> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.mint_type) params.set('mint_type', filters.mint_type);
  if (filters?.wallet) params.set('wallet', filters.wallet);

  const qs = params.toString();
  const path = qs ? `mint/admin/log?${qs}` : 'mint/admin/log';
  const response = await fetchWithAuth(path);
  if (!response.ok) return { logs: [] };
  return response.json();
}
