import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { createBookingSchema } from '@/lib/validations';

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
      p_base_amount: body.base_amount || 0,
      p_pax_surcharge: body.pax_surcharge || 0,
      p_addons_amount: body.addons_amount || 0,
      p_discount_amount: body.discount_amount || 0,
      p_total_amount: body.total_amount || 0,
      p_source: data.source || 'manual',
      p_created_by: session.admin_user_id,
      p_addon_ids: data.addon_ids || [],
      p_addon_quantities: data.addon_quantities || data.addon_ids?.map(() => 1) || [],
      p_addon_prices: body.addon_prices || [],
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
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    const supabase = createAdminClient();
    let query = supabase
      .from('bookings')
      .select('*, rooms(name), accommodation_types(name)', { count: 'exact' })
      .eq('tenant_id', session.tenant_id)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`reference_number.ilike.%${search}%,guest_email.ilike.%${search}%,guest_first_name.ilike.%${search}%,guest_last_name.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, limit, total: count || 0 },
    });
  } catch (error) {
    console.error('[admin/bookings] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
