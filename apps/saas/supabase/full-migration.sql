-- BudaBook Full Migration + Seed (Auto-generated)
-- Run this in the Supabase Dashboard SQL Editor
-- ================================================

-- ============================================================
-- BudaBook Database Schema — Migration 001: Create All Tables
-- ============================================================

-- 1. tenants
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(63) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  tagline TEXT,
  description TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#2D5016',
  secondary_color VARCHAR(7) DEFAULT '#F5F0E8',
  accent_color VARCHAR(7) DEFAULT '#D4A574',
  font_family VARCHAR(100) DEFAULT 'Inter',
  font_heading VARCHAR(100) DEFAULT 'Playfair Display',
  font_body VARCHAR(100) DEFAULT 'Inter',
  meta_description TEXT,
  social_links JSONB DEFAULT '{}',
  contact_phone VARCHAR(50),
  contact_phone_2 VARCHAR(50),
  contact_email VARCHAR(255),
  facebook_url TEXT,
  instagram_url TEXT,
  tiktok_url TEXT,
  address TEXT,
  gps_latitude DECIMAL(10,7),
  gps_longitude DECIMAL(10,7),
  check_in_time TIME DEFAULT '15:00',
  check_out_time TIME DEFAULT '10:00',
  day_tour_start TIME DEFAULT '14:00',
  day_tour_end TIME DEFAULT '17:00',
  day_tour_capacity INTEGER DEFAULT 50,
  day_tour_rate_adult DECIMAL(10,2) DEFAULT 350.00,
  day_tour_rate_child DECIMAL(10,2) DEFAULT 200.00,
  booking_rules JSONB DEFAULT '{"require_full_payment":true,"min_advance_days":1,"max_advance_days":90,"payment_expiry_hours":48,"payment_details":{"gcash_number":"","gcash_name":"","bank_name":"","bank_account":"","bank_account_name":""}}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. admin_users
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255),
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(20) DEFAULT 'resort_admin' CHECK (role IN ('super_admin', 'resort_admin', 'staff')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_users_tenant ON admin_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);

-- 3. accommodation_types
CREATE TABLE IF NOT EXISTS accommodation_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  short_description VARCHAR(500),
  base_rate_weekday DECIMAL(10,2) NOT NULL,
  base_rate_weekend DECIMAL(10,2) NOT NULL,
  base_pax INTEGER NOT NULL DEFAULT 4,
  max_pax INTEGER NOT NULL DEFAULT 6,
  additional_pax_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  size_sqm DECIMAL(5,1),
  amenities JSONB DEFAULT '[]',
  inclusions JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_accom_types_tenant ON accommodation_types(tenant_id);

-- 4. rooms
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  accommodation_type_id UUID NOT NULL REFERENCES accommodation_types(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  view_description VARCHAR(500),
  unique_features JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rooms_tenant ON rooms(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rooms_type ON rooms(accommodation_type_id);

-- 5. guests
CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  total_bookings INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  tags JSONB DEFAULT '[]',
  first_visit DATE,
  last_visit DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, email)
);
CREATE INDEX IF NOT EXISTS idx_guests_tenant ON guests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_guests_email ON guests(email);

-- 6. addons
CREATE TABLE IF NOT EXISTS addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  pricing_model VARCHAR(20) DEFAULT 'per_booking' CHECK (pricing_model IN ('per_booking', 'per_person')),
  category VARCHAR(50) DEFAULT 'experience' CHECK (category IN ('experience', 'meal', 'amenity', 'other')),
  applies_to VARCHAR(20) DEFAULT 'overnight' CHECK (applies_to IN ('overnight', 'day_tour', 'both')),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_addons_tenant ON addons(tenant_id);

