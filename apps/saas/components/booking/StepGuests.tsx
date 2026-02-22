'use client';

import { useEffect, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Users, Info, Bed } from 'lucide-react';
import { formatPHP } from '@/lib/pricing';
import type { BookingState, PerRoomGuestCount } from './BookingWizard';

interface StepGuestsProps {
  state: BookingState;
  updateState: (partial: Partial<BookingState>) => void;
}

export function StepGuests({ state, updateState }: StepGuestsProps) {
  const selectedRooms = state.selectedRooms?.length > 0
    ? state.selectedRooms
    : state.room ? [state.room] : [];

  const isMultiRoom = selectedRooms.length > 1;
  const typeMap = new Map((state.selectedTypes ?? []).map(t => [t.id, t]));

  const getTypeForRoom = useCallback((room: typeof selectedRooms[0]) => {
    const typeId = room.accommodation_type_id;
    return (typeId && typeMap.get(typeId)) || state.accommodationType;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedTypes, state.accommodationType]);

  // Initialize perRoomGuests for any rooms that don't have entries yet
  useEffect(() => {
    if (!isMultiRoom) return;
    const current = { ...state.perRoomGuests };
    let changed = false;
    for (const room of selectedRooms) {
      if (!current[room.id]) {
        current[room.id] = { numAdults: 1, numChildren: 0 };
        changed = true;
      }
    }
    if (changed) {
      updateState({ perRoomGuests: current });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRooms.length, isMultiRoom]);

  // Auto-sum per-room guests into global totals (multi-room)
  const syncGlobalGuests = useCallback((prg: Record<string, PerRoomGuestCount>) => {
    let totalAdults = 0;
    let totalChildren = 0;
    for (const room of selectedRooms) {
      const g = prg[room.id];
      if (g) {
        totalAdults += g.numAdults;
        totalChildren += g.numChildren;
      }
    }
    updateState({ perRoomGuests: prg, numAdults: totalAdults, numChildren: totalChildren });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRooms.length]);

  const updateRoomGuests = (roomId: string, field: 'numAdults' | 'numChildren', delta: number) => {
    const current = { ...state.perRoomGuests };
    const g = current[roomId] ?? { numAdults: 1, numChildren: 0 };
    const newVal = g[field] + delta;
    if (field === 'numAdults' && newVal < 1) return;
    if (field === 'numChildren' && newVal < 0) return;
    current[roomId] = { ...g, [field]: newVal };
    syncGlobalGuests(current);
  };

  // Fetch pricing for single room - always called, guarded internally
  useEffect(() => {
    if (isMultiRoom) return;
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
      .then(data => { if (data.success) updateState({ pricing: data.data }); })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMultiRoom, state.numAdults, state.numChildren, state.accommodationType?.id, state.checkIn, state.checkOut]);

  // --- Single-room mode (original behavior) ---
  if (!isMultiRoom) {
    const maxPax = state.accommodationType?.max_pax || 6;
    const basePax = state.accommodationType?.base_pax || 4;
    const paxFee = state.accommodationType?.additional_pax_fee || 0;
    const totalPax = state.numAdults + state.numChildren;
    const extraPax = Math.max(0, totalPax - basePax);

    return (
      <div>
        <h2 className="text-xl font-bold text-forest-500 mb-1">Number of Guests</h2>
        <p className="text-sm text-forest-500/45 mb-6">
          Your accommodation holds {basePax} guests (max {maxPax}).
          {paxFee > 0 && ` Additional guests: ${formatPHP(paxFee)}/person/night.`}
        </p>
        <div className="flex items-center gap-2 mb-6 p-3 bg-forest-50/50 rounded-lg text-xs text-forest-600">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>1 child (6 years old and below) stays <strong>free</strong> per room and is not counted toward extra guest fees.</span>
        </div>
        <div className="max-w-sm space-y-6">
          <GuestCounter
            label="Adults"
            value={state.numAdults}
            onDecrement={() => updateState({ numAdults: Math.max(1, state.numAdults - 1) })}
            onIncrement={() => updateState({ numAdults: Math.min(maxPax - state.numChildren, state.numAdults + 1) })}
            decrementDisabled={state.numAdults <= 1}
            incrementDisabled={totalPax >= maxPax}
          />
          <GuestCounter
            label="Children"
            value={state.numChildren}
            onDecrement={() => updateState({ numChildren: Math.max(0, state.numChildren - 1) })}
            onIncrement={() => updateState({ numChildren: Math.min(maxPax - state.numAdults, state.numChildren + 1) })}
            decrementDisabled={state.numChildren <= 0}
            incrementDisabled={totalPax >= maxPax}
          />
        </div>
        <GuestSummary totalPax={totalPax} extraPax={extraPax} paxFee={paxFee} maxPax={maxPax} />
      </div>
    );
  }

  // --- Multi-room mode: per-room guest assignment ---
  return (
    <div>
      <h2 className="text-xl font-bold text-forest-500 mb-1">Guests per Room</h2>
      <p className="text-sm text-forest-500/45 mb-6">
        Assign the number of guests to each room. Each room has its own capacity limit and fees for extra guests.
      </p>

      <div className="space-y-4">
        {selectedRooms.map((room) => {
          const type = getTypeForRoom(room);
          const maxPax = type?.max_pax ?? 6;
          const basePax = type?.base_pax ?? 4;
          const paxFee = type?.additional_pax_fee ?? 0;
          const g = state.perRoomGuests[room.id] ?? { numAdults: 1, numChildren: 0 };
          const roomPax = g.numAdults + g.numChildren;
          const roomExtra = Math.max(0, roomPax - basePax);

          return (
            <div key={room.id} className="border border-forest-100/30 rounded-xl p-5 bg-white">
              <div className="flex items-center gap-2 mb-4">
                <Bed className="w-4 h-4 text-forest-500" />
                <h3 className="font-semibold text-forest-700">{room.name}</h3>
                <span className="text-xs text-forest-500/40 ml-auto">
                  {type?.name} &middot; max {maxPax} guests
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <GuestCounter
                  label="Adults"
                  value={g.numAdults}
                  onDecrement={() => updateRoomGuests(room.id, 'numAdults', -1)}
                  onIncrement={() => updateRoomGuests(room.id, 'numAdults', 1)}
                  decrementDisabled={g.numAdults <= 1}
                  incrementDisabled={roomPax >= maxPax}
                  compact
                />
                <GuestCounter
                  label="Children"
                  value={g.numChildren}
                  onDecrement={() => updateRoomGuests(room.id, 'numChildren', -1)}
                  onIncrement={() => updateRoomGuests(room.id, 'numChildren', 1)}
                  decrementDisabled={g.numChildren <= 0}
                  incrementDisabled={roomPax >= maxPax}
                  compact
                />
              </div>

              {roomExtra > 0 && (
                <p className="text-xs text-forest-500/45 mt-3">
                  {roomExtra} extra guest{roomExtra > 1 ? 's' : ''} &times; {formatPHP(paxFee)}/night
                </p>
              )}
              {roomPax > maxPax && (
                <div className="flex items-center gap-2 mt-2 text-sm text-amber-600">
                  <Info className="w-4 h-4" />
                  Maximum capacity is {maxPax} guests for this room.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Global total */}
      <div className="mt-6 p-4 bg-stone-50 rounded-xl">
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-forest-500" />
          <span className="font-medium text-forest-700">
            {state.numAdults + state.numChildren} guest{state.numAdults + state.numChildren !== 1 ? 's' : ''} total
          </span>
          <span className="text-forest-500/40">
            ({state.numAdults} adult{state.numAdults !== 1 ? 's' : ''}, {state.numChildren} child{state.numChildren !== 1 ? 'ren' : ''})
          </span>
        </div>
      </div>
    </div>
  );
}

// --- Reusable guest counter widget ---
function GuestCounter({
  label, value, onDecrement, onIncrement, decrementDisabled, incrementDisabled, compact,
}: {
  label: string;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  decrementDisabled: boolean;
  incrementDisabled: boolean;
  compact?: boolean;
}) {
  return (
    <div>
      <Label className="text-sm font-medium text-forest-700">{label}</Label>
      <div className="flex items-center gap-3 mt-2">
        <Button variant="outline" size="icon" onClick={onDecrement} disabled={decrementDisabled}
          className={compact ? 'rounded-full w-8 h-8' : 'rounded-full'}>
          <Minus className="w-4 h-4" />
        </Button>
        <span className={`font-bold text-forest-700 w-8 text-center ${compact ? 'text-lg' : 'text-2xl'}`}>
          {value}
        </span>
        <Button variant="outline" size="icon" onClick={onIncrement} disabled={incrementDisabled}
          className={compact ? 'rounded-full w-8 h-8' : 'rounded-full'}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function GuestSummary({ totalPax, extraPax, paxFee, maxPax }: { totalPax: number; extraPax: number; paxFee: number; maxPax: number }) {
  return (
    <div className="mt-6 p-4 bg-stone-50 rounded-xl">
      <div className="flex items-center gap-2 text-sm">
        <Users className="w-4 h-4 text-forest-500" />
        <span className="font-medium text-forest-700">
          {totalPax} guest{totalPax > 1 ? 's' : ''} total
        </span>
        {extraPax > 0 && (
          <span className="text-forest-500/45">
            ({extraPax} extra &times; {formatPHP(paxFee)}/night)
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
  );
}
