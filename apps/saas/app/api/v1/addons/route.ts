import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createV1Handler } from '@/lib/v1-handler';

export const GET = createV1Handler(
    { endpoint: 'v1/addons' },
    async ({ tenantId }) => {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('addons')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    }
);

export const OPTIONS = createV1Handler(
    { endpoint: 'v1/addons' },
    async () => new NextResponse(null, { status: 204 })
);
