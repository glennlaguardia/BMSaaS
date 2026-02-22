import { NextResponse } from 'next/server';

/**
 * CORS headers for /api/v1/* cross-origin requests.
 *
 * In production, ALLOWED_ORIGINS should be set to specific client domains.
 * For development, we allow all origins.
 */
const ALLOWED_ORIGINS = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['*'];

const CORS_HEADERS = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
    'Access-Control-Max-Age': '86400', // Preflight cache for 24h
};

/**
 * Get CORS headers for a given origin.
 * If the origin is in the allowlist (or '*' is set), return appropriate headers.
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
    if (ALLOWED_ORIGINS.includes('*')) {
        return {
            'Access-Control-Allow-Origin': origin || '*',
            ...CORS_HEADERS,
        };
    }

    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        return {
            'Access-Control-Allow-Origin': origin,
            'Vary': 'Origin',
            ...CORS_HEADERS,
        };
    }

    // Origin not allowed — return headers without Allow-Origin
    return CORS_HEADERS;
}

/**
 * Handle CORS preflight (OPTIONS) request.
 */
export function handlePreflight(origin: string | null): NextResponse {
    return new NextResponse(null, {
        status: 204,
        headers: getCorsHeaders(origin),
    });
}

/**
 * Add CORS headers to a NextResponse.
 */
export function withCors(response: NextResponse, origin: string | null): NextResponse {
    const headers = getCorsHeaders(origin);
    for (const [key, value] of Object.entries(headers)) {
        response.headers.set(key, value);
    }
    return response;
}
