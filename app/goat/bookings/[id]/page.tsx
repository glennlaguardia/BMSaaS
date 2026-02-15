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
}

export default function BookingDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/bookings/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setBooking(data.data);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/goat/bookings"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-forest-700">Booking {booking.reference_number}</h1>
          <p className="text-sm text-forest-500/45">Created {formatDateTime(booking.created_at)}</p>
        </div>
      </div>

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
                <div className="flex justify-between">
                  <span className="text-forest-500/45">Add-ons</span>
                  <span>{formatPHP(booking.addons_amount)}</span>
                </div>
              )}
              {booking.discount_amount > 0 && (
                <div className="flex justify-between text-forest-500">
                  <span>Discount</span>
                  <span>-{formatPHP(booking.discount_amount)}</span>
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
