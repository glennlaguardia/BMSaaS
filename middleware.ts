import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'budabook-dev-secret'
);
const COOKIE_NAME = 'budabook_admin_session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Pass the full URL as a header so server components can read query params
  response.headers.set('x-url', request.url);

  // Resolve tenant from subdomain or query param
  const host = request.headers.get('host') || '';
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'budabook.com';
  let tenantSlug = 'taglucop'; // default

  // Check query param
  const tenantParam = request.nextUrl.searchParams.get('tenant');
  if (tenantParam) {
    tenantSlug = tenantParam;
  } else if (host.includes('.') && host.endsWith(appDomain)) {
    const subdomain = host.replace(`.${appDomain}`, '').split(':')[0];
    if (subdomain && subdomain !== 'www') {
      tenantSlug = subdomain;
    }
  }

  response.headers.set('x-tenant-slug', tenantSlug);

  // Protect /goat/* routes (admin panel) — except the login page itself
  if (pathname.startsWith('/goat') && pathname !== '/goat') {
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/goat', request.url));
    }

    try {
      await jwtVerify(token, JWT_SECRET);
    } catch {
      // Invalid or expired token — redirect to login
      return NextResponse.redirect(new URL('/goat', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
