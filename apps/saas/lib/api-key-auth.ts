import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import bcrypt from 'bcryptjs';

/**
 * API Key Authentication for /api/v1/* routes.
 *
 * External client websites authenticate via `X-API-Key` header.
 * Keys are stored as bcrypt hashes in the `api_keys` table.
 * On success, returns the tenant_id associated with the key.
 */

interface ApiKeyResult {
    tenantId: string;
    scopes: string[];
}

/**
 * Validate an API key from the request header.
 * Returns the tenant ID and scopes if valid, or null.
 */
export async function validateApiKey(request: NextRequest): Promise<ApiKeyResult | null> {
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) return null;

    // Extract prefix for quick lookup (first 12 chars: "sk_live_xxxx")
    const prefix = apiKey.slice(0, 12);

    const supabase = createAdminClient();
    const { data: keys, error } = await supabase
        .from('api_keys')
        .select('id, tenant_id, key_hash, scopes, is_active, expires_at')
        .eq('key_prefix', prefix)
        .eq('is_active', true);

    if (error || !keys || keys.length === 0) return null;

    // Check each matching key (usually just one)
    for (const key of keys) {
        // Check expiration
        if (key.expires_at && new Date(key.expires_at) < new Date()) {
            continue;
        }

        // Verify the full key against the hash
        const isValid = await bcrypt.compare(apiKey, key.key_hash);
        if (isValid) {
            // Update last_used timestamp (fire and forget)
            supabase
                .from('api_keys')
                .update({ last_used: new Date().toISOString() })
                .eq('id', key.id)
                .then(() => { });

            return {
                tenantId: key.tenant_id,
                scopes: key.scopes || ['read'],
            };
        }
    }

    return null;
}

/**
 * Check if the API key has the required scope.
 */
export function hasScope(scopes: string[], required: string): boolean {
    return scopes.includes(required) || scopes.includes('*');
}

/**
 * Standard 401 response for missing/invalid API key.
 */
export function unauthorizedResponse(): NextResponse {
    return NextResponse.json(
        { success: false, error: 'Invalid or missing API key', code: 'UNAUTHORIZED' },
        { status: 401 }
    );
}

/**
 * Standard 403 response for insufficient scopes.
 */
export function forbiddenResponse(requiredScope: string): NextResponse {
    return NextResponse.json(
        { success: false, error: `Insufficient permissions. Required scope: ${requiredScope}`, code: 'FORBIDDEN' },
        { status: 403 }
    );
}