-- 7. bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  reference_number VARCHAR(20) UNIQUE NOT NULL,
  room_id UUID NOT NULL REFERENCES rooms(id),
  accommodation_type_id UUID NOT NULL REFERENCES accommodation_types(id),
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  num_adults INTEGER NOT NULL DEFAULT 1,
  num_children INTEGER NOT NULL DEFAULT 0,
  total_pax INTEGER GENERATED ALWAYS AS (num_adults + num_children) STORED,
  guest_first_name VARCHAR(255) NOT NULL,
  guest_last_name VARCHAR(255) NOT NULL,
  guest_email VARCHAR(255) NOT NULL,
  guest_phone VARCHAR(50) NOT NULL,
  special_requests TEXT,
  base_amount DECIMAL(10,2) NOT NULL,
  pax_surcharge DECIMAL(10,2) DEFAULT 0,
  addons_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','confirmed','paid','checked_in','checked_out','cancelled','no_show','expired')),
  payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','pending_verification','paid','partially_refunded','refunded')),
  payment_method VARCHAR(30),
  payment_reference VARCHAR(255),
  payment_proof_url TEXT,
  paid_at TIMESTAMPTZ,
  checked_in_at TIMESTAMPTZ,
  checked_out_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  source VARCHAR(20) DEFAULT 'online' CHECK (source IN ('online','manual','phone','facebook','walk_in')),
  notes TEXT,
  created_by UUID REFERENCES admin_users(id),
  guest_id UUID REFERENCES guests(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant ON bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room ON bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_ref ON bookings(reference_number);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_email ON bookings(guest_email);

-- 8. booking_addons
CREATE TABLE IF NOT EXISTS booking_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES addons(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_booking_addons_booking ON booking_addons(booking_id);

-- 9. day_tour_bookings
CREATE TABLE IF NOT EXISTS day_tour_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  reference_number VARCHAR(20) UNIQUE NOT NULL,
  tour_date DATE NOT NULL,
  num_adults INTEGER NOT NULL DEFAULT 1,
  num_children INTEGER NOT NULL DEFAULT 0,
  total_pax INTEGER GENERATED ALWAYS AS (num_adults + num_children) STORED,
  guest_first_name VARCHAR(255) NOT NULL,
  guest_last_name VARCHAR(255) NOT NULL,
  guest_email VARCHAR(255) NOT NULL,
  guest_phone VARCHAR(50) NOT NULL,
  special_requests TEXT,
  base_amount DECIMAL(10,2) NOT NULL,
  addons_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','confirmed','paid','completed','cancelled','no_show','expired')),
  payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','pending_verification','paid','refunded')),
  payment_method VARCHAR(30),
  payment_reference VARCHAR(255),
  payment_proof_url TEXT,
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  source VARCHAR(20) DEFAULT 'online',
  notes TEXT,
  created_by UUID REFERENCES admin_users(id),
  guest_id UUID REFERENCES guests(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_day_tour_tenant ON day_tour_bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_day_tour_date ON day_tour_bookings(tour_date);

-- 10. day_tour_booking_addons
CREATE TABLE IF NOT EXISTS day_tour_booking_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_tour_booking_id UUID NOT NULL REFERENCES day_tour_bookings(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES addons(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dt_booking_addons ON day_tour_booking_addons(day_tour_booking_id);

-- 11. booking_status_log (audit trail)
CREATE TABLE IF NOT EXISTS booking_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  day_tour_booking_id UUID REFERENCES day_tour_bookings(id) ON DELETE CASCADE,
  booking_type VARCHAR(20) NOT NULL CHECK (booking_type IN ('overnight','day_tour')),
  field_changed VARCHAR(30) NOT NULL CHECK (field_changed IN ('status','payment_status')),
  old_value VARCHAR(30),
  new_value VARCHAR(30) NOT NULL,
  changed_by UUID REFERENCES admin_users(id),
  change_source VARCHAR(20) DEFAULT 'system' CHECK (change_source IN ('system','admin','guest','cron')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_status_log_booking ON booking_status_log(booking_id);
CREATE INDEX IF NOT EXISTS idx_status_log_dt ON booking_status_log(day_tour_booking_id);
CREATE INDEX IF NOT EXISTS idx_status_log_tenant ON booking_status_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_status_log_created ON booking_status_log(created_at);

-- 12. rate_adjustments
CREATE TABLE IF NOT EXISTS rate_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  adjustment_type VARCHAR(20) NOT NULL CHECK (adjustment_type IN ('percentage_discount','percentage_surcharge','fixed_override')),
  adjustment_value DECIMAL(10,2) NOT NULL,
  applies_to VARCHAR(20) DEFAULT 'all' CHECK (applies_to IN ('all','specific')),
  accommodation_type_ids JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CHECK (start_date <= end_date)
);
CREATE INDEX IF NOT EXISTS idx_rate_adj_tenant ON rate_adjustments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rate_adj_dates ON rate_adjustments(start_date, end_date);

-- 13. website_sections
CREATE TABLE IF NOT EXISTS website_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  section_type VARCHAR(30) NOT NULL CHECK (section_type IN ('hero','about','accommodations','activities','gallery','pricing','testimonials','location','contact')),
  title VARCHAR(255),
  subtitle VARCHAR(500),
  is_visible BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  content JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, section_type)
);
CREATE INDEX IF NOT EXISTS idx_sections_tenant ON website_sections(tenant_id);

-- 14. testimonials
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  guest_name VARCHAR(255) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL,
  source VARCHAR(50) DEFAULT 'manual',
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_testimonials_tenant ON testimonials(tenant_id);

-- 15. gallery_images
CREATE TABLE IF NOT EXISTS gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(255),
  category VARCHAR(50) DEFAULT 'general',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gallery_tenant ON gallery_images(tenant_id);


-- ============================================================
-- BudaBook Database — Migration 002: Enable RLS and Create Policies
-- ============================================================

-- Enable RLS on all tenant-scoped tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodation_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_tour_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_tour_booking_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_status_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PUBLIC READ policies (for public-facing website and booking flow)
-- These allow anonymous users to read active tenant data
-- ============================================================

-- tenants: public read active tenants
CREATE POLICY "tenants_public_read" ON tenants
  FOR SELECT USING (is_active = true);

-- accommodation_types: public read active types for active tenants
CREATE POLICY "accom_types_public_read" ON accommodation_types
  FOR SELECT USING (is_active = true);

-- rooms: public read active rooms
CREATE POLICY "rooms_public_read" ON rooms
  FOR SELECT USING (is_active = true);

-- addons: public read active addons
CREATE POLICY "addons_public_read" ON addons
  FOR SELECT USING (is_active = true);

-- website_sections: public read visible sections
CREATE POLICY "sections_public_read" ON website_sections
  FOR SELECT USING (is_visible = true);

-- testimonials: public read featured testimonials
CREATE POLICY "testimonials_public_read" ON testimonials
  FOR SELECT USING (is_featured = true);

-- gallery_images: public read active images
CREATE POLICY "gallery_public_read" ON gallery_images
  FOR SELECT USING (is_active = true);

-- rate_adjustments: public read active adjustments (needed for pricing calc)
CREATE POLICY "rate_adj_public_read" ON rate_adjustments
  FOR SELECT USING (is_active = true);

-- bookings: public can view own booking by reference (for status lookup)
CREATE POLICY "bookings_public_read_own" ON bookings
  FOR SELECT USING (true);

-- day_tour_bookings: public can read own
CREATE POLICY "day_tour_public_read" ON day_tour_bookings
  FOR SELECT USING (true);

-- ============================================================
-- SERVICE ROLE bypasses RLS automatically, so all admin operations
-- via the service role client will work without additional policies.
-- The anon key + RLS policies above control public access.
-- ============================================================

-- Allow inserts for bookings from anon (public booking flow)
CREATE POLICY "bookings_public_insert" ON bookings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "day_tour_public_insert" ON day_tour_bookings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "booking_addons_public_insert" ON booking_addons
  FOR INSERT WITH CHECK (true);

CREATE POLICY "dt_booking_addons_public_insert" ON day_tour_booking_addons
  FOR INSERT WITH CHECK (true);

-- booking_status_log: public insert allowed (system logs during booking creation)
CREATE POLICY "status_log_public_insert" ON booking_status_log
  FOR INSERT WITH CHECK (true);

-- booking_status_log: public read allowed (status page)
CREATE POLICY "status_log_public_read" ON booking_status_log
  FOR SELECT USING (true);

-- guests: public insert (auto-created during booking)
CREATE POLICY "guests_public_insert" ON guests
  FOR INSERT WITH CHECK (true);

-- guests: public read (needed for upsert check)
CREATE POLICY "guests_public_read" ON guests
  FOR SELECT USING (true);

-- bookings: allow public update for payment proof upload
CREATE POLICY "bookings_public_update" ON bookings
  FOR UPDATE USING (true) WITH CHECK (true);

-- day_tour_bookings: allow public update for payment proof
CREATE POLICY "day_tour_public_update" ON day_tour_bookings
  FOR UPDATE USING (true) WITH CHECK (true);

-- admin_users: no public access (service role only)
-- No RLS policy needed — service role bypasses RLS


-- ============================================================
-- BudaBook Database — Migration 003: Database Functions
-- ============================================================

-- Function: Generate a unique reference number like BB-XXXXXXXX
CREATE OR REPLACE FUNCTION generate_reference_number()
RETURNS TEXT AS $$
DECLARE
  ref TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    ref := 'BB-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    -- Check both booking tables
    SELECT EXISTS(
      SELECT 1 FROM bookings WHERE reference_number = ref
      UNION ALL
      SELECT 1 FROM day_tour_bookings WHERE reference_number = ref
    ) INTO exists_check;
    IF NOT exists_check THEN
      RETURN ref;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;


-- Function: Create a booking with advisory lock to prevent overbooking
-- Supports multi-night stays: checks all nights in the range
CREATE OR REPLACE FUNCTION create_booking(
  p_tenant_id UUID,
  p_room_id UUID,
  p_accommodation_type_id UUID,
  p_check_in DATE,
  p_check_out DATE,
  p_num_adults INTEGER,
  p_num_children INTEGER,
  p_guest_first_name TEXT,
  p_guest_last_name TEXT,
  p_guest_email TEXT,
  p_guest_phone TEXT,
  p_special_requests TEXT,
  p_base_amount DECIMAL,
  p_pax_surcharge DECIMAL,
  p_addons_amount DECIMAL,
  p_discount_amount DECIMAL,
  p_total_amount DECIMAL,
  p_source TEXT DEFAULT 'online',
  p_created_by UUID DEFAULT NULL,
  p_addon_ids UUID[] DEFAULT ARRAY[]::UUID[],
  p_addon_quantities INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  p_addon_prices DECIMAL[] DEFAULT ARRAY[]::DECIMAL[]
)
RETURNS JSONB AS $$
DECLARE
  v_lock_key BIGINT;
  v_conflict_count INTEGER;
  v_booking_id UUID;
  v_ref TEXT;
  v_guest_id UUID;
  v_i INTEGER;
BEGIN
  -- Generate a lock key from room_id hash
  v_lock_key := ('x' || substring(p_room_id::text from 1 for 8))::bit(32)::bigint;

  -- Acquire advisory lock for this room
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- Check for overlapping bookings on this room for ALL nights in range
  -- A booking conflicts if it overlaps the [check_in, check_out) range
  SELECT COUNT(*) INTO v_conflict_count
  FROM bookings
  WHERE room_id = p_room_id
    AND status NOT IN ('cancelled', 'expired', 'no_show')
    AND check_in_date < p_check_out
    AND check_out_date > p_check_in;

  IF v_conflict_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Room is no longer available for the selected dates. Please choose different dates or another room.'
    );
  END IF;

  -- Generate reference number
  v_ref := generate_reference_number();

  -- Upsert guest record
  INSERT INTO guests (tenant_id, first_name, last_name, email, phone, total_bookings, first_visit, last_visit)
  VALUES (p_tenant_id, p_guest_first_name, p_guest_last_name, p_guest_email, p_guest_phone, 1, p_check_in, p_check_in)
  ON CONFLICT (tenant_id, email) DO UPDATE SET
    phone = COALESCE(EXCLUDED.phone, guests.phone),
    total_bookings = guests.total_bookings + 1,
    last_visit = GREATEST(guests.last_visit, p_check_in),
    updated_at = now()
  RETURNING id INTO v_guest_id;

  -- Create the booking
  INSERT INTO bookings (
    tenant_id, reference_number, room_id, accommodation_type_id,
    check_in_date, check_out_date, num_adults, num_children,
    guest_first_name, guest_last_name, guest_email, guest_phone,
    special_requests, base_amount, pax_surcharge, addons_amount,
    discount_amount, total_amount, source, created_by, guest_id
  ) VALUES (
    p_tenant_id, v_ref, p_room_id, p_accommodation_type_id,
    p_check_in, p_check_out, p_num_adults, p_num_children,
    p_guest_first_name, p_guest_last_name, p_guest_email, p_guest_phone,
    p_special_requests, p_base_amount, p_pax_surcharge, p_addons_amount,
    p_discount_amount, p_total_amount, p_source, p_created_by, v_guest_id
  )
  RETURNING id INTO v_booking_id;

  -- Insert booking addons
  IF array_length(p_addon_ids, 1) IS NOT NULL THEN
    FOR v_i IN 1..array_length(p_addon_ids, 1) LOOP
      INSERT INTO booking_addons (booking_id, addon_id, quantity, unit_price, total_price)
      VALUES (v_booking_id, p_addon_ids[v_i], p_addon_quantities[v_i], p_addon_prices[v_i], p_addon_quantities[v_i] * p_addon_prices[v_i]);
    END LOOP;
  END IF;

  -- Log the initial status
  INSERT INTO booking_status_log (
    tenant_id, booking_id, booking_type, field_changed,
    old_value, new_value, change_source, notes
  ) VALUES (
    p_tenant_id, v_booking_id, 'overnight', 'status',
    NULL, 'pending', 'system', 'Booking created via ' || p_source
  );

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'reference_number', v_ref
  );
END;
$$ LANGUAGE plpgsql;


-- Function: Create a day tour booking
CREATE OR REPLACE FUNCTION create_day_tour_booking(
  p_tenant_id UUID,
  p_tour_date DATE,
  p_num_adults INTEGER,
  p_num_children INTEGER,
  p_guest_first_name TEXT,
  p_guest_last_name TEXT,
  p_guest_email TEXT,
  p_guest_phone TEXT,
  p_special_requests TEXT,
  p_base_amount DECIMAL,
  p_addons_amount DECIMAL,
  p_total_amount DECIMAL,
  p_source TEXT DEFAULT 'online',
  p_created_by UUID DEFAULT NULL,
  p_addon_ids UUID[] DEFAULT ARRAY[]::UUID[],
  p_addon_quantities INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  p_addon_prices DECIMAL[] DEFAULT ARRAY[]::DECIMAL[]
)
RETURNS JSONB AS $$
DECLARE
  v_current_pax INTEGER;
  v_capacity INTEGER;
  v_booking_id UUID;
  v_ref TEXT;
  v_guest_id UUID;
  v_total_new_pax INTEGER;
  v_i INTEGER;
BEGIN
  -- Get day tour capacity
  SELECT day_tour_capacity INTO v_capacity FROM tenants WHERE id = p_tenant_id;

  -- Calculate total new pax
  v_total_new_pax := p_num_adults + p_num_children;

  -- Check current capacity for that date
  SELECT COALESCE(SUM(num_adults + num_children), 0) INTO v_current_pax
  FROM day_tour_bookings
  WHERE tenant_id = p_tenant_id
    AND tour_date = p_tour_date
    AND status NOT IN ('cancelled', 'expired', 'no_show');

  IF v_current_pax + v_total_new_pax > v_capacity THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Day tour is fully booked for this date. Only ' || (v_capacity - v_current_pax) || ' spots remaining.'
    );
  END IF;

  -- Generate reference number
  v_ref := generate_reference_number();

  -- Upsert guest
  INSERT INTO guests (tenant_id, first_name, last_name, email, phone, total_bookings, first_visit, last_visit)
  VALUES (p_tenant_id, p_guest_first_name, p_guest_last_name, p_guest_email, p_guest_phone, 1, p_tour_date, p_tour_date)
  ON CONFLICT (tenant_id, email) DO UPDATE SET
    phone = COALESCE(EXCLUDED.phone, guests.phone),
    total_bookings = guests.total_bookings + 1,
    last_visit = GREATEST(guests.last_visit, p_tour_date),
    updated_at = now()
  RETURNING id INTO v_guest_id;

  -- Create day tour booking
  INSERT INTO day_tour_bookings (
    tenant_id, reference_number, tour_date,
    num_adults, num_children,
    guest_first_name, guest_last_name, guest_email, guest_phone,
    special_requests, base_amount, addons_amount, total_amount,
    source, created_by, guest_id
  ) VALUES (
    p_tenant_id, v_ref, p_tour_date,
    p_num_adults, p_num_children,
    p_guest_first_name, p_guest_last_name, p_guest_email, p_guest_phone,
    p_special_requests, p_base_amount, p_addons_amount, p_total_amount,
    p_source, p_created_by, v_guest_id
  )
  RETURNING id INTO v_booking_id;

  -- Insert addons
  IF array_length(p_addon_ids, 1) IS NOT NULL THEN
    FOR v_i IN 1..array_length(p_addon_ids, 1) LOOP
      INSERT INTO day_tour_booking_addons (day_tour_booking_id, addon_id, quantity, unit_price, total_price)
      VALUES (v_booking_id, p_addon_ids[v_i], p_addon_quantities[v_i], p_addon_prices[v_i], p_addon_quantities[v_i] * p_addon_prices[v_i]);
    END LOOP;
  END IF;

  -- Log initial status
  INSERT INTO booking_status_log (
    tenant_id, day_tour_booking_id, booking_type, field_changed,
    old_value, new_value, change_source, notes
  ) VALUES (
    p_tenant_id, v_booking_id, 'day_tour', 'status',
    NULL, 'pending', 'system', 'Day tour booking created via ' || p_source
  );

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'reference_number', v_ref
  );
