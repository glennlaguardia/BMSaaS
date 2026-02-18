'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle, Copy, Home, BedDouble } from 'lucide-react';
import { useState } from 'react';
import type { BookingState } from './BookingWizard';
import type { Tenant } from '@/types';

interface StepConfirmationProps {
  state: BookingState;
  tenant: Tenant;
}

export function StepConfirmation({ state, tenant }: StepConfirmationProps) {
  const [copied, setCopied] = useState(false);

  const hasGroup = !!state.groupReferenceNumber;
  const hasMultiple = state.multiBookings && state.multiBookings.length > 1;
  const primaryReference = state.groupReferenceNumber || state.referenceNumber || state.multiBookings?.[0]?.referenceNumber || '';

  const copyRef = () => {
    if (primaryReference) {
      navigator.clipboard.writeText(primaryReference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const rules = tenant.booking_rules as unknown as Record<string, unknown> | null;
  const paymentDetails = (rules?.payment_details || {}) as Record<string, string>;

  // Build a URL to pre-fill dates and guest info for booking another room
  const bookAnotherParams = new URLSearchParams();
  if (state.checkIn) bookAnotherParams.set('checkIn', state.checkIn);
  if (state.checkOut) bookAnotherParams.set('checkOut', state.checkOut);
  if (state.firstName) bookAnotherParams.set('firstName', state.firstName);
  if (state.lastName) bookAnotherParams.set('lastName', state.lastName);
  if (state.email) bookAnotherParams.set('email', state.email);
  if (state.phone) bookAnotherParams.set('phone', state.phone);
  bookAnotherParams.set('numAdults', String(state.numAdults));
  bookAnotherParams.set('numChildren', String(state.numChildren));
  const bookAnotherRoomUrl = `/book?${bookAnotherParams.toString()}`;

  return (
    <div className="max-w-xl mx-auto px-4 py-12 md:py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-forest-500 flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-8 h-8 text-white" />
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-forest-500">
        {hasGroup ? 'Booking Group Submitted!' : hasMultiple ? 'Bookings Submitted!' : 'Booking Submitted!'}
      </h1>
      <p className="text-forest-500/45 mt-2">
        Your booking has been received. Please complete payment within 48 hours.
      </p>

      {/* Reference Number(s) */}
      <div className="mt-8 p-6 bg-white rounded-2xl border border-stone-200 shadow-sm">
        <p className="text-sm text-forest-500/45 mb-2">
          {hasGroup ? 'Your Group Reference Number' : hasMultiple ? 'Your Reference Numbers' : 'Your Reference Number'}
        </p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-2xl md:text-3xl font-bold tracking-wider text-forest-500">
            {primaryReference}
          </span>
          <button
            onClick={copyRef}
            className="p-2 rounded-lg hover:bg-stone-100 transition-colors"
            title="Copy reference number"
          >
            <Copy className="w-4 h-4 text-forest-500/35" />
          </button>
        </div>
        {hasMultiple && state.multiBookings && (
          <div className="mt-4 text-left space-y-1 text-sm text-forest-700">
            {state.multiBookings.map((b, idx) => (
              <p key={`${b.referenceNumber}-${idx}`}>
                <span className="font-medium">{b.roomName || 'Room'}:</span>{' '}
                <span className="font-mono">{b.referenceNumber}</span>
              </p>
            ))}
          </div>
        )}
        {copied && <p className="text-xs text-forest-500 mt-1">Copied!</p>}
      </div>

      {/* Payment Instructions */}
      <div className="mt-6 p-6 bg-amber-50 rounded-2xl text-left">
        <h3 className="font-semibold text-amber-800 mb-3">Payment Instructions</h3>
        <div className="space-y-2 text-sm text-amber-700">
          {paymentDetails.gcash_number && (
            <p>
              <strong>GCash:</strong> {paymentDetails.gcash_number} ({paymentDetails.gcash_name || 'Resort'})
            </p>
          )}
          {paymentDetails.bank_name && (
            <p>
              <strong>Bank Transfer:</strong> {paymentDetails.bank_name} — {paymentDetails.bank_account || 'Contact resort for details'}
            </p>
          )}
          <p className="mt-3 text-amber-600">
            After sending payment, you can upload your proof of payment or send it via Facebook/SMS to confirm your booking.
          </p>
        </div>
      </div>

      {/* Multi-Room Note */}
      {!hasMultiple && (
        <div className="mt-6 p-4 bg-forest-50 rounded-2xl border border-forest-200">
          <p className="text-sm text-forest-700">
            <strong>Need multiple rooms?</strong> You can book additional rooms for the same dates. 
            Your guest info will be pre-filled for convenience.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        {!hasMultiple && (
          <Button asChild className="bg-forest-500 hover:bg-forest-600 text-white rounded-full px-8">
            <Link href={bookAnotherRoomUrl}>
              <BedDouble className="w-4 h-4 mr-2" />
              Book Another Room
            </Link>
          </Button>
        )}
        <Button asChild variant="outline" className="rounded-full px-8">
          <Link href="/">
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>
      </div>

      <p className="text-xs text-forest-500/35 mt-6">
        Confirmation details will be sent to <strong>{state.email}</strong> once payment is verified.
      </p>
    </div>
  );
}
