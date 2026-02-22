import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/tenant';
import { createAdminClient } from '@/lib/supabase/admin';
import { createBookingSchema, createBookingGroupSchema } from '@/lib/validations';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/get-ip';
import { sendHandlerNotification } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 booking requests per hour per IP
    const ip = getClientIp(request);
    const rl = rateLimit(ip, 'public/bookings', { windowMs: 3_600_000, max: 10 });
    if (!rl.success) return rateLimitResponse(rl.resetMs);

    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await request.json();
    const supabase = createAdminClient();

    if (body.group_booking === true) {
      const groupParsed = createBookingGroupSchema.safeParse(body);
      if (!groupParsed.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid group booking data', details: groupParsed.error.flatten() },
          { status: 400 }
        );
      }
      const data = groupParsed.data;
      const roomsPayload = data.rooms.map(r => ({
        room_id: r.room_id,
        accommodation_type_id: r.accommodation_type_id,
        base_amount: r.base_amount,
        pax_surcharge: r.pax_surcharge,
        addons_amount: r.addons_amount,
        total_amount: r.total_amount,
        addon_ids: r.addon_ids || [],
        addon_quantities: r.addon_quantities || r.addon_ids?.map(() => 1) || [],
        addon_prices: r.addon_prices || [],
      }));
      const result = await supabase.rpc('create_booking_group_with_bookings', {
        p_tenant_id: tenantId,
        p_check_in: data.check_in_date,
        p_check_out: data.check_out_date,
        p_num_adults: data.num_adults,
        p_num_children: data.num_children,
        p_guest_first_name: data.guest_first_name,
        p_guest_last_name: data.guest_last_name,
        p_guest_email: data.guest_email,
        p_guest_phone: data.guest_phone,
        p_special_requests: data.special_requests || null,
        p_source: data.source || 'online',
        p_rooms: roomsPayload,
        p_food_restrictions: data.food_restrictions || null,
        p_voucher_code: data.voucher_code || null,
      });
      if (result.error) {
        return NextResponse.json({ success: false, error: result.error.message }, { status: 400 });
      }
      const groupResult = result.data as { success?: boolean; error?: string; group_id?: string; group_reference_number?: string };
      if (!groupResult?.success) {
        return NextResponse.json(
          { success: false, error: groupResult?.error || 'Group booking failed' },
          { status: 409 }
        );
      }
      return NextResponse.json({
        success: true,
        data: {
          group_id: groupResult.group_id,
          group_reference_number: groupResult.group_reference_number,
        },
      });
    }

    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid booking data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

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
      p_base_amount: data.base_amount,
      p_pax_surcharge: data.pax_surcharge,
      p_addons_amount: data.addons_amount,
      p_discount_amount: data.discount_amount,
      p_total_amount: data.total_amount,
      p_source: data.source || 'online',
      p_created_by: null,
      p_addon_ids: data.addon_ids || [],
      p_addon_quantities: data.addon_quantities || data.addon_ids?.map(() => 1) || [],
      p_addon_prices: data.addon_prices || [],
      p_food_restrictions: data.food_restrictions || null,
      p_voucher_code: data.voucher_code || null,
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

    // Fire-and-forget: send handler notification email to resort staff
    (async () => {
      try {
        // Fetch tenant notification_email, room name, and accommodation name
        const [tenantRes, roomRes, accomRes] = await Promise.all([
          supabase.from('tenants').select('name, notification_email').eq('id', tenantId).single(),
          supabase.from('rooms').select('name').eq('id', data.room_id).single(),
          supabase.from('accommodation_types').select('name').eq('id', data.accommodation_type_id).single(),
        ]);

        const handlerEmail = tenantRes.data?.notification_email;
        if (!handlerEmail) return; // Skip notification if no email configured

        await sendHandlerNotification({
          handlerEmail,
          guestName: `${data.guest_first_name} ${data.guest_last_name}`,
          referenceNumber: bookingResult.reference_number || 'N/A',
          accommodationName: accomRes.data?.name || 'N/A',
          roomName: roomRes.data?.name || 'N/A',
          checkInDate: data.check_in_date,
          checkOutDate: data.check_out_date,
          totalAmount: `₱${Number(data.total_amount).toLocaleString()}`,
          tenantName: tenantRes.data?.name || 'Resort',
        });
      } catch (err) {
        console.error('[Email] handler notification error:', err);
      }
    })();

    return NextResponse.json({
      success: true,
      data: {
        booking_id: bookingResult.booking_id,
        reference_number: bookingResult.reference_number,
      },
    });
  } catch (error) {
    console.error('[bookings] POST error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