END;
$$ LANGUAGE plpgsql;


-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER set_updated_at_tenants BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_admin_users BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_accommodation_types BEFORE UPDATE ON accommodation_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_rooms BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_bookings BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_day_tour_bookings BEFORE UPDATE ON day_tour_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_addons BEFORE UPDATE ON addons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_rate_adjustments BEFORE UPDATE ON rate_adjustments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_guests BEFORE UPDATE ON guests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_website_sections BEFORE UPDATE ON website_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- BudaBook Database — Migration 004: Seed Data for Taglucop Strawberry Hills
-- NOTE: The admin password hash will be inserted by the JS seed script
-- because we need bcrypt hashing at runtime.
-- ============================================================

-- 1. Tenant
INSERT INTO tenants (
  id, slug, name, tagline, description, 
  primary_color, secondary_color, accent_color, font_family,
  contact_phone, contact_phone_2, contact_email,
  facebook_url, address, gps_latitude, gps_longitude,
  check_in_time, check_out_time,
  day_tour_start, day_tour_end, day_tour_capacity,
  day_tour_rate_adult, day_tour_rate_child,
  booking_rules, is_active
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-000000000001',
  'taglucop',
  'Taglucop Strawberry Hills',
  'Glamping in Bukidnon''s Strawberry Paradise',
  'A luxury glamping and agri-tourism resort nestled in the highlands of Bukidnon, Philippines. At 4,000 feet elevation, experience cool mountain air, sea of clouds, strawberry fields, and pine forests — all with the comforts of modern luxury.',
  '#2D5016', '#F5F0E8', '#D4A574', 'Inter',
  '+63 917 525 4613', '+63 963 288 9480', 'taglucopfarms@gmail.com',
  'https://facebook.com/tstrawberryhills',
  'Barangay Lorega, Kitaotao, Bukidnon, Philippines',
  7.6386, 125.0094,
  '15:00', '10:00',
  '14:00', '17:00', 50,
  350.00, 200.00,
  '{"require_full_payment":true,"min_advance_days":1,"max_advance_days":90,"allow_same_day":false,"payment_expiry_hours":48,"payment_details":{"gcash_number":"0917 525 4613","gcash_name":"Taglucop Farms","bank_name":"BDO","bank_account":"Contact resort for details","bank_account_name":"Taglucop Farms"}}',
  true
) ON CONFLICT (slug) DO NOTHING;

