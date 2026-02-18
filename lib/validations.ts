import { z } from 'zod';

// ---- Auth ----
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

// ---- Booking ----
// Note: We use .min(1) instead of .uuid() because Supabase returns UUIDs
// but strict .uuid() validation can fail on edge cases. The database enforces UUID format.
export const createBookingSchema = z.object({
  room_id: z.string().min(1, 'Room ID is required'),
  accommodation_type_id: z.string().min(1, 'Accommodation type ID is required'),
  check_in_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  check_out_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  num_adults: z.number().int().min(1).max(20),
  num_children: z.number().int().min(0).max(20),
  guest_first_name: z.string().min(1).max(255),
  guest_last_name: z.string().min(1).max(255),
  guest_email: z.string().email().max(255),
  guest_phone: z.string().min(1).max(50),
  special_requests: z.string().max(1000).optional().nullable(),
  addon_ids: z.array(z.string().min(1)).optional().default([]),
  addon_quantities: z.array(z.number().int().min(1)).optional().default([]),
  addon_prices: z.array(z.number().min(0).max(999999)).optional().default([]),
  payment_method: z.enum(['online', 'manual']).optional(),
  source: z.enum(['online', 'manual', 'phone', 'facebook', 'walk_in']).optional().default('online'),
  base_amount: z.number().min(0).max(999999).optional().default(0),
  pax_surcharge: z.number().min(0).max(999999).optional().default(0),
  addons_amount: z.number().min(0).max(999999).optional().default(0),
  discount_amount: z.number().min(0).max(999999).optional().default(0),
  total_amount: z.number().min(0).max(9999999).optional().default(0),
});

const roomInGroupSchema = z.object({
  room_id: z.string().min(1),
  accommodation_type_id: z.string().min(1),
  base_amount: z.number().min(0),
  pax_surcharge: z.number().min(0),
  addons_amount: z.number().min(0),
  total_amount: z.number().min(0),
  addon_ids: z.array(z.string().min(1)).optional().default([]),
  addon_quantities: z.array(z.number().int().min(0)).optional().default([]),
  addon_prices: z.array(z.number().min(0)).optional().default([]),
});

export const createBookingGroupSchema = z.object({
  group_booking: z.literal(true),
  check_in_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  check_out_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  num_adults: z.number().int().min(1).max(20),
  num_children: z.number().int().min(0).max(20),
  guest_first_name: z.string().min(1).max(255),
  guest_last_name: z.string().min(1).max(255),
  guest_email: z.string().email().max(255),
  guest_phone: z.string().min(1).max(50),
  special_requests: z.string().max(1000).optional().nullable(),
  source: z.enum(['online', 'manual', 'phone', 'facebook', 'walk_in']).optional().default('online'),
  rooms: z.array(roomInGroupSchema).min(1, 'At least one room is required'),
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
  addon_ids: z.array(z.string().min(1)).optional().default([]),
  addon_quantities: z.array(z.number().int().min(1)).optional().default([]),
  payment_method: z.enum(['online', 'manual']).optional(),
  base_amount: z.number().min(0).optional().default(0),
  addons_amount: z.number().min(0).optional().default(0),
  total_amount: z.number().min(0).optional().default(0),
});

// ---- Price Calculation ----
export const calculatePriceSchema = z.object({
  accommodation_type_id: z.string().min(1),
  check_in_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  check_out_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  num_adults: z.number().int().min(1),
  num_children: z.number().int().min(0),
  addon_ids: z.array(z.string().min(1)).optional().default([]),
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
  accommodation_type_id: z.string().min(1),
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
  accommodation_type_ids: z.array(z.string().min(1)).optional().default([]),
  is_active: z.boolean().optional().default(true),
});

// ---- Admin: Website Section ----
export const sectionSettingsSchema = z.object({
  background_color: z.string().max(20).optional(),
  text_color: z.string().max(20).optional(),
  padding: z.enum(['compact', 'normal', 'spacious']).optional(),
  layout_variant: z.string().max(50).optional(),
}).optional().nullable();

export const websiteSectionSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  subtitle: z.string().max(500).optional().nullable(),
  is_visible: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  settings: sectionSettingsSchema,
});

