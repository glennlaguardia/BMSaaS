import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const period = request.nextUrl.searchParams.get('period') || '30';
    const days = parseInt(period, 10) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startISO = startDate.toISOString().split('T')[0];

    const supabase = createAdminClient();

    // Get all bookings for this period
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, status, total_amount, payment_status, created_at, check_in_date, check_out_date, accommodation_types(name)')
      .eq('tenant_id', session.tenant_id)
      .gte('created_at', startISO)
      .order('created_at', { ascending: true });

    // Get day tour bookings for this period
    const { data: dayTours } = await supabase
      .from('day_tour_bookings')
      .select('id, status, total_amount, payment_status, created_at, tour_date')
      .eq('tenant_id', session.tenant_id)
      .gte('created_at', startISO)
      .order('created_at', { ascending: true });

    const allBookings = bookings || [];
    const allDayTours = dayTours || [];

    // Summary stats
    const totalRevenue = allBookings
      .filter(b => ['confirmed', 'paid', 'checked_in', 'checked_out'].includes(b.status))
      .reduce((sum, b) => sum + (b.total_amount || 0), 0)
      + allDayTours
        .filter(d => ['confirmed', 'paid', 'completed'].includes(d.status))
        .reduce((sum, d) => sum + (d.total_amount || 0), 0);

    const confirmedBookings = allBookings.filter(b => !['cancelled', 'expired', 'no_show'].includes(b.status)).length;
    const cancelledBookings = allBookings.filter(b => b.status === 'cancelled').length;
    const paidBookings = allBookings.filter(b => b.payment_status === 'paid').length;
    const avgBookingValue = confirmedBookings > 0
      ? allBookings
        .filter(b => !['cancelled', 'expired', 'no_show'].includes(b.status))
        .reduce((sum, b) => sum + (b.total_amount || 0), 0) / confirmedBookings
      : 0;

    // Revenue by day for chart
    const revenueByDay: Record<string, number> = {};
    const bookingsByDay: Record<string, number> = {};
    for (const b of allBookings) {
      const day = b.created_at.split('T')[0];
      if (!['cancelled', 'expired', 'no_show'].includes(b.status)) {
        revenueByDay[day] = (revenueByDay[day] || 0) + (b.total_amount || 0);
        bookingsByDay[day] = (bookingsByDay[day] || 0) + 1;
      }
    }
    for (const d of allDayTours) {
      const day = d.created_at.split('T')[0];
      if (!['cancelled', 'expired'].includes(d.status)) {
        revenueByDay[day] = (revenueByDay[day] || 0) + (d.total_amount || 0);
      }
    }

    // Revenue by accommodation type
    const revenueByType: Record<string, number> = {};
    for (const b of allBookings) {
      if (!['cancelled', 'expired', 'no_show'].includes(b.status)) {
        const typeName = (b.accommodation_types as unknown as { name: string } | null)?.name || 'Unknown';
        revenueByType[typeName] = (revenueByType[typeName] || 0) + (b.total_amount || 0);
      }
    }

    // Status distribution
    const statusDist: Record<string, number> = {};
    for (const b of allBookings) {
      statusDist[b.status] = (statusDist[b.status] || 0) + 1;
    }

    // Build chart data arrays
    const chartDays: { date: string; revenue: number; bookings: number }[] = [];
    const current = new Date(startISO);
    const today = new Date();
    while (current <= today) {
      const key = current.toISOString().split('T')[0];
      chartDays.push({
        date: key,
        revenue: revenueByDay[key] || 0,
        bookings: bookingsByDay[key] || 0,
      });
      current.setDate(current.getDate() + 1);
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          confirmedBookings,
          cancelledBookings,
          paidBookings,
          avgBookingValue,
          totalDayTours: allDayTours.length,
        },
        charts: {
          revenueOverTime: chartDays,
          revenueByType: Object.entries(revenueByType).map(([name, value]) => ({ name, value })),
          statusDistribution: Object.entries(statusDist).map(([name, value]) => ({ name, value })),
        },
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