-- 2. Accommodation Types
INSERT INTO accommodation_types (id, tenant_id, name, slug, description, short_description, base_rate_weekday, base_rate_weekend, base_pax, max_pax, additional_pax_fee, size_sqm, amenities, inclusions, is_active, sort_order) VALUES
('a1b2c3d4-0001-0001-0001-000000000001', 'a1b2c3d4-e5f6-7890-abcd-000000000001', 'Cocoon Suite', 'cocoon-suite', 'Our newest luxury accommodation featuring a private swimming pool, hot tub, and fire pit. The Cocoon Suite offers an unparalleled glamping experience with modern amenities surrounded by lush forestry. Perfect for couples and families seeking privacy and indulgence.', 'Private pool, hot tub, and fire pit with luxury modern interiors', 19800.00, 19800.00, 4, 6, 2500.00, NULL, '["AC", "Private Swimming Pool", "Hot Tub", "Fire Pit", "En-suite Bathroom", "Modern Interiors", "Lush Forest View", "Electricity", "Hot Water"]', '["Breakfast for 4", "Welcome Grazing Platter", "Strawberry Juice", "Pool Access", "Toiletries", "Drinking Water"]', true, 1),
('a1b2c3d4-0001-0001-0001-000000000002', 'a1b2c3d4-e5f6-7890-abcd-000000000001', 'Geodesic Dome Tent', 'dome-tent', 'Our signature 28 sqm geodesic dome tents combine the thrill of camping with luxury living. Each dome features air conditioning, cozy beds, an en-suite bathroom, Android TV with Netflix, and a private outdoor Jacuzzi with 2 hours of free bubbles. Step onto your private deck to enjoy breathtaking mountain views and the cool highland breeze.', '28 sqm luxury dome with AC, Jacuzzi, Netflix, and mountain views', 9800.00, 10800.00, 4, 6, 1800.00, 28.0, '["AC", "En-suite Bathroom", "Android TV with Netflix", "Outdoor Jacuzzi", "Private Deck", "Mountain View", "Electricity", "Hot Water", "Cozy Beds", "Living Area"]', '["Breakfast for 4", "Welcome Grazing Platter", "Strawberry Juice", "Pool Access", "2-Hour Jacuzzi Bubbles", "Toiletries", "Drinking Water"]', true, 2),
('a1b2c3d4-0001-0001-0001-000000000003', 'a1b2c3d4-e5f6-7890-abcd-000000000001', 'Premium Tent', 'premium-tent', 'An elevated glamping experience with larger space and premium furnishings. The Premium Tent offers everything the Dome Tent has plus additional luxury touches, more space, and superior views. Ideal for those who want the absolute best.', 'Upgraded dome experience with premium furnishings and superior views', 13800.00, 13800.00, 4, 8, 2000.00, NULL, '["AC", "En-suite Bathroom", "Android TV with Netflix", "Outdoor Jacuzzi", "Private Deck", "Panoramic Mountain View", "Electricity", "Hot Water", "Premium Beds", "Spacious Living Area"]', '["Breakfast for 4", "Welcome Grazing Platter", "Strawberry Wine", "Pool Access", "2-Hour Jacuzzi Bubbles", "Premium Toiletries", "Drinking Water"]', true, 3),
('a1b2c3d4-0001-0001-0001-000000000004', 'a1b2c3d4-e5f6-7890-abcd-000000000001', 'Tiny House', 'tiny-house', 'Compact and modern, our Tiny Houses offer a cozy retreat for couples or small groups. Featuring clean design, comfortable beds, and essential amenities — perfect for travelers who want a comfortable stay without the premium price.', 'Compact modern stay for couples with essential comforts', 7500.00, 7500.00, 2, 4, 1500.00, NULL, '["AC", "Private Bathroom", "Electricity", "Hot Water", "Comfortable Bed", "Small Deck"]', '["Breakfast for 2", "Welcome Juice", "Pool Access", "Toiletries", "Drinking Water"]', true, 4)
ON CONFLICT DO NOTHING;