// ---- Contact / Inquiry ----
export const inquirySchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  message: z.string().min(1).max(2000),
});

// ---- Branding ----
const hexColorRegex = /^#[0-9a-fA-F]{3,8}$/;
const socialLinksSchema = z.record(z.string().max(50), z.string().url().max(500)).optional();
const bookingRulesSchema = z.record(z.string().max(50), z.unknown()).optional();

export const brandingSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  logo_url: z.string().url().max(1000).optional().nullable(),
  primary_color: z.string().regex(hexColorRegex, 'Invalid hex color').max(9).optional(),
  secondary_color: z.string().regex(hexColorRegex, 'Invalid hex color').max(9).optional(),
  accent_color: z.string().regex(hexColorRegex, 'Invalid hex color').max(9).optional(),
  font_heading: z.string().max(100).optional(),
  font_body: z.string().max(100).optional(),
  font_heading_size: z.string().max(10).optional().nullable(),
  font_body_size: z.string().max(10).optional().nullable(),
  font_heading_color: z.string().regex(hexColorRegex, 'Invalid hex color').max(9).optional().nullable(),
  font_body_color: z.string().regex(hexColorRegex, 'Invalid hex color').max(9).optional().nullable(),
  tagline: z.string().max(500).optional().nullable(),
  meta_description: z.string().max(1000).optional().nullable(),
  social_links: socialLinksSchema,
  booking_rules: bookingRulesSchema,
});

// ---- Query Parameter Validation (GET endpoints) ----
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

/** Reusable pagination params — clamps page >= 1, limit 1-100 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const bookingFilterSchema = paginationSchema.extend({
  status: z.enum(['all', 'pending', 'confirmed', 'paid', 'checked_in', 'checked_out', 'cancelled', 'no_show', 'expired']).default('all'),
  search: z.string().max(200).default(''),
  booking_group_id: z.string().max(100).optional(),
  from_date: z.string().regex(dateRegex, 'Invalid date format').optional(),
  to_date: z.string().regex(dateRegex, 'Invalid date format').optional(),
  sort_by: z.enum(['created_at', 'check_in_date', 'status_priority']).default('status_priority'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
});

export const guestFilterSchema = paginationSchema.extend({
  search: z.string().max(200).default(''),
  sort_by: z.enum(['name', 'total_bookings', 'total_spent', 'last_visit']).default('last_visit'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  min_bookings: z.coerce.number().int().min(0).optional(),
  min_spent: z.coerce.number().min(0).optional(),
});

export const dayTourFilterSchema = paginationSchema.extend({
  status: z.enum(['all', 'pending', 'confirmed', 'paid', 'completed', 'cancelled', 'no_show', 'expired']).default('all'),
  search: z.string().max(200).default(''),
  from_date: z.string().regex(dateRegex).optional(),
  to_date: z.string().regex(dateRegex).optional(),
});

export const auditLogFilterSchema = paginationSchema.extend({
  start_date: z.string().regex(dateRegex).optional(),
  end_date: z.string().regex(dateRegex).optional(),
  booking_type: z.enum(['overnight', 'day_tour']).optional(),
  field_changed: z.enum(['status', 'payment_status']).optional(),
  change_source: z.enum(['system', 'admin', 'guest', 'cron']).optional(),
});

export const reportParamsSchema = z.object({
  period: z.coerce.number().int().min(1).max(365).default(30),
});

export const reportExportSchema = z.object({
  type: z.enum(['bookings', 'guests']).default('bookings'),
  period: z.coerce.number().int().min(1).max(365).default(30),
});

export const publicDateRangeSchema = z.object({
  check_in: z.string().regex(dateRegex, 'Invalid date format').optional(),
  check_out: z.string().regex(dateRegex, 'Invalid date format').optional(),
  start_date: z.string().regex(dateRegex, 'Invalid date format').optional(),
  end_date: z.string().regex(dateRegex, 'Invalid date format').optional(),
  type_id: z.string().max(100).optional(),
  type_ids: z.string().max(1000).optional(),
});

// ---- Type Exports ----
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CreateDayTourBookingInput = z.infer<typeof createDayTourBookingSchema>;
export type CalculatePriceInput = z.infer<typeof calculatePriceSchema>;
