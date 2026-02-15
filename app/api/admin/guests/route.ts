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
    const search = searchParams.get('search') || '';
    const sort_by = searchParams.get('sort_by') || 'last_visit';
    const sort_order = searchParams.get('sort_order') || 'desc';
    const min_bookings = searchParams.get('min_bookings');
    const min_spent = searchParams.get('min_spent');

    // Map sort_by to actual column names
    const sortColumnMap: Record<string, string> = {
      name: 'first_name',
      total_bookings: 'total_bookings',
      total_spent: 'total_spent',
      last_visit: 'last_visit',
    };
    const sortColumn = sortColumnMap[sort_by] || 'last_visit';
    const ascending = sort_order === 'asc';

    const supabase = createAdminClient();
    let query = supabase
      .from('guests')
      .select('*', { count: 'exact' })
      .eq('tenant_id', session.tenant_id);

    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    if (min_bookings) {
      query = query.gte('total_bookings', parseInt(min_bookings));
    }

    if (min_spent) {
      query = query.gte('total_spent', parseFloat(min_spent));
    }

    const { data, error, count } = await query
      .order(sortColumn, { ascending })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, limit, total: count || 0 },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
