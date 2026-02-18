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

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return handlePreflight(origin);
        }

        try {
            // Rate limiting
            const ip = getClientIp(request);
            const rl = rateLimit(ip, endpoint, { windowMs: rateWindowMs, max: rateMax });
            if (!rl.success) return rateLimitResponse(rl.resetMs);

            // API key authentication
            const auth = await validateApiKey(request);
            if (!auth) {
                return unauthorizedResponse();
            }

            // Scope validation
            if (!hasScope(auth.scopes, scope)) {
                return forbiddenResponse(scope);
            }

            // Execute handler
            const response = await handler({
                tenantId: auth.tenantId,
                scopes: auth.scopes,
                request,
            });

            // Add CORS headers
            const corsHeaders = getCorsHeaders(origin);
            for (const [key, value] of Object.entries(corsHeaders)) {
                response.headers.set(key, value);
            }

            return response;
        } catch (error) {
            console.error(`[${endpoint}] error:`, error);
            const resp = NextResponse.json(
                { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
                { status: 500 }
            );
            const corsHeaders = getCorsHeaders(origin);
            for (const [key, value] of Object.entries(corsHeaders)) {
                resp.headers.set(key, value);
            }
            return resp;
        }
    };
}
