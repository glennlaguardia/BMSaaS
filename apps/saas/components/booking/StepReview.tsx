'use client';

import { useEffect, useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { formatPHP } from '@/lib/pricing';
import { CalendarDays, Bed, Users, Package, User, Info } from 'lucide-react';
import type { BookingState } from './BookingWizard';
import type { Tenant, PriceCalculation } from '@/types';

interface StepReviewProps {
  state: BookingState;
  tenant: Tenant;
}

export function StepReview({ state, tenant }: StepReviewProps) {
  const [pricing, setPricing] = useState<PriceCalculation | null>(state.pricing);

  useEffect(() => {
    // Re-use pricing calculated in the sidebar to avoid duplicate server calls.
    if (state.pricing) {
      setPricing(state.pricing);
    }
  }, [state.pricing]);

  const nights = state.checkIn && state.checkOut
    ? differenceInDays(new Date(state.checkOut), new Date(state.checkIn))
    : 0;

  return (
    <div>
      <h2 className="text-xl font-bold text-forest-500 mb-1">Review Your Booking</h2>
      <p className="text-sm text-forest-500/45 mb-6">
        Please review all details before confirming.
      </p>

      <div className="space-y-5">
        {/* Dates */}
        <div className="flex items-start gap-3 p-4 bg-stone-50 rounded-xl">
          <CalendarDays className="w-5 h-5 text-forest-500 mt-0.5" />
          <div>
            <p className="font-medium text-forest-700">
              {state.checkIn && format(new Date(state.checkIn), 'EEEE, MMMM d, yyyy')}
              <span className="text-forest-500/35 mx-2">→</span>
              {state.checkOut && format(new Date(state.checkOut), 'EEEE, MMMM d, yyyy')}
            </p>
            <p className="text-sm text-forest-500/45">
              {nights} night{nights > 1 ? 's' : ''} · Check-in {tenant.check_in_time || '3:00 PM'} · Check-out {tenant.check_out_time || '10:00 AM'}
            </p>
          </div>
        </div>

        {/* Accommodation & Rooms */}
        <div className="flex items-start gap-3 p-4 bg-stone-50 rounded-xl">
          <Bed className="w-5 h-5 text-forest-500 mt-0.5" />
          <div>
            <p className="font-medium text-forest-700">
              {state.selectedTypes && state.selectedTypes.length > 0
                ? state.selectedTypes.map(t => t.name).join(' · ')
                : state.accommodationType?.name}
            </p>
            {state.selectedRooms && state.selectedRooms.length > 0 ? (
              <ul className="mt-1 text-sm text-forest-500/45 space-y-0.5">
                {state.selectedRooms.map(room => (
                  <li key={room.id}>{room.name}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-forest-500/45">{state.room?.name}</p>
            )}
          </div>
        </div>

        {/* Guests */}
        <div className="flex items-start gap-3 p-4 bg-stone-50 rounded-xl">
          <Users className="w-5 h-5 text-forest-500 mt-0.5" />
          <div>
            <p className="font-medium text-forest-700">
              {state.numAdults} adult{state.numAdults > 1 ? 's' : ''}
              {state.numChildren > 0 && `, ${state.numChildren} child${state.numChildren > 1 ? 'ren' : ''}`}
            </p>
            <p className="text-sm text-forest-500/45">
              {state.numAdults + state.numChildren} guest{state.numAdults + state.numChildren > 1 ? 's' : ''} total
            </p>
            {state.selectedRooms && state.selectedRooms.length > 1 && state.perRoomGuests && (
              <ul className="mt-2 space-y-1 text-xs text-forest-500/45">
                {state.selectedRooms.map(room => {
                  const g = state.perRoomGuests[room.id];
                  if (!g) return null;
                  return (
                    <li key={room.id}>
                      {room.name}: {g.numAdults} adult{g.numAdults !== 1 ? 's' : ''}{g.numChildren > 0 ? `, ${g.numChildren} child${g.numChildren !== 1 ? 'ren' : ''}` : ''}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Add-ons */}
        {state.selectedAddons.length > 0 && (
          <div className="flex items-start gap-3 p-4 bg-stone-50 rounded-xl">
            <Package className="w-5 h-5 text-forest-500 mt-0.5" />
            <div>
              <p className="font-medium text-forest-700">Add-ons</p>
              {state.selectedAddons.map(({ addon }) => (
                <p key={addon.id} className="text-sm text-forest-500/45">
                  {addon.name} — {formatPHP(addon.price)} {addon.pricing_model === 'per_person' ? '/person' : '/booking'}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Guest Details */}
        <div className="flex items-start gap-3 p-4 bg-stone-50 rounded-xl">
          <User className="w-5 h-5 text-forest-500 mt-0.5" />
          <div>
            <p className="font-medium text-forest-700">
              {state.firstName} {state.lastName}
            </p>
            <p className="text-sm text-forest-500/45">{state.email}</p>
            <p className="text-sm text-forest-500/45">{state.phone}</p>
            {state.specialRequests && (
              <p className="text-sm text-forest-500/35 mt-1 italic">&ldquo;{state.specialRequests}&rdquo;</p>
            )}
          </div>
        </div>

        {/* Pricing Breakdown */}
        {pricing && (
          <div className="p-5 bg-forest-500/5 rounded-xl border border-forest-500/10">
            <h3 className="font-semibold text-forest-500 mb-3">Price Breakdown</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-forest-500/55">
                  Base rate ({pricing.totalNights} night{pricing.totalNights > 1 ? 's' : ''})
                </span>
                <span className="font-medium">{formatPHP(pricing.totalBaseRate)}</span>
              </div>
              {pricing.totalPaxSurcharge > 0 && (
                <div className="flex justify-between">
                  <span className="text-forest-500/55">
                    Extra guest surcharge ({pricing.extraPax} pax × {nights} nights)
                  </span>
                  <span className="font-medium">{formatPHP(pricing.totalPaxSurcharge)}</span>
                </div>
              )}
              {pricing.addonsTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-forest-500/55">Add-ons</span>
                  <span className="font-medium">{formatPHP(pricing.addonsTotal)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-forest-500/10 flex justify-between">
                <span className="font-bold text-forest-500">Total</span>
                <span className="font-bold text-forest-500 text-lg">{formatPHP(pricing.grandTotal)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Payment note */}
        <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 p-4 rounded-xl">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Payment Required Within 48 Hours</p>
            <p className="text-amber-600 mt-0.5">
              After confirming, you will receive payment instructions. 
              Your booking will be held for 48 hours pending payment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
