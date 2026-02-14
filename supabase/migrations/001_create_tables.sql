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
