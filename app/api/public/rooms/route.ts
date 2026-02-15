import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/tenant';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const typeId = searchParams.get('type_id');
    const checkIn = searchParams.get('check_in');
    const checkOut = searchParams.get('check_out');

    if (!typeId) {
      return NextResponse.json({ success: false, error: 'type_id required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get all active rooms for this type
    const { data: rooms, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('accommodation_type_id', typeId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    // If dates provided, filter out booked rooms
    if (checkIn && checkOut && rooms) {
      const roomIds = rooms.map(r => r.id);
      const { data: bookings } = await supabase
        .from('bookings')
        .select('room_id')
        .eq('tenant_id', tenantId)
        .in('room_id', roomIds.length > 0 ? roomIds : ['none'])
        .not('status', 'in', '("cancelled","expired","no_show")')
        .lt('check_in_date', checkOut)
        .gt('check_out_date', checkIn);

      const bookedRoomIds = new Set((bookings || []).map(b => b.room_id));
      const availableRooms = rooms.map(room => ({
        ...room,
        is_available: !bookedRoomIds.has(room.id),
      }));

      return NextResponse.json({ success: true, data: availableRooms });
    }

    return NextResponse.json({ success: true, data: rooms });
  } catch (error) {
    console.error('[public/rooms] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
