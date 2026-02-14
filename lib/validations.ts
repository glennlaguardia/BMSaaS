import { z } from 'zod';

// ---- Auth ----
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

// ---- Booking ----
export const createBookingSchema = z.object({
  room_id: z.string().uuid(),
  accommodation_type_id: z.string().uuid(),
  check_in_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  check_out_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  num_adults: z.number().int().min(1).max(20),
  num_children: z.number().int().min(0).max(20),
  guest_first_name: z.string().min(1).max(255),
  guest_last_name: z.string().min(1).max(255),
  guest_email: z.string().email().max(255),
  guest_phone: z.string().min(1).max(50),
  special_requests: z.string().max(1000).optional().nullable(),
  addon_ids: z.array(z.string().uuid()).optional().default([]),
  addon_quantities: z.array(z.number().int().min(1)).optional().default([]),
  payment_method: z.enum(['online', 'manual']).optional(),
  source: z.enum(['online', 'manual', 'phone', 'facebook', 'walk_in']).optional().default('online'),
});

// ---- Day Tour Booking ----
export const createDayTourBookingSchema = z.object({
  tour_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  num_adults: z.number().int().min(1).max(50),
  num_children: z.number().int().min(0).max(50),
  guest_first_name: z.string().min(1).max(255),
  guest_last_name: z.string().min(1).max(255),
  guest_email: z.string().email().max(255),
  guest_phone: z.string().min(1).max(50),
  special_requests: z.string().max(1000).optional().nullable(),
  addon_ids: z.array(z.string().uuid()).optional().default([]),
  addon_quantities: z.array(z.number().int().min(1)).optional().default([]),
  payment_method: z.enum(['online', 'manual']).optional(),
});

// ---- Price Calculation ----
export const calculatePriceSchema = z.object({
  accommodation_type_id: z.string().uuid(),
  check_in_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  check_out_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  num_adults: z.number().int().min(1),
  num_children: z.number().int().min(0),
  addon_ids: z.array(z.string().uuid()).optional().default([]),
  addon_quantities: z.array(z.number().int().min(1)).optional().default([]),
});

// ---- Admin: Status Update ----
export const updateBookingStatusSchema = z.object({
  status: z.enum(['confirmed', 'paid', 'checked_in', 'checked_out', 'cancelled', 'no_show']),
  notes: z.string().max(500).optional(),
  cancellation_reason: z.string().max(500).optional(),
});

export const updatePaymentStatusSchema = z.object({
  payment_status: z.enum(['unpaid', 'pending_verification', 'paid', 'refunded']),
  payment_method: z.string().max(30).optional(),
  payment_reference: z.string().max(255).optional(),
  notes: z.string().max(500).optional(),
});

// ---- Admin: Accommodation Type ----
export const accommodationTypeSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string().max(2000).optional().nullable(),
  short_description: z.string().max(500).optional().nullable(),
  base_rate_weekday: z.number().min(0),
  base_rate_weekend: z.number().min(0),
  base_pax: z.number().int().min(1),
  max_pax: z.number().int().min(1),
  additional_pax_fee: z.number().min(0),
  size_sqm: z.number().min(0).optional().nullable(),
  amenities: z.array(z.string()).optional().default([]),
  inclusions: z.array(z.string()).optional().default([]),
  is_active: z.boolean().optional().default(true),
  sort_order: z.number().int().optional().default(0),
});

// ---- Admin: Room ----
export const roomSchema = z.object({
  accommodation_type_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional().nullable(),
  view_description: z.string().max(500).optional().nullable(),
  unique_features: z.array(z.string()).optional().default([]),
  is_active: z.boolean().optional().default(true),
  sort_order: z.number().int().optional().default(0),
});

// ---- Admin: Addon ----
export const addonSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional().nullable(),
  price: z.number().min(0),
  pricing_model: z.enum(['per_booking', 'per_person']),
  category: z.enum(['experience', 'meal', 'amenity', 'other']),
  applies_to: z.enum(['overnight', 'day_tour', 'both']),
  is_active: z.boolean().optional().default(true),
  sort_order: z.number().int().optional().default(0),
});

// ---- Admin: Rate Adjustment ----
export const rateAdjustmentSchema = z.object({
  name: z.string().min(1).max(255),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adjustment_type: z.enum(['percentage_discount', 'percentage_surcharge', 'fixed_override']),
  adjustment_value: z.number().min(0),
  applies_to: z.enum(['all', 'specific']),
  accommodation_type_ids: z.array(z.string().uuid()).optional().default([]),
  is_active: z.boolean().optional().default(true),
});

// ---- Admin: Website Section ----
export const websiteSectionSchema = z.object({
  is_visible: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  content: z.record(z.unknown()).optional(),
});

// ---- Contact / Inquiry ----
export const inquirySchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  message: z.string().min(1).max(2000),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CreateDayTourBookingInput = z.infer<typeof createDayTourBookingSchema>;
export type CalculatePriceInput = z.infer<typeof calculatePriceSchema>;
