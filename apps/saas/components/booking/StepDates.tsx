'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarDays, Info } from 'lucide-react';
import { differenceInDays, addDays, format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { BookingState } from './BookingWizard';
import type { Tenant } from '@/types';

interface StepDatesProps {
  state: BookingState;
  updateState: (partial: Partial<BookingState>) => void;
  tenant: Tenant;
}

export function StepDates({ state, updateState, tenant }: StepDatesProps) {
  const tomorrow = addDays(new Date(), 1);
  const maxDate = addDays(new Date(), 90);

  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);

  const checkInDate = state.checkIn ? new Date(state.checkIn) : undefined;
  const checkOutDate = state.checkOut ? new Date(state.checkOut) : undefined;

  const nights = state.checkIn && state.checkOut
    ? differenceInDays(new Date(state.checkOut), new Date(state.checkIn))
    : 0;

  const handleCheckInSelect = (date: Date | undefined) => {
    if (!date) return;
    const formatted = format(date, 'yyyy-MM-dd');
    updateState({ checkIn: formatted });
    // Auto-set checkout to next day if not set or invalid
    if (!state.checkOut || state.checkOut <= formatted) {
      updateState({ checkOut: format(addDays(date, 1), 'yyyy-MM-dd') });
    }
    setCheckInOpen(false);
  };

  const handleCheckOutSelect = (date: Date | undefined) => {
    if (!date) return;
    updateState({ checkOut: format(date, 'yyyy-MM-dd') });
    setCheckOutOpen(false);
  };

  const minCheckOut = checkInDate ? addDays(checkInDate, 1) : tomorrow;

  return (
    <div>
      <h2 className="text-xl font-bold text-forest-500 mb-1">Select Your Dates</h2>
      <p className="text-sm text-forest-500/45 mb-6">
        Choose your check-in and check-out dates for your stay.
      </p>

      <div className="grid sm:grid-cols-2 gap-6 max-w-lg">
        {/* Check-in */}
        <div>
          <Label className="text-sm font-medium text-forest-700 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-forest-500" />
            Check-in Date
          </Label>
          <Popover open={checkInOpen} onOpenChange={setCheckInOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full mt-1.5 justify-start text-left font-normal',
                  !checkInDate && 'text-muted-foreground'
                )}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                {checkInDate ? format(checkInDate, 'MMM d, yyyy') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={checkInDate}
                onSelect={handleCheckInSelect}
                disabled={(date) => date < tomorrow || date > maxDate}
                defaultMonth={checkInDate || tomorrow}
              />
            </PopoverContent>
          </Popover>
          <p className="text-xs text-forest-500/35 mt-1">Check-in: {tenant.check_in_time || '3:00 PM'}</p>
        </div>

        {/* Check-out */}
        <div>
          <Label className="text-sm font-medium text-forest-700 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-forest-500" />
            Check-out Date
          </Label>
          <Popover open={checkOutOpen} onOpenChange={setCheckOutOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full mt-1.5 justify-start text-left font-normal',
                  !checkOutDate && 'text-muted-foreground'
                )}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                {checkOutDate ? format(checkOutDate, 'MMM d, yyyy') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={checkOutDate}
                onSelect={handleCheckOutSelect}
                disabled={(date) => date < minCheckOut || date > maxDate}
                defaultMonth={checkOutDate || minCheckOut}
              />
            </PopoverContent>
          </Popover>
          <p className="text-xs text-forest-500/35 mt-1">Check-out: {tenant.check_out_time || '10:00 AM'}</p>
        </div>
      </div>

      {nights > 0 && (
        <div className="mt-6 flex items-center gap-2 text-sm bg-forest-500/5 text-forest-500 px-4 py-3 rounded-lg">
          <Info className="w-4 h-4" />
          <span className="font-medium">{nights} night{nights > 1 ? 's' : ''}</span>
          <span className="text-forest-500/45">
            — {format(new Date(state.checkIn), 'MMM d')} to {format(new Date(state.checkOut), 'MMM d, yyyy')}
          </span>
        </div>
      )}
    </div>
  );
}
