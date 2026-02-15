import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/tenant';
import { createAdminClient } from '@/lib/supabase/admin';
import { createDayTourBookingSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createDayTourBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid booking data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const supabase = createAdminClient();

    // Calculate amounts server-side for security
    // TODO: fetch day tour pricing from DB when pricing table is ready
    const baseAmount = data.base_amount ?? 0;
    const addonsAmount = data.addons_amount ?? 0;
    const totalAmount = baseAmount + addonsAmount;

    // Insert the day tour booking (total_pax is a GENERATED column — do not include it)
    const { data: booking, error } = await supabase
      .from('day_tour_bookings')
      .insert({
        tenant_id: tenantId,
        tour_date: data.tour_date,
        num_adults: data.num_adults,
        num_children: data.num_children,
        guest_first_name: data.guest_first_name,
        guest_last_name: data.guest_last_name,
        guest_email: data.guest_email,
        guest_phone: data.guest_phone,
        special_requests: data.special_requests || null,
        base_amount: baseAmount,
        addons_amount: addonsAmount,
        total_amount: totalAmount,
        status: 'pending',
        payment_status: 'unpaid',
        source: 'online',
      })
      .select('id, reference_number')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: { booking_id: booking.id, reference_number: booking.reference_number },
    });
  } catch (error) {
    console.error('[day-tour-bookings] POST error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
