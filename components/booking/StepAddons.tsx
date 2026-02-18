'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { formatPHP } from '@/lib/pricing';
import { Check, Plus, Bed } from 'lucide-react';
import type { BookingState } from './BookingWizard';
import type { Addon } from '@/types';

interface StepAddonsProps {
  state: BookingState;
  updateState: (partial: Partial<BookingState>) => void;
  addons: Addon[];
}

export function StepAddons({ state, updateState, addons }: StepAddonsProps) {
  const selectedRooms = state.selectedRooms?.length > 0
    ? state.selectedRooms
    : state.room ? [state.room] : [];
  const isMultiRoom = selectedRooms.length > 1;

  // Active tab for multi-room per-room addon selection
  const [activeRoomTab, setActiveRoomTab] = useState<string>(selectedRooms[0]?.id ?? '');

  // Initialize perRoomAddons for new rooms
  useEffect(() => {
    if (!isMultiRoom) return;
    const current = { ...state.perRoomAddons };
    let changed = false;
    for (const room of selectedRooms) {
      if (!current[room.id]) {
        current[room.id] = [];
        changed = true;
      }
    }
    if (changed) updateState({ perRoomAddons: current });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRooms.length, isMultiRoom]);

  // Split addons by pricing model
  const perBookingAddons = addons.filter(a => a.pricing_model === 'per_booking');
  const perPersonAddons = addons.filter(a => a.pricing_model === 'per_person');

  // --- Global addon toggle (per_booking or single-room) ---
  const toggleGlobalAddon = (addon: Addon) => {
    const existing = state.selectedAddons.find(a => a.addon.id === addon.id);
    if (existing) {
      updateState({ selectedAddons: state.selectedAddons.filter(a => a.addon.id !== addon.id) });
    } else {
      updateState({ selectedAddons: [...state.selectedAddons, { addon, quantity: 1 }] });
    }
  };

  const isGlobalSelected = (id: string) => state.selectedAddons.some(a => a.addon.id === id);

  // --- Per-room addon toggle ---
  const toggleRoomAddon = (roomId: string, addon: Addon) => {
    const current = { ...state.perRoomAddons };
    const roomAddons = [...(current[roomId] ?? [])];
    const idx = roomAddons.findIndex(a => a.addon.id === addon.id);
    if (idx >= 0) {
      roomAddons.splice(idx, 1);
    } else {
      roomAddons.push({ addon, quantity: 1 });
    }
    current[roomId] = roomAddons;
    updateState({ perRoomAddons: current });
  };

  const isRoomSelected = (roomId: string, addonId: string) =>
    (state.perRoomAddons[roomId] ?? []).some(a => a.addon.id === addonId);

  // --- Single-room: original behavior (all addons global) ---
  if (!isMultiRoom) {
    const totalPax = state.numAdults + state.numChildren;
    return (
      <div>
        <h2 className="text-xl font-bold text-forest-500 mb-1">Enhance Your Stay</h2>
        <p className="text-sm text-forest-500/45 mb-6">
          Add experiences and meals to make your visit unforgettable. These are optional.
        </p>
        <div className="grid gap-3">
          {addons.map((addon) => (
            <AddonCard
              key={addon.id}
              addon={addon}
              selected={isGlobalSelected(addon.id)}
              onToggle={() => toggleGlobalAddon(addon)}
              paxCount={totalPax}
            />
          ))}
        </div>
        {addons.length === 0 && (
          <p className="text-center text-forest-500/45 py-8">No add-ons available at this time.</p>
        )}
      </div>
    );
  }

  // --- Multi-room mode ---
  const typeMap = new Map((state.selectedTypes ?? []).map(t => [t.id, t]));

  return (
    <div>
      <h2 className="text-xl font-bold text-forest-500 mb-1">Enhance Your Stay</h2>
      <p className="text-sm text-forest-500/45 mb-6">
        Per-booking add-ons apply once to your entire group. Per-person add-ons can be assigned to each room individually.
      </p>

      {/* Per-booking addons (global) */}
      {perBookingAddons.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-forest-700 mb-3 uppercase tracking-wide">Per Booking</h3>
          <div className="grid gap-3">
            {perBookingAddons.map(addon => (
              <AddonCard
                key={addon.id}
                addon={addon}
                selected={isGlobalSelected(addon.id)}
                onToggle={() => toggleGlobalAddon(addon)}
                paxCount={1}
              />
            ))}
          </div>
        </div>
      )}

      {/* Per-person addons (per room) */}
      {perPersonAddons.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-forest-700 mb-3 uppercase tracking-wide">Per Person (by room)</h3>

          {/* Room tabs */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {selectedRooms.map(room => {
              const type = typeMap.get(room.accommodation_type_id) || state.accommodationType;
              return (
                <button
                  key={room.id}
                  onClick={() => setActiveRoomTab(room.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border',
                    activeRoomTab === room.id
                      ? 'bg-forest-500 text-white border-forest-500'
                      : 'bg-white text-forest-500/60 border-forest-100/40 hover:border-forest-200'
                  )}
                >
                  <Bed className="w-3.5 h-3.5" />
                  {room.name}
                  <span className="text-xs opacity-60">({type?.name})</span>
                </button>
              );
            })}
          </div>

          {/* Active room's per-person addons */}
          {selectedRooms.filter(r => r.id === activeRoomTab).map(room => {
            const g = state.perRoomGuests[room.id] ?? { numAdults: 1, numChildren: 0 };
            const roomPax = g.numAdults + g.numChildren;

            return (
              <div key={room.id} className="grid gap-3">
                {perPersonAddons.map(addon => (
                  <AddonCard
                    key={addon.id}
                    addon={addon}
                    selected={isRoomSelected(room.id, addon.id)}
                    onToggle={() => toggleRoomAddon(room.id, addon)}
                    paxCount={roomPax}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}

      {addons.length === 0 && (
        <p className="text-center text-forest-500/45 py-8">No add-ons available at this time.</p>
      )}
    </div>
  );
}

// --- Reusable addon card ---
function AddonCard({
  addon, selected, onToggle, paxCount,
}: {
  addon: Addon;
  selected: boolean;
  onToggle: () => void;
  paxCount: number;
}) {
  const priceDisplay = addon.pricing_model === 'per_person'
    ? `${formatPHP(addon.price)}/person`
    : `${formatPHP(addon.price)}/booking`;

  const estimatedTotal = addon.pricing_model === 'per_person'
    ? addon.price * paxCount
    : addon.price;

  return (
    <button
      onClick={onToggle}
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
          {addon.pricing_model === 'per_person' && paxCount > 1 && (
            <p className="text-xs text-forest-500/35">for {paxCount} guests</p>
          )}
        </div>
      </div>
    </button>
  );
}
