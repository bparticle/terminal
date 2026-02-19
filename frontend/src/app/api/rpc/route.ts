import { NextRequest, NextResponse } from 'next/server';

// Use server-only env var (no NEXT_PUBLIC_ prefix) to avoid leaking API key to client
const HELIUS_RPC_URL = process.env.HELIUS_RPC_URL || process.env.NEXT_PUBLIC_HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com';

const ALLOWED_METHODS = [
  'getAccountInfo',
  'getBalance',
  'getLatestBlockhash',
  'getSignatureStatuses',
  'searchAssets',
  'getAsset',
  'getAssetProof',
];

// Simple in-memory rate limiting for RPC proxy
const rpcRateMap = new Map<string, { count: number; resetAt: number }>();
const RPC_RATE_LIMIT = 30; // requests per minute
const RPC_RATE_WINDOW = 60 * 1000;

function isRpcRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rpcRateMap.get(ip);
  if (!entry || now >= entry.resetAt) {
    rpcRateMap.set(ip, { count: 1, resetAt: now + RPC_RATE_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RPC_RATE_LIMIT;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRpcRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many RPC requests. Please slow down.' },
        { status: 429 }
      );
    }

    const body = await request.json();

    if (!body.method || typeof body.method !== 'string' || !ALLOWED_METHODS.includes(body.method)) {
      return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 403 }
      );
    }

    // Reconstruct body from only expected fields to prevent injection of extra keys
    const sanitizedBody = {
      jsonrpc: '2.0',
      id: typeof body.id === 'number' || typeof body.id === 'string' ? body.id : 1,
      method: body.method,
      params: Array.isArray(body.params) ? body.params : [],
    };

    const response = await fetch(HELIUS_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitizedBody),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('RPC proxy error:', error);
    return NextResponse.json(
      { error: 'RPC proxy request failed' },
      { status: 502 }
    );
  }
}
