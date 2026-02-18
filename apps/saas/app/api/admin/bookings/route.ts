import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { createBookingSchema, bookingFilterSchema } from '@/lib/validations';
import { sanitizeSearchInput } from '@/lib/sanitize';

// ---- POST: Admin creates a manual booking ----
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Use the same validation, but allow manual sources
    const parsed = createBookingSchema.safeParse({
      ...body,
      source: body.source || 'manual',
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid booking data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const supabase = createAdminClient();

    const result = await supabase.rpc('create_booking', {
      p_tenant_id: session.tenant_id,
      p_room_id: data.room_id,
      p_accommodation_type_id: data.accommodation_type_id,
      p_check_in: data.check_in_date,
      p_check_out: data.check_out_date,
      p_num_adults: data.num_adults,
      p_num_children: data.num_children,
      p_guest_first_name: data.guest_first_name,
      p_guest_last_name: data.guest_last_name,
      p_guest_email: data.guest_email,
      p_guest_phone: data.guest_phone,
      p_special_requests: data.special_requests || null,
      p_base_amount: data.base_amount,
      p_pax_surcharge: data.pax_surcharge,
      p_addons_amount: data.addons_amount,
      p_discount_amount: data.discount_amount,
      p_total_amount: data.total_amount,
      p_source: data.source || 'manual',
      p_created_by: session.admin_user_id,
      p_addon_ids: data.addon_ids || [],
      p_addon_quantities: data.addon_quantities || data.addon_ids?.map(() => 1) || [],
      p_addon_prices: data.addon_prices || [],
    });

    if (result.error) {
      return NextResponse.json({ success: false, error: result.error.message }, { status: 400 });
    }

    const bookingResult = result.data;
    if (!bookingResult?.success) {
      return NextResponse.json(
        { success: false, error: bookingResult?.error || 'Booking failed' },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        booking_id: bookingResult.booking_id,
        reference_number: bookingResult.reference_number,
      },
    });
  } catch (error) {
    console.error('[admin/bookings] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// ---- GET: List bookings ----
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = bookingFilterSchema.safeParse({
      status: searchParams.get('status') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      booking_group_id: searchParams.get('booking_group_id') ?? undefined,
      from_date: searchParams.get('from_date') ?? undefined,
      to_date: searchParams.get('to_date') ?? undefined,
      sort_by: searchParams.get('sort_by') ?? undefined,
      sort_order: searchParams.get('sort_order') ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid query parameters', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const filters = parsed.data;
    const { status, page, limit, search, from_date, to_date, sort_by, sort_order } = filters;

    const supabase = createAdminClient();
    let query = supabase
      .from('bookings')
      .select('*, rooms(name), accommodation_types(name), booking_groups(group_reference_number, total_amount)', { count: 'exact' })
      .eq('tenant_id', session.tenant_id);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      const safe = sanitizeSearchInput(search);
      if (safe) {
        query = query.or(`reference_number.ilike.%${safe}%,guest_email.ilike.%${safe}%,guest_first_name.ilike.%${safe}%,guest_last_name.ilike.%${safe}%`);
      }
    }

    if (filters.booking_group_id) {
      query = query.eq('booking_group_id', filters.booking_group_id);
    }

    // Date range filters on check_in_date
    if (from_date) {
      query = query.gte('check_in_date', from_date);
    }
    if (to_date) {
      query = query.lte('check_in_date', to_date);
    }

    // Sorting: status_priority puts active bookings first, completed/cancelled at end
    if (sort_by === 'status_priority') {
      // Active-first: pending, confirmed, checked_in come first; then paid; then checked_out, completed, cancelled, expired, no_show
      // We use a raw order trick: order by check_in_date ascending so upcoming bookings appear first,
      // then client-side the UI also groups by status priority.
      // Supabase doesn't support CASE expressions in .order(), so we use a secondary column sort:
      // We order by status (alphabetical puts cancelled/checked_out/expired last) then by check_in_date ascending.
      query = query
        .order('check_in_date', { ascending: true });
    } else if (sort_by === 'check_in_date') {
      query = query.order('check_in_date', { ascending: sort_order === 'asc' });
    } else {
      query = query.order('created_at', { ascending: sort_order === 'asc' });
    }

    query = query.range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // When sorting by status_priority, sort server-side results so active bookings come first
    let sortedData = data ?? [];
    if (sort_by === 'status_priority' && sortedData.length > 0) {
      const statusPriority: Record<string, number> = {
        pending: 0,
        confirmed: 1,
        checked_in: 2,
        paid: 3,
        checked_out: 4,
        completed: 5,
        cancelled: 6,
        expired: 7,
        no_show: 8,
      };
      sortedData = [...sortedData].sort((a, b) => {
        const pa = statusPriority[a.status] ?? 9;
        const pb = statusPriority[b.status] ?? 9;
        if (pa !== pb) return pa - pb;
        // Secondary sort: soonest check-in first
        return (a.check_in_date ?? '').localeCompare(b.check_in_date ?? '');
      });
    }

    return NextResponse.json({
      success: true,
      data: sortedData,
      pagination: { page, limit, total: count || 0 },
    });
  } catch (error) {
    console.error('[admin/bookings] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
