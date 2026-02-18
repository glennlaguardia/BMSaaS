import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { updateBookingStatusSchema, updatePaymentStatusSchema } from '@/lib/validations';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('bookings')
      .select('*, rooms(name, view_description), accommodation_types(name), booking_addons(*, addons(name, price)), booking_status_log(*), booking_groups(group_reference_number, total_amount)')
      .eq('id', id)
      .eq('tenant_id', session.tenant_id)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[admin/bookings/[id]] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = createAdminClient();

    // Determine if this is a status or payment_status update
    if (body.status) {
      const parsed = updateBookingStatusSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
      }

      // Get current booking
      const { data: booking } = await supabase
        .from('bookings')
        .select('status')
        .eq('id', id)
        .eq('tenant_id', session.tenant_id)
        .single();

      if (!booking) {
        return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
      }

      const updateData: Record<string, unknown> = { status: parsed.data.status };
      if (parsed.data.status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
        updateData.cancellation_reason = parsed.data.cancellation_reason || null;
      }
      if (parsed.data.status === 'checked_in') updateData.checked_in_at = new Date().toISOString();
      if (parsed.data.status === 'checked_out') updateData.checked_out_at = new Date().toISOString();

      const { error: updateErr } = await supabase.from('bookings').update(updateData).eq('id', id);
      if (updateErr) throw updateErr;

      // Log the change
      const { error: logErr } = await supabase.from('booking_status_log').insert({
        tenant_id: session.tenant_id,
        booking_id: id,
        booking_type: 'overnight',
        field_changed: 'status',
        old_value: booking.status,
        new_value: parsed.data.status,
        changed_by: session.admin_user_id,
        change_source: 'admin',
        notes: parsed.data.notes || null,
      });
      if (logErr) console.error('[admin/bookings/[id]] status log error:', logErr);

    } else if (body.payment_status) {
      const parsed = updatePaymentStatusSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: 'Invalid payment status' }, { status: 400 });
      }

      const { data: booking } = await supabase
        .from('bookings')
        .select('payment_status')
        .eq('id', id)
        .eq('tenant_id', session.tenant_id)
        .single();

      if (!booking) {
        return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
      }

      const updateData: Record<string, unknown> = {
        payment_status: parsed.data.payment_status,
      };
      if (parsed.data.payment_method) updateData.payment_method = parsed.data.payment_method;
      if (parsed.data.payment_reference) updateData.payment_reference = parsed.data.payment_reference;
      if (parsed.data.payment_status === 'paid') updateData.paid_at = new Date().toISOString();

      const { error: payErr } = await supabase.from('bookings').update(updateData).eq('id', id);
      if (payErr) throw payErr;

      // Log the change
      const { error: payLogErr } = await supabase.from('booking_status_log').insert({
        tenant_id: session.tenant_id,
        booking_id: id,
        booking_type: 'overnight',
        field_changed: 'payment_status',
        old_value: booking.payment_status,
        new_value: parsed.data.payment_status,
        changed_by: session.admin_user_id,
        change_source: 'admin',
        notes: parsed.data.notes || null,
      });
      if (payLogErr) console.error('[admin/bookings/[id]] payment log error:', payLogErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[admin/bookings/[id]] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
