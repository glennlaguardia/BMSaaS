import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createV1Handler } from '@/lib/v1-handler';

export const GET = createV1Handler(
    { endpoint: 'v1/testimonials' },
    async ({ tenantId }) => {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('testimonials')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('is_featured', true)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    }
);

export const OPTIONS = createV1Handler(
    { endpoint: 'v1/testimonials' },
    async () => new NextResponse(null, { status: 204 })
);
