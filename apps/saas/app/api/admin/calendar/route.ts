import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const month = request.nextUrl.searchParams.get('month');
    const year = request.nextUrl.searchParams.get('year');
    const now = new Date();
    const m = month ? parseInt(month) : now.getMonth() + 1;
    const y = year ? parseInt(year) : now.getFullYear();

    // Validate month/year are reasonable numbers
    if (isNaN(m) || isNaN(y) || m < 1 || m > 12 || y < 2020 || y > 2100) {
      return NextResponse.json({ success: false, error: 'Invalid month or year' }, { status: 400 });
    }

    // Start of month and end of month
    const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
    const endDate = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;

    const supabase = createAdminClient();

    // Get bookings that overlap with this month
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, reference_number, status, check_in_date, check_out_date, guest_first_name, guest_last_name, rooms(name), accommodation_types(name)')
      .eq('tenant_id', session.tenant_id)
      .not('status', 'in', '("cancelled","expired")')
      .lt('check_in_date', endDate)
      .gte('check_out_date', startDate);

    // Get day tours in this month
    const { data: dayTours } = await supabase
      .from('day_tour_bookings')
      .select('id, reference_number, status, tour_date, num_adults, num_children, guest_first_name, guest_last_name')
      .eq('tenant_id', session.tenant_id)
      .not('status', 'in', '("cancelled","expired")')
      .gte('tour_date', startDate)
      .lt('tour_date', endDate);

    return NextResponse.json({
      success: true,
      data: {
        bookings: bookings || [],
        dayTours: dayTours || [],
        month: m,
        year: y,
      },
    });
  } catch (error) {
    console.error('[admin/calendar] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
