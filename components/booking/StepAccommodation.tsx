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
      <h2 className="text-xl font-bold text-[#2D5016] mb-1">Choose Your Accommodation</h2>
      <p className="text-sm text-stone-500 mb-6">
        Select the type of accommodation for your stay.
      </p>

      <div className="grid gap-4">
        {types.map((type) => {
          const isSelected = state.accommodationType?.id === type.id;
          const amenities = (type.amenities as string[]) || [];

          return (
            <button
              key={type.id}
              onClick={() => updateState({ accommodationType: type, room: null })}
              className={cn(
                'text-left p-5 rounded-xl border-2 transition-all',
                isSelected
                  ? 'border-[#2D5016] bg-[#2D5016]/5 ring-1 ring-[#2D5016]/20'
                  : 'border-stone-200 hover:border-stone-300 bg-white'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-zinc-900">{type.name}</h3>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[#2D5016] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-stone-500 mt-1">{type.short_description || ''}</p>

                  <div className="flex items-center gap-4 mt-3 text-sm text-stone-500">
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
                      <span key={a} className="px-2 py-0.5 bg-stone-100 text-stone-600 text-xs rounded-full">
                        {a}
                      </span>
                    ))}
                    {amenities.length > 4 && (
                      <span className="px-2 py-0.5 bg-stone-100 text-stone-400 text-xs rounded-full">
                        +{amenities.length - 4}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-[#2D5016]">
                    {formatPHP(type.base_rate_weekday)}
                  </p>
                  <p className="text-xs text-stone-400">per night (weekday)</p>
                  {type.base_rate_weekday !== type.base_rate_weekend && (
                    <p className="text-xs text-stone-400">
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
