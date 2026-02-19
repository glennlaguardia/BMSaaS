import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, unauthorizedResponse, hasScope, forbiddenResponse } from '@/lib/api-key-auth';
import { getCorsHeaders, handlePreflight } from '@/lib/cors';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/get-ip';

/**
 * Options for creating a v1 API handler.
 */
interface V1HandlerOptions {
    /** Required scope for this endpoint (default: 'read') */
    scope?: string;
    /** Rate limit: max requests per window (default: 120) */
    rateMax?: number;
    /** Rate limit: window in ms (default: 60 seconds) */
    rateWindowMs?: number;
    /** Endpoint name for rate limiting (e.g. 'v1/tenant') */
    endpoint: string;
}

/**
 * Validated context passed to the handler function.
 */
interface V1Context {
    tenantId: string;
    scopes: string[];
    request: NextRequest;
}

type HandlerFn = (ctx: V1Context) => Promise<NextResponse>;

/**
 * Create a standardized v1 API route handler with:
 * - CORS preflight handling
 * - API key authentication
 * - Scope validation
 * - Rate limiting
 * - Error handling
 */
export function createV1Handler(options: V1HandlerOptions, handler: HandlerFn) {
    const { scope = 'read', rateMax = 120, rateWindowMs = 60_000, endpoint } = options;

    return async function (request: NextRequest): Promise<NextResponse | Response> {
        const origin = request.headers.get('origin');

        // Handle CORS preflight (shouldn't reach here if OPTIONS is exported separately, but just in case)
        if (request.method === 'OPTIONS') {
            return handlePreflight(origin);
        }

        try {
            // Rate limiting
            const ip = getClientIp(request);
            const rl = rateLimit(ip, endpoint, { windowMs: rateWindowMs, max: rateMax });
            if (!rl.success) {
                // Add CORS headers to rate limit responses too
                const resp = rateLimitResponse(rl.resetMs);
                const corsHeaders = getCorsHeaders(origin);
                const newResp = new Response(resp.body, {
                    status: resp.status,
                    headers: { ...Object.fromEntries(resp.headers.entries()), ...corsHeaders },
                });
                return newResp;
            }

            // API key authentication
            const auth = await validateApiKey(request);
            if (!auth) {
                return addCorsHeaders(unauthorizedResponse(), origin);
            }

            // Scope validation
            if (!hasScope(auth.scopes, scope)) {
                return addCorsHeaders(forbiddenResponse(scope), origin);
            }

            // Execute handler
            const response = await handler({
                tenantId: auth.tenantId,
                scopes: auth.scopes,
                request,
            });

            return addCorsHeaders(response, origin);
        } catch (error) {
            console.error(`[${endpoint}] error:`, error);
            const resp = NextResponse.json(
                { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
                { status: 500 }
            );
            return addCorsHeaders(resp, origin);
        }
    };
}

/**
 * Create a CORS preflight handler for v1 routes.
 * This does NOT require authentication — browsers never send
 * custom headers (like X-API-Key) on OPTIONS requests.
 */
export function createV1Options() {
    return async function (request: NextRequest): Promise<NextResponse> {
        const origin = request.headers.get('origin');
        return handlePreflight(origin);
    };
}

/** Helper: add CORS headers to any response */
function addCorsHeaders(response: NextResponse, origin: string | null): NextResponse {
    const corsHeaders = getCorsHeaders(origin);
    for (const [key, value] of Object.entries(corsHeaders)) {
        response.headers.set(key, value);
    }
    return response;
}

