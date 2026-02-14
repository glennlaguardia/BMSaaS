'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Eye, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { formatDate, statusLabel, statusColor } from '@/lib/utils';
import { formatPHP } from '@/lib/pricing';
import Link from 'next/link';

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
  rooms: { name: string } | null;
  accommodation_types: { name: string } | null;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    if (status !== 'all') params.set('status', status);

    const res = await fetch(`/api/admin/bookings?${params}`);
    const data = await res.json();
    if (data.success) {
      setBookings(data.data);
      setTotal(data.pagination.total);
    }
    setLoading(false);
  }, [page, search, status]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Bookings</h1>
          <p className="text-sm text-zinc-500 mt-1">{total} total bookings</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
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
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="checked_in">Checked In</SelectItem>
                <SelectItem value="checked_out">Checked Out</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
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
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
          ) : bookings.length === 0 ? (
            <p className="text-center text-zinc-500 py-12">No bookings found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium text-zinc-500">Ref</th>
                    <th className="text-left py-3 px-2 font-medium text-zinc-500">Guest</th>
                    <th className="text-left py-3 px-2 font-medium text-zinc-500 hidden md:table-cell">Room</th>
                    <th className="text-left py-3 px-2 font-medium text-zinc-500 hidden lg:table-cell">Dates</th>
                    <th className="text-left py-3 px-2 font-medium text-zinc-500">Status</th>
                    <th className="text-left py-3 px-2 font-medium text-zinc-500">Payment</th>
                    <th className="text-right py-3 px-2 font-medium text-zinc-500">Amount</th>
                    <th className="text-right py-3 px-2 font-medium text-zinc-500"></th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="border-b last:border-0 hover:bg-zinc-50">
                      <td className="py-3 px-2">
                        <span className="font-mono text-xs text-zinc-900">{booking.reference_number}</span>
                      </td>
                      <td className="py-3 px-2">
                        <p className="font-medium text-zinc-900">{booking.guest_first_name} {booking.guest_last_name}</p>
                        <p className="text-xs text-zinc-400">{booking.guest_email}</p>
                      </td>
                      <td className="py-3 px-2 hidden md:table-cell text-zinc-600">
                        {booking.rooms?.name || '—'}
                      </td>
                      <td className="py-3 px-2 hidden lg:table-cell text-zinc-600 text-xs">
                        {formatDate(booking.check_in_date)} — {formatDate(booking.check_out_date)}
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant={statusColor(booking.status)}>{statusLabel(booking.status)}</Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant={statusColor(booking.payment_status)}>{statusLabel(booking.payment_status)}</Badge>
                      </td>
                      <td className="py-3 px-2 text-right font-medium text-zinc-900">
                        {formatPHP(booking.total_amount)}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/goat/bookings/${booking.id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-zinc-500">
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
