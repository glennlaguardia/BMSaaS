import { NextRequest } from 'next/server';

/**
 * Extract the client IP address from a Next.js request.
 * Checks x-forwarded-for (set by reverse proxies / Vercel), then x-real-ip,
 * then falls back to a generic identifier.
 */
export function getClientIp(request: NextRequest | Request): string {
  const headers = request.headers;

  // x-forwarded-for may contain a comma-separated list; the first entry is the client
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return '127.0.0.1';
}
