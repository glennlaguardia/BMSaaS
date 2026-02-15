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
    if (!state.accommodationType) return;

    const params = new URLSearchParams({
      type_id: state.accommodationType.id,
    });
    if (state.checkIn) params.set('check_in', state.checkIn);
    if (state.checkOut) params.set('check_out', state.checkOut);

    fetch(`/api/public/rooms?${params}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setRooms(data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [state.accommodationType, state.checkIn, state.checkOut]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-forest-500" />
        <span className="ml-2 text-sm text-forest-500/45">Loading rooms...</span>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-forest-500 mb-1">Choose Your Room</h2>
      <p className="text-sm text-forest-500/45 mb-6">
        Select a specific {state.accommodationType?.name || 'room'} for your stay.
      </p>

      <div className="grid gap-3">
        {rooms.map((room) => {
          const isSelected = state.room?.id === room.id;
          const isAvailable = room.is_available !== false;
          const features = (room.unique_features as string[]) || [];

          return (
            <button
              key={room.id}
              onClick={() => isAvailable && updateState({ room })}
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

      {rooms.length === 0 && (
        <p className="text-center text-forest-500/45 py-8">
          No rooms available for the selected dates.
        </p>
      )}
    </div>
  );
}
