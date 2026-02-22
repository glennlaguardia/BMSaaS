import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { updateVoucherSchema } from '@/lib/validations';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        if (!UUID_RE.test(id)) {
            return NextResponse.json({ success: false, error: 'Invalid voucher ID' }, { status: 400 });
        }

        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('vouchers')
            .select('*')
            .eq('id', id)
            .eq('tenant_id', session.tenant_id)
            .single();

        if (error || !data) {
            return NextResponse.json({ success: false, error: 'Voucher not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('[admin/vouchers/[id]] GET error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        if (!UUID_RE.test(id)) {
            return NextResponse.json({ success: false, error: 'Invalid voucher ID' }, { status: 400 });
        }

        const body = await request.json();
        const parsed = updateVoucherSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
        }

        const supabase = createAdminClient();

        // If code is being changed, check for duplicates
        if (parsed.data.code) {
            const { data: existing } = await supabase
                .from('vouchers')
                .select('id')
                .eq('tenant_id', session.tenant_id)
                .eq('code', parsed.data.code)
                .neq('id', id)
                .maybeSingle();

            if (existing) {
                return NextResponse.json({ success: false, error: 'A voucher with this code already exists' }, { status: 409 });
            }
        }

        const { data, error } = await supabase
            .from('vouchers')
            .update(parsed.data)
            .eq('id', id)
            .eq('tenant_id', session.tenant_id)
            .select()
            .single();

        if (error || !data) {
            return NextResponse.json({ success: false, error: 'Voucher not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('[admin/vouchers/[id]] PATCH error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        if (!UUID_RE.test(id)) {
            return NextResponse.json({ success: false, error: 'Invalid voucher ID' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Soft delete: deactivate
        const { data, error } = await supabase
            .from('vouchers')
            .update({ is_active: false })
            .eq('id', id)
            .eq('tenant_id', session.tenant_id)
            .select()
            .single();

        if (error || !data) {
            return NextResponse.json({ success: false, error: 'Voucher not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('[admin/vouchers/[id]] DELETE error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
