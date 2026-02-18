import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const tenantId = session.tenant_id;

    // Date calculations
    const today = new Date().toISOString().split('T')[0];
    const monthStart = today.slice(0, 7) + '-01';
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const sevenDaysLater = sevenDaysFromNow.toISOString().split('T')[0];

    // Run all queries in parallel
    const [
      todayCheckinsResult,
      activeBookingsResult,
      monthlyRevenueResult,
      totalGuestsResult,
      overlappingBookingsResult,
      totalRoomsResult,
      pendingPaymentsResult,
      recentBookingsResult,
      upcomingCheckinsResult,
    ] = await Promise.all([
      // 1. Today's check-ins
      supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('check_in_date', today)
        .in('status', ['confirmed', 'paid']),

      // 2. Active bookings
      supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .in('status', ['confirmed', 'paid', 'checked_in']),

      // 3. Monthly revenue (fetch total_amount for this month)
      supabase
        .from('bookings')
        .select('total_amount')
        .eq('tenant_id', tenantId)
        .gte('created_at', monthStart)
        .lt('created_at', today.slice(0, 7) === '12'
          ? `${parseInt(today.slice(0, 4)) + 1}-01-01`
          : `${today.slice(0, 4)}-${String(parseInt(today.slice(5, 7)) + 1).padStart(2, '0')}-01`
        ),

      // 4. Total distinct guests
      supabase
        .from('bookings')
        .select('guest_email')
        .eq('tenant_id', tenantId),

      // 5. Occupancy: bookings overlapping today → 7 days from now
      supabase
        .from('bookings')
        .select('room_id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .in('status', ['confirmed', 'paid', 'checked_in'])
        .lte('check_in_date', sevenDaysLater)
        .gte('check_out_date', today),

      // 6. Total rooms for this tenant
      supabase
        .from('rooms')
        .select('id, accommodation_types!inner(tenant_id)', { count: 'exact', head: true })
        .eq('accommodation_types.tenant_id', tenantId),

      // 7. Pending payments
      supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .in('payment_status', ['unpaid', 'pending_verification']),

      // 8. Recent bookings (latest 5)
      supabase
        .from('bookings')
        .select('id, reference_number, guest_first_name, guest_last_name, status, total_amount, created_at, accommodation_types(name)')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(5),

      // 9. Upcoming check-ins (next 5)
      supabase
        .from('bookings')
        .select('id, reference_number, guest_first_name, guest_last_name, check_in_date, check_out_date, status, rooms(name), accommodation_types(name)')
        .eq('tenant_id', tenantId)
        .gte('check_in_date', today)
        .in('status', ['confirmed', 'paid'])
        .order('check_in_date', { ascending: true })
        .limit(5),
    ]);

    // Calculate metrics
    const todayCheckins = todayCheckinsResult.count ?? 0;
    const activeBookings = activeBookingsResult.count ?? 0;

    const monthlyRevenue = (monthlyRevenueResult.data ?? []).reduce(
      (sum: number, b: { total_amount: number | null }) => sum + (b.total_amount ?? 0),
      0
    );

    const uniqueEmails = new Set(
      (totalGuestsResult.data ?? []).map((b: { guest_email: string }) => b.guest_email)
    );
    const totalGuests = uniqueEmails.size;

    const overlappingCount = overlappingBookingsResult.count ?? 0;
    const totalRooms = totalRoomsResult.count ?? 0;
    const occupancyRate = totalRooms > 0
      ? Math.round((overlappingCount / totalRooms) * 1000) / 10
      : 0;

    const pendingPayments = pendingPaymentsResult.count ?? 0;

    const recentBookings = recentBookingsResult.data ?? [];
    const upcomingCheckins = upcomingCheckinsResult.data ?? [];

    return NextResponse.json({
      success: true,
      data: {
        todayCheckins,
        activeBookings,
        monthlyRevenue,
        totalGuests,
        occupancyRate,
        pendingPayments,
        recentBookings,
        upcomingCheckins,
      },
    });
  } catch (error) {
    console.error('[admin/dashboard] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
