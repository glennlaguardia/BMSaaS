'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Tenant, AccommodationType, Addon, Room, PriceCalculation } from '@/types';

import { StepDates } from '@/components/booking/StepDates';
import { StepAccommodation } from '@/components/booking/StepAccommodation';
import { StepRoom } from '@/components/booking/StepRoom';
import { StepGuests } from '@/components/booking/StepGuests';
import { StepAddons } from '@/components/booking/StepAddons';
import { StepDetails } from '@/components/booking/StepDetails';
import { StepReview } from '@/components/booking/StepReview';
import { StepConfirmation } from '@/components/booking/StepConfirmation';
import { BookingCostBreakdown } from '@/components/booking/BookingCostBreakdown';

export interface BookingState {
  checkIn: string;
  checkOut: string;
  accommodationType: AccommodationType | null;
  room: Room | null;
  numAdults: number;
  numChildren: number;
  selectedAddons: { addon: Addon; quantity: number }[];
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialRequests: string;
  pricing: PriceCalculation | null;
  bookingId: string | null;
  referenceNumber: string | null;
}

const STEPS = [
  { id: 1, label: 'Dates' },
  { id: 2, label: 'Type' },
  { id: 3, label: 'Room' },
  { id: 4, label: 'Guests' },
  { id: 5, label: 'Add-ons' },
  { id: 6, label: 'Details' },
  { id: 7, label: 'Review' },
];

interface BookingWizardProps {
  tenant: Tenant;
  accommodationTypes: AccommodationType[];
  addons: Addon[];
}

export function BookingWizard({ tenant, accommodationTypes, addons }: BookingWizardProps) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [state, setState] = useState<BookingState>({
    checkIn: '',
    checkOut: '',
    accommodationType: null,
    room: null,
    numAdults: 2,
    numChildren: 0,
    selectedAddons: [],
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialRequests: '',
    pricing: null,
    bookingId: null,
    referenceNumber: null,
  });

  const updateState = useCallback((partial: Partial<BookingState>) => {
    setState(prev => ({ ...prev, ...partial }));
  }, []);

  const canProceed = useCallback((): boolean => {
    switch (step) {
      case 1: return !!state.checkIn && !!state.checkOut;
      case 2: return !!state.accommodationType;
      case 3: return !!state.room;
      case 4: return state.numAdults >= 1;
      case 5: return true;
      case 6: {
        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email.trim());
        const phoneClean = state.phone.trim().replace(/[\s\-()]/g, '');
        const phoneValid = phoneClean.length >= 7 && phoneClean.length <= 15;
        return (
          state.firstName.trim().length >= 2 &&
          state.lastName.trim().length >= 2 &&
          emailValid &&
          phoneValid
        );
      }
      case 7: return true;
      default: return false;
    }
  }, [step, state]);

  const handleNext = () => {
    if (canProceed() && step < 7) setStep(s => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(s => s - 1);
  };

  const handleSubmit = async () => {
    if (!state.room?.id || !state.accommodationType?.id) {
      alert('Please select a room and accommodation type.');
      return;
    }
    setSubmitting(true);
    try {
      const addonIds = state.selectedAddons
        .map(a => String(a.addon.id))
        .filter(id => id && id !== 'undefined');
      const addonQuantities = state.selectedAddons
        .filter(a => a.addon.id)
        .map(a => a.quantity || 1);
      const addonPrices = state.selectedAddons
        .filter(a => a.addon.id)
        .map(a => Number(a.addon.price) || 0);

      const payload = {
        room_id: String(state.room.id),
        accommodation_type_id: String(state.accommodationType.id),
        check_in_date: state.checkIn,
        check_out_date: state.checkOut,
        num_adults: Number(state.numAdults),
        num_children: Number(state.numChildren),
        guest_first_name: state.firstName.trim(),
        guest_last_name: state.lastName.trim(),
        guest_email: state.email.trim().toLowerCase(),
        guest_phone: state.phone.trim(),
        special_requests: state.specialRequests?.trim() || null,
        addon_ids: addonIds,
        addon_quantities: addonQuantities,
        base_amount: state.pricing?.totalBaseRate || 0,
        pax_surcharge: state.pricing?.totalPaxSurcharge || 0,
        addons_amount: state.pricing?.addonsTotal || 0,
        discount_amount: 0,
        total_amount: state.pricing?.grandTotal || 0,
        addon_prices: addonPrices,
      };

      const res = await fetch('/api/public/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        updateState({
          bookingId: data.data.booking_id,
          referenceNumber: data.data.reference_number,
        });
        setStep(8);
      } else {
        const msg = data.details?.fieldErrors
          ? 'Validation error: ' + Object.entries(data.details.fieldErrors).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`).join('; ')
          : data.error || 'Booking failed. Please try again.';
        alert(msg);
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 8) {
    return (
      <StepConfirmation
        state={state}
        tenant={tenant}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <Link href="/" className="text-sm text-forest-500/60 hover:text-forest-500 flex items-center gap-1.5 font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to {tenant.name}
        </Link>
        <h1 className="font-display text-xl md:text-2xl font-semibold text-forest-500 hidden sm:block">
          Book Your Stay
        </h1>
      </div>

      {/* Progress Steps */}
      <div className="mb-10 max-w-4xl">
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
              {s.id < 7 && (
                <div className={cn(
                  'hidden sm:block w-8 md:w-14 h-[2px] mx-2 rounded-full transition-colors duration-300',
                  step > s.id ? 'bg-forest-500' : 'bg-cream-200'
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main content + sidebar */}
      <div className="flex gap-8 items-start">
        {/* Step Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl shadow-sm border border-forest-100/30 p-6 md:p-8 min-h-[400px] animate-fade-in">
            {step === 1 && (
              <StepDates state={state} updateState={updateState} tenant={tenant} />
            )}
            {step === 2 && (
              <StepAccommodation
                state={state}
                updateState={updateState}
                types={accommodationTypes}
              />
            )}
            {step === 3 && (
              <StepRoom state={state} updateState={updateState} />
            )}
            {step === 4 && (
              <StepGuests state={state} updateState={updateState} />
            )}
            {step === 5 && (
              <StepAddons state={state} updateState={updateState} addons={addons} />
            )}
            {step === 6 && (
              <StepDetails state={state} updateState={updateState} />
            )}
            {step === 7 && (
              <StepReview state={state} tenant={tenant} />
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

            {step < 7 ? (
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
                disabled={submitting}
                variant="amber"
                className="rounded-full px-8"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Confirm Booking'
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Cost Breakdown Sidebar */}
        <BookingCostBreakdown state={state} updateState={updateState} currentStep={step} />
      </div>
    </div>
  );
}
