import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

function getJwtSecret(): Uint8Array {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('JWT_SECRET environment variable is required in production');
        }
        return new TextEncoder().encode('budabook-dev-only-not-for-production');
    }
    return new TextEncoder().encode(secret);
}

const JWT_SECRET = getJwtSecret();
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

    // Protect /dashboard/* routes (admin panel) — except the login page itself
    if (pathname.startsWith('/dashboard') && pathname !== '/dashboard') {
        const token = request.cookies.get(COOKIE_NAME)?.value;

        if (!token) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        try {
            await jwtVerify(token, JWT_SECRET);
        } catch {
            // Invalid or expired token — redirect to login
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
