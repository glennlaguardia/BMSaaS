'use client';

import { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Users, Info } from 'lucide-react';
import { formatPHP } from '@/lib/pricing';
import type { BookingState } from './BookingWizard';

interface StepGuestsProps {
  state: BookingState;
  updateState: (partial: Partial<BookingState>) => void;
}

export function StepGuests({ state, updateState }: StepGuestsProps) {
  const maxPax = state.accommodationType?.max_pax || 6;
  const basePax = state.accommodationType?.base_pax || 4;
  const totalPax = state.numAdults + state.numChildren;
  const extraPax = Math.max(0, totalPax - basePax);
  const paxFee = state.accommodationType?.additional_pax_fee || 0;

  // Fetch pricing whenever guest count changes
  useEffect(() => {
    if (!state.accommodationType || !state.checkIn || !state.checkOut) return;

    fetch('/api/public/calculate-price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accommodation_type_id: state.accommodationType.id,
        check_in_date: state.checkIn,
        check_out_date: state.checkOut,
        num_adults: state.numAdults,
        num_children: state.numChildren,
        addon_ids: state.selectedAddons.map(a => a.addon.id),
        addon_quantities: state.selectedAddons.map(a => a.quantity),
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) updateState({ pricing: data.data });
      })
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.numAdults, state.numChildren, state.accommodationType?.id, state.checkIn, state.checkOut]);

  return (
    <div>
      <h2 className="text-xl font-bold text-forest-500 mb-1">Number of Guests</h2>
      <p className="text-sm text-forest-500/45 mb-6">
        {state.accommodationType?.name} accommodates {basePax} guests (max {maxPax}).
        {paxFee > 0 && ` Additional guests: ${formatPHP(paxFee)}/person/night.`}
      </p>

      <div className="max-w-sm space-y-6">
        {/* Adults */}
        <div>
          <Label className="text-sm font-medium text-forest-700">Adults</Label>
          <div className="flex items-center gap-4 mt-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateState({ numAdults: Math.max(1, state.numAdults - 1) })}
              disabled={state.numAdults <= 1}
              className="rounded-full"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="text-2xl font-bold text-forest-700 w-10 text-center">
              {state.numAdults}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateState({ numAdults: Math.min(maxPax - state.numChildren, state.numAdults + 1) })}
              disabled={totalPax >= maxPax}
              className="rounded-full"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Children */}
        <div>
          <Label className="text-sm font-medium text-forest-700">Children</Label>
          <div className="flex items-center gap-4 mt-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateState({ numChildren: Math.max(0, state.numChildren - 1) })}
              disabled={state.numChildren <= 0}
              className="rounded-full"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="text-2xl font-bold text-forest-700 w-10 text-center">
              {state.numChildren}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateState({ numChildren: Math.min(maxPax - state.numAdults, state.numChildren + 1) })}
              disabled={totalPax >= maxPax}
              className="rounded-full"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-stone-50 rounded-xl">
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-forest-500" />
          <span className="font-medium text-forest-700">
            {totalPax} guest{totalPax > 1 ? 's' : ''} total
          </span>
          {extraPax > 0 && (
            <span className="text-forest-500/45">
              ({extraPax} extra × {formatPHP(paxFee)}/night)
            </span>
          )}
        </div>
        {totalPax > maxPax && (
          <div className="flex items-center gap-2 mt-2 text-sm text-amber-600">
            <Info className="w-4 h-4" />
            Maximum capacity is {maxPax} guests for this accommodation.
          </div>
        )}
      </div>
    </div>
  );
}
