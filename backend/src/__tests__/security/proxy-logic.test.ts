/**
 * Proxy allowlist logic tests — extracted from frontend proxy and RPC route.
 * Tests path traversal, startsWith bypass, and RPC method filtering.
 */

// ── Replicate the proxy path validation logic for isolated testing ──
const ALLOWED_PATHS = [
  'auth/request-message',
  'auth/verify-wallet',
  'users/check-wallet',
  'users/check-admin',
  'users/profile',
  'users/online',
  'users/heartbeat',
  'game/new',
  'game/load',
  'game/save',
  'game/action',
  'game/users',
  'game/metadata',
  'campaigns',
  'campaigns/all',
  'campaigns/user/progress',
  'campaigns/simulate-achievement',
  'wallet',
  'nft',
];

function isPathAllowed(path: string): boolean {
  if (path.includes('..') || path.includes('%2e') || path.includes('%2E')) {
    return false;
  }
  return ALLOWED_PATHS.some((allowed) => path === allowed || path.startsWith(allowed + '/'));
}

// ── Replicate RPC method allowlist ──
const ALLOWED_METHODS = [
  'getAccountInfo',
  'getBalance',
  'getLatestBlockhash',
  'getSignatureStatuses',
  'searchAssets',
  'getAsset',
  'getAssetProof',
];

function isRpcMethodAllowed(method: string): boolean {
  return typeof method === 'string' && ALLOWED_METHODS.includes(method);
}

describe('Proxy Path Allowlist', () => {
  describe('fix #3: startsWith bypass prevention', () => {
    it('rejects path that starts with allowed prefix but is traversal (wallet../../admin)', () => {
      expect(isPathAllowed('wallet../../admin')).toBe(false);
    });

    it('rejects path traversal with ..', () => {
      expect(isPathAllowed('campaigns/../admin/secret')).toBe(false);
      expect(isPathAllowed('../../../etc/passwd')).toBe(false);
    });

    it('rejects encoded traversal with %2e', () => {
      expect(isPathAllowed('campaigns/%2e%2e/admin')).toBe(false);
      expect(isPathAllowed('campaigns/%2E%2E/admin')).toBe(false);
    });

    it('rejects partial prefix without slash (e.g. campaignsx)', () => {
      // "campaignsx" should not match "campaigns" because no exact or prefix+/
      expect(isPathAllowed('campaignsx')).toBe(false);
    });
  });

  describe('Exact and prefix matching', () => {
    it('allows exact match: campaigns', () => {
      expect(isPathAllowed('campaigns')).toBe(true);
    });

    it('allows prefix + slash: campaigns/all', () => {
      expect(isPathAllowed('campaigns/all')).toBe(true);
    });

    it('allows prefix + slash + subpath: campaigns/some-uuid', () => {
      expect(isPathAllowed('campaigns/some-uuid')).toBe(true);
    });

    it('allows game/load with wallet subpath', () => {
      expect(isPathAllowed('game/load/wallet123')).toBe(true);
    });

    it('rejects unknown paths', () => {
      expect(isPathAllowed('admin/secret')).toBe(false);
      expect(isPathAllowed('internal/debug')).toBe(false);
    });
  });
});

describe('RPC Method Allowlist', () => {
  describe('fix #5: dangerous methods blocked', () => {
    it('rejects sendTransaction', () => {
      expect(isRpcMethodAllowed('sendTransaction')).toBe(false);
    });

    it('rejects simulateTransaction', () => {
      expect(isRpcMethodAllowed('simulateTransaction')).toBe(false);
    });

    it('rejects requestAirdrop', () => {
      expect(isRpcMethodAllowed('requestAirdrop')).toBe(false);
    });

    it('rejects non-string values', () => {
      expect(isRpcMethodAllowed(undefined as any)).toBe(false);
      expect(isRpcMethodAllowed(null as any)).toBe(false);
      expect(isRpcMethodAllowed(123 as any)).toBe(false);
    });
  });

  describe('Allowed methods pass', () => {
    it('allows getAccountInfo', () => {
      expect(isRpcMethodAllowed('getAccountInfo')).toBe(true);
    });

    it('allows searchAssets', () => {
      expect(isRpcMethodAllowed('searchAssets')).toBe(true);
    });

    it('allows getAsset', () => {
      expect(isRpcMethodAllowed('getAsset')).toBe(true);
    });
  });
});

describe('RPC body sanitization — fix #5', () => {
  function sanitizeRpcBody(body: any) {
    return {
      jsonrpc: '2.0',
      id: typeof body.id === 'number' || typeof body.id === 'string' ? body.id : 1,
      method: body.method,
      params: Array.isArray(body.params) ? body.params : [],
    };
  }

  it('strips extra keys from request body', () => {
    const dirty = {
      jsonrpc: '2.0',
      id: 1,
      method: 'getBalance',
      params: ['address'],
      evil_key: 'injected',
      __proto__: { isAdmin: true },
    };

    const clean = sanitizeRpcBody(dirty);
    expect(Object.keys(clean)).toEqual(['jsonrpc', 'id', 'method', 'params']);
    expect((clean as any).evil_key).toBeUndefined();
  });

  it('defaults id to 1 when not number or string', () => {
    const clean = sanitizeRpcBody({ method: 'getBalance', id: [1, 2, 3] });
    expect(clean.id).toBe(1);
  });

  it('defaults params to empty array when not array', () => {
    const clean = sanitizeRpcBody({ method: 'getBalance', params: 'not-array' });
    expect(clean.params).toEqual([]);
  });
});
