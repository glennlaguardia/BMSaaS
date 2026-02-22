import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { auditLogFilterSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = auditLogFilterSchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      start_date: searchParams.get('start_date') ?? undefined,
      end_date: searchParams.get('end_date') ?? undefined,
      booking_type: searchParams.get('booking_type') ?? undefined,
      field_changed: searchParams.get('field_changed') ?? undefined,
      change_source: searchParams.get('change_source') ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid query parameters', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const filters = parsed.data;
    const { page, limit, start_date, end_date, booking_type, field_changed, change_source } = filters;

    const supabase = createAdminClient();
    let query = supabase
      .from('booking_status_log')
      .select('*, admin_users(full_name, username)', { count: 'exact' })
      .eq('tenant_id', session.tenant_id);

    if (start_date) {
      query = query.gte('created_at', start_date);
    }

    if (end_date) {
      query = query.lte('created_at', end_date + 'T23:59:59');
    }

    if (booking_type) {
      query = query.eq('booking_type', booking_type);
    }

    if (field_changed) {
      query = query.eq('field_changed', field_changed);
    }

    if (change_source) {
      query = query.eq('change_source', change_source);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, limit, total: count || 0 },
    });
  } catch (error) {
    console.error('[admin/audit-log] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
