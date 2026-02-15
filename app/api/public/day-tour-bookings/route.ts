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

    // Insert the day tour booking directly
    const { data: booking, error } = await supabase
      .from('day_tour_bookings')
      .insert({
        tenant_id: tenantId,
        tour_date: data.tour_date,
        num_adults: data.num_adults,
        num_children: data.num_children,
        total_pax: data.num_adults + data.num_children,
        guest_first_name: data.guest_first_name,
        guest_last_name: data.guest_last_name,
        guest_email: data.guest_email,
        guest_phone: data.guest_phone,
        special_requests: data.special_requests || null,
        base_amount: body.base_amount || 0,
        addons_amount: body.addons_amount || 0,
        total_amount: body.total_amount || 0,
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
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
