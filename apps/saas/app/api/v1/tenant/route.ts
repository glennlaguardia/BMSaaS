import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createV1Handler, createV1Options } from '@/lib/v1-handler';

export const GET = createV1Handler(
    { endpoint: 'v1/tenant' },
    async ({ tenantId }) => {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', tenantId)
            .eq('is_active', true)
            .single();

        if (error || !data) {
            return NextResponse.json(
                { success: false, error: 'Tenant not found', code: 'NOT_FOUND' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data });
    }
);

export const OPTIONS = createV1Options();
