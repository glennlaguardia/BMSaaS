'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Search, ChevronLeft, ChevronRight, Loader2, Plus, CalendarDays, UserPlus } from 'lucide-react';
import { formatDate, statusLabel, statusColor } from '@/lib/utils';
import { formatPHP } from '@/lib/pricing';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/** Relative time helper, e.g. "2h ago", "3d ago" */
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(dateStr);
}

interface Booking {
  id: string;
  reference_number: string;
  guest_first_name: string;
  guest_last_name: string;
  guest_email: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  payment_status: string;
  total_amount: number;
  source: string;
  created_at: string;
  is_read: boolean;
  booking_group_id: string | null;
  rooms: { name: string } | null;
  accommodation_types: { name: string } | null;
  booking_groups: { group_reference_number: string; total_amount: number | null } | null;
}

/** One row in the list: either a standalone booking or a group (one row per group). */
type BookingRow =
  | { type: 'single'; booking: Booking }
  | { type: 'group'; ref: string; guest: string; guestEmail: string; roomLabel: string; checkIn: string; checkOut: string; status: string; paymentStatus: string; totalAmount: number; firstBookingId: string; count: number; createdAt: string; isRead: boolean };

function toRows(bookings: Booking[]): BookingRow[] {
  const byGroup = new Map<string, Booking[]>();
  for (const b of bookings) {
    const key = b.booking_group_id ?? b.id;
    if (!byGroup.has(key)) byGroup.set(key, []);
    byGroup.get(key)!.push(b);
  }
  const rows: BookingRow[] = [];
  for (const [, groupBookings] of Array.from(byGroup)) {
    const first = groupBookings[0];
    if (groupBookings.length === 1) {
      rows.push({ type: 'single', booking: first });
    } else {
      const groupRef = first.booking_groups?.group_reference_number ?? first.reference_number;
      const totalAmount = groupBookings.reduce((s, b) => s + b.total_amount, 0);
      rows.push({
        type: 'group',
        ref: groupRef,
        guest: `${first.guest_first_name} ${first.guest_last_name}`,
        guestEmail: first.guest_email,
        roomLabel: `${groupBookings.length} rooms`,
        checkIn: first.check_in_date,
        checkOut: first.check_out_date,
        status: first.status,
        paymentStatus: first.payment_status,
        totalAmount,
        firstBookingId: first.id,
        count: groupBookings.length,
        createdAt: first.created_at,
        isRead: groupBookings.every(b => b.is_read),
      });
    }
  }
  return rows;
}

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sort_by: 'created_at',
      sort_order: 'desc',
    });
    if (search) params.set('search', search);
    if (status !== 'all') params.set('status', status);
    if (paymentStatus !== 'all') params.set('payment_status', paymentStatus);
    if (fromDate) params.set('from_date', fromDate);
    if (toDate) params.set('to_date', toDate);

    const res = await fetch(`/api/admin/bookings?${params}`);
    const data = await res.json();
    if (data.success) {
      setBookings(data.data);
      setTotal(data.pagination.total);
    }
    setLoading(false);
  }, [page, search, status, paymentStatus, fromDate, toDate]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const totalPages = Math.ceil(total / limit);
  const rows = toRows(bookings);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-forest-700">Bookings</h1>
          <p className="text-sm text-forest-500/45 mt-1">{total} total bookings</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/bookings/new?source=walk_in">
              <UserPlus className="w-4 h-4 mr-2" />
              Walk-in
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/bookings/new">
              <Plus className="w-4 h-4 mr-2" />
              New Booking
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-500/35" />
              <Input
                placeholder="Search by reference, name, or email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="checked_in">Checked In</SelectItem>
                <SelectItem value="checked_out">Checked Out</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentStatus} onValueChange={(v) => { setPaymentStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Payment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="pending_verification">Pending Verification</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex items-center gap-1.5">
              <Button
                variant={fromDate === new Date().toISOString().split('T')[0] && toDate === new Date().toISOString().split('T')[0] ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  setFromDate(today);
                  setToDate(today);
                  setPage(1);
                }}
              >
                Today
              </Button>
              <Button
                variant={(() => {
                  const now = new Date();
                  const day = now.getDay();
                  const mon = new Date(now);
                  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
                  const sun = new Date(mon);
                  sun.setDate(mon.getDate() + 6);
                  return fromDate === mon.toISOString().split('T')[0] && toDate === sun.toISOString().split('T')[0] ? 'default' : 'outline';
                })()}
                size="sm"
                onClick={() => {
                  const now = new Date();
                  const day = now.getDay();
                  const mon = new Date(now);
                  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
                  const sun = new Date(mon);
                  sun.setDate(mon.getDate() + 6);
                  setFromDate(mon.toISOString().split('T')[0]);
                  setToDate(sun.toISOString().split('T')[0]);
                  setPage(1);
                }}
              >
                This Week
              </Button>
              <Button
                variant={(() => {
                  const now = new Date();
                  const first = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
                  return fromDate === first && toDate === last ? 'default' : 'outline';
                })()}
                size="sm"
                onClick={() => {
                  const now = new Date();
                  setFromDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
                  setToDate(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]);
                  setPage(1);
                }}
              >
                This Month
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-forest-500/35 flex-shrink-0" />
              <div>
                <Label className="text-xs text-forest-500/45">Check-in from</Label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                  className="w-[160px]"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-forest-500/45">Check-in to</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                className="w-[160px]"
              />
            </div>
            {(fromDate || toDate) && (
              <Button variant="ghost" size="sm" onClick={() => { setFromDate(''); setToDate(''); setPage(1); }}>
                Clear dates
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Booking List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-forest-500/35" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-center text-forest-500/45 py-12">No bookings found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium text-forest-500/45 w-4"></th>
                    <th className="text-left py-3 px-2 font-medium text-forest-500/45">Ref</th>
                    <th className="text-left py-3 px-2 font-medium text-forest-500/45">Guest</th>
                    <th className="text-left py-3 px-2 font-medium text-forest-500/45 hidden md:table-cell">Room</th>
                    <th className="text-left py-3 px-2 font-medium text-forest-500/45 hidden lg:table-cell">Dates</th>
                    <th className="text-left py-3 px-2 font-medium text-forest-500/45">Status</th>
                    <th className="text-left py-3 px-2 font-medium text-forest-500/45">Payment</th>
                    <th className="text-right py-3 px-2 font-medium text-forest-500/45">Amount</th>
                    <th className="text-right py-3 px-2 font-medium text-forest-500/45 hidden xl:table-cell">Booked On</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) =>
                    row.type === 'single' ? (
                      <tr
                        key={row.booking.id}
                        onClick={() => router.push(`/dashboard/bookings/${row.booking.id}`)}
                        className="border-b last:border-0 hover:bg-forest-50/80 hover:shadow-sm transition-all cursor-pointer"
                      >
                        <td className="py-3 px-2 w-4">
                          {!row.booking.is_read && (
                            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" title="New booking" />
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <span className="font-mono text-xs text-forest-700">{row.booking.reference_number}</span>
                        </td>
                        <td className="py-3 px-2">
                          <p className="font-medium text-forest-700">{row.booking.guest_first_name} {row.booking.guest_last_name}</p>
                          <p className="text-xs text-forest-500/35">{row.booking.guest_email}</p>
                        </td>
                        <td className="py-3 px-2 hidden md:table-cell text-forest-500/60">
                          {row.booking.rooms?.name || '—'}
                        </td>
                        <td className="py-3 px-2 hidden lg:table-cell text-forest-500/60 text-xs">
                          {formatDate(row.booking.check_in_date)} — {formatDate(row.booking.check_out_date)}
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant={statusColor(row.booking.status)}>{statusLabel(row.booking.status)}</Badge>
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant={statusColor(row.booking.payment_status)}>{statusLabel(row.booking.payment_status)}</Badge>
                        </td>
                        <td className="py-3 px-2 text-right font-medium text-forest-700">
                          {formatPHP(row.booking.total_amount)}
                        </td>
                        <td className="py-3 px-2 text-right hidden xl:table-cell text-xs text-forest-500/50">
                          {timeAgo(row.booking.created_at)}
                        </td>
                      </tr>
                    ) : (
                      <tr
                        key={row.firstBookingId}
                        onClick={() => router.push(`/dashboard/bookings/${row.firstBookingId}`)}
                        className="border-b last:border-0 hover:bg-forest-50/80 hover:shadow-sm transition-all cursor-pointer"
                      >
                        <td className="py-3 px-2 w-4">
                          {!row.isRead && (
                            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" title="New booking" />
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <span className="font-mono text-xs text-forest-700">{row.ref}</span>
                          <span className="ml-1 text-forest-500/35">(group)</span>
                        </td>
                        <td className="py-3 px-2">
                          <p className="font-medium text-forest-700">{row.guest}</p>
                          <p className="text-xs text-forest-500/35">{row.guestEmail}</p>
                        </td>
                        <td className="py-3 px-2 hidden md:table-cell text-forest-500/60">{row.roomLabel}</td>
                        <td className="py-3 px-2 hidden lg:table-cell text-forest-500/60 text-xs">
                          {formatDate(row.checkIn)} — {formatDate(row.checkOut)}
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant={statusColor(row.status)}>{statusLabel(row.status)}</Badge>
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant={statusColor(row.paymentStatus)}>{statusLabel(row.paymentStatus)}</Badge>
                        </td>
                        <td className="py-3 px-2 text-right font-medium text-forest-700">
                          {formatPHP(row.totalAmount)}
                        </td>
                        <td className="py-3 px-2 text-right hidden xl:table-cell text-xs text-forest-500/50">
                          {timeAgo(row.createdAt)}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-forest-500/45">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
