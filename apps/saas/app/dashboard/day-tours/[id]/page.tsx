'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Users, Sun, Info } from 'lucide-react';
import { formatPHP } from '@/lib/pricing';
import { formatDate, statusLabel, statusColor } from '@/lib/utils';

interface DayTourBookingDetail {
  id: string;
  reference_number: string;
  tour_date: string;
  status: string;
  payment_status: string;
  total_amount: number;
  base_amount: number;
  addons_amount: number;
  num_adults: number;
  num_children: number;
  guest_first_name: string;
  guest_last_name: string;
  guest_email: string;
  guest_phone: string;
  special_requests: string | null;
  created_at: string;
  addons: {
    addon_id: string;
    name: string;
    quantity: number;
    unit_price: number;
  }[];
}

export default function DayTourDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [booking, setBooking] = useState<DayTourBookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/admin/day-tours/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setBooking(data.data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (updates: Partial<Pick<DayTourBookingDetail, 'status' | 'payment_status'>>) => {
    if (!booking) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/day-tours/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        setBooking({ ...booking, ...updates });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-forest-500/40" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="rounded-full">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <p className="text-sm text-forest-500/60">Day tour booking not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-forest-700">Day Tour {booking.reference_number}</h1>
            <p className="text-xs text-forest-500/50 mt-0.5">
              {formatDate(booking.tour_date)} · Created {formatDate(booking.created_at)}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant={statusColor(booking.status)} className="text-xs">
            {statusLabel(booking.status)}
          </Badge>
          <Badge variant={statusColor(booking.payment_status)} className="text-xs">
            {statusLabel(booking.payment_status)}
          </Badge>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              Booking Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Users className="w-4 h-4 text-forest-500 mt-0.5" />
              <div>
                <p className="font-medium text-forest-700">
                  {booking.num_adults} adult{booking.num_adults !== 1 ? 's' : ''}{' '}
                  {booking.num_children > 0 && `· ${booking.num_children} child${booking.num_children !== 1 ? 'ren' : ''}`}
                </p>
                <p className="text-xs text-forest-500/45">
                  Total {booking.num_adults + booking.num_children} guests
                </p>
              </div>
            </div>

            <div className="border-t border-forest-100/40 pt-3">
              <p className="text-xs font-semibold text-forest-500/50 uppercase tracking-[0.16em] mb-1">
                Guest
              </p>
              <p className="text-sm font-medium text-forest-700">
                {booking.guest_first_name} {booking.guest_last_name}
              </p>
              <p className="text-xs text-forest-500/45">{booking.guest_email}</p>
              <p className="text-xs text-forest-500/45">{booking.guest_phone}</p>
            </div>

            {booking.special_requests && (
              <div className="border-t border-forest-100/40 pt-3 flex gap-2 text-sm text-forest-700">
                <Info className="w-4 h-4 text-amber-500 mt-0.5" />
                <p className="italic text-forest-600">
                  “{booking.special_requests}”
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-forest-500/50 mb-1">Booking Status</p>
              <Select
                value={booking.status}
                onValueChange={(val) => updateStatus({ status: val as DayTourBookingDetail['status'] })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="checked_in">Checked In</SelectItem>
                  <SelectItem value="checked_out">Checked Out</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs text-forest-500/50 mb-1">Payment Status</p>
              <Select
                value={booking.payment_status}
                onValueChange={(val) => updateStatus({ payment_status: val as DayTourBookingDetail['payment_status'] })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {saving && (
              <p className="text-[11px] text-forest-500/60 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving...
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-forest-500/60">Base amount</span>
            <span className="font-medium text-forest-700">{formatPHP(booking.base_amount)}</span>
          </div>
          {booking.addons_amount > 0 && (
            <div className="flex justify-between">
              <span className="text-forest-500/60">Add-ons</span>
              <span className="font-medium text-forest-700">{formatPHP(booking.addons_amount)}</span>
            </div>
          )}
          {booking.addons && booking.addons.length > 0 && (
            <div className="pt-2 border-t border-forest-100/40 mt-2 space-y-1">
              {booking.addons.map((addon) => (
                <div key={addon.addon_id} className="flex justify-between text-xs text-forest-500/70">
                  <span>{addon.name} × {addon.quantity}</span>
                  <span>{formatPHP(addon.unit_price * addon.quantity)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="pt-3 border-t border-forest-100/60 mt-2 flex justify-between items-center">
            <span className="font-semibold text-forest-700">Total</span>
            <span className="font-bold text-forest-700 text-lg">{formatPHP(booking.total_amount)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

