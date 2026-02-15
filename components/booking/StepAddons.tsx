'use client';

import { cn } from '@/lib/utils';
import { formatPHP } from '@/lib/pricing';
import { Check, Plus } from 'lucide-react';
import type { BookingState } from './BookingWizard';
import type { Addon } from '@/types';

interface StepAddonsProps {
  state: BookingState;
  updateState: (partial: Partial<BookingState>) => void;
  addons: Addon[];
}

export function StepAddons({ state, updateState, addons }: StepAddonsProps) {
  const toggleAddon = (addon: Addon) => {
    const existing = state.selectedAddons.find(a => a.addon.id === addon.id);
    if (existing) {
      updateState({
        selectedAddons: state.selectedAddons.filter(a => a.addon.id !== addon.id),
      });
    } else {
      updateState({
        selectedAddons: [...state.selectedAddons, { addon, quantity: 1 }],
      });
    }
  };

  const isSelected = (id: string) => state.selectedAddons.some(a => a.addon.id === id);

  const totalPax = state.numAdults + state.numChildren;

  return (
    <div>
      <h2 className="text-xl font-bold text-forest-500 mb-1">Enhance Your Stay</h2>
      <p className="text-sm text-forest-500/45 mb-6">
        Add experiences and meals to make your visit unforgettable. These are optional.
      </p>

      <div className="grid gap-3">
        {addons.map((addon) => {
          const selected = isSelected(addon.id);
          const priceDisplay = addon.pricing_model === 'per_person'
            ? `${formatPHP(addon.price)}/person`
            : `${formatPHP(addon.price)}/booking`;

          const estimatedTotal = addon.pricing_model === 'per_person'
            ? addon.price * totalPax
            : addon.price;

          return (
            <button
              key={addon.id}
              onClick={() => toggleAddon(addon)}
              className={cn(
                'text-left p-4 rounded-xl border-2 transition-all',
                selected
                  ? 'border-amber-300 bg-amber-300/5'
                  : 'border-stone-200 hover:border-stone-300 bg-white'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-forest-700">{addon.name}</h3>
                    {selected ? (
                      <div className="w-5 h-5 rounded-full bg-amber-300 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-stone-300 flex items-center justify-center">
                        <Plus className="w-3 h-3 text-forest-500/35" />
                      </div>
                    )}
                  </div>
                  {addon.description && (
                    <p className="text-sm text-forest-500/45 mt-1">{addon.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-stone-100 text-forest-500/45 px-2 py-0.5 rounded-full">
                      {addon.category}
                    </span>
                    <span className="text-xs text-forest-500/35">{priceDisplay}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-forest-500">{formatPHP(estimatedTotal)}</p>
                  {addon.pricing_model === 'per_person' && totalPax > 1 && (
                    <p className="text-xs text-forest-500/35">for {totalPax} guests</p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {addons.length === 0 && (
        <p className="text-center text-forest-500/45 py-8">
          No add-ons available at this time.
        </p>
      )}
    </div>
  );
}
