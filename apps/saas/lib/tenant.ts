import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Tenant } from '@/types';

/**
 * Resolve the current tenant from the request.
 * 
 * Strategy:
 * 1. Check for ?tenant= query parameter (dev mode)
 * 2. Check subdomain from Host header (production)
 * 3. Default to 'taglucop' in development
 */
export async function getTenantSlug(): Promise<string> {
    const headersList = await headers();
    const host = headersList.get('host') || '';
    const url = headersList.get('x-url') || headersList.get('x-forwarded-url') || '';

    // Check query parameter first (development convenience)
    if (url) {
        try {
            const parsed = new URL(url, `http://${host}`);
            const tenantParam = parsed.searchParams.get('tenant');
            if (tenantParam) return tenantParam;
        } catch {
            // URL parsing failed, continue
        }
    }

    // Check subdomain
    const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'budabook.com';
    if (host.includes('.') && host.endsWith(appDomain)) {
        const subdomain = host.replace(`.${appDomain}`, '').split(':')[0];
        if (subdomain && subdomain !== 'www') return subdomain;
    }

    // Development fallback — in production, return empty to force 404
    if (process.env.NODE_ENV === 'development') {
        return process.env.DEFAULT_TENANT_SLUG || 'taglucop';
    }

    return '';
}

/**
 * Fetch the full tenant record from the database.
 */
export async function getTenant(): Promise<Tenant | null> {
    const slug = await getTenantSlug();
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

    if (error || !data) return null;
    return data as Tenant;
}

/**
 * Get tenant ID from slug. Used in API routes.
 */
export async function getTenantId(): Promise<string | null> {
    const tenant = await getTenant();
    return tenant?.id || null;
}
