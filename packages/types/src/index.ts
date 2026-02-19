// ============================================================
// BudaBook — TypeScript Type Definitions
// All interfaces match the database schema from SPECIFICATIONS.md
// ============================================================

// ---- Tenant ----
export interface Tenant {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  font_heading: string;
  font_body: string;
  font_heading_size: string | null;
  font_body_size: string | null;
  font_heading_color: string | null;
  font_body_color: string | null;
  meta_description: string | null;
  social_links: Record<string, string> | null;
  contact_phone: string | null;
  contact_phone_2: string | null;
  contact_email: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  address: string | null;
  gps_latitude: number | null;
  gps_longitude: number | null;
  check_in_time: string;
  check_out_time: string;
  day_tour_start: string;
  day_tour_end: string;
  day_tour_capacity: number;
  day_tour_rate_adult: number;
  day_tour_rate_child: number;
  booking_rules: BookingRules;
  website_url: string | null;
  notification_email: string | null;
  enabled_service_types: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookingRules {
  require_full_payment: boolean;
  min_advance_days: number;
  max_advance_days: number;
  payment_expiry_hours: number;
  payment_details: PaymentDetails;
}

export interface PaymentDetails {
  gcash_number: string;
  gcash_name: string;
  bank_name: string;
  bank_account: string;
  bank_account_name: string;
}

// ---- Admin User ----
export interface AdminUser {
  id: string;
  tenant_id: string;
  username: string;
  email: string | null;
  password_hash: string;
  full_name: string | null;
  role: 'super_admin' | 'resort_admin' | 'staff';
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

export interface AdminSession {
  admin_user_id: string;
  tenant_id: string;
  role: string;
}

// ---- Accommodation Type ----
export interface AccommodationType {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  base_rate_weekday: number;
  base_rate_weekend: number;
  base_pax: number;
  max_pax: number;
  additional_pax_fee: number;
  size_sqm: number | null;
  amenities: string[];
  inclusions: string[];
  images: AccommodationImage[];
  thumbnail_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AccommodationImage {
  url: string;
  alt: string;
  sort_order: number;
}

// ---- Room ----
export interface Room {
  id: string;
  tenant_id: string;
  accommodation_type_id: string;
  name: string;
  description: string | null;
  view_description: string | null;
  unique_features: string[];
  images: AccommodationImage[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  accommodation_type?: AccommodationType;
}

// ---- Booking ----
export type BookingStatus = 'pending' | 'confirmed' | 'paid' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show' | 'expired';
export type PaymentStatus = 'unpaid' | 'pending_verification' | 'paid' | 'refunded';
export type BookingSource = 'online' | 'manual' | 'phone' | 'facebook' | 'walk_in';

export interface Booking {
  id: string;
  tenant_id: string;
  reference_number: string;
  room_id: string;
  accommodation_type_id: string;
  booking_group_id: string | null;
  check_in_date: string;
  check_out_date: string;
  num_adults: number;
  num_children: number;
  total_pax: number;
  guest_first_name: string;
  guest_last_name: string;
  guest_email: string;
  guest_phone: string;
  special_requests: string | null;
  food_restrictions: string | null;
  voucher_code: string | null;
  base_amount: number;
  pax_surcharge: number;
  addons_amount: number;
  discount_amount: number;
  total_amount: number;
  status: BookingStatus;
  payment_status: PaymentStatus;
  payment_method: string | null;
  payment_reference: string | null;
  payment_proof_url: string | null;
  paid_at: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  source: BookingSource;
  notes: string | null;
  created_by: string | null;
  guest_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  room?: Room;
  accommodation_type?: AccommodationType;
  booking_addons?: BookingAddon[];
}

// ---- Addon ----
export type PricingModel = 'per_booking' | 'per_person';
export type AddonCategory = 'experience' | 'meal' | 'amenity' | 'other';
export type AddonAppliesTo = 'overnight' | 'day_tour' | 'both';

export interface Addon {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  price: number;
  pricing_model: PricingModel;
  category: AddonCategory;
  applies_to: AddonAppliesTo;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BookingAddon {
  id: string;
  booking_id: string;
  addon_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  // Joined
  addon?: Addon;
}

// ---- Day Tour Booking ----
export type DayTourStatus = 'pending' | 'confirmed' | 'paid' | 'completed' | 'cancelled' | 'no_show' | 'expired';

export interface DayTourBooking {
  id: string;
  tenant_id: string;
  reference_number: string;
  tour_date: string;
  num_adults: number;
  num_children: number;
  total_pax: number;
  guest_first_name: string;
  guest_last_name: string;
  guest_email: string;
  guest_phone: string;
  special_requests: string | null;
  base_amount: number;
  addons_amount: number;
  total_amount: number;
  status: DayTourStatus;
  payment_status: PaymentStatus;
  payment_method: string | null;
  payment_reference: string | null;
  payment_proof_url: string | null;
  paid_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  source: string;
  notes: string | null;
  created_by: string | null;
  guest_id: string | null;
  created_at: string;
  updated_at: string;
}

// ---- Booking Status Log (Audit) ----
export interface BookingStatusLog {
  id: string;
  tenant_id: string;
  booking_id: string | null;
  day_tour_booking_id: string | null;
  service_booking_id: string | null;
  booking_type: 'overnight' | 'day_tour' | 'service';
  field_changed: 'status' | 'payment_status';
  old_value: string | null;
  new_value: string;
  changed_by: string | null;
  change_source: 'system' | 'admin' | 'guest' | 'cron';
  notes: string | null;
  created_at: string;
  // Joined
  admin_user?: AdminUser;
  booking?: Booking;
}

// ---- Rate Adjustment ----
export type AdjustmentType = 'percentage_discount' | 'percentage_surcharge' | 'fixed_override';

export interface RateAdjustment {
  id: string;
  tenant_id: string;
  name: string;
  start_date: string;
  end_date: string;
  adjustment_type: AdjustmentType;
  adjustment_value: number;
  applies_to: 'all' | 'specific';
  accommodation_type_ids: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ---- Guest ----
export interface Guest {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  total_bookings: number;
  total_spent: number;
  notes: string | null;
  tags: string[];
  first_visit: string | null;
  last_visit: string | null;
  created_at: string;
  updated_at: string;
}

// ---- Website Section ----
export type SectionType = 'hero' | 'about' | 'accommodations' | 'activities' | 'gallery' | 'pricing' | 'testimonials' | 'location' | 'contact';

/** Per-section style settings stored in the JSONB `settings` column. */
export interface SectionSettings {
  background_color?: string;
  text_color?: string;
  padding?: 'compact' | 'normal' | 'spacious';
  layout_variant?: string;
}

export interface WebsiteSection {
  id: string;
  tenant_id: string;
  section_type: SectionType;
  title: string | null;
  subtitle: string | null;
  is_visible: boolean;
  sort_order: number;
  content: Record<string, unknown>;
  settings: SectionSettings | null;
  created_at: string;
  updated_at: string;
}

// ---- Testimonial ----
export interface Testimonial {
  id: string;
  tenant_id: string;
  guest_name: string;
  rating: number | null;
  content: string;
  source: string;
  is_featured: boolean;
  created_at: string;
}

// ---- Gallery Image ----
export interface GalleryImage {
  id: string;
  tenant_id: string;
  image_url: string;
  alt_text: string | null;
  category: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

// ---- Pricing Calculation Types ----
export interface NightBreakdown {
  date: string;
  dayOfWeek: number;
  isWeekend: boolean;
  baseRate: number;
  adjustmentName: string | null;
  adjustmentAmount: number;
  effectiveRate: number;
}

export interface PriceCalculation {
  nights: NightBreakdown[];
  totalNights: number;
  totalBaseRate: number;
  extraPax: number;
  paxSurchargePerNight: number;
  totalPaxSurcharge: number;
  addonsTotal: number;
  grandTotal: number;
}

/** Per-room breakdown for multi-room bookings (used in booking payload). */
export interface PerRoomBreakdown {
  roomId: string;
  typeId: string;
  baseAmount: number;
  paxSurcharge: number;
  addonsAmount: number;
  totalAmount: number;
}

/** Pricing state in the wizard: single-room result or multi-room with perRoomBreakdown. */
export type BookingPriceState = PriceCalculation & { perRoomBreakdown?: PerRoomBreakdown[] };

// ---- Booking Wizard State ----
export interface BookingWizardState {
  currentStep: number;
  checkInDate: string | null;
  checkOutDate: string | null;
  numAdults: number;
  numChildren: number;
  selectedTypeId: string | null;
  selectedRoomId: string | null;
  selectedAddons: { addonId: string; quantity: number }[];
  guestInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    specialRequests: string;
  };
  paymentMethod: 'online' | 'manual' | null;
  priceCalculation: PriceCalculation | null;
}

// ---- API Response Types ----
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AvailabilityMap {
  [date: string]: {
    total_rooms: number;
    booked_rooms: number;
    status: 'available' | 'limited' | 'full';
  };
}

export interface BookingCreateResult {
  success: boolean;
  booking_id?: string;
  reference_number?: string;
  error?: string;
}

// ---- Service Types (Generalized) ----
export type ServiceCategory = 'venue_reservation' | 'event' | 'experience' | 'package' | 'general';
export type ServicePricingModel = 'fixed' | 'per_person' | 'per_hour' | 'tiered';

export interface ServicePricingTier {
  name: string;
  price: number;
  description?: string;
}

export interface ServiceType {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description: string | null;
  category: ServiceCategory;
  pricing_model: ServicePricingModel;
  base_price: number;
  min_pax: number;
  max_pax: number | null;
  pricing_tiers: ServicePricingTier[];
  inclusions: string[];
  images: AccommodationImage[];
  thumbnail_url: string | null;
  duration_hours: number | null;
  is_active: boolean;
  event_date: string | null;
  event_end_date: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type ServiceBookingStatus = 'pending' | 'confirmed' | 'paid' | 'completed' | 'cancelled' | 'no_show' | 'expired';

export interface ServiceBooking {
  id: string;
  tenant_id: string;
  service_type_id: string;
  reference_number: string;
  service_date: string;
  service_end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  num_pax: number;
  guest_first_name: string;
  guest_last_name: string;
  guest_email: string;
  guest_phone: string;
  special_requests: string | null;
  selected_tier: string | null;
  base_amount: number;
  addons_amount: number;
  total_amount: number;
  status: ServiceBookingStatus;
  payment_status: PaymentStatus;
  payment_method: string | null;
  payment_reference: string | null;
  payment_proof_url: string | null;
  paid_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  source: BookingSource;
  notes: string | null;
  created_by: string | null;
  guest_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  service_type?: ServiceType;
}
