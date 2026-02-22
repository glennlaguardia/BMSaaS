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

    const { data: group, error: groupError } = await supabase
      .from('booking_groups')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', session.tenant_id)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 });
    }

    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*, rooms(name), accommodation_types(name)')
      .eq('booking_group_id', id)
      .eq('tenant_id', session.tenant_id)
      .order('check_in_date', { ascending: true });

    if (bookingsError) throw bookingsError;

    return NextResponse.json({ success: true, data: { group, bookings: bookings ?? [] } });
  } catch (error) {
    console.error('[admin/booking-groups/[id]] GET error:', error);
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

    const { id: groupId } = await params;
    const supabase = createAdminClient();

    const { data: group } = await supabase
      .from('booking_groups')
      .select('id')
      .eq('id', groupId)
      .eq('tenant_id', session.tenant_id)
      .single();

    if (!group) {
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 });
    }

    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, status, payment_status')
      .eq('booking_group_id', groupId)
      .eq('tenant_id', session.tenant_id);

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ success: false, error: 'No bookings in group' }, { status: 404 });
    }

    const body = await request.json();

    if (body.status !== undefined) {
      const parsed = updateBookingStatusSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
      }

      for (const b of bookings) {
        const updateData: Record<string, unknown> = { status: parsed.data.status };
        if (parsed.data.status === 'cancelled') {
          updateData.cancelled_at = new Date().toISOString();
          updateData.cancellation_reason = parsed.data.cancellation_reason ?? null;
        }
        if (parsed.data.status === 'checked_in') updateData.checked_in_at = new Date().toISOString();
        if (parsed.data.status === 'checked_out') updateData.checked_out_at = new Date().toISOString();

        const { error: statusErr } = await supabase.from('bookings').update(updateData).eq('id', b.id);
        if (statusErr) throw statusErr;

        const { error: logErr } = await supabase.from('booking_status_log').insert({
          tenant_id: session.tenant_id,
          booking_id: b.id,
          booking_type: 'overnight',
          field_changed: 'status',
          old_value: b.status ?? null,
          new_value: parsed.data.status,
          changed_by: session.admin_user_id,
          change_source: 'admin',
          notes: parsed.data.notes ?? null,
        });
        if (logErr) console.error('[admin/booking-groups/[id]] status log error:', logErr);
      }
    }

    if (body.payment_status !== undefined) {
      const parsed = updatePaymentStatusSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: 'Invalid payment status' }, { status: 400 });
      }

      for (const b of bookings) {
        const updateData: Record<string, unknown> = { payment_status: parsed.data.payment_status };
        if (parsed.data.payment_method) updateData.payment_method = parsed.data.payment_method;
        if (parsed.data.payment_reference) updateData.payment_reference = parsed.data.payment_reference;
        if (parsed.data.payment_status === 'paid') updateData.paid_at = new Date().toISOString();

        const { error: payErr } = await supabase.from('bookings').update(updateData).eq('id', b.id);
        if (payErr) throw payErr;

        const { error: payLogErr } = await supabase.from('booking_status_log').insert({
          tenant_id: session.tenant_id,
          booking_id: b.id,
          booking_type: 'overnight',
          field_changed: 'payment_status',
          old_value: b.payment_status ?? null,
          new_value: parsed.data.payment_status,
          changed_by: session.admin_user_id,
          change_source: 'admin',
          notes: parsed.data.notes ?? null,
        });
        if (payLogErr) console.error('[admin/booking-groups/[id]] payment log error:', payLogErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[admin/booking-groups/[id]] PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
