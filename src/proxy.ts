import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PROXY_ENDPOINTS = new Set([
  'forgot-password',
  'login',
  'register_user',
  'resend-code',
  'reset-password',
  'verify-email',
]);

const getProxyEndpoint = (pathname: string) =>
  pathname.replace(/^\/api\/proxy\/?/, '').split('/')[0] || '';

const decodeJwtPart = <T,>(value: string) => {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    return JSON.parse(atob(padded)) as T;
  } catch {
    return null;
  }
};

const hasUsableBearerToken = (authorization: string | null) => {
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();

  const [headerPart, payloadPart] = token?.split('.') || [];
  if (!token || token.split('.').length !== 3) return false;

  const header = decodeJwtPart<{ alg?: string }>(headerPart);
  if (!header?.alg || header.alg.toLowerCase() === 'none') return false;

  const payload = decodeJwtPart<{ email?: string; exp?: number; id?: number | string; sub?: string; user_id?: number | string }>(payloadPart);
  if (!payload) return false;

  const hasIdentity = Boolean(payload.email || payload.sub || payload.user_id || payload.id);
  if (!hasIdentity) return false;

  return typeof payload.exp !== 'number' || payload.exp * 1000 > Date.now();
};

export function proxy(request: NextRequest) {
  const endpoint = getProxyEndpoint(request.nextUrl.pathname);

  if (PUBLIC_PROXY_ENDPOINTS.has(endpoint)) {
    return NextResponse.next();
  }

  if (!hasUsableBearerToken(request.headers.get('authorization'))) {
    return NextResponse.json(
      { message: 'No autorizado' },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/proxy/:path*'],
};
