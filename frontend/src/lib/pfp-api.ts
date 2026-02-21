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
