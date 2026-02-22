import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api/v1';
const API_KEY = process.env.API_KEY || '';

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
  'game/reset',
  'game/admin',
  'game/users',
  'game/metadata',
  'campaigns',
  'campaigns/all',
  'campaigns/user/progress',
  'campaigns/simulate-achievement',
  'wallet',
  'nft',
  'site',
  'mint',
  'soulbound',
  'pfp',
];

function isPathAllowed(path: string): boolean {
  // Reject path traversal attempts
  if (path.includes('..') || path.includes('%2e') || path.includes('%2E')) {
    return false;
  }
  return ALLOWED_PATHS.some((allowed) => path === allowed || path.startsWith(allowed + '/'));
}

function buildHeaders(request: NextRequest): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
  };

  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  return headers;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');

  if (!isPathAllowed(path)) {
    return NextResponse.json({ error: 'Path not allowed' }, { status: 403 });
  }

  const url = `${API_BASE_URL}/${path}`;
  const searchParams = request.nextUrl.searchParams.toString();
  const fullUrl = searchParams ? `${url}?${searchParams}` : url;

  try {
    const response = await fetch(fullUrl, {
      headers: buildHeaders(request),
      cache: 'no-store',
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy GET error:', error);
    return NextResponse.json({ error: 'Proxy request failed' }, { status: 502 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');

  if (!isPathAllowed(path)) {
    return NextResponse.json({ error: 'Path not allowed' }, { status: 403 });
  }

  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is OK (e.g. heartbeat)
    }

    const url = `${API_BASE_URL}/${path}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: buildHeaders(request),
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy POST error:', error);
    return NextResponse.json({ error: 'Proxy request failed' }, { status: 502 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');

  if (!isPathAllowed(path)) {
    return NextResponse.json({ error: 'Path not allowed' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const url = `${API_BASE_URL}/${path}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: buildHeaders(request),
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy PUT error:', error);
    return NextResponse.json({ error: 'Proxy request failed' }, { status: 502 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');

  if (!isPathAllowed(path)) {
    return NextResponse.json({ error: 'Path not allowed' }, { status: 403 });
  }

  try {
    const url = `${API_BASE_URL}/${path}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: buildHeaders(request),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy DELETE error:', error);
    return NextResponse.json({ error: 'Proxy request failed' }, { status: 502 });
  }
}
