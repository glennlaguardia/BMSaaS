import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createV1Handler } from '@/lib/v1-handler';

export const GET = createV1Handler(
    { endpoint: 'v1/rate-adjustments' },
    async ({ tenantId }) => {
        const supabase = createAdminClient();
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('rate_adjustments')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('is_active', true)
            .lte('start_date', today)
            .gte('end_date', today);

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    }
);

export const OPTIONS = createV1Handler(
    { endpoint: 'v1/rate-adjustments' },
    async () => new NextResponse(null, { status: 204 })
);
