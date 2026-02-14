'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { User, Mail, Phone, MessageSquare } from 'lucide-react';
import type { BookingState } from './BookingWizard';

interface StepDetailsProps {
  state: BookingState;
  updateState: (partial: Partial<BookingState>) => void;
}

export function StepDetails({ state, updateState }: StepDetailsProps) {
  return (
    <div>
      <h2 className="text-xl font-bold text-[#2D5016] mb-1">Guest Details</h2>
      <p className="text-sm text-stone-500 mb-6">
        Enter the details of the primary guest for this booking.
      </p>

      <div className="max-w-lg space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName" className="text-sm font-medium text-stone-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#2D5016]" />
              First Name
            </Label>
            <Input
              id="firstName"
              value={state.firstName}
              onChange={(e) => updateState({ firstName: e.target.value })}
              placeholder="Juan"
              className="mt-1.5"
              required
            />
          </div>
          <div>
            <Label htmlFor="lastName" className="text-sm font-medium text-stone-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#2D5016]" />
              Last Name
            </Label>
            <Input
              id="lastName"
              value={state.lastName}
              onChange={(e) => updateState({ lastName: e.target.value })}
              placeholder="Dela Cruz"
              className="mt-1.5"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email" className="text-sm font-medium text-stone-700 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-[#2D5016]" />
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            value={state.email}
            onChange={(e) => updateState({ email: e.target.value })}
            placeholder="juan@email.com"
            className="mt-1.5"
            required
          />
          <p className="text-xs text-stone-400 mt-1">Booking confirmation will be sent to this email.</p>
        </div>

        <div>
          <Label htmlFor="phone" className="text-sm font-medium text-stone-700 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-[#2D5016]" />
            Phone Number
          </Label>
          <Input
            id="phone"
            type="tel"
            value={state.phone}
            onChange={(e) => updateState({ phone: e.target.value })}
            placeholder="+63 917 123 4567"
            className="mt-1.5"
            required
          />
        </div>

        <div>
          <Label htmlFor="requests" className="text-sm font-medium text-stone-700 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-[#2D5016]" />
            Special Requests
            <span className="text-stone-400 font-normal">(optional)</span>
          </Label>
          <Textarea
            id="requests"
            value={state.specialRequests}
            onChange={(e) => updateState({ specialRequests: e.target.value })}
            placeholder="Any special requests or celebrations?"
            className="mt-1.5 min-h-[100px]"
          />
        </div>
      </div>
    </div>
  );
}
