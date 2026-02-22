/**
 * Direct Supabase data access for the web app.
 *
 * Queries the database directly using the anon key + RLS,
 * eliminating the dependency on the SaaS v1 API and API keys.
 *
 * Usage (in a Server Component):
 *   const tenant = await api.getTenant();
 *   const types = await api.getAccommodationTypes();
 */

import { createWebClient } from '@/lib/supabase';
import type {
    Tenant,
    AccommodationType,
    Testimonial,
    WebsiteSection,
} from '@budabook/types';

// Tenant slug configured per deployment
const TENANT_SLUG = process.env.TENANT_SLUG || process.env.DEFAULT_TENANT_SLUG || 'taglucop';

// ── Internal helpers ────────────────────────────────────────────────

async function getTenantId(): Promise<string | null> {
    const supabase = createWebClient();
    const { data } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', TENANT_SLUG)
        .eq('is_active', true)
        .single();
    return data?.id ?? null;
}

// ── Public API ──────────────────────────────────────────────────────

export const api = {
    /** Fetch tenant details */
    async getTenant(): Promise<Tenant | null> {
        const supabase = createWebClient();
        const { data, error } = await supabase
            .from('tenants')
            .select('*')
            .eq('slug', TENANT_SLUG)
            .eq('is_active', true)
            .single();

        if (error || !data) return null;
        return data as Tenant;
    },

    /** Fetch visible website sections for this tenant */
    async getSections(): Promise<WebsiteSection[]> {
        const tenantId = await getTenantId();
        if (!tenantId) return [];

        const supabase = createWebClient();
        const { data, error } = await supabase
            .from('website_sections')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('is_visible', true)
            .order('sort_order', { ascending: true });

        if (error || !data) return [];
        return data as WebsiteSection[];
    },

    /** Fetch active accommodation types for this tenant */
    async getAccommodationTypes(): Promise<AccommodationType[]> {
        const tenantId = await getTenantId();
        if (!tenantId) return [];

        const supabase = createWebClient();
        const { data, error } = await supabase
            .from('accommodation_types')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error || !data) return [];
        return data as AccommodationType[];
    },

    /** Fetch featured testimonials for this tenant */
    async getTestimonials(): Promise<Testimonial[]> {
        const tenantId = await getTenantId();
        if (!tenantId) return [];

        const supabase = createWebClient();
        const { data, error } = await supabase
            .from('testimonials')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('is_featured', true)
            .order('created_at', { ascending: false })
            .limit(6);

        if (error || !data) return [];
        return data as Testimonial[];
    },

    /** Fetch active rate adjustments for this tenant (current date range) */
    async getRateAdjustments(): Promise<{ id: string; name: string; start_date: string; end_date: string; adjustment_type: string; adjustment_value: number; applies_to: string }[]> {
        const tenantId = await getTenantId();
        if (!tenantId) return [];

        const today = new Date().toISOString().split('T')[0];
        const supabase = createWebClient();
        const { data, error } = await supabase
            .from('rate_adjustments')
            .select('id, name, start_date, end_date, adjustment_type, adjustment_value, applies_to')
            .eq('tenant_id', tenantId)
            .eq('is_active', true)
            .lte('start_date', today)
            .gte('end_date', today);

        if (error || !data) return [];
        return data;
    },
};
