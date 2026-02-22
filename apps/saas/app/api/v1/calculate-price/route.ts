import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createV1Handler, createV1Options } from '@/lib/v1-handler';
import { calculatePriceSchema } from '@/lib/validations';
import { calculatePrice } from '@/lib/pricing';
import type { Addon } from '@/types';

export const POST = createV1Handler(
    { endpoint: 'v1/calculate-price', rateMax: 60, rateWindowMs: 60_000 },
    async ({ tenantId, request }) => {
        const body = await request.json();
        const parsed = calculatePriceSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: 'Invalid input', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { check_in_date, check_out_date, num_adults, num_children, accommodation_type_id, addon_ids, addon_quantities } = parsed.data;

        const supabase = createAdminClient();

        // Fetch accommodation type
        const { data: type, error: typeError } = await supabase
            .from('accommodation_types')
            .select('*')
            .eq('id', accommodation_type_id)
            .eq('tenant_id', tenantId)
            .eq('is_active', true)
            .single();

        if (typeError || !type) {
            return NextResponse.json(
                { success: false, error: 'Accommodation type not found', code: 'NOT_FOUND' },
                { status: 404 }
            );
        }

        // Fetch active rate adjustments
        const { data: adjustments } = await supabase
            .from('rate_adjustments')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('is_active', true);

        // Fetch selected addons
        let selectedAddons: { addon: Addon; quantity: number }[] = [];
        if (addon_ids && addon_ids.length > 0) {
            const { data: addons } = await supabase
                .from('addons')
                .select('*')
                .in('id', addon_ids)
                .eq('tenant_id', tenantId)
                .eq('is_active', true);

            if (addons) {
                selectedAddons = addon_ids.map((id: string, i: number) => {
                    const addon = addons.find(a => a.id === id);
                    return addon ? { addon, quantity: addon_quantities?.[i] || 1 } : null;
                }).filter(Boolean) as { addon: Addon; quantity: number }[];
            }
        }

        const result = calculatePrice(
            check_in_date,
            check_out_date,
            num_adults,
            num_children,
            type,
            adjustments || [],
            selectedAddons
        );

        return NextResponse.json({ success: true, data: result });
    }
);

export const OPTIONS = createV1Options();
