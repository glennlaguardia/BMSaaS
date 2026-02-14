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
      case 5: return true; // Addons are optional
      case 6: return !!state.firstName && !!state.lastName && !!state.email && !!state.phone;
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
    setSubmitting(true);
    try {
      const res = await fetch('/api/public/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: state.room?.id,
          accommodation_type_id: state.accommodationType?.id,
          check_in_date: state.checkIn,
          check_out_date: state.checkOut,
          num_adults: state.numAdults,
          num_children: state.numChildren,
          guest_first_name: state.firstName,
          guest_last_name: state.lastName,
          guest_email: state.email,
          guest_phone: state.phone,
          special_requests: state.specialRequests || null,
          addon_ids: state.selectedAddons.map(a => a.addon.id),
          base_amount: state.pricing?.totalBaseRate || 0,
          pax_surcharge: state.pricing?.totalPaxSurcharge || 0,
          addons_amount: state.pricing?.addonsTotal || 0,
          discount_amount: 0,
          total_amount: state.pricing?.grandTotal || 0,
          addon_prices: state.selectedAddons.map(a => a.addon.price),
        }),
      });

      const data = await res.json();
      if (data.success) {
        updateState({
          bookingId: data.data.booking_id,
          referenceNumber: data.data.reference_number,
        });
        setStep(8); // Confirmation
      } else {
        alert(data.error || 'Booking failed. Please try again.');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Confirmation step
  if (step === 8) {
    return (
      <StepConfirmation
        state={state}
        tenant={tenant}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/" className="text-sm text-[#2D5016] hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Back to {tenant.name}
        </Link>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((s) => (
            <div key={s.id} className="flex items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  step > s.id
                    ? 'bg-[#2D5016] text-white'
                    : step === s.id
                    ? 'bg-[#2D5016] text-white ring-4 ring-[#2D5016]/20'
                    : 'bg-stone-200 text-stone-500'
                )}
              >
                {step > s.id ? <Check className="w-4 h-4" /> : s.id}
              </div>
              <span
                className={cn(
                  'hidden sm:block ml-2 text-sm font-medium',
                  step >= s.id ? 'text-[#2D5016]' : 'text-stone-400'
                )}
              >
                {s.label}
              </span>
              {s.id < 7 && (
                <div className={cn(
                  'hidden sm:block w-8 md:w-12 h-px mx-2',
                  step > s.id ? 'bg-[#2D5016]' : 'bg-stone-200'
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 md:p-8 min-h-[400px]">
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
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={step === 1}
          className="rounded-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {step < 7 ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="bg-[#2D5016] hover:bg-[#1e3a0f] text-white rounded-full px-8"
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-[#D4A574] hover:bg-[#c49464] text-[#1a3409] font-semibold rounded-full px-8"
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
  );
}
