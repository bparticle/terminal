import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOSTS = ['gateway.irys.xyz', 'arweave.net'];
const CACHE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days — immutable content

/**
 * GET /api/image?url=https://gateway.irys.xyz/...
 *
 * Proxies Arweave/Irys images through the Next.js server so browsers
 * that can't reach gateway.irys.xyz (SSL issues, firewalls, etc.)
 * still render PFP images.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return NextResponse.json({ error: 'Host not allowed' }, { status: 403 });
  }

  try {
    const upstream = await fetch(url, {
      headers: { 'Accept': 'image/*' },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${upstream.status}` },
        { status: upstream.status },
      );
    }

    const contentType = upstream.headers.get('content-type') || 'image/png';
    const body = await upstream.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, immutable`,
      },
    });
  } catch (err: any) {
    console.error('Image proxy error:', err.message);
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 });
  }
}
