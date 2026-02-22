'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { ArrowLeft, Loader2, Check, Users, Calendar, Phone, Mail, User, MessageSquare } from 'lucide-react';
import { formatPHP } from '@/lib/pricing';
import { cn } from '@/lib/utils';
import { format as fmtDate } from 'date-fns';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface AccommodationType {
  id: string;
  name: string;
  base_rate_weekday: number;
  base_rate_weekend: number;
  base_pax: number;
  max_pax: number;
  additional_pax_fee: number;
}

interface Room {
  id: string;
  name: string;
  accommodation_type_id: string;
  is_available?: boolean;
}

interface Addon {
  id: string;
  name: string;
  price: number;
  pricing_model: 'per_booking' | 'per_person';
  category: string;
}

interface PriceCalc {
  totalNights: number;
  totalBaseRate: number;
  totalPaxSurcharge: number;
  addonsTotal: number;
  grandTotal: number;
}

const SOURCES = [
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'phone', label: 'Phone Call' },
  { value: 'facebook', label: 'Facebook / Social Media' },
  { value: 'manual', label: 'Manual Entry' },
];

function NewManualBookingContent() {
  const searchParams = useSearchParams();
  const initialSource = searchParams.get('source') || 'walk_in';
  const isWalkIn = initialSource === 'walk_in';
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ booking_id: string; reference_number: string } | null>(null);

  // Data
  const [types, setTypes] = useState<AccommodationType[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [pricing, setPricing] = useState<PriceCalc | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  // Form state
  const [form, setForm] = useState(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return {
      source: initialSource,
      accommodation_type_id: '',
      room_id: '',
      check_in_date: isWalkIn ? today.toISOString().split('T')[0] : '',
      check_out_date: isWalkIn ? tomorrow.toISOString().split('T')[0] : '',
      num_adults: 1,
      num_children: 0,
      guest_first_name: '',
      guest_last_name: '',
      guest_email: '',
      guest_phone: '',
      special_requests: '',
    };
  });
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  // Load accommodation types and addons on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/admin/accommodation-types').then(r => r.json()),
      fetch('/api/admin/addons').then(r => r.json()),
    ])
      .then(([typesRes, addonsRes]) => {
        if (typesRes.success) setTypes(typesRes.data || []);
        if (addonsRes.success) setAddons(addonsRes.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Load rooms when accommodation type changes
  useEffect(() => {
    if (!form.accommodation_type_id) {
      setRooms([]);
      return;
    }
    const params = new URLSearchParams({ type_id: form.accommodation_type_id });
    if (form.check_in_date) params.set('check_in', form.check_in_date);
    if (form.check_out_date) params.set('check_out', form.check_out_date);

    fetch(`/api/public/rooms?${params}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setRooms(data.data || []);
      })
      .catch(console.error);
  }, [form.accommodation_type_id, form.check_in_date, form.check_out_date]);

  // Calculate pricing
  const recalcPrice = useCallback(() => {
    if (!form.accommodation_type_id || !form.check_in_date || !form.check_out_date) {
      setPricing(null);
      return;
    }
    setPricingLoading(true);
    fetch('/api/public/calculate-price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accommodation_type_id: form.accommodation_type_id,
        check_in_date: form.check_in_date,
        check_out_date: form.check_out_date,
        num_adults: form.num_adults,
        num_children: form.num_children,
        addon_ids: Array.from(selectedAddonIds),
        addon_quantities: Array.from(selectedAddonIds).map(() => 1),
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) setPricing(data.data);
      })
      .catch(console.error)
      .finally(() => setPricingLoading(false));
  }, [form.accommodation_type_id, form.check_in_date, form.check_out_date, form.num_adults, form.num_children, selectedAddonIds]);

  useEffect(() => {
    recalcPrice();
  }, [recalcPrice]);

  const toggleAddon = (id: string) => {
    setSelectedAddonIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.room_id || !form.accommodation_type_id) {
      setError('Please select an accommodation type and room.');
      return;
    }
    if (!form.check_in_date || !form.check_out_date) {
      setError('Please select check-in and check-out dates.');
      return;
    }
    if (!form.guest_first_name.trim() || !form.guest_last_name.trim()) {
      setError('Please enter the guest name.');
      return;
    }
    if (!form.guest_email.trim() && !form.guest_phone.trim()) {
      setError('Please enter at least a phone number or email.');
      return;
    }

    setSubmitting(true);
    try {
      const addonIds = Array.from(selectedAddonIds);
      const addonQuantities = addonIds.map(() => 1);
      const addonPrices = addonIds.map(id => {
        const a = addons.find(x => x.id === id);
        return a ? a.price : 0;
      });

      const payload = {
        room_id: form.room_id,
        accommodation_type_id: form.accommodation_type_id,
        check_in_date: form.check_in_date,
        check_out_date: form.check_out_date,
        num_adults: form.num_adults,
        num_children: form.num_children,
        guest_first_name: form.guest_first_name.trim(),
        guest_last_name: form.guest_last_name.trim(),
        guest_email: form.guest_email.trim() || 'walkin@resort.local',
        guest_phone: form.guest_phone.trim() || 'N/A',
        special_requests: form.special_requests.trim() || null,
        source: form.source,
        addon_ids: addonIds,
        addon_quantities: addonQuantities,
        base_amount: pricing?.totalBaseRate || 0,
        pax_surcharge: pricing?.totalPaxSurcharge || 0,
        addons_amount: pricing?.addonsTotal || 0,
        discount_amount: 0,
        total_amount: pricing?.grandTotal || 0,
        addon_prices: addonPrices,
      };

      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(data.data);
      } else {
        setError(data.error || 'Failed to create booking');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-forest-500" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-forest-700 mb-2">Booking Created</h1>
        <p className="text-forest-600/60 mb-2">
          Reference: <span className="font-mono font-bold text-forest-700">{success.reference_number}</span>
        </p>
        <p className="text-sm text-forest-600/50 mb-8">
          The booking has been created successfully. You can view and manage it from the bookings list.
        </p>
        <div className="flex justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/dashboard/bookings">Back to Bookings</Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/bookings/${success.booking_id}`}>View Booking</Link>
          </Button>
        </div>
      </div>
    );
  }

  const totalPax = form.num_adults + form.num_children;
  const selectedType = types.find(t => t.id === form.accommodation_type_id);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/bookings">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-forest-700">Create Manual Booking</h1>
          <p className="text-sm text-forest-600/50 mt-1">
            For walk-ins, phone calls, or social media bookings
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Main form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Source */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Phone className="w-4 h-4 text-terracotta-500" />
                  Booking Source
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={form.source} onValueChange={v => {
                  const updates: Record<string, string> = { source: v };
                  if (v === 'walk_in') {
                    const today = new Date();
                    const tomorrow = new Date(today);
                    tomorrow.setDate(today.getDate() + 1);
                    updates.check_in_date = today.toISOString().split('T')[0];
                    updates.check_out_date = tomorrow.toISOString().split('T')[0];
                  }
                  setForm(f => ({ ...f, ...updates }));
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-terracotta-500" />
                  Stay Dates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-1.5">Check-in</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !form.check_in_date && 'text-muted-foreground'
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {form.check_in_date ? fmtDate(new Date(form.check_in_date), 'MMM d, yyyy') : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarPicker
                          mode="single"
                          selected={form.check_in_date ? new Date(form.check_in_date) : undefined}
                          onSelect={(date) => {
                            if (date) setForm(f => ({ ...f, check_in_date: fmtDate(date, 'yyyy-MM-dd') }));
                          }}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-1.5">Check-out</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !form.check_out_date && 'text-muted-foreground'
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {form.check_out_date ? fmtDate(new Date(form.check_out_date), 'MMM d, yyyy') : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarPicker
                          mode="single"
                          selected={form.check_out_date ? new Date(form.check_out_date) : undefined}
                          onSelect={(date) => {
                            if (date) setForm(f => ({ ...f, check_out_date: fmtDate(date, 'yyyy-MM-dd') }));
                          }}
                          disabled={(date) => {
                            const minDate = form.check_in_date
                              ? new Date(new Date(form.check_in_date).getTime() + 86400000)
                              : new Date(new Date().setHours(0, 0, 0, 0));
                            return date < minDate;
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Accommodation */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Accommodation & Room</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-1.5">Accommodation Type</label>
                  <Select
                    value={form.accommodation_type_id}
                    onValueChange={v => setForm(f => ({ ...f, accommodation_type_id: v, room_id: '' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {types.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} — {formatPHP(t.base_rate_weekday)}/night
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {form.accommodation_type_id && (
                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-1.5">Room</label>
                    <Select
                      value={form.room_id}
                      onValueChange={v => setForm(f => ({ ...f, room_id: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map(r => (
                          <SelectItem key={r.id} value={r.id} disabled={r.is_available === false}>
                            {r.name} {r.is_available === false ? '(Unavailable)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Guests */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-terracotta-500" />
                  Guests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-1.5">Adults</label>
                    <Input
                      type="number"
                      min={1}
                      max={selectedType?.max_pax || 20}
                      value={form.num_adults}
                      onChange={e => setForm(f => ({ ...f, num_adults: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-1.5">Children</label>
                    <Input
                      type="number"
                      min={0}
                      max={20}
                      value={form.num_children}
                      onChange={e => setForm(f => ({ ...f, num_children: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                {selectedType && totalPax > selectedType.base_pax && (
                  <p className="text-xs text-amber-600 mt-2">
                    Extra pax surcharge applies: {formatPHP(selectedType.additional_pax_fee)}/person/night
                    for {totalPax - selectedType.base_pax} extra guest(s)
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Guest Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <User className="w-4 h-4 text-terracotta-500" />
                  Guest Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-1.5">First Name *</label>
                    <Input
                      value={form.guest_first_name}
                      onChange={e => setForm(f => ({ ...f, guest_first_name: e.target.value }))}
                      placeholder="Juan"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-1.5">Last Name *</label>
                    <Input
                      value={form.guest_last_name}
                      onChange={e => setForm(f => ({ ...f, guest_last_name: e.target.value }))}
                      placeholder="Dela Cruz"
                      required
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-1.5 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" /> Email
                    </label>
                    <Input
                      type="email"
                      value={form.guest_email}
                      onChange={e => setForm(f => ({ ...f, guest_email: e.target.value }))}
                      placeholder="guest@email.com"
                    />
                    <p className="text-xs text-forest-600/40 mt-1">Optional for walk-ins</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-1.5 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> Phone
                    </label>
                    <Input
                      value={form.guest_phone}
                      onChange={e => setForm(f => ({ ...f, guest_phone: e.target.value }))}
                      placeholder="09XX-XXX-XXXX"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-1.5 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" /> Special Requests
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    rows={3}
                    value={form.special_requests}
                    onChange={e => setForm(f => ({ ...f, special_requests: e.target.value }))}
                    placeholder="Any special requests or notes..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Add-ons */}
            {addons.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Add-ons (Optional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {addons.map(addon => {
                      const selected = selectedAddonIds.has(addon.id);
                      return (
                        <button
                          key={addon.id}
                          type="button"
                          onClick={() => toggleAddon(addon.id)}
                          className={`text-left p-3 rounded-lg border-2 transition-all ${selected
                            ? 'border-terracotta-400 bg-terracotta-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm text-forest-700">{addon.name}</span>
                            <span className="text-sm text-forest-600/50">{formatPHP(addon.price)}</span>
                          </div>
                          <span className="text-xs text-forest-600/40">{addon.pricing_model === 'per_person' ? 'per person' : 'per booking'}</span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* Right: Price summary sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card>
                <CardHeader className="bg-forest-500 text-white rounded-t-lg">
                  <CardTitle className="text-base font-semibold">Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                  {form.check_in_date && form.check_out_date && (
                    <div className="text-sm">
                      <span className="text-forest-600/50">Dates:</span>
                      <p className="font-medium text-forest-700">
                        {form.check_in_date} &rarr; {form.check_out_date}
                      </p>
                    </div>
                  )}

                  {selectedType && (
                    <div className="text-sm">
                      <span className="text-forest-600/50">Type:</span>
                      <p className="font-medium text-forest-700">{selectedType.name}</p>
                    </div>
                  )}

                  {form.room_id && (
                    <div className="text-sm">
                      <span className="text-forest-600/50">Room:</span>
                      <p className="font-medium text-forest-700">
                        {rooms.find(r => r.id === form.room_id)?.name || '—'}
                      </p>
                    </div>
                  )}

                  <div className="text-sm">
                    <span className="text-forest-600/50">Guests:</span>
                    <p className="font-medium text-forest-700">
                      {form.num_adults} adult{form.num_adults > 1 ? 's' : ''}
                      {form.num_children > 0 && `, ${form.num_children} child${form.num_children > 1 ? 'ren' : ''}`}
                    </p>
                  </div>

                  {selectedAddonIds.size > 0 && (
                    <div className="text-sm border-t pt-3">
                      <span className="text-forest-600/50">Add-ons:</span>
                      {Array.from(selectedAddonIds).map(id => {
                        const a = addons.find(x => x.id === id);
                        return a ? (
                          <p key={id} className="text-forest-700 mt-0.5">{a.name} — {formatPHP(a.price)}</p>
                        ) : null;
                      })}
                    </div>
                  )}

                  <div className="border-t-2 pt-4 mt-4">
                    {pricing ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-forest-600/50">Base ({pricing.totalNights} night{pricing.totalNights > 1 ? 's' : ''})</span>
                          <span className="font-medium">{formatPHP(pricing.totalBaseRate)}</span>
                        </div>
                        {pricing.totalPaxSurcharge > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-forest-600/50">Extra pax</span>
                            <span className="font-medium">{formatPHP(pricing.totalPaxSurcharge)}</span>
                          </div>
                        )}
                        {pricing.addonsTotal > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-forest-600/50">Add-ons</span>
                            <span className="font-medium">{formatPHP(pricing.addonsTotal)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-lg pt-3 border-t">
                          <span className="text-forest-700">Total</span>
                          <span className="text-forest-700">
                            {pricingLoading ? '...' : formatPHP(pricing.grandTotal)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-center text-forest-600/40">
                        {pricingLoading ? 'Calculating...' : 'Select dates and type to see pricing'}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full mt-4"
                    disabled={submitting || !form.room_id || !form.accommodation_type_id}
                    onClick={handleSubmit}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Booking'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function NewManualBookingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-forest-500" />
      </div>
    }>
      <NewManualBookingContent />
    </Suspense>
  );
}
