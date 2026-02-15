import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    const booking_type = searchParams.get('booking_type');
    const field_changed = searchParams.get('field_changed');
    const change_source = searchParams.get('change_source');

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