-- 3. Rooms
INSERT INTO rooms (id, tenant_id, accommodation_type_id, name, description, view_description, unique_features, sort_order) VALUES
('a1b2c3d4-0002-0001-0001-000000000001', 'a1b2c3d4-e5f6-7890-abcd-000000000001', 'a1b2c3d4-0001-0001-0001-000000000001', 'Cocoon Suite - Pine Haven', 'Nestled among the pine trees with ultimate privacy', 'Surrounded by pine groves with filtered mountain light', '["Most secluded unit", "Pine tree canopy", "Private pathway"]', 1),
('a1b2c3d4-0002-0001-0001-000000000002', 'a1b2c3d4-e5f6-7890-abcd-000000000001', 'a1b2c3d4-0001-0001-0001-000000000001', 'Cocoon Suite - Cloud Nine', 'Positioned for the best sea of clouds viewing', 'Highest elevation unit with unobstructed eastern views', '["Best sunrise spot", "Highest elevation", "Sea of clouds view"]', 2),
('a1b2c3d4-0002-0002-0001-000000000001', 'a1b2c3d4-e5f6-7890-abcd-000000000001', 'a1b2c3d4-0001-0001-0001-000000000002', 'Dome Tent - Sunrise View', 'East-facing dome with the first light of dawn', 'East-facing with unobstructed sunrise and sea of clouds view', '["Corner unit", "Closest to infinity pool", "Best sunrise"]', 1),
('a1b2c3d4-0002-0002-0001-000000000002', 'a1b2c3d4-e5f6-7890-abcd-000000000001', 'a1b2c3d4-0001-0001-0001-000000000002', 'Dome Tent - Garden View', 'Overlooking the strawberry fields', 'Direct view of strawberry fields and pine forest', '["Ground level access", "Private garden area", "Near restaurant"]', 2),
('a1b2c3d4-0002-0002-0001-000000000003', 'a1b2c3d4-e5f6-7890-abcd-000000000001', 'a1b2c3d4-0001-0001-0001-000000000002', 'Dome Tent - Mountain Ridge', 'Perched on the ridge with panoramic views', 'Panoramic mountain ridge view with valley below', '["Highest dome", "360-degree views", "Most private"]', 3),
('a1b2c3d4-0002-0002-0001-000000000004', 'a1b2c3d4-e5f6-7890-abcd-000000000001', 'a1b2c3d4-0001-0001-0001-000000000002', 'Dome Tent - Forest Edge', 'Where the pine forest meets the meadow', 'Forest edge with mixed pine and meadow views', '["Forest adjacent", "Quiet location", "Nature sounds"]', 4),
('a1b2c3d4-0002-0003-0001-000000000001', 'a1b2c3d4-e5f6-7890-abcd-000000000001', 'a1b2c3d4-0001-0001-0001-000000000003', 'Premium Tent - Summit View', 'The crown jewel with the widest vista', 'Commanding 180-degree view of mountain peaks and valleys', '["Largest premium unit", "Best overall view", "VIP location"]', 1),
('a1b2c3d4-0002-0003-0001-000000000002', 'a1b2c3d4-e5f6-7890-abcd-000000000001', 'a1b2c3d4-0001-0001-0001-000000000003', 'Premium Tent - Horizon', 'Where the sky meets the mountains', 'Western-facing with stunning sunset and horizon views', '["Sunset view", "Premium furnishings", "Extra spacious"]', 2),
('a1b2c3d4-0002-0004-0001-000000000001', 'a1b2c3d4-e5f6-7890-abcd-000000000001', 'a1b2c3d4-0001-0001-0001-000000000004', 'Tiny House - The Nest', 'A cozy retreat for two', 'Garden view with strawberry fields in the distance', '["Most affordable", "Couples favorite", "Garden access"]', 1),
('a1b2c3d4-0002-0004-0001-000000000002', 'a1b2c3d4-e5f6-7890-abcd-000000000001', 'a1b2c3d4-0001-0001-0001-000000000004', 'Tiny House - The Perch', 'Elevated with a view', 'Slightly elevated with tree-level views', '["Elevated position", "Tree-level view", "Quiet corner"]', 2),
('a1b2c3d4-0002-0004-0001-000000000003', 'a1b2c3d4-e5f6-7890-abcd-000000000001', 'a1b2c3d4-0001-0001-0001-000000000004', 'Tiny House - The Burrow', 'Tucked in among the greenery', 'Surrounded by lush greenery and flowering plants', '["Most secluded tiny house", "Lush garden", "Romantic"]', 3)
ON CONFLICT DO NOTHING;

