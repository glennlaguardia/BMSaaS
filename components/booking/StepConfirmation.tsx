'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle, Copy, Home } from 'lucide-react';
import { useState } from 'react';
import type { BookingState } from './BookingWizard';
import type { Tenant } from '@/types';

interface StepConfirmationProps {
  state: BookingState;
  tenant: Tenant;
}

export function StepConfirmation({ state, tenant }: StepConfirmationProps) {
  const [copied, setCopied] = useState(false);

  const copyRef = () => {
    if (state.referenceNumber) {
      navigator.clipboard.writeText(state.referenceNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const rules = tenant.booking_rules as unknown as Record<string, unknown> | null;
  const paymentDetails = (rules?.payment_details || {}) as Record<string, string>;

  return (
    <div className="max-w-xl mx-auto px-4 py-12 md:py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-forest-500 flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-8 h-8 text-white" />
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-forest-500">
        Booking Submitted!
      </h1>
      <p className="text-forest-500/45 mt-2">
        Your booking has been received. Please complete payment within 48 hours.
      </p>

      {/* Reference Number */}
      <div className="mt-8 p-6 bg-white rounded-2xl border border-stone-200 shadow-sm">
        <p className="text-sm text-forest-500/45 mb-2">Your Reference Number</p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-2xl md:text-3xl font-bold tracking-wider text-forest-500">
            {state.referenceNumber}
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
        A confirmation details will be sent to <strong>{state.email}</strong> once payment is verified.
      </p>
    </div>
  );
}
