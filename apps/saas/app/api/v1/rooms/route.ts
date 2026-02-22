import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createV1Handler, createV1Options } from '@/lib/v1-handler';

export const GET = createV1Handler(
    { endpoint: 'v1/rooms' },
    async ({ tenantId, request }) => {
        const typeId = new URL(request.url).searchParams.get('type_id');

        const supabase = createAdminClient();
        let query = supabase
            .from('rooms')
            .select('*, accommodation_type:accommodation_types(*)')
            .eq('tenant_id', tenantId)
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (typeId) {
            query = query.eq('accommodation_type_id', typeId);
        }

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json({ success: true, data });
    }
);

export const OPTIONS = createV1Options();
