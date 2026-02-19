'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Check, MapPin, Loader2 } from 'lucide-react';
import type { BookingState } from './BookingWizard';
import type { Room } from '@/types';

interface StepRoomProps {
  state: BookingState;
  updateState: (partial: Partial<BookingState>) => void;
}

interface RoomWithAvailability extends Room {
  is_available?: boolean;
}

export function StepRoom({ state, updateState }: StepRoomProps) {
  const [rooms, setRooms] = useState<RoomWithAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const selectedTypes = state.selectedTypes && state.selectedTypes.length > 0
      ? state.selectedTypes
      : state.accommodationType
      ? [state.accommodationType]
      : [];

    if (selectedTypes.length === 0) return;

    const params = new URLSearchParams();
    const typeIds = selectedTypes.map(t => t.id);

    if (typeIds.length === 1) {
      params.set('type_id', typeIds[0]);
    } else if (typeIds.length > 1) {
      params.set('type_ids', typeIds.join(','));
    }

    if (state.checkIn) params.set('check_in', state.checkIn);
    if (state.checkOut) params.set('check_out', state.checkOut);

    fetch(`/api/public/rooms?${params}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setRooms(data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [state.selectedTypes, state.accommodationType, state.checkIn, state.checkOut]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-forest-500" />
        <span className="ml-2 text-sm text-forest-500/45">Loading rooms...</span>
      </div>
    );
  }

  // Group rooms by accommodation_type_id for clearer multi-type selection
  const grouped = rooms.reduce<Record<string, RoomWithAvailability[]>>((acc, room) => {
    const typeId = room.accommodation_type_id;
    const key = typeId || 'unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(room);
    return acc;
  }, {});

  const orderedTypeIds: string[] = [];
  const selectedTypeIds = (state.selectedTypes || []).map(t => t.id);
  selectedTypeIds.forEach(id => {
    if (grouped[id]) orderedTypeIds.push(id);
  });
  Object.keys(grouped).forEach(id => {
    if (!orderedTypeIds.includes(id)) orderedTypeIds.push(id);
  });

  const getTypeLabel = (typeId: string) =>
    state.selectedTypes?.find(t => t.id === typeId)?.name ||
    state.accommodationType?.name ||
    'Room type';

  return (
    <div>
      <h2 className="text-xl font-bold text-forest-500 mb-1">Choose Your Room(s)</h2>
      <p className="text-sm text-forest-500/65 mb-6">
        Select one or more rooms for your stay across the chosen accommodation types.
      </p>

      <div className="space-y-5">
        {orderedTypeIds.map((typeId) => (
          <div key={typeId}>
            <h3 className="text-sm font-semibold text-forest-700 mb-2">
              {getTypeLabel(typeId)}
            </h3>
            <div className="grid gap-3">
              {grouped[typeId].map((room) => {
                const isSelected =
                  state.selectedRooms?.some(r => r.id === room.id) || state.room?.id === room.id;
                const isAvailable = room.is_available !== false;
                const features = (room.unique_features as string[]) || [];

                return (
                  <button
                    key={room.id}
                    onClick={() => {
                      if (!isAvailable) return;
                      const current = state.selectedRooms || [];
                      const exists = current.some(r => r.id === room.id);
                      let nextSelected: RoomWithAvailability[];
                      if (exists) {
                        nextSelected = current.filter(r => r.id !== room.id);
                      } else {
                        nextSelected = [...current, room];
                      }

                      // Keep the primary `room` field in sync for the rest of the flow
                      const nextPrimary = nextSelected[0] || null;
                      updateState({ selectedRooms: nextSelected, room: nextPrimary });
                    }}
                    disabled={!isAvailable}
                    className={cn(
                      'text-left p-4 rounded-xl border-2 transition-all',
                      !isAvailable
                        ? 'border-stone-100 bg-stone-50 opacity-60'
                        : isSelected
                        ? 'border-forest-500 bg-forest-500/5'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-forest-700">{room.name}</h3>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-forest-500 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                          {!isAvailable && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                              Unavailable
                            </span>
                          )}
                        </div>

                        {room.view_description && (
                          <p className="text-sm text-forest-500/45 mt-1 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {room.view_description}
                          </p>
                        )}

                        {features.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {features.map((f) => (
                              <span key={f} className="px-2 py-0.5 bg-cream-100 text-forest-500 text-xs rounded-full">
                                {f}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {rooms.length === 0 && (
        <p className="text-center text-forest-500/45 py-8">
          No rooms available for the selected dates.
        </p>
      )}
    </div>
  );
}
