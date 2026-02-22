'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Tenant, AccommodationType, Addon, Room, BookingPriceState } from '@/types';

import { StepDates } from '@/components/booking/StepDates';
import { StepAccommodation } from '@/components/booking/StepAccommodation';
import { StepRoom } from '@/components/booking/StepRoom';
import { StepGuests } from '@/components/booking/StepGuests';
import { StepAddons } from '@/components/booking/StepAddons';
import { StepDetails } from '@/components/booking/StepDetails';
import { StepReview } from '@/components/booking/StepReview';
import { StepConfirmation } from '@/components/booking/StepConfirmation';
import { BookingCostBreakdown } from '@/components/booking/BookingCostBreakdown';

/** Per-room guest counts for multi-room bookings. */
export interface PerRoomGuestCount {
  numAdults: number;
  numChildren: number;
}

export interface BookingState {
  checkIn: string;
  checkOut: string;
  accommodationType: AccommodationType | null;
  // Multi-type support: full list of selected accommodation types.
  selectedTypes: AccommodationType[];
  room: Room | null;
  // Global guest counts (auto-summed from perRoomGuests in multi-room mode).
  numAdults: number;
  numChildren: number;
  // Multi-room support
  selectedRooms: Room[];
  // Per-room guest assignments keyed by room_id (multi-room only).
  perRoomGuests: Record<string, PerRoomGuestCount>;
  // Per-room addon selections keyed by room_id (multi-room only).
  // Global addons (per_booking) are stored in selectedAddons as before.
  perRoomAddons: Record<string, { addon: Addon; quantity: number }[]>;
  selectedAddons: { addon: Addon; quantity: number }[];
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialRequests: string;
  foodRestrictions: string;
  voucherCode: string;
  pricing: BookingPriceState | null;
  bookingId: string | null;
  referenceNumber: string | null;
  /** For multi-room: single group reference (GB-XXXXXXXX). */
  groupReferenceNumber: string | null;
  multiBookings?: { roomName: string; referenceNumber: string }[] | null;
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

interface PrefillData {
  checkIn?: string;
  checkOut?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  numAdults?: number;
  numChildren?: number;
}

interface BookingWizardProps {
  tenant: Tenant;
  accommodationTypes: AccommodationType[];
  addons: Addon[];
  prefill?: PrefillData;
  returnUrl?: string;
}

export function BookingWizard({ tenant, accommodationTypes, addons, prefill, returnUrl }: BookingWizardProps) {
  const hasPrefill = prefill && (prefill.checkIn || prefill.firstName);
  const [step, setStep] = useState(hasPrefill && prefill?.checkIn ? 2 : 1);
  const [submitting, setSubmitting] = useState(false);
  const [state, setState] = useState<BookingState>({
    checkIn: prefill?.checkIn || '',
    checkOut: prefill?.checkOut || '',
    accommodationType: null,
    selectedTypes: [],
    room: null,
    numAdults: prefill?.numAdults ?? 1,
    numChildren: prefill?.numChildren ?? 0,
    selectedRooms: [],
    perRoomGuests: {},
    perRoomAddons: {},
    selectedAddons: [],
    firstName: prefill?.firstName || '',
    lastName: prefill?.lastName || '',
    email: prefill?.email || '',
    phone: prefill?.phone || '',
    specialRequests: '',
    foodRestrictions: '',
    voucherCode: '',
    pricing: null,
    bookingId: null,
    referenceNumber: null,
    groupReferenceNumber: null,
  });

  const updateState = useCallback((partial: Partial<BookingState>) => {
    setState(prev => ({ ...prev, ...partial }));
  }, []);

  const canProceed = useCallback((): boolean => {
    switch (step) {
      case 1: return !!state.checkIn && !!state.checkOut;
      case 2: return (state.selectedTypes && state.selectedTypes.length > 0) || !!state.accommodationType;
      case 3: return !!state.room;
      case 4: {
        const rooms = state.selectedRooms.length > 0 ? state.selectedRooms : state.room ? [state.room] : [];
        const multi = rooms.length > 1;
        if (multi) {
          // Every room must have at least 1 adult
          return rooms.every(r => {
            const g = state.perRoomGuests[r.id];
            return g && g.numAdults >= 1;
          });
        }
        return state.numAdults >= 1;
      }
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
    if (!state.accommodationType?.id) {
      alert('Please select an accommodation type.');
      return;
    }

    // Determine which rooms are being booked: either the explicit multi-selection,
    // or the single legacy `room` field.
    const rooms =
      (state.selectedRooms && state.selectedRooms.length > 0)
        ? state.selectedRooms
        : state.room
          ? [state.room]
          : [];

    if (rooms.length === 0) {
      alert('Please select at least one room.');
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

      const perRoomBreakdown = state.pricing?.perRoomBreakdown;
      const usePerRoom = perRoomBreakdown && perRoomBreakdown.length === rooms.length;

      const isMultiRoom = rooms.length > 1;

      if (isMultiRoom) {
        // Require per-room breakdown; do not fall back to equal split.
        if (!usePerRoom) {
          setSubmitting(false);
          alert('Pricing is not ready for all rooms. Please go back to the room step and continue through the flow to recalculate the total.');
          return;
        }
        const roomPayloads: {
          room_id: string;
          accommodation_type_id: string;
          num_adults: number;
          num_children: number;
          base_amount: number;
          pax_surcharge: number;
          addons_amount: number;
          total_amount: number;
          addon_ids: string[];
          addon_quantities: number[];
          addon_prices: number[];
        }[] = [];
        for (const room of rooms) {
          const breakdown = perRoomBreakdown!.find(b => b.roomId === room.id);
          if (!breakdown) {
            setSubmitting(false);
            alert('Pricing is not ready for all rooms. Please go back to the room step and continue through the flow to recalculate the total.');
            return;
          }
          const roomAccommodationTypeId =
            room.accommodation_type_id || state.accommodationType?.id;

          // Per-room guest counts
          const roomGuests = state.perRoomGuests[room.id] ?? { numAdults: 1, numChildren: 0 };

          // Per-room addons (per_person) + global addons (per_booking)
          const roomPerPersonAddons = (state.perRoomAddons[room.id] ?? []);
          const globalPerBookingAddons = state.selectedAddons.filter(a => a.addon.pricing_model === 'per_booking');
          const allRoomAddons = [...roomPerPersonAddons, ...globalPerBookingAddons];
          const roomAddonIds = allRoomAddons.map(a => String(a.addon.id)).filter(Boolean);
          const roomAddonQtys = allRoomAddons.map(a => a.quantity || 1);
          const roomAddonPrices = allRoomAddons.map(a => Number(a.addon.price) || 0);

          roomPayloads.push({
            room_id: String(room.id),
            accommodation_type_id: String(roomAccommodationTypeId ?? ''),
            num_adults: roomGuests.numAdults,
            num_children: roomGuests.numChildren,
            base_amount: breakdown.baseAmount,
            pax_surcharge: breakdown.paxSurcharge,
            addons_amount: breakdown.addonsAmount,
            total_amount: breakdown.totalAmount,
            addon_ids: roomAddonIds,
            addon_quantities: roomAddonQtys,
            addon_prices: roomAddonPrices,
          });
        }

        const groupPayload = {
          group_booking: true,
          check_in_date: state.checkIn,
          check_out_date: state.checkOut,
          num_adults: Number(state.numAdults),
          num_children: Number(state.numChildren),
          guest_first_name: state.firstName.trim(),
          guest_last_name: state.lastName.trim(),
          guest_email: state.email.trim().toLowerCase(),
          guest_phone: state.phone.trim(),
          special_requests: state.specialRequests?.trim() || null,
          food_restrictions: state.foodRestrictions?.trim() || null,
          voucher_code: state.voucherCode?.trim() || null,
          rooms: roomPayloads,
        };

        const res = await fetch('/api/public/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(groupPayload),
        });
        const data = await res.json();
        if (!data.success) {
          const msg = data.details?.fieldErrors
            ? 'Validation error: ' + Object.entries(data.details.fieldErrors).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`).join('; ')
            : data.error || 'Booking failed. Please try again.';
          alert(msg);
          return;
        }
        const groupRef = data.data?.group_reference_number as string;
        updateState({
          groupReferenceNumber: groupRef,
          referenceNumber: groupRef,
          multiBookings: rooms.map(r => ({ roomName: r.name, referenceNumber: groupRef })),
        });
        setStep(8);
        return;
      }

      const created: { roomName: string; bookingId: string; referenceNumber: string }[] = [];
      for (const room of rooms) {
        const roomAccommodationTypeId =
          room.accommodation_type_id || state.accommodationType?.id;
        if (!roomAccommodationTypeId) continue;

        let base_amount: number;
        let pax_surcharge: number;
        let addons_amount: number;
        let total_amount: number;
        if (usePerRoom) {
          const breakdown = perRoomBreakdown!.find(b => b.roomId === room.id);
          if (breakdown) {
            base_amount = breakdown.baseAmount;
            pax_surcharge = breakdown.paxSurcharge;
            addons_amount = breakdown.addonsAmount;
            total_amount = breakdown.totalAmount;
          } else {
            const baseTotal = state.pricing?.totalBaseRate || 0;
            const paxTotal = state.pricing?.totalPaxSurcharge || 0;
            const addonsTotal = state.pricing?.addonsTotal || 0;
            const grandTotal = state.pricing?.grandTotal || 0;
            base_amount = baseTotal / rooms.length;
            pax_surcharge = paxTotal / rooms.length;
            addons_amount = addonsTotal / rooms.length;
            total_amount = grandTotal / rooms.length;
          }
        } else {
          const baseTotal = state.pricing?.totalBaseRate || 0;
          const paxTotal = state.pricing?.totalPaxSurcharge || 0;
          const addonsTotal = state.pricing?.addonsTotal || 0;
          const grandTotal = state.pricing?.grandTotal || 0;
          base_amount = baseTotal / rooms.length;
          pax_surcharge = paxTotal / rooms.length;
          addons_amount = addonsTotal / rooms.length;
          total_amount = grandTotal / rooms.length;
        }

        const payload = {
          room_id: String(room.id),
          accommodation_type_id: String(roomAccommodationTypeId),
          check_in_date: state.checkIn,
          check_out_date: state.checkOut,
          num_adults: Number(state.numAdults),
          num_children: Number(state.numChildren),
          guest_first_name: state.firstName.trim(),
          guest_last_name: state.lastName.trim(),
          guest_email: state.email.trim().toLowerCase(),
          guest_phone: state.phone.trim(),
          special_requests: state.specialRequests?.trim() || null,
          food_restrictions: state.foodRestrictions?.trim() || null,
          voucher_code: state.voucherCode?.trim() || null,
          addon_ids: addonIds,
          addon_quantities: addonQuantities,
          base_amount,
          pax_surcharge,
          addons_amount,
          discount_amount: 0,
          total_amount,
          addon_prices: addonPrices,
        };

        const res = await fetch('/api/public/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!data.success) {
          const msg = data.details?.fieldErrors
            ? 'Validation error: ' + Object.entries(data.details.fieldErrors).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`).join('; ')
            : data.error || 'Booking failed. Please try again.';
          alert(msg);
          return;
        }
        created.push({
          roomName: room.name,
          bookingId: data.data.booking_id as string,
          referenceNumber: data.data.reference_number as string,
        });
      }

      if (created.length > 0) {
        const primary = created[0];
        updateState({
          bookingId: primary.bookingId,
          referenceNumber: primary.referenceNumber,
          multiBookings: created.length > 1 ? created.map(b => ({ roomName: b.roomName, referenceNumber: b.referenceNumber })) : null,
        });
        setStep(8);
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
        returnUrl={returnUrl}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        {returnUrl ? (
          <a href={returnUrl} className="text-sm text-forest-600/80 hover:text-forest-700 flex items-center gap-1.5 font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to {tenant.name}
          </a>
        ) : (
          <span className="text-sm text-forest-600/80 flex items-center gap-1.5 font-medium">
            <ArrowLeft className="w-4 h-4" />
            {tenant.name}
          </span>
        )}
        <h1 className="font-display text-xl md:text-2xl font-semibold text-forest-700 hidden sm:block">
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
