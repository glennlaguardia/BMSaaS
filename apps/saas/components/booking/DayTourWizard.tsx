'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format, addDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Loader2,
  CalendarDays,
  Users,
  ArrowLeft,
  ArrowRight,
  Check,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPHP } from '@/lib/pricing';
import { Receipt, ChevronDown, ChevronUp, Plus, Minus, CheckCircle, Copy, Home } from 'lucide-react';
import type { Tenant, Addon } from '@/types';

// ---- Types ----
interface DayTourWizardProps {
  tenant: Tenant;
  addons: Addon[];
}

const STEPS = [
  { id: 1, label: 'Date & Guests' },
  { id: 2, label: 'Add-ons' },
  { id: 3, label: 'Your Details' },
];

// ---- Component ----
export function DayTourWizard({ tenant, addons }: DayTourWizardProps) {
  // Step state
  const [step, setStep] = useState(1);

  // Step 1 — Date & Guests
  const [tourDate, setTourDate] = useState('');
  const [numAdults, setNumAdults] = useState(1);
  const [numChildren, setNumChildren] = useState(0);

  // Step 2 — Add-ons
  const [selectedAddons, setSelectedAddons] = useState<{ addon: Addon; quantity: number }[]>([]);

  // Step 3 — Guest Details
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    booking_id: string;
    reference_number: string;
  } | null>(null);

  // Mobile summary
  const [mobileExpanded, setMobileExpanded] = useState(false);

  // Copy ref
  const [copied, setCopied] = useState(false);

  // ---- Pricing ----
  const baseAmount =
    numAdults * tenant.day_tour_rate_adult +
    numChildren * tenant.day_tour_rate_child;
  const totalPax = numAdults + numChildren;

  let addonsAmount = 0;
  for (const { addon, quantity } of selectedAddons) {
    if (addon.pricing_model === 'per_person') {
      addonsAmount += addon.price * totalPax * quantity;
    } else {
      addonsAmount += addon.price * quantity;
    }
  }
  const totalAmount = baseAmount + addonsAmount;

  // ---- Date bounds ----
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const maxDate = format(addDays(new Date(), 90), 'yyyy-MM-dd');

  // ---- Applicable add-ons ----
  const applicableAddons = addons.filter(
    (a) => a.applies_to === 'day_tour' || a.applies_to === 'both'
  );

  // ---- Addon helpers ----
  const toggleAddon = (addon: Addon) => {
    const exists = selectedAddons.find((a) => a.addon.id === addon.id);
    if (exists) {
      setSelectedAddons(selectedAddons.filter((a) => a.addon.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, { addon, quantity: 1 }]);
    }
  };

  const updateAddonQuantity = (addonId: string, delta: number) => {
    setSelectedAddons(
      selectedAddons
        .map((a) =>
          a.addon.id === addonId
            ? { ...a, quantity: Math.max(1, a.quantity + delta) }
            : a
        )
    );
  };

  const isAddonSelected = (id: string) =>
    selectedAddons.some((a) => a.addon.id === id);

  // ---- Validation ----
  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return !!tourDate && numAdults >= 1;
      case 2:
        return true; // addons are optional
      case 3: {
        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
        const phoneClean = phone.trim().replace(/[\s\-()]/g, '');
        const phoneValid = phoneClean.length >= 7 && phoneClean.length <= 15;
        return (
          firstName.trim().length >= 2 &&
          lastName.trim().length >= 2 &&
          emailValid &&
          phoneValid
        );
      }
      default:
        return false;
    }
  };

  // ---- Navigation ----
  const handleNext = () => {
    if (canProceed() && step < 3) setStep((s) => s + 1);
  };
  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  // ---- Submit ----
  const handleSubmit = async () => {
    if (!canProceed()) return;
    setSubmitting(true);
    try {
      const payload = {
        tour_date: tourDate,
        num_adults: numAdults,
        num_children: numChildren,
        guest_first_name: firstName.trim(),
        guest_last_name: lastName.trim(),
        guest_email: email.trim().toLowerCase(),
        guest_phone: phone.trim(),
        special_requests: specialRequests.trim() || null,
        addon_ids: selectedAddons.map((a) => String(a.addon.id)),
        addon_quantities: selectedAddons.map((a) => a.quantity),
        base_amount: baseAmount,
        addons_amount: addonsAmount,
        total_amount: totalAmount,
      };

      const res = await fetch('/api/public/day-tour-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setBookingResult({
          booking_id: data.data.booking_id,
          reference_number: data.data.reference_number,
        });
        setStep(4);
      } else {
        const msg = data.details?.fieldErrors
          ? 'Validation error: ' +
            Object.entries(data.details.fieldErrors)
              .map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`)
              .join('; ')
          : data.error || 'Booking failed. Please try again.';
        alert(msg);
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Copy reference number
  const copyRef = () => {
    if (bookingResult?.reference_number) {
      navigator.clipboard.writeText(bookingResult.reference_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ================================================================
  // Step 4 — Confirmation
  // ================================================================
  if (step === 4 && bookingResult) {
    const rules = tenant.booking_rules as unknown as Record<string, unknown> | null;
    const paymentDetails = (rules?.payment_details || {}) as Record<string, string>;

    return (
      <div className="max-w-xl mx-auto px-4 py-12 md:py-20 text-center">
        {/* Animated checkmark */}
        <div className="w-20 h-20 rounded-full bg-forest-500 flex items-center justify-center mx-auto mb-6 animate-[scale-in_0.4s_ease-out]">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-forest-500">
          Day Tour Booked!
        </h1>
        <p className="text-forest-500/45 mt-2">
          Your day tour booking has been received. Please complete payment to confirm your spot.
        </p>

        {/* Reference Number */}
        <div className="mt-8 p-6 bg-white rounded-2xl border border-stone-200 shadow-sm">
          <p className="text-sm text-forest-500/45 mb-2">Your Reference Number</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl md:text-3xl font-bold tracking-wider text-forest-500">
              {bookingResult.reference_number}
            </span>
            <button
              onClick={copyRef}
              className="p-2 rounded-lg hover:bg-stone-100 transition-colors"
              title="Copy reference number"
            >
              <Copy className="w-4 h-4 text-forest-500/35" />
            </button>
          </div>
          {copied && <p className="text-xs text-forest-500 mt-1">Copied!</p>}
        </div>

        {/* Payment Instructions */}
        <div className="mt-6 p-6 bg-amber-50 rounded-2xl text-left">
          <h3 className="font-semibold text-amber-800 mb-3">Payment Instructions</h3>
          <div className="space-y-2 text-sm text-amber-700">
            {paymentDetails.gcash_number && (
              <p>
                <strong>GCash:</strong> {paymentDetails.gcash_number}{' '}
                ({paymentDetails.gcash_name || 'Resort'})
              </p>
            )}
            {paymentDetails.bank_name && (
              <p>
                <strong>Bank Transfer:</strong> {paymentDetails.bank_name} —{' '}
                {paymentDetails.bank_account || 'Contact resort for details'}
              </p>
            )}
            <p className="mt-3 text-amber-600">
              After sending payment, you can upload your proof of payment or send it
              via Facebook/SMS to confirm your booking.
            </p>
          </div>
        </div>

        {/* Booking summary */}
        <div className="mt-6 p-6 bg-cream-50 rounded-2xl text-left border border-cream-200">
          <h3 className="font-semibold text-forest-700 mb-3">Booking Summary</h3>
          <div className="space-y-2 text-sm text-forest-500/60">
            <div className="flex justify-between">
              <span>Tour Date</span>
              <span className="font-medium text-forest-700">{tourDate}</span>
            </div>
            <div className="flex justify-between">
              <span>Guests</span>
              <span className="font-medium text-forest-700">
                {numAdults} adult{numAdults > 1 ? 's' : ''}
                {numChildren > 0 && `, ${numChildren} child${numChildren > 1 ? 'ren' : ''}`}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-cream-200">
              <span className="font-semibold text-forest-700">Total</span>
              <span className="font-bold text-forest-500">{formatPHP(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild className="bg-forest-500 hover:bg-forest-600 text-white rounded-full px-8">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>

        <p className="text-xs text-forest-500/35 mt-6">
          Confirmation details will be sent to <strong>{email}</strong> once payment is verified.
        </p>
      </div>
    );
  }

  // ================================================================
  // Main Wizard Layout
  // ================================================================
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <Link
          href="/"
          className="text-sm text-forest-500/60 hover:text-forest-500 flex items-center gap-1.5 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {tenant.name}
        </Link>
        <h1 className="font-display text-xl md:text-2xl font-semibold text-forest-500 hidden sm:block">
          <MapPin className="w-5 h-5 inline-block mr-1.5 -mt-0.5 text-amber-400" />
          Book a Day Tour
        </h1>
      </div>

      {/* Progress Steps */}
      <div className="mb-10 max-w-2xl">
        <div className="flex items-center justify-between">
          {STEPS.map((s) => (
            <div key={s.id} className="flex items-center">
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300',
                  step > s.id
                    ? 'bg-forest-500 text-white shadow-sm'
                    : step === s.id
                    ? 'bg-forest-500 text-white ring-4 ring-forest-500/15 shadow-sm'
                    : 'bg-cream-200 text-forest-500/30'
                )}
              >
                {step > s.id ? <Check className="w-4 h-4" /> : s.id}
              </div>
              <span
                className={cn(
                  'hidden sm:block ml-2.5 text-sm font-medium transition-colors duration-200',
                  step >= s.id ? 'text-forest-500' : 'text-forest-500/30'
                )}
              >
                {s.label}
              </span>
              {s.id < 3 && (
                <div
                  className={cn(
                    'hidden sm:block w-12 md:w-20 h-[2px] mx-2 rounded-full transition-colors duration-300',
                    step > s.id ? 'bg-forest-500' : 'bg-cream-200'
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main content + sidebar */}
      <div className="flex gap-8 items-start">
        {/* Form Steps */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl shadow-sm border border-forest-100/30 p-6 md:p-8 min-h-[400px] animate-fade-in">
            {/* ---- Step 1: Date & Guests ---- */}
            {step === 1 && (
              <div>
                <h2 className="text-xl font-bold text-forest-600 mb-1">
                  <CalendarDays className="w-5 h-5 inline-block mr-1.5 -mt-0.5 text-amber-400" />
                  Choose Your Date & Guests
                </h2>
                <p className="text-sm text-forest-600/70 mb-6">
                  Pick a date and let us know how many guests are coming.
                </p>

                {/* Day tour time info */}
                <div className="mb-6 p-4 bg-cream-50 rounded-xl border border-cream-200">
                  <p className="text-sm font-medium text-forest-700">
                    Day Tour Hours
                  </p>
                  <p className="text-sm text-forest-600/80 mt-0.5">
                    {tenant.day_tour_start} — {tenant.day_tour_end}
                  </p>
                  <p className="text-xs text-forest-600/70 mt-2">
                    {formatPHP(tenant.day_tour_rate_adult)}/adult &middot;{' '}
                    {formatPHP(tenant.day_tour_rate_child)}/child
                  </p>
                </div>

                {/* Tour date */}
                <div className="mb-6">
                  <Label htmlFor="tourDate" className="text-sm font-medium text-forest-700 mb-1.5 block">
                    Tour Date
                  </Label>
                  <Input
                    id="tourDate"
                    type="date"
                    min={tomorrow}
                    max={maxDate}
                    value={tourDate}
                    onChange={(e) => setTourDate(e.target.value)}
                    className="max-w-xs"
                  />
                </div>

                {/* Adults */}
                <div className="mb-5">
                  <Label className="text-sm font-medium text-forest-700 mb-1.5 block">
                    Adults
                  </Label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setNumAdults(Math.max(1, numAdults - 1))}
                      className="w-10 h-10 rounded-full border-2 border-forest-200 flex items-center justify-center hover:border-forest-400 transition-colors"
                    >
                      <Minus className="w-4 h-4 text-forest-500" />
                    </button>
                    <span className="w-12 text-center text-lg font-bold text-forest-700">
                      {numAdults}
                    </span>
                    <button
                      type="button"
                      onClick={() => setNumAdults(Math.min(50, numAdults + 1))}
                      className="w-10 h-10 rounded-full border-2 border-forest-200 flex items-center justify-center hover:border-forest-400 transition-colors"
                    >
                      <Plus className="w-4 h-4 text-forest-500" />
                    </button>
                    <span className="text-sm text-forest-500/40 ml-2">
                      {formatPHP(tenant.day_tour_rate_adult)} each
                    </span>
                  </div>
                </div>

                {/* Children */}
                <div className="mb-5">
                  <Label className="text-sm font-medium text-forest-700 mb-1.5 block">
                    Children
                  </Label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setNumChildren(Math.max(0, numChildren - 1))}
                      className="w-10 h-10 rounded-full border-2 border-forest-200 flex items-center justify-center hover:border-forest-400 transition-colors"
                    >
                      <Minus className="w-4 h-4 text-forest-500" />
                    </button>
                    <span className="w-12 text-center text-lg font-bold text-forest-700">
                      {numChildren}
                    </span>
                    <button
                      type="button"
                      onClick={() => setNumChildren(Math.min(50, numChildren + 1))}
                      className="w-10 h-10 rounded-full border-2 border-forest-200 flex items-center justify-center hover:border-forest-400 transition-colors"
                    >
                      <Plus className="w-4 h-4 text-forest-500" />
                    </button>
                    <span className="text-sm text-forest-500/40 ml-2">
                      {formatPHP(tenant.day_tour_rate_child)} each
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ---- Step 2: Add-ons ---- */}
            {step === 2 && (
              <div>
                <h2 className="text-xl font-bold text-forest-500 mb-1">
                  Enhance Your Day Tour
                </h2>
                <p className="text-sm text-forest-500/45 mb-6">
                  Add experiences and extras to make your visit even better. These are
                  optional.
                </p>

                {applicableAddons.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-forest-500/40 font-medium">
                      No add-ons available for day tours at this time.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {applicableAddons.map((addon) => {
                      const selected = isAddonSelected(addon.id);
                      const selectedEntry = selectedAddons.find(
                        (a) => a.addon.id === addon.id
                      );
                      const priceDisplay =
                        addon.pricing_model === 'per_person'
                          ? `${formatPHP(addon.price)}/person`
                          : `${formatPHP(addon.price)}/booking`;

                      const qty = selectedEntry?.quantity ?? 1;
                      const estimatedTotal =
                        addon.pricing_model === 'per_person'
                          ? addon.price * totalPax * qty
                          : addon.price * qty;

                      return (
                        <div
                          key={addon.id}
                          className={cn(
                            'p-4 rounded-xl border-2 transition-all',
                            selected
                              ? 'border-amber-300 bg-amber-300/5'
                              : 'border-stone-200 hover:border-stone-300 bg-white'
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => toggleAddon(addon)}
                            className="text-left w-full"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-forest-700">
                                    {addon.name}
                                  </h3>
                                  {selected ? (
                                    <div className="w-5 h-5 rounded-full bg-amber-300 flex items-center justify-center">
                                      <Check className="w-3 h-3 text-white" />
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 rounded-full border-2 border-stone-300 flex items-center justify-center">
                                      <Plus className="w-3 h-3 text-forest-500/35" />
                                    </div>
                                  )}
                                </div>
                                {addon.description && (
                                  <p className="text-sm text-forest-500/45 mt-1">
                                    {addon.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs bg-stone-100 text-forest-500/45 px-2 py-0.5 rounded-full">
                                    {addon.category}
                                  </span>
                                  <span className="text-xs text-forest-500/35">
                                    {priceDisplay}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="font-bold text-forest-500">
                                  {formatPHP(estimatedTotal)}
                                </p>
                                {addon.pricing_model === 'per_person' &&
                                  totalPax > 1 && (
                                    <p className="text-xs text-forest-500/35">
                                      for {totalPax} guests
                                    </p>
                                  )}
                              </div>
                            </div>
                          </button>

                          {/* Quantity selector (shown when selected) */}
                          {selected && (
                            <div className="mt-3 pt-3 border-t border-stone-100 flex items-center gap-3">
                              <span className="text-xs font-medium text-forest-500/50">
                                Qty:
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateAddonQuantity(addon.id, -1)
                                }
                                className="w-7 h-7 rounded-full border border-stone-200 flex items-center justify-center hover:border-stone-400 transition-colors"
                              >
                                <Minus className="w-3 h-3 text-forest-500" />
                              </button>
                              <span className="w-8 text-center text-sm font-bold text-forest-700">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateAddonQuantity(addon.id, 1)
                                }
                                className="w-7 h-7 rounded-full border border-stone-200 flex items-center justify-center hover:border-stone-400 transition-colors"
                              >
                                <Plus className="w-3 h-3 text-forest-500" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ---- Step 3: Guest Details ---- */}
            {step === 3 && (
              <div>
                <h2 className="text-xl font-bold text-forest-500 mb-1">
                  <Users className="w-5 h-5 inline-block mr-1.5 -mt-0.5 text-amber-400" />
                  Your Details
                </h2>
                <p className="text-sm text-forest-500/45 mb-6">
                  Tell us who to expect so we can prepare for your arrival.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="firstName" className="text-sm font-medium text-forest-700 mb-1.5 block">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="Juan"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-sm font-medium text-forest-700 mb-1.5 block">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Dela Cruz"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-forest-700 mb-1.5 block">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="juan@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-forest-700 mb-1.5 block">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="0917 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="specialRequests" className="text-sm font-medium text-forest-700 mb-1.5 block">
                    Special Requests{' '}
                    <span className="text-forest-500/30 font-normal">(optional)</span>
                  </Label>
                  <textarea
                    id="specialRequests"
                    rows={3}
                    placeholder="Any dietary restrictions, accessibility needs, celebrations, etc."
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-7 pb-24 lg:pb-0">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={step === 1}
              className="rounded-full font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {step < 3 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="rounded-full px-8 font-semibold"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting || !canProceed()}
                variant="amber"
                className="rounded-full px-8"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Confirm Day Tour'
                )}
              </Button>
            )}
          </div>
        </div>

        {/* ================================================================ */}
        {/* Cost Summary — Desktop Sidebar */}
        {/* ================================================================ */}
        <div className="hidden lg:block w-80 flex-shrink-0">
          <div className="sticky top-8">
            <Card className="rounded-2xl shadow-sm border-forest-100/30 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-forest-500 to-forest-600 px-5 py-4">
                <div className="flex items-center gap-2.5 text-white">
                  <Receipt className="w-5 h-5 text-amber-300" />
                  <h3 className="font-bold text-lg">Day Tour Summary</h3>
                </div>
              </div>

              <CardContent className="p-5 space-y-4">
                {/* Tour date */}
                {tourDate && (
                  <div className="pb-4 border-b border-forest-100/20">
                    <p className="text-[10px] font-semibold text-forest-500/35 uppercase tracking-[0.15em] mb-1.5">
                      Tour Date
                    </p>
                    <p className="text-sm font-semibold text-forest-700">
                      {tourDate}
                    </p>
                    <p className="text-xs text-forest-500/40 mt-0.5">
                      {tenant.day_tour_start} — {tenant.day_tour_end}
                    </p>
                  </div>
                )}

                {/* Guests */}
                <div className="pb-4 border-b border-forest-100/20">
                  <p className="text-[10px] font-semibold text-forest-500/35 uppercase tracking-[0.15em] mb-1.5">
                    Guests
                  </p>
                  <p className="text-sm text-forest-700">
                    {numAdults} adult{numAdults > 1 ? 's' : ''}
                    {numChildren > 0 &&
                      `, ${numChildren} child${numChildren > 1 ? 'ren' : ''}`}
                  </p>
                </div>

                {/* Add-ons (visible from step 2+) */}
                {selectedAddons.length > 0 && step >= 2 && (
                  <div className="pb-4 border-b border-forest-100/20">
                    <p className="text-[10px] font-semibold text-forest-500/35 uppercase tracking-[0.15em] mb-2">
                      Add-ons
                    </p>
                    {selectedAddons.map(({ addon, quantity }) => {
                      const lineTotal =
                        addon.pricing_model === 'per_person'
                          ? addon.price * totalPax * quantity
                          : addon.price * quantity;
                      return (
                        <div
                          key={addon.id}
                          className="flex justify-between text-sm mt-1.5"
                        >
                          <span className="text-forest-500/60 truncate mr-2">
                            {addon.name}
                            {quantity > 1 && ` x${quantity}`}
                          </span>
                          <span className="text-forest-700 flex-shrink-0 font-medium">
                            {formatPHP(lineTotal)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Price breakdown */}
                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-forest-500/50">
                      Base ({numAdults} adult{numAdults > 1 ? 's' : ''}
                      {numChildren > 0
                        ? `, ${numChildren} child${numChildren > 1 ? 'ren' : ''}`
                        : ''}
                      )
                    </span>
                    <span className="font-medium text-forest-700">
                      {formatPHP(baseAmount)}
                    </span>
                  </div>

                  {addonsAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-forest-500/50">Add-ons</span>
                      <span className="font-medium text-forest-700">
                        {formatPHP(addonsAmount)}
                      </span>
                    </div>
                  )}

                  <div className="pt-4 mt-3 border-t-2 border-forest-500/15">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-forest-500">Total</span>
                      <span className="font-bold text-2xl text-forest-500">
                        {formatPHP(totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* Cost Summary — Mobile Bottom Bar */}
      {/* ================================================================ */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <div
          className={cn(
            'bg-white border-t border-forest-100/30 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] transition-all duration-300',
            mobileExpanded ? 'rounded-t-2xl' : ''
          )}
        >
          {mobileExpanded && (
            <div className="px-5 pt-5 pb-2 max-h-[60vh] overflow-y-auto space-y-3">
              {tourDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-forest-500/50">Tour Date</span>
                  <span className="text-forest-700 font-medium">{tourDate}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-forest-500/50">Guests</span>
                <span className="text-forest-700 font-medium">
                  {numAdults} adult{numAdults > 1 ? 's' : ''}
                  {numChildren > 0 &&
                    `, ${numChildren} child${numChildren > 1 ? 'ren' : ''}`}
                </span>
              </div>

              <div className="border-t border-forest-100/20 pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-forest-500/50">Base amount</span>
                  <span className="font-medium">{formatPHP(baseAmount)}</span>
                </div>
                {addonsAmount > 0 && (
                  <div className="flex justify-between text-sm mt-1.5">
                    <span className="text-forest-500/50">Add-ons</span>
                    <span className="font-medium">{formatPHP(addonsAmount)}</span>
                  </div>
                )}
              </div>

              {selectedAddons.length > 0 && (
                <div className="border-t border-forest-100/20 pt-3">
                  {selectedAddons.map(({ addon, quantity }) => {
                    const lineTotal =
                      addon.pricing_model === 'per_person'
                        ? addon.price * totalPax * quantity
                        : addon.price * quantity;
                    return (
                      <div
                        key={addon.id}
                        className="flex justify-between text-xs text-forest-500/50 mt-1.5"
                      >
                        <span>
                          {addon.name}
                          {quantity > 1 && ` x${quantity}`}
                        </span>
                        <span className="font-medium">{formatPHP(lineTotal)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Always-visible summary bar */}
          <button
            onClick={() => setMobileExpanded(!mobileExpanded)}
            className="w-full flex items-center justify-between px-5 py-4"
          >
            <div className="flex items-center gap-2.5">
              <Receipt className="w-4 h-4 text-forest-500" />
              <span className="text-sm font-semibold text-forest-700">
                {formatPHP(totalAmount)}
              </span>
            </div>
            {mobileExpanded ? (
              <ChevronDown className="w-4 h-4 text-forest-500/40" />
            ) : (
              <ChevronUp className="w-4 h-4 text-forest-500/40" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