-- 4. Add-ons
INSERT INTO addons (id, tenant_id, name, description, price, pricing_model, category, applies_to, sort_order) VALUES
('a1b2c3d4-0003-0001-0001-000000000001', 'a1b2c3d4-e5f6-7890-abcd-000000000001', 'Bonfire with S''mores & Sausages', 'Cozy bonfire experience with s''mores kit and grilled sausages', 650.00, 'per_booking', 'experience', 'overnight', 1),
('a1b2c3d4-0003-0001-0001-000000000002', 'a1b2c3d4-e5f6-7890-abcd-000000000001', 'Lunch / Dinner', 'Farm-to-table full course meal', 650.00, 'per_person', 'meal', 'both', 2),
('a1b2c3d4-0003-0001-0001-000000000003', 'a1b2c3d4-e5f6-7890-abcd-000000000001', 'Snack Platter', 'Curated snack platter with local treats', 390.00, 'per_person', 'meal', 'both', 3),
('a1b2c3d4-0003-0001-0001-000000000004', 'a1b2c3d4-e5f6-7890-abcd-000000000001', 'Breakfast', 'Full breakfast meal (additional beyond included breakfast)', 450.00, 'per_person', 'meal', 'both', 4),
('a1b2c3d4-0003-0001-0001-000000000005', 'a1b2c3d4-e5f6-7890-abcd-000000000001', 'Strawberry Picking Experience', 'Pick your own fresh highland strawberries (seasonal)', 150.00, 'per_person', 'experience', 'both', 5),
('a1b2c3d4-0003-0001-0001-000000000006', 'a1b2c3d4-e5f6-7890-abcd-000000000001', 'Strawberry Wine Tasting', 'Sample locally produced strawberry wine and ice wine', 200.00, 'per_person', 'experience', 'overnight', 6),
('a1b2c3d4-0003-0001-0001-000000000007', 'a1b2c3d4-e5f6-7890-abcd-000000000001', 'Grazing Platter Upgrade', 'Premium cheese and cold cuts grazing platter upgrade', 500.00, 'per_booking', 'meal', 'overnight', 7)
ON CONFLICT DO NOTHING;

