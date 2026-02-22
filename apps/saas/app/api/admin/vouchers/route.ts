import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { createVoucherSchema, voucherFilterSchema } from '@/lib/validations';
import { sanitizeSearchInput } from '@/lib/sanitize';

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const supabase = createAdminClient();
        const { searchParams } = new URL(request.url);
        const parsed = voucherFilterSchema.safeParse({
            search: searchParams.get('search') ?? undefined,
            status: searchParams.get('status') ?? undefined,
            page: searchParams.get('page') ?? undefined,
            limit: searchParams.get('limit') ?? undefined,
        });
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: 'Invalid query parameters', details: parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { search, status, page, limit } = parsed.data;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('vouchers')
            .select('*', { count: 'exact' })
            .eq('tenant_id', session.tenant_id);

        if (status === 'active') {
            query = query.eq('is_active', true);
        } else if (status === 'inactive') {
            query = query.eq('is_active', false);
        } else if (status === 'expired') {
            query = query.lt('valid_until', new Date().toISOString().split('T')[0]);
        }

        if (search) {
            const safe = sanitizeSearchInput(search);
            if (safe) {
                const like = `%${safe}%`;
                query = query.or(`code.ilike.${like},description.ilike.${like}`);
            }
        }

        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) throw error;

        return NextResponse.json({
            success: true,
            data,
            pagination: { page, limit, total: count ?? 0 },
        });
    } catch (error) {
        console.error('[admin/vouchers] error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const parsed = createVoucherSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Check for duplicate code within tenant
        const { data: existing } = await supabase
            .from('vouchers')
            .select('id')
            .eq('tenant_id', session.tenant_id)
            .eq('code', parsed.data.code)
            .maybeSingle();

        if (existing) {
            return NextResponse.json({ success: false, error: 'A voucher with this code already exists' }, { status: 409 });
        }

        const { data, error } = await supabase
            .from('vouchers')
            .insert({ ...parsed.data, tenant_id: session.tenant_id })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error) {
        console.error('[admin/vouchers] POST error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
