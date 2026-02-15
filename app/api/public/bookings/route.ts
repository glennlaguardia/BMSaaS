import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/tenant';
import { createAdminClient } from '@/lib/supabase/admin';
import { createBookingSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await request.json();

    // Debug log to diagnose UUID issues
    console.log('[Booking] Received payload:', JSON.stringify({
      room_id: body.room_id,
      accommodation_type_id: body.accommodation_type_id,
      addon_ids: body.addon_ids,
    }));

    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      console.log('[Booking] Validation failed:', JSON.stringify(parsed.error.flatten()));
      return NextResponse.json(
        { success: false, error: 'Invalid booking data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const supabase = createAdminClient();

    // Calculate the actual price server-side (prevent tampering)
    // For now use the client-provided amounts — in production, re-calculate server-side
    const result = await supabase.rpc('create_booking', {
      p_tenant_id: tenantId,
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
      p_source: data.source || 'online',
      p_created_by: null,
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
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