-- 5. Website Sections
INSERT INTO website_sections (tenant_id, section_type, title, subtitle, is_visible, sort_order, content) VALUES
('a1b2c3d4-e5f6-7890-abcd-000000000001', 'hero', 'Taglucop Strawberry Hills', 'Glamping in Bukidnon''s Strawberry Paradise', true, 1, '{"tagline":"Glamping in Bukidnon''s Strawberry Paradise","subtitle":"Luxury camping meets farm-fresh experiences at 4,000 feet above sea level","cta_text":"Book Your Stay","cta_link":"/book","overlay_opacity":40}'),
('a1b2c3d4-e5f6-7890-abcd-000000000001', 'about', 'Our Story', 'The story behind the hills', true, 2, '{"heading":"Our Story","body":"Opened in 2020 as a strawberry farm turned glamping site during the pandemic, Taglucop Strawberry Hills blends luxury with rural charm. What started as a simple strawberry farm in the highlands of Bukidnon has grown into one of Mindanao''s most sought-after glamping destinations.\n\nOwned and operated by Taglucop Farms, we promote a ''glamping not camping'' vibe — modern comforts wrapped in nature''s embrace. Nestled on hill slopes with pine groves, strawberry fields, and mountain views including breathtaking sea of clouds at dawn.\n\nBy 2025, we''ve expanded with Cocoon Suites and Tiny Houses, earned 91K+ Facebook followers, and continue to be the go-to destination for family getaways, romantic escapes, and group retreats in Central Mindanao.","highlights":[{"label":"Elevation","value":"4,000 ft"},{"label":"Temperature","value":"15-20°C"},{"label":"Since","value":"2020"},{"label":"Followers","value":"91K+"}]}'),
('a1b2c3d4-e5f6-7890-abcd-000000000001', 'accommodations', 'Our Accommodations', 'Choose your highland retreat', true, 3, '{"heading":"Our Accommodations","subtitle":"Choose your highland retreat"}'),
('a1b2c3d4-e5f6-7890-abcd-000000000001', 'activities', 'Experiences Await', 'More than just a stay — immerse yourself in highland living', true, 4, '{"heading":"Experiences Await","subtitle":"More than just a stay — immerse yourself in highland living","activities":[{"name":"Strawberry Picking","description":"Pick your own fresh strawberries from our highland fields. A seasonal farm-to-hand experience.","icon":"strawberry"},{"name":"Sea of Clouds","description":"Wake up to breathtaking sea of clouds at dawn from your private deck or the infinity pool.","icon":"cloud"},{"name":"Bonfire Night","description":"Gather around the fire with s''mores and sausages under a blanket of stars.","icon":"flame"},{"name":"Infinity Pool","description":"Swim in our three-tiered infinity pool with stunning mountain panoramas.","icon":"waves"},{"name":"Forest Hikes","description":"Explore the pine forest trails and discover the natural beauty surrounding the resort.","icon":"trees"},{"name":"Farm Tours","description":"Learn about strawberry cultivation and highland agriculture with our guided farm tours.","icon":"tractor"}]}'),
('a1b2c3d4-e5f6-7890-abcd-000000000001', 'gallery', 'Gallery', 'A glimpse of paradise', true, 5, '{"heading":"Gallery","subtitle":"A glimpse of paradise"}'),
('a1b2c3d4-e5f6-7890-abcd-000000000001', 'pricing', 'Rates & Pricing', 'Transparent pricing for your highland getaway', true, 6, '{"heading":"Rates & Pricing","subtitle":"Transparent pricing for your highland getaway","day_tour_note":"Day Tour: PHP 200-350 per person (2-5 PM, includes welcome juice and platter)"}'),
('a1b2c3d4-e5f6-7890-abcd-000000000001', 'testimonials', 'What Our Guests Say', 'Real experiences from real visitors', true, 7, '{"heading":"What Our Guests Say","subtitle":"Real experiences from real visitors"}'),
('a1b2c3d4-e5f6-7890-abcd-000000000001', 'location', 'Getting Here', 'How to reach paradise', true, 8, '{"heading":"Getting Here","description":"Located in the highlands of Barangay Lorega, Kitaotao, Bukidnon at approximately 4,000 feet above sea level. Near Central Mindanao University.","directions":[{"from":"Davao City","duration":"2-3 hours","description":"Via Sayre Highway, heading north"},{"from":"Cagayan de Oro","duration":"1.5-2 hours","description":"Via Malaybalay, heading south"},{"from":"Malaybalay","duration":"1-1.5 hours","description":"Direct route via Kitaotao"},{"from":"Tagum City","duration":"3 hours","description":"Via Sayre Highway, heading north"}],"travel_tips":"The last 5-10 km have rough roads. 4x4 vehicles are recommended especially during rainy season."}'),
('a1b2c3d4-e5f6-7890-abcd-000000000001', 'contact', 'Get in Touch', 'For inquiries and reservations', true, 9, '{"heading":"Get in Touch","subtitle":"For inquiries and reservations","show_inquiry_form":true}')
ON CONFLICT (tenant_id, section_type) DO NOTHING;

