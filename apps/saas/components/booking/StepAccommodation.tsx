'use client';

import { cn } from '@/lib/utils';
import { formatPHP } from '@/lib/pricing';
import { Users, Maximize, Check } from 'lucide-react';
import type { BookingState } from './BookingWizard';
import type { AccommodationType } from '@/types';

interface StepAccommodationProps {
  state: BookingState;
  updateState: (partial: Partial<BookingState>) => void;
  types: AccommodationType[];
}

export function StepAccommodation({ state, updateState, types }: StepAccommodationProps) {
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

          return (
            <button
              key={type.id}
              onClick={() => {
                const current = state.selectedTypes || [];
                const exists = current.some(t => t.id === type.id);
                const nextTypes = exists ? current.filter(t => t.id !== type.id) : [...current, type];
                const nextPrimary = nextTypes[0] || null;

                updateState({
                  selectedTypes: nextTypes,
                  accommodationType: nextPrimary,
                  // Clear any previously selected rooms when types change
                  selectedRooms: [],
                  room: null,
                });
              }}
              className={cn(
                'text-left p-5 rounded-xl border-2 transition-all',
                isSelected
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
                  <p className="text-lg font-bold text-forest-500">
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
    </div>
  );
}
