import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { updateBookingStatusSchema, updatePaymentStatusSchema } from '@/lib/validations';
import { sendBookingConfirmation, sendCancellationNotice } from '@/lib/email';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ success: false, error: 'Invalid booking ID' }, { status: 400 });
    }
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
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ success: false, error: 'Invalid booking ID' }, { status: 400 });
    }
    const body = await request.json();
    const supabase = createAdminClient();

    // Handle mark-as-read (lightweight, no status logging)
    if (body.mark_read === true) {
      const { error: readErr } = await supabase
        .from('bookings')
        .update({ is_read: true })
        .eq('id', id)
        .eq('tenant_id', session.tenant_id);
      if (readErr) throw readErr;
      return NextResponse.json({ success: true });
    }

    // Determine if this is a status or payment_status update
    if (body.status) {
      const parsed = updateBookingStatusSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
      }

      // Get current booking
      const { data: booking } = await supabase
        .from('bookings')
        .select('status, reference_number, guest_first_name, guest_last_name, guest_email, check_in_date, check_out_date, total_amount, rooms(name), accommodation_types(name), tenants(name)')
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

      // Fire-and-forget emails based on the new status
      const tenantRec = booking.tenants as unknown as { name: string } | null;
      const roomRec = booking.rooms as unknown as { name: string } | null;
      const accomRec = booking.accommodation_types as unknown as { name: string } | null;

      if (parsed.data.status === 'confirmed') {
        sendBookingConfirmation({
          guestName: `${booking.guest_first_name} ${booking.guest_last_name}`,
          guestEmail: booking.guest_email,
          referenceNumber: booking.reference_number,
          accommodationName: accomRec?.name || 'N/A',
          roomName: roomRec?.name || 'N/A',
          checkInDate: booking.check_in_date,
          checkOutDate: booking.check_out_date,
          totalAmount: `₱${Number(booking.total_amount).toLocaleString()}`,
          tenantName: tenantRec?.name || 'Resort',
        }).catch(err => console.error('[Email] confirmation error:', err));
      } else if (parsed.data.status === 'cancelled') {
        sendCancellationNotice({
          guestName: `${booking.guest_first_name} ${booking.guest_last_name}`,
          guestEmail: booking.guest_email,
          referenceNumber: booking.reference_number,
          reason: parsed.data.cancellation_reason || undefined,
          tenantName: tenantRec?.name || 'Resort',
        }).catch(err => console.error('[Email] cancellation error:', err));
      }

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
