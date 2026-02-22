/**
 * PFP API — Frontend helpers for PFP mint status and minting
 */

import { fetchWithAuth } from './api';

export interface PfpStatus {
  whitelisted: boolean;
  canMint: boolean;
  pfpCount: number;
  maxMints: number;
  mintsRemaining: number;
  pfps: Array<{ assetId: string; imageUri: string; name: string }>;
}

export interface PfpMintResult {
  assetId: string;
  signature: string;
  imageUri: string;
  traits: {
    paletteName: string;
    faceShape: string;
    eyeType: string;
    mouthStyle: string;
    hairStyle: string;
    accessory: string;
    clothing: string;
    bgPattern: string;
    pixelStyle: string;
  };
}

/**
 * Check PFP mint eligibility and existing PFPs for the current user.
 */
export async function checkPfpStatus(): Promise<PfpStatus> {
  const response = await fetchWithAuth('pfp/status');
  if (!response.ok) {
    throw new Error('Failed to check PFP status');
  }
  return response.json();
}

/**
 * Mint a new random PFP. No preview — result contains the reveal.
 */
export async function mintPfp(): Promise<PfpMintResult> {
  const response = await fetchWithAuth('pfp/mint', { method: 'POST' });
  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: 'PFP mint failed' }));
    throw new Error(data.error || 'PFP mint failed');
  }
  return response.json();
}

// ── User-paid PFP mint (prepare/confirm flow) ─

export interface PfpPrepareResult {
  transactionBase64: string;
  mintLogId: string;
  pfpData: {
    seed: number;
    imageUri: string;
    name: string;
    traits: PfpMintResult['traits'];
  };
}

/**
 * Generate PFP + upload to Arweave + build partially-signed mint transaction.
 */
export async function preparePfpMint(): Promise<PfpPrepareResult> {
  const response = await fetchWithAuth('pfp/prepare', { method: 'POST' });
  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: 'PFP prepare failed' }));
    throw new Error(data.error || 'PFP prepare failed');
  }
  return response.json();
}

/**
 * Confirm a PFP mint by sending the signed transaction to the backend for submission.
 * Backend submits to Helius directly and confirms on-chain.
 */
export async function confirmPfpMint(mintLogId: string, signedTransactionBase64: string): Promise<PfpMintResult> {
  const response = await fetchWithAuth('pfp/confirm', {
    method: 'POST',
    body: JSON.stringify({ mintLogId, signedTransactionBase64 }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: 'PFP confirm failed' }));
    throw new Error(data.error || 'PFP confirm failed');
  }
  return response.json();
}
