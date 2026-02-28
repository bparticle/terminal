const API_BASE_URL = '/api/proxy';

let authContext: {
  getAuthHeaders: () => Record<string, string>;
  authenticate: () => Promise<void>;
} | null = null;

export function setAuthContext(ctx: typeof authContext) {
  authContext = ctx;
}

/**
 * Fetch with automatic auth header injection and 401 retry
 */
export async function fetchWithAuth(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Add auth headers
  if (authContext) {
    const authHeaders = authContext.getAuthHeaders();
    Object.assign(headers, authHeaders);
  }

  const url = `${API_BASE_URL}/${path}`;

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  // On 401 the session has expired. Do NOT attempt to silently re-authenticate here —
  // this system requires a wallet signature, so calling authenticate() from a background
  // fetch would: (a) pop up unexpected wallet dialogs, and (b) hammer the rate-limited
  // auth endpoint when multiple concurrent requests all fail at once.
  // Instead, return the 401 response and let callers handle it gracefully.
  // The stuck-state detector in GameTerminal will prompt the user to type "connect".

  if (response.status === 429) {
    throw new Error('Rate limited. Please try again later.');
  }

  return response;
}

/**
 * Request an auth message for signing
 */
export async function requestAuthMessage(walletAddress: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/auth/request-message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet_address: walletAddress }),
  });
  const data = await response.json();
  return data.message;
}

/**
 * Verify a wallet signature
 */
export async function verifyWallet(
  walletAddress: string,
  message: string,
  signature: string
): Promise<{ token: string; user: any }> {
  const response = await fetch(`${API_BASE_URL}/auth/verify-wallet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet_address: walletAddress, message, signature }),
  });
  return response.json();
}

/**
 * Get user profile
 */
export async function getUserProfile(): Promise<any> {
  const response = await fetchWithAuth('users/profile');
  if (!response.ok) throw new Error('Failed to fetch profile');
  return response.json();
}

/**
 * Update profile name
 */
export async function updateProfileName(name: string): Promise<any> {
  const response = await fetchWithAuth('users/profile', {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });
  if (!response.ok) throw new Error('Failed to update name');
  return response.json();
}

/**
 * Update profile picture
 */
export async function updateProfilePfp(pfpImageUrl: string, pfpNftId: string): Promise<any> {
  const response = await fetchWithAuth('users/profile', {
    method: 'PUT',
    body: JSON.stringify({ pfp_image_url: pfpImageUrl, pfp_nft_id: pfpNftId }),
  });
  if (!response.ok) throw new Error('Failed to update PFP');
  const data = await response.json();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('profile-pfp-updated', {
        detail: {
          imageUrl: pfpImageUrl || null,
          assetId: pfpNftId || null,
        },
      }),
    );
  }
  return data;
}
