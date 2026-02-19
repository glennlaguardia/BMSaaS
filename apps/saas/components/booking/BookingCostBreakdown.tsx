'use client';

import { useEffect, useState } from 'react';
import { differenceInDays } from 'date-fns';
import { formatPHP, calculateMultiRoomPrice } from '@/lib/pricing';
import { Receipt, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RateAdjustment } from '@/types';
import type { BookingState } from './BookingWizard';

interface BookingCostBreakdownProps {
  state: BookingState;
  updateState: (partial: Partial<BookingState>) => void;
  currentStep: number;
}

export function BookingCostBreakdown({ state, updateState, currentStep }: BookingCostBreakdownProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasAccommodation = !!state.accommodationType;
  const hasDates = !!state.checkIn && !!state.checkOut;
  const nights = hasDates ? differenceInDays(new Date(state.checkOut), new Date(state.checkIn)) : 0;
  const totalPax = state.numAdults + state.numChildren;

  const selectedRooms = state.selectedRooms?.length ? state.selectedRooms : state.room ? [state.room] : [];
  const selectedTypes = state.selectedTypes?.length ? state.selectedTypes : state.accommodationType ? [state.accommodationType] : [];
  const isMultiRoom = selectedRooms.length > 1 || selectedTypes.length > 1;

  useEffect(() => {
    if (!state.accommodationType || !state.checkIn || !state.checkOut) return;
    if (currentStep < 2) return;

    setLoading(true);
    const abortController = new AbortController();

    if (isMultiRoom && selectedRooms.length > 0 && selectedTypes.length > 0) {
      const typeMap = new Map(selectedTypes.map(t => [t.id, t]));
      const roomEntries = selectedRooms
        .map(r => {
          const typeId = (r as { accommodation_type_id?: string }).accommodation_type_id;
          const type = (typeId && typeMap.get(typeId)) || state.accommodationType;
          const g = state.perRoomGuests?.[r.id] ?? { numAdults: 1, numChildren: 0 };
          return type ? { roomId: r.id, type, numAdults: g.numAdults, numChildren: g.numChildren } : null;
        })
        .filter((e): e is { roomId: string; type: NonNullable<typeof state.accommodationType>; numAdults: number; numChildren: number } => e != null);

      if (roomEntries.length === 0) {
        setLoading(false);
        return;
      }

      // Separate global (per_booking) addons from per-room (per_person) addons
      const globalAddons = state.selectedAddons.filter(a => a.addon.pricing_model === 'per_booking');
      const perRoomAddons = state.perRoomAddons ?? {};

      const rateAdjustmentsUrl = `/api/public/rate-adjustments?check_in=${encodeURIComponent(state.checkIn)}&check_out=${encodeURIComponent(state.checkOut)}`;
      fetch(rateAdjustmentsUrl, { signal: abortController.signal })
        .then(r => r.json())
        .then(data => {
          const adjustments = (data.success && data.data ? data.data : []) as RateAdjustment[];
          const result = calculateMultiRoomPrice(
            state.checkIn,
            state.checkOut,
            roomEntries,
            adjustments,
            globalAddons,
            perRoomAddons
          );
          updateState({ pricing: result });
        })
        .catch(err => {
          if (err.name !== 'AbortError') console.error(err);
        })
        .finally(() => setLoading(false));
      return () => abortController.abort();
    }

    fetch('/api/public/calculate-price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accommodation_type_id: String(state.accommodationType.id),
        check_in_date: state.checkIn,
        check_out_date: state.checkOut,
        num_adults: state.numAdults,
        num_children: state.numChildren,
        addon_ids: state.selectedAddons.map(a => String(a.addon.id)),
        addon_quantities: state.selectedAddons.map(a => a.quantity),
      }),
      signal: abortController.signal,
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) updateState({ pricing: data.data });
      })
      .catch(err => {
        if (err.name !== 'AbortError') console.error(err);
      })
      .finally(() => setLoading(false));

    return () => abortController.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.accommodationType?.id,
    state.checkIn,
    state.checkOut,
    state.numAdults,
    state.numChildren,
    isMultiRoom,
    selectedRooms.length,
    selectedTypes.length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    state.selectedAddons.map(a => `${a.addon.id}:${a.quantity}`).join(','),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(state.perRoomGuests),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(state.perRoomAddons),
    currentStep,
  ]);

  if (!hasDates || currentStep < 1) return null;

  const pricing = state.pricing;
  const totalDiscount =
    pricing && Array.isArray((pricing as { nights?: { adjustmentAmount?: number }[] }).nights)
      ? ((pricing as { nights: { adjustmentAmount?: number }[] }).nights).reduce(
        (sum: number, n: { adjustmentAmount?: number }) => sum + (n.adjustmentAmount || 0),
        0,
      )
      : 0;

  return (
    <>
      {/* Desktop: sidebar */}
      <div className="hidden lg:block w-80 flex-shrink-0">
        <div className="sticky top-8">
          <div className="bg-white rounded-2xl shadow-sm border border-forest-100/30 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-forest-500 to-forest-600 px-5 py-4">
              <div className="flex items-center gap-2.5 text-white">
                <Receipt className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-lg">Booking Summary</h3>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Dates */}
              {hasDates && (
                <div className="pb-4 border-b border-forest-100/20">
                  <p className="text-[10px] font-semibold text-forest-500/35 uppercase tracking-[0.15em] mb-1.5">Stay</p>
                  <p className="text-sm font-semibold text-forest-700">
                    {nights} night{nights > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-forest-500/40 mt-0.5">{state.checkIn} &rarr; {state.checkOut}</p>
                </div>
              )}

              {/* Accommodation */}
              {hasAccommodation && (
                <div className="pb-4 border-b border-forest-100/20">
                  <p className="text-[10px] font-semibold text-forest-500/35 uppercase tracking-[0.15em] mb-1.5">Accommodation</p>
                  <p className="text-sm font-semibold text-forest-700">{state.accommodationType?.name}</p>
                  {state.room && (
                    <p className="text-xs text-forest-500/40 mt-0.5">{state.room.name}</p>
                  )}
                </div>
              )}

              {/* Guests */}
              {currentStep >= 4 && (
                <div className="pb-4 border-b border-forest-100/20">
                  <p className="text-[10px] font-semibold text-forest-500/35 uppercase tracking-[0.15em] mb-1.5">Guests</p>
                  <p className="text-sm text-forest-700">
                    {state.numAdults} adult{state.numAdults > 1 ? 's' : ''}
                    {state.numChildren > 0 && `, ${state.numChildren} child${state.numChildren > 1 ? 'ren' : ''}`}
                  </p>
                </div>
              )}

              {/* Add-ons */}
              {state.selectedAddons.length > 0 && currentStep >= 5 && (
                <div className="pb-4 border-b border-forest-100/20">
                  <p className="text-[10px] font-semibold text-forest-500/35 uppercase tracking-[0.15em] mb-2">Add-ons</p>
                  {state.selectedAddons.map(({ addon }) => (
                    <div key={addon.id} className="flex justify-between text-sm mt-1.5">
                      <span className="text-forest-500/60 truncate mr-2">{addon.name}</span>
                      <span className="text-forest-700 flex-shrink-0 font-medium">
                        {formatPHP(
                          addon.pricing_model === 'per_person'
                            ? addon.price * totalPax
                            : addon.price
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Price Breakdown */}
              {pricing && hasAccommodation && (
                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-forest-500/50">
                      Base rate ({pricing.totalNights} night{pricing.totalNights > 1 ? 's' : ''})
                    </span>
                    <span className="font-medium text-forest-700">{formatPHP(pricing.totalBaseRate)}</span>
                  </div>

                  {totalDiscount < 0 && (
                    <>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-forest-500/45">Original base rate</span>
                        <span className="font-medium line-through text-forest-500/40">
                          {formatPHP(pricing.totalBaseRate - totalDiscount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-forest-500/55">
                          Discount
                        </span>
                        <span className="font-medium text-forest-700">
                          {formatPHP(totalDiscount)}
                        </span>
                      </div>
                    </>
                  )}

                  {pricing.totalPaxSurcharge > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-forest-500/50">Extra pax surcharge</span>
                      <span className="font-medium text-forest-700">{formatPHP(pricing.totalPaxSurcharge)}</span>
                    </div>
                  )}

                  {pricing.addonsTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-forest-500/50">Add-ons</span>
                      <span className="font-medium text-forest-700">{formatPHP(pricing.addonsTotal)}</span>
                    </div>
                  )}

                  <div className="pt-4 mt-3 border-t-2 border-forest-500/15">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-forest-500">Total</span>
                      <span className="font-bold text-2xl text-forest-500">
                        {loading ? '...' : formatPHP(pricing.grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {!pricing && hasAccommodation && (
                <div className="text-center py-3">
                  <p className="text-xs text-forest-500/30 font-medium">
                    {loading ? 'Calculating...' : 'Price will update as you proceed'}
                  </p>
                </div>
              )}

              {!hasAccommodation && (
                <div className="text-center py-3">
                  <p className="text-xs text-forest-500/30 font-medium">Select an accommodation to see pricing</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: collapsible bottom bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className={cn(
          'bg-white border-t border-forest-100/30 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] transition-all duration-300',
          expanded ? 'rounded-t-2xl' : ''
        )}>
          {expanded && (
            <div className="px-5 pt-5 pb-2 max-h-[60vh] overflow-y-auto space-y-3">
              {hasDates && (
                <div className="flex justify-between text-sm">
                  <span className="text-forest-500/50">Stay</span>
                  <span className="text-forest-700 font-medium">{nights} night{nights > 1 ? 's' : ''}</span>
                </div>
              )}
              {hasAccommodation && (
                <div className="flex justify-between text-sm">
                  <span className="text-forest-500/50">Type</span>
                  <span className="text-forest-700 font-medium">{state.accommodationType?.name}</span>
                </div>
              )}
              {state.room && (
                <div className="flex justify-between text-sm">
                  <span className="text-forest-500/50">Room</span>
                  <span className="text-forest-700 font-medium">{state.room.name}</span>
                </div>
              )}
              {pricing && (
                <>
                  <div className="border-t border-forest-100/20 pt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-forest-500/50">Base rate</span>
                      <span className="font-medium">{formatPHP(pricing.totalBaseRate)}</span>
                    </div>
                    {pricing.totalPaxSurcharge > 0 && (
                      <div className="flex justify-between text-sm mt-1.5">
                        <span className="text-forest-500/50">Extra pax</span>
                        <span className="font-medium">{formatPHP(pricing.totalPaxSurcharge)}</span>
                      </div>
                    )}
                    {pricing.addonsTotal > 0 && (
                      <div className="flex justify-between text-sm mt-1.5">
                        <span className="text-forest-500/50">Add-ons</span>
                        <span className="font-medium">{formatPHP(pricing.addonsTotal)}</span>
                      </div>
                    )}
                  </div>
                  {state.selectedAddons.length > 0 && (
                    <div className="border-t border-forest-100/20 pt-3">
                      {state.selectedAddons.map(({ addon }) => (
                        <div key={addon.id} className="flex justify-between text-xs text-forest-500/50 mt-1.5">
                          <span>{addon.name}</span>
                          <span className="font-medium">{formatPHP(addon.pricing_model === 'per_person' ? addon.price * totalPax : addon.price)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Always-visible summary bar */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-5 py-4"
          >
            <div className="flex items-center gap-2.5">
              <Receipt className="w-4 h-4 text-forest-500" />
              <span className="text-sm font-semibold text-forest-700">
                {pricing ? formatPHP(pricing.grandTotal) : 'Booking Summary'}
              </span>
              {loading && <span className="text-xs text-forest-500/30 animate-pulse">updating...</span>}
            </div>
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-forest-500/40" />
            ) : (
              <ChevronUp className="w-4 h-4 text-forest-500/40" />
            )}
          </button>
        </div>
      </div>
    </>
  );
}