-- 6. Testimonials
INSERT INTO testimonials (tenant_id, guest_name, rating, content, source, is_featured) VALUES
('a1b2c3d4-e5f6-7890-abcd-000000000001', 'Maria Santos', 5, 'Absolutely unforgettable! The dome tent was luxurious, the views were breathtaking, and the strawberry picking was such a unique experience. My family loved every moment.', 'Facebook', true),
('a1b2c3d4-e5f6-7890-abcd-000000000001', 'Carlos Reyes', 5, 'The sea of clouds at sunrise was magical. The infinity pool with mountain views is a dream. Food was delicious — the farm-to-table meals were incredible. Will definitely come back!', 'Google', true),
('a1b2c3d4-e5f6-7890-abcd-000000000001', 'Ana Lim', 4, 'Beautiful place with amazing ambiance. The cocoon suite was worth every peso — private pool and hot tub made it feel so exclusive. Only downside is the rough road getting there, but it is totally worth it.', 'TripAdvisor', true),
('a1b2c3d4-e5f6-7890-abcd-000000000001', 'Jake Torres', 5, 'Perfect romantic getaway! My partner and I stayed in the Tiny House and it was cozy and charming. The bonfire under the stars was the highlight. The staff were so welcoming.', 'Facebook', true),
('a1b2c3d4-e5f6-7890-abcd-000000000001', 'Diane Cruz', 4, 'Great for families! Kids loved picking strawberries and swimming in the infinity pool. The grazing platter and strawberry wine were a nice touch. Highly recommended for a weekend escape.', 'Google', true)
ON CONFLICT DO NOTHING;


-- Admin user (password: epstein, bcrypt hashed)
INSERT INTO admin_users (id, tenant_id, username, email, password_hash, full_name, role, is_active)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-000000000002',
  'a1b2c3d4-e5f6-7890-abcd-000000000001',
  'epstein',
  'taglucopfarms@gmail.com',
  '$2b$12$W3.jB8g6yAKNYTsgHZEDMOFrc/p3HnUTM1yyPNXdDkdLnAqpUjlBi',
  'Resort Admin',
  'resort_admin',
  true
)
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;
