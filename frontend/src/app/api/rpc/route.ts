import { NextRequest, NextResponse } from 'next/server';

const HELIUS_RPC_URL = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com';

const ALLOWED_METHODS = [
  'getAccountInfo',
  'getBalance',
  'getLatestBlockhash',
  'getSignatureStatuses',
  'sendTransaction',
  'simulateTransaction',
  'searchAssets',
  'getAsset',
  'getAssetProof',
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!ALLOWED_METHODS.includes(body.method)) {
      return NextResponse.json(
        { error: `Method '${body.method}' not allowed` },
        { status: 403 }
      );
    }

    const response = await fetch(HELIUS_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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
