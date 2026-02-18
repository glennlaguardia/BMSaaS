'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatDate, formatDateTime, statusLabel, statusColor } from '@/lib/utils';
import { formatPHP } from '@/lib/pricing';
import type { Booking, BookingAddon } from '@/types';

interface BookingDetail extends Booking {
  rooms?: { name: string } | null;
  accommodation_types?: { name: string } | null;
  booking_addons?: (BookingAddon & { addons?: { name: string } })[];
  booking_status_log?: {
    id: string;
    field_changed: string;
    old_value: string | null;
    new_value: string;
    change_source: string;
    notes: string | null;
    created_at: string;
  }[];
  booking_groups?: { group_reference_number: string; total_amount: number | null } | null;
}

interface GroupBookingRow {
  id: string;
  reference_number: string;
  rooms: { name: string } | null;
  accommodation_types: { name: string } | null;
  status: string;
  payment_status: string;
  total_amount: number;
}

export default function BookingDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [groupBookings, setGroupBookings] = useState<GroupBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/bookings/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setBooking(data.data);
          const bid = data.data?.booking_group_id;
          if (bid) {
            return fetch(`/api/admin/bookings?booking_group_id=${encodeURIComponent(bid)}&limit=50`)
              .then(r2 => r2.json())
              .then(d2 => {
                if (d2.success && Array.isArray(d2.data)) setGroupBookings(d2.data);
              });
          }
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (data.success) {
      router.refresh();
      // Re-fetch booking
      const res2 = await fetch(`/api/admin/bookings/${id}`);
      const data2 = await res2.json();
      if (data2.success) setBooking(data2.data);
    }
    setUpdating(false);
  };

  const updatePaymentStatus = async (newStatus: string) => {
    setUpdating(true);
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status: newStatus }),
    });
    const data = await res.json();
    if (data.success) {
      const res2 = await fetch(`/api/admin/bookings/${id}`);
      const data2 = await res2.json();
      if (data2.success) setBooking(data2.data);
    }
    setUpdating(false);
  };

  const updateGroupStatus = async (newStatus: string) => {
    if (!booking?.booking_group_id) return;
    setUpdating(true);
    const res = await fetch(`/api/admin/booking-groups/${booking.booking_group_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (data.success) {
      const res2 = await fetch(`/api/admin/bookings/${id}`);
      const data2 = await res2.json();
      if (data2.success) setBooking(data2.data);
      const bid = data2.data?.booking_group_id;
      if (bid) {
        const r3 = await fetch(`/api/admin/bookings?booking_group_id=${encodeURIComponent(bid)}&limit=50`);
        const d3 = await r3.json();
        if (d3.success && Array.isArray(d3.data)) setGroupBookings(d3.data);
      }
    }
    setUpdating(false);
  };

  const updateGroupPaymentStatus = async (newStatus: string) => {
    if (!booking?.booking_group_id) return;
    setUpdating(true);
    const res = await fetch(`/api/admin/booking-groups/${booking.booking_group_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status: newStatus }),
    });
    const data = await res.json();
    if (data.success) {
      const res2 = await fetch(`/api/admin/bookings/${id}`);
      const data2 = await res2.json();
      if (data2.success) setBooking(data2.data);
      const bid = data2.data?.booking_group_id;
      if (bid) {
        const r3 = await fetch(`/api/admin/bookings?booking_group_id=${encodeURIComponent(bid)}&limit=50`);
        const d3 = await r3.json();
        if (d3.success && Array.isArray(d3.data)) setGroupBookings(d3.data);
      }
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-forest-500/35" />
      </div>
    );
  }

  if (!booking) {
    return <p className="text-forest-500/45 text-center py-12">Booking not found.</p>;
  }

  const isGroup = !!booking.booking_group_id && groupBookings.length > 0;
  const groupRef = booking.booking_groups?.group_reference_number;
  const groupTotal = booking.booking_groups?.total_amount ?? (isGroup ? groupBookings.reduce((s, b) => s + b.total_amount, 0) : null);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/goat/bookings"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-forest-700">
            {isGroup && groupRef ? `Group ${groupRef}` : `Booking ${booking.reference_number}`}
          </h1>
          <p className="text-sm text-forest-500/45">
            {isGroup && groupRef ? `${groupBookings.length} rooms · Total ${groupTotal != null ? formatPHP(groupTotal) : '—'}` : `Created ${formatDateTime(booking.created_at)}`}
          </p>
        </div>
      </div>

      {isGroup && groupBookings.length > 1 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Group actions</CardTitle>
              <p className="text-sm text-forest-500/45">Apply to all rooms in this group</p>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-forest-500/45 mb-2">Set status for all rooms</p>
                  <Select value="" onValueChange={updateGroupStatus} disabled={updating}>
                    <SelectTrigger><SelectValue placeholder="Choose status…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="checked_in">Checked In</SelectItem>
                      <SelectItem value="checked_out">Checked Out</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="no_show">No Show</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-sm text-forest-500/45 mb-2">Set payment status for all rooms</p>
                  <Select value="" onValueChange={updateGroupPaymentStatus} disabled={updating}>
                    <SelectTrigger><SelectValue placeholder="Choose payment status…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="pending_verification">Pending Verification</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rooms in this group</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-forest-500/45">Ref</th>
                      <th className="text-left py-2 font-medium text-forest-500/45">Room</th>
                      <th className="text-left py-2 font-medium text-forest-500/45">Status</th>
                      <th className="text-left py-2 font-medium text-forest-500/45">Payment</th>
                      <th className="text-right py-2 font-medium text-forest-500/45">Amount</th>
                      <th className="text-right py-2 font-medium text-forest-500/45"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupBookings.map((b) => (
                      <tr key={b.id} className="border-b last:border-0">
                        <td className="py-2 font-mono text-xs">{b.reference_number}</td>
                        <td className="py-2">{b.rooms?.name ?? b.accommodation_types?.name ?? '—'}</td>
                        <td className="py-2"><Badge variant={statusColor(b.status)}>{statusLabel(b.status)}</Badge></td>
                        <td className="py-2"><Badge variant={statusColor(b.payment_status)}>{statusLabel(b.payment_status)}</Badge></td>
                        <td className="py-2 text-right">{formatPHP(b.total_amount)}</td>
                        <td className="py-2 text-right">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/goat/bookings/${b.id}`}>View</Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status & Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-forest-500/45 mb-2">Booking Status</p>
                  <Badge variant={statusColor(booking.status)} className="mb-3">{statusLabel(booking.status)}</Badge>
                  <Select value={booking.status} onValueChange={updateStatus} disabled={updating}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="checked_in">Checked In</SelectItem>
                      <SelectItem value="checked_out">Checked Out</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="no_show">No Show</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-sm text-forest-500/45 mb-2">Payment Status</p>
                  <Badge variant={statusColor(booking.payment_status)} className="mb-3">{statusLabel(booking.payment_status)}</Badge>
                  <Select value={booking.payment_status} onValueChange={updatePaymentStatus} disabled={updating}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="pending_verification">Pending Verification</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guest Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Guest Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-forest-500/45">Name</p>
                  <p className="font-medium">{booking.guest_first_name} {booking.guest_last_name}</p>
                </div>
                <div>
                  <p className="text-forest-500/45">Email</p>
                  <p className="font-medium">{booking.guest_email}</p>
                </div>
                <div>
                  <p className="text-forest-500/45">Phone</p>
                  <p className="font-medium">{booking.guest_phone}</p>
                </div>
                <div>
                  <p className="text-forest-500/45">Source</p>
                  <p className="font-medium capitalize">{booking.source}</p>
                </div>
              </div>
              {booking.special_requests && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-forest-500/45 text-sm">Special Requests</p>
                  <p className="text-sm mt-1">{booking.special_requests}</p>
                </div>
              )}
              {booking.food_restrictions && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-forest-500/45 text-sm">Food Restrictions / Allergies</p>
                  <p className="text-sm mt-1">{booking.food_restrictions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audit Log */}
          {booking.booking_status_log && booking.booking_status_log.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Activity Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {booking.booking_status_log
                    .sort((a: { created_at: string }, b: { created_at: string }) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((log: { id: string; field_changed: string; old_value: string | null; new_value: string; change_source: string; notes: string | null; created_at: string }) => (
                      <div key={log.id} className="flex items-start gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-forest-200 mt-1.5 flex-shrink-0" />
                        <div>
                          <p className="text-forest-700">
                            <span className="font-medium">{statusLabel(log.field_changed)}</span> changed from{' '}
                            <Badge variant="outline" className="text-xs">{statusLabel(log.old_value || 'none')}</Badge> to{' '}
                            <Badge variant={statusColor(log.new_value)} className="text-xs">{statusLabel(log.new_value)}</Badge>
                          </p>
                          <p className="text-xs text-forest-500/35 mt-0.5">
                            {formatDateTime(log.created_at)} · {log.change_source}
                            {log.notes && ` · ${log.notes}`}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stay Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stay Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-forest-500/45">Accommodation</p>
                <p className="font-medium">{booking.accommodation_types?.name || '—'}</p>
              </div>
              <div>
                <p className="text-forest-500/45">Room</p>
                <p className="font-medium">{booking.rooms?.name || '—'}</p>
              </div>
              <div>
                <p className="text-forest-500/45">Check-in</p>
                <p className="font-medium">{formatDate(booking.check_in_date, 'EEE, MMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-forest-500/45">Check-out</p>
                <p className="font-medium">{formatDate(booking.check_out_date, 'EEE, MMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-forest-500/45">Guests</p>
                <p className="font-medium">
                  {booking.num_adults} adult{booking.num_adults > 1 ? 's' : ''}
                  {booking.num_children > 0 && `, ${booking.num_children} child${booking.num_children > 1 ? 'ren' : ''}`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-forest-500/45">Base Amount</span>
                <span>{formatPHP(booking.base_amount)}</span>
              </div>
              {booking.pax_surcharge > 0 && (
                <div className="flex justify-between">
                  <span className="text-forest-500/45">Pax Surcharge</span>
                  <span>{formatPHP(booking.pax_surcharge)}</span>
                </div>
              )}
              {booking.addons_amount > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-forest-500/45">Add-ons</span>
                    <span>{formatPHP(booking.addons_amount)}</span>
                  </div>
                  {booking.booking_addons && booking.booking_addons.length > 0 && (
                    <div className="pl-3 space-y-1">
                      {booking.booking_addons.map((ba) => (
                        <div key={ba.id} className="flex justify-between text-xs text-forest-500/50">
                          <span>{ba.addons?.name ?? 'Add-on'} ×{ba.quantity}</span>
                          <span>{formatPHP(ba.total_price)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
              {booking.discount_amount > 0 && (
                <div className="flex justify-between text-forest-500">
                  <span>Discount</span>
                  <span>-{formatPHP(booking.discount_amount)}</span>
                </div>
              )}
              {booking.voucher_code && (
                <div className="flex justify-between text-xs">
                  <span className="text-forest-500/45">Voucher</span>
                  <span className="font-mono text-forest-600">{booking.voucher_code}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t font-bold">
                <span>Total</span>
                <span className="text-lg">{formatPHP(booking.total_amount)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
