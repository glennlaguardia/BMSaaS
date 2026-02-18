import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/tenant';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/get-ip';
import { publicDateRangeSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    // Rate limit: 120 requests per minute per IP
    const ip = getClientIp(request);
    const rl = rateLimit(ip, 'public/rooms', { windowMs: 60_000, max: 120 });
    if (!rl.success) return rateLimitResponse(rl.resetMs);

    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const roomParams = publicDateRangeSchema.safeParse({
      type_id: searchParams.get('type_id') ?? undefined,
      type_ids: searchParams.get('type_ids') ?? undefined,
      check_in: searchParams.get('check_in') ?? undefined,
      check_out: searchParams.get('check_out') ?? undefined,
    });
    if (!roomParams.success) {
      return NextResponse.json({ success: false, error: 'Invalid query parameters' }, { status: 400 });
    }
    const typeId = roomParams.data.type_id ?? null;
    const typeIdsParam = roomParams.data.type_ids ?? null;
    const checkIn = roomParams.data.check_in ?? null;
    const checkOut = roomParams.data.check_out ?? null;

    if (!typeId && !typeIdsParam) {
      return NextResponse.json({ success: false, error: 'type_id or type_ids required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get all active rooms for this type
    let query = supabase
      .from('rooms')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (typeIdsParam) {
      const typeIds = typeIdsParam.split(',').map(id => id.trim()).filter(Boolean);
      if (typeIds.length > 0) {
        query = query.in('accommodation_type_id', typeIds);
      }
    } else if (typeId) {
      query = query.eq('accommodation_type_id', typeId);
    }

    const { data: rooms, error } = await query;

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
