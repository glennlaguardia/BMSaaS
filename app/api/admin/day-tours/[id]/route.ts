import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const dayTourStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'paid', 'completed', 'cancelled', 'no_show', 'expired']).optional(),
  payment_status: z.enum(['unpaid', 'pending_verification', 'paid', 'refunded']).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const supabase = createAdminClient();

    const { data: booking, error } = await supabase
      .from('day_tour_bookings')
      .select('*, day_tour_booking_addons(addon_id, quantity, unit_price, addons(name))')
      .eq('tenant_id', session.tenant_id)
      .eq('id', params.id)
      .single();

    if (error || !booking) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const addons =
      (booking.day_tour_booking_addons || []).map((row: { addon_id: string; quantity: number; unit_price: number; addons?: { name: string } }) => ({
        addon_id: row.addon_id,
        quantity: row.quantity,
        unit_price: row.unit_price,
        name: row.addons?.name ?? 'Addon',
      })) ?? [];

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { day_tour_booking_addons: _dtAddons, ...rest } = booking;

    return NextResponse.json({
      success: true,
      data: {
        ...rest,
        addons,
      },
    });
  } catch (error) {
    console.error('[admin/day-tours/:id] GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const parsed = dayTourStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid input', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.status) updates.status = parsed.data.status;
    if (parsed.data.payment_status) updates.payment_status = parsed.data.payment_status;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: 'No updates provided' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from('day_tour_bookings')
      .update(updates)
      .eq('tenant_id', session.tenant_id)
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[admin/day-tours/:id] PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

