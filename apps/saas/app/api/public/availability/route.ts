import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/tenant';
import { createAdminClient } from '@/lib/supabase/admin';
import { addDays, format, parseISO } from 'date-fns';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/get-ip';
import { publicDateRangeSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    // Rate limit: 120 requests per minute per IP
    const ip = getClientIp(request);
    const rl = rateLimit(ip, 'public/availability', { windowMs: 60_000, max: 120 });
    if (!rl.success) return rateLimitResponse(rl.resetMs);

    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const dateParams = publicDateRangeSchema.safeParse({
      start_date: searchParams.get('start_date') ?? undefined,
      end_date: searchParams.get('end_date') ?? undefined,
      type_id: searchParams.get('type_id') ?? undefined,
    });
    if (!dateParams.success) {
      return NextResponse.json({ success: false, error: 'Invalid query parameters' }, { status: 400 });
    }
    const startDate = dateParams.data.start_date ?? null;
    const endDate = dateParams.data.end_date ?? null;
    const typeId = dateParams.data.type_id ?? null;

    if (!startDate || !endDate) {
      return NextResponse.json({ success: false, error: 'start_date and end_date required' }, { status: 400 });
    }

    // Guard: max 90-day range to prevent DoS via expensive date-by-date loops
    const rangeMs = parseISO(endDate).getTime() - parseISO(startDate).getTime();
    const maxRangeMs = 90 * 24 * 60 * 60 * 1000; // 90 days
    if (rangeMs < 0 || rangeMs > maxRangeMs) {
      return NextResponse.json(
        { success: false, error: 'Date range must be between 1 and 90 days' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get total rooms for the type (or all types)
    let roomQuery = supabase
      .from('rooms')
      .select('id, accommodation_type_id')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (typeId) {
      roomQuery = roomQuery.eq('accommodation_type_id', typeId);
    }

    const { data: rooms } = await roomQuery;
    const totalRooms = rooms?.length || 0;
    const roomIds = rooms?.map(r => r.id) || [];

    // Get bookings that overlap the date range
    const { data: bookings } = await supabase
      .from('bookings')
      .select('room_id, check_in_date, check_out_date')
      .eq('tenant_id', tenantId)
      .in('room_id', roomIds.length > 0 ? roomIds : ['none'])
      .not('status', 'in', '("cancelled","expired","no_show")')
      .lte('check_in_date', endDate)
      .gte('check_out_date', startDate);

    // Build availability map date by date
    const availabilityMap: Record<string, { total_rooms: number; booked_rooms: number; status: string }> = {};
    let current = parseISO(startDate);
    const end = parseISO(endDate);

    while (current <= end) {
      const dateStr = format(current, 'yyyy-MM-dd');
      const bookedCount = (bookings || []).filter(b =>
        b.check_in_date <= dateStr && b.check_out_date > dateStr
      ).length;

      const available = totalRooms - bookedCount;
      let status = 'available';
      if (available === 0) status = 'full';
      else if (available <= Math.ceil(totalRooms * 0.3)) status = 'limited';

      availabilityMap[dateStr] = {
        total_rooms: totalRooms,
        booked_rooms: bookedCount,
        status,
      };

      current = addDays(current, 1);
    }

    return NextResponse.json({ success: true, data: availabilityMap });
  } catch (error) {
    console.error('[public/availability] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
