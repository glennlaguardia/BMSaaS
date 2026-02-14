'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CalendarDays, Info } from 'lucide-react';
import { differenceInDays, addDays, format } from 'date-fns';
import type { BookingState } from './BookingWizard';
import type { Tenant } from '@/types';

interface StepDatesProps {
  state: BookingState;
  updateState: (partial: Partial<BookingState>) => void;
  tenant: Tenant;
}

export function StepDates({ state, updateState, tenant }: StepDatesProps) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const minCheckIn = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const maxDate = format(addDays(new Date(), 90), 'yyyy-MM-dd');

  const nights = state.checkIn && state.checkOut
    ? differenceInDays(new Date(state.checkOut), new Date(state.checkIn))
    : 0;

  const handleCheckInChange = (date: string) => {
    updateState({ checkIn: date });
    // Auto-set checkout to next day if not set or invalid
    if (!state.checkOut || state.checkOut <= date) {
      updateState({ checkOut: format(addDays(new Date(date), 1), 'yyyy-MM-dd') });
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-[#2D5016] mb-1">Select Your Dates</h2>
      <p className="text-sm text-stone-500 mb-6">
        Choose your check-in and check-out dates for your stay.
      </p>

      <div className="grid sm:grid-cols-2 gap-6 max-w-lg">
        <div>
          <Label htmlFor="checkin" className="text-sm font-medium text-stone-700 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#2D5016]" />
            Check-in Date
          </Label>
          <Input
            id="checkin"
            type="date"
            value={state.checkIn}
            onChange={(e) => handleCheckInChange(e.target.value)}
            min={minCheckIn}
            max={maxDate}
            className="mt-1.5"
          />
          <p className="text-xs text-stone-400 mt-1">Check-in: {tenant.check_in_time || '3:00 PM'}</p>
        </div>

        <div>
          <Label htmlFor="checkout" className="text-sm font-medium text-stone-700 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#2D5016]" />
            Check-out Date
          </Label>
          <Input
            id="checkout"
            type="date"
            value={state.checkOut}
            onChange={(e) => updateState({ checkOut: e.target.value })}
            min={state.checkIn ? format(addDays(new Date(state.checkIn), 1), 'yyyy-MM-dd') : today}
            max={maxDate}
            className="mt-1.5"
          />
          <p className="text-xs text-stone-400 mt-1">Check-out: {tenant.check_out_time || '10:00 AM'}</p>
        </div>
      </div>

      {nights > 0 && (
        <div className="mt-6 flex items-center gap-2 text-sm bg-[#2D5016]/5 text-[#2D5016] px-4 py-3 rounded-lg">
          <Info className="w-4 h-4" />
          <span className="font-medium">{nights} night{nights > 1 ? 's' : ''}</span>
          <span className="text-stone-500">
            — {format(new Date(state.checkIn), 'MMM d')} to {format(new Date(state.checkOut), 'MMM d, yyyy')}
          </span>
        </div>
      )}
    </div>
  );
}
