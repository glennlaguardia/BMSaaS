import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { sanitizeSearchInput } from '@/lib/sanitize';
import { dayTourFilterSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const supabase = createAdminClient();

    const { searchParams } = new URL(request.url);
    const parsed = dayTourFilterSchema.safeParse({
      search: searchParams.get('search') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      from_date: searchParams.get('from_date') ?? undefined,
      to_date: searchParams.get('to_date') ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid query parameters', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const filters = parsed.data;
    const { search, status, page, limit, from_date: fromDate, to_date: toDate } = filters;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('day_tour_bookings')
      .select('*', { count: 'exact' })
      .eq('tenant_id', session.tenant_id);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (fromDate) {
      query = query.gte('tour_date', fromDate);
    }
    if (toDate) {
      query = query.lte('tour_date', toDate);
    }

    if (search) {
      const safe = sanitizeSearchInput(search);
      if (safe) {
        const like = `%${safe}%`;
        query = query.or(
          `reference_number.ilike.${like},guest_first_name.ilike.${like},guest_last_name.ilike.${like},guest_email.ilike.${like}`
        );
      }
    }

    query = query
      .order('tour_date', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count ?? 0,
      },
    });
  } catch (error) {
    console.error('[admin/day-tours] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
