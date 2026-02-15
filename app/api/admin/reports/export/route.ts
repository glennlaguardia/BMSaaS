import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const type = request.nextUrl.searchParams.get('type') || 'bookings';
    const period = request.nextUrl.searchParams.get('period') || '30';
    const days = parseInt(period, 10) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startISO = startDate.toISOString().split('T')[0];

    const supabase = createAdminClient();

    if (type === 'bookings') {
      const { data } = await supabase
        .from('bookings')
        .select('reference_number, status, payment_status, total_amount, check_in_date, check_out_date, guest_first_name, guest_last_name, guest_email, guest_phone, num_adults, num_children, special_requests, source, created_at, accommodation_types(name)')
        .eq('tenant_id', session.tenant_id)
        .gte('created_at', startISO)
        .order('created_at', { ascending: false });

      const rows = (data || []).map((b) => ({
        'Reference': b.reference_number,
        'Status': b.status,
        'Payment': b.payment_status,
        'Total': b.total_amount,
        'Check-In': b.check_in_date,
        'Check-Out': b.check_out_date,
        'Guest Name': `${b.guest_first_name} ${b.guest_last_name}`,
        'Email': b.guest_email,
        'Phone': b.guest_phone,
        'Adults': b.num_adults,
        'Children': b.num_children,
        'Type': (b.accommodation_types as unknown as { name: string } | null)?.name || '',
        'Source': b.source,
        'Special Requests': b.special_requests || '',
        'Created': b.created_at,
      }));

      const csv = toCsv(rows);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="bookings-export-${startISO}.csv"`,
        },
      });
    }

    if (type === 'guests') {
      const { data } = await supabase
        .from('guests')
        .select('first_name, last_name, email, phone, total_bookings, total_spent, last_visit, created_at')
        .eq('tenant_id', session.tenant_id)
        .order('created_at', { ascending: false });

      const rows = (data || []).map((g) => ({
        'Name': `${g.first_name} ${g.last_name}`,
        'Email': g.email,
        'Phone': g.phone || '',
        'Total Bookings': g.total_bookings,
        'Total Spent': g.total_spent,
        'Last Visit': g.last_visit || '',
        'First Seen': g.created_at,
      }));

      const csv = toCsv(rows);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="guests-export.csv"`,
        },
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown export type' }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row =>
      headers.map(h => {
        const val = String(row[h] ?? '').replace(/"/g, '""');
        return `"${val}"`;
      }).join(',')
    ),
  ];
  return lines.join('\n');
}
