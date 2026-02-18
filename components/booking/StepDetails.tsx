'use client';

import { useState, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { User, Mail, Phone, MessageSquare, AlertCircle, UtensilsCrossed, Ticket } from 'lucide-react';
import type { BookingState } from './BookingWizard';

interface StepDetailsProps {
  state: BookingState;
  updateState: (partial: Partial<BookingState>) => void;
}

interface FieldErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PH_PHONE_REGEX = /^(\+?63|0)?[0-9]{10,11}$/;

function validateField(field: keyof FieldErrors, value: string): string | undefined {
  const trimmed = value.trim();
  switch (field) {
    case 'firstName':
      if (!trimmed) return 'First name is required';
      if (trimmed.length < 2) return 'First name must be at least 2 characters';
      if (trimmed.length > 255) return 'First name is too long';
      return undefined;
    case 'lastName':
      if (!trimmed) return 'Last name is required';
      if (trimmed.length < 2) return 'Last name must be at least 2 characters';
      if (trimmed.length > 255) return 'Last name is too long';
      return undefined;
    case 'email':
      if (!trimmed) return 'Email address is required';
      if (!EMAIL_REGEX.test(trimmed)) return 'Please enter a valid email address';
      if (trimmed.length > 255) return 'Email is too long';
      return undefined;
    case 'phone':
      if (!trimmed) return 'Phone number is required';
      // Strip spaces, dashes, parens for validation
      const cleaned = trimmed.replace(/[\s\-()]/g, '');
      if (!PH_PHONE_REGEX.test(cleaned) && cleaned.length < 7) {
        return 'Please enter a valid phone number (e.g. 09171234567)';
      }
      if (cleaned.length < 7) return 'Phone number is too short';
      if (cleaned.length > 15) return 'Phone number is too long';
      return undefined;
    default:
      return undefined;
  }
}

export function StepDetails({ state, updateState }: StepDetailsProps) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleBlur = useCallback((field: keyof FieldErrors, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const handleChange = useCallback((field: keyof FieldErrors, value: string) => {
    // Validate on change only if the field was already touched
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  }, [touched]);

  const fieldClass = (field: keyof FieldErrors) => {
    if (touched[field] && errors[field]) {
      return 'mt-1.5 border-red-300 focus:border-red-400 focus:ring-red-400/20';
    }
    if (touched[field] && !errors[field]) {
      return 'mt-1.5 border-green-300 focus:border-green-400 focus:ring-green-400/20';
    }
    return 'mt-1.5';
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-forest-500 mb-1">Guest Details</h2>
      <p className="text-sm text-forest-500/45 mb-6">
        Enter the details of the primary guest for this booking.
      </p>

      <div className="max-w-lg space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          {/* First Name */}
          <div>
            <Label htmlFor="firstName" className="text-sm font-medium text-forest-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-forest-500" />
              First Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="firstName"
              value={state.firstName}
              onChange={(e) => {
                updateState({ firstName: e.target.value });
                handleChange('firstName', e.target.value);
              }}
              onBlur={() => handleBlur('firstName', state.firstName)}
              placeholder="Juan"
              className={fieldClass('firstName')}
              aria-invalid={touched.firstName && !!errors.firstName}
            />
            {touched.firstName && errors.firstName && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.firstName}
              </p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <Label htmlFor="lastName" className="text-sm font-medium text-forest-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-forest-500" />
              Last Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="lastName"
              value={state.lastName}
              onChange={(e) => {
                updateState({ lastName: e.target.value });
                handleChange('lastName', e.target.value);
              }}
              onBlur={() => handleBlur('lastName', state.lastName)}
              placeholder="Dela Cruz"
              className={fieldClass('lastName')}
              aria-invalid={touched.lastName && !!errors.lastName}
            />
            {touched.lastName && errors.lastName && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.lastName}
              </p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email" className="text-sm font-medium text-forest-700 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-forest-500" />
            Email Address <span className="text-red-400">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={state.email}
            onChange={(e) => {
              updateState({ email: e.target.value });
              handleChange('email', e.target.value);
            }}
            onBlur={() => handleBlur('email', state.email)}
            placeholder="juan@email.com"
            className={fieldClass('email')}
            aria-invalid={touched.email && !!errors.email}
          />
          {touched.email && errors.email ? (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.email}
            </p>
          ) : (
            <p className="text-xs text-forest-500/35 mt-1">Booking confirmation will be sent to this email.</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <Label htmlFor="phone" className="text-sm font-medium text-forest-700 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-forest-500" />
            Phone Number <span className="text-red-400">*</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            value={state.phone}
            onChange={(e) => {
              updateState({ phone: e.target.value });
              handleChange('phone', e.target.value);
            }}
            onBlur={() => handleBlur('phone', state.phone)}
            placeholder="+63 917 123 4567"
            className={fieldClass('phone')}
            aria-invalid={touched.phone && !!errors.phone}
          />
          {touched.phone && errors.phone && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.phone}
            </p>
          )}
        </div>

        {/* Special Requests */}
        <div>
          <Label htmlFor="requests" className="text-sm font-medium text-forest-700 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-forest-500" />
            Special Requests
            <span className="text-forest-500/35 font-normal">(optional)</span>
          </Label>
          <Textarea
            id="requests"
            value={state.specialRequests}
            onChange={(e) => updateState({ specialRequests: e.target.value })}
            placeholder="Any special requests or celebrations?"
            className="mt-1.5 min-h-[100px]"
            maxLength={1000}
          />
          <p className="text-xs text-forest-500/35 mt-1 text-right">
            {state.specialRequests.length}/1000
          </p>
        </div>

        {/* Food Restrictions */}
        <div>
          <Label htmlFor="foodRestrictions" className="text-sm font-medium text-forest-700 flex items-center gap-1.5">
            <UtensilsCrossed className="w-3.5 h-3.5 text-forest-500" />
            Food Restrictions / Allergies
            <span className="text-forest-500/35 font-normal">(optional)</span>
          </Label>
          <Textarea
            id="foodRestrictions"
            value={state.foodRestrictions}
            onChange={(e) => updateState({ foodRestrictions: e.target.value })}
            placeholder="E.g. vegetarian, no pork, lactose intolerant, nut allergy..."
            className="mt-1.5 min-h-[80px]"
            maxLength={500}
          />
          <p className="text-xs text-forest-500/35 mt-1 text-right">
            {state.foodRestrictions.length}/500
          </p>
        </div>

        {/* Voucher Code */}
        <div>
          <Label htmlFor="voucherCode" className="text-sm font-medium text-forest-700 flex items-center gap-1.5">
            <Ticket className="w-3.5 h-3.5 text-forest-500" />
            Voucher Code
            <span className="text-forest-500/35 font-normal">(optional)</span>
          </Label>
          <Input
            id="voucherCode"
            value={state.voucherCode}
            onChange={(e) => updateState({ voucherCode: e.target.value.toUpperCase() })}
            placeholder="Enter voucher code"
            className="mt-1.5 font-mono uppercase tracking-wider"
            maxLength={50}
          />
          <p className="text-xs text-forest-500/35 mt-1">Discount will be applied upon admin verification.</p>
        </div>
      </div>
    </div>
  );
}
