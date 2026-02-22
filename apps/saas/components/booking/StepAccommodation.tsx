'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { formatPHP } from '@/lib/pricing';
import { Users, Maximize, Check, AlertTriangle } from 'lucide-react';
import type { BookingState } from './BookingWizard';
import type { AccommodationType } from '@/types';

interface StepAccommodationProps {
  state: BookingState;
  updateState: (partial: Partial<BookingState>) => void;
  types: AccommodationType[];
}

interface TypeAvailability {
  anyDateFull: boolean;   // true if ANY date in range is fully booked
  allDatesFull: boolean;  // true if ALL dates in range are fully booked (completely unavailable)
  limited: boolean;       // true if availability is limited on some dates
}

export function StepAccommodation({ state, updateState, types }: StepAccommodationProps) {
  const [availability, setAvailability] = useState<Record<string, TypeAvailability>>({});
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const hasDates = !!state.checkIn && !!state.checkOut;

  // Fetch availability for all accommodation types when dates are set
  useEffect(() => {
    if (!hasDates) return;

    setLoadingAvailability(true);
    const abortController = new AbortController();

    const fetchAll = async () => {
      const results: Record<string, TypeAvailability> = {};

      try {
        await Promise.all(
          types.map(async (type) => {
            try {
              const url = `/api/public/availability?start_date=${encodeURIComponent(state.checkIn)}&end_date=${encodeURIComponent(state.checkOut)}&type_id=${type.id}`;
              const res = await fetch(url, { signal: abortController.signal });
              const data = await res.json();

              if (data.success && data.data) {
                const dates = Object.values(data.data) as { status: string }[];
                const fullDates = dates.filter(d => d.status === 'full').length;
                const limitedDates = dates.filter(d => d.status === 'limited').length;

                results[type.id] = {
                  anyDateFull: fullDates > 0,
                  allDatesFull: fullDates === dates.length && dates.length > 0,
                  limited: limitedDates > 0,
                };
              }
            } catch (err: unknown) {
              if (err instanceof Error && err.name !== 'AbortError') {
                console.error(`[availability] Failed to check type ${type.id}`, err);
              }
            }
          })
        );

        setAvailability(results);
      } finally {
        setLoadingAvailability(false);
      }
    };

    fetchAll();
    return () => abortController.abort();
  }, [state.checkIn, state.checkOut, types, hasDates]);

  return (
    <div>
      <h2 className="text-xl font-bold text-forest-500 mb-1">Choose Your Accommodation(s)</h2>
      <p className="text-sm text-forest-500/45 mb-6">
        Select one or more accommodation types for your stay.
      </p>

      <div className="grid gap-4">
        {types.map((type) => {
          const isSelected = state.selectedTypes?.some(t => t.id === type.id) || state.accommodationType?.id === type.id;
          const amenities = (type.amenities as string[]) || [];
          const avail = availability[type.id];
          const isFullyBooked = avail?.allDatesFull === true;
          const isLimited = avail?.limited === true && !isFullyBooked;
          const hasPartialConflict = avail?.anyDateFull === true && !isFullyBooked;

          return (
            <button
              key={type.id}
              disabled={isFullyBooked}
              onClick={() => {
                if (isFullyBooked) return;
                const current = state.selectedTypes || [];
                const exists = current.some(t => t.id === type.id);
                const nextTypes = exists ? current.filter(t => t.id !== type.id) : [...current, type];
                const nextPrimary = nextTypes[0] || null;

                updateState({
                  selectedTypes: nextTypes,
                  accommodationType: nextPrimary,
                  selectedRooms: [],
                  room: null,
                });
              }}
              className={cn(
                'text-left p-5 rounded-xl border-2 transition-all',
                isFullyBooked
                  ? 'border-stone-200 bg-stone-50 opacity-60 cursor-not-allowed'
                  : isSelected
                    ? 'border-forest-500 bg-forest-500/5 ring-1 ring-forest-500/20'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-forest-700">{type.name}</h3>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-forest-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {isFullyBooked && (
                      <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Fully Booked
                      </span>
                    )}
                    {(isLimited || hasPartialConflict) && !isFullyBooked && (
                      <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        Limited Availability
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-forest-500/45 mt-1">{type.short_description || ''}</p>

                  <div className="flex items-center gap-4 mt-3 text-sm text-forest-500/45">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {type.base_pax}–{type.max_pax} guests
                    </span>
                    {type.size_sqm && (
                      <span className="flex items-center gap-1">
                        <Maximize className="w-4 h-4" />
                        {type.size_sqm} sqm
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {amenities.slice(0, 4).map((a) => (
                      <span key={a} className="px-2 py-0.5 bg-stone-100 text-forest-500/55 text-xs rounded-full">
                        {a}
                      </span>
                    ))}
                    {amenities.length > 4 && (
                      <span className="px-2 py-0.5 bg-stone-100 text-forest-500/35 text-xs rounded-full">
                        +{amenities.length - 4}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className={cn('text-lg font-bold', isFullyBooked ? 'text-forest-500/30' : 'text-forest-500')}>
                    {formatPHP(type.base_rate_weekday)}
                  </p>
                  <p className="text-xs text-forest-500/35">per night (weekday)</p>
                  {type.base_rate_weekday !== type.base_rate_weekend && (
                    <p className="text-xs text-forest-500/35">
                      Weekend: {formatPHP(type.base_rate_weekend)}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {loadingAvailability && (
        <p className="text-xs text-forest-500/35 mt-4 text-center animate-pulse">
          Checking availability...
        </p>
      )}
    </div>
  );
}
