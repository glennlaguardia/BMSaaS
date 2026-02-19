-- ============================================================
-- BudaBook — Migration 011: Generalized Service Types
-- ============================================================
-- Allows tenants to define custom service categories beyond
-- accommodations and day tours (e.g., venue reservations,
-- wine tasting, photoshoot, harvest festivals, etc.)
--
-- This is an ADDITIVE change — existing accommodation_types,
-- bookings, and day_tour_bookings tables remain untouched.

-- 1. service_types — tenant-configurable service categories
CREATE TABLE IF NOT EXISTS service_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL DEFAULT 'general'
    CHECK (category IN ('venue_reservation','event','experience','package','general')),
  -- Pricing configuration
  pricing_model VARCHAR(30) NOT NULL DEFAULT 'fixed'
    CHECK (pricing_model IN ('fixed','per_person','per_hour','tiered')),
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  -- For per_person pricing: min/max pax
  min_pax INTEGER DEFAULT 1,
  max_pax INTEGER,
  -- For tiered pricing, store tiers as JSON
  -- e.g. [{"name":"3 wines","price":800},{"name":"5 wines + charcuterie","price":1500}]
  pricing_tiers JSONB DEFAULT '[]',
  -- What's included
  inclusions JSONB DEFAULT '[]',
  -- Images
  images JSONB DEFAULT '[]',
  thumbnail_url TEXT,
  -- Duration (optional, for time-based services)
  duration_hours DECIMAL(4,1),
  -- Availability
  is_active BOOLEAN DEFAULT true,
  -- For events with specific dates
  event_date DATE,
  event_end_date DATE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_service_types_tenant ON service_types(tenant_id);
CREATE INDEX IF NOT EXISTS idx_service_types_category ON service_types(category);

-- 2. service_bookings — bookings for non-accommodation services
CREATE TABLE IF NOT EXISTS service_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  service_type_id UUID NOT NULL REFERENCES service_types(id),
  reference_number VARCHAR(20) UNIQUE NOT NULL,
  -- Date/time of the service
  service_date DATE NOT NULL,
  service_end_date DATE,
  start_time TIME,
  end_time TIME,
  -- Guest info
  num_pax INTEGER NOT NULL DEFAULT 1,
  guest_first_name VARCHAR(255) NOT NULL,
  guest_last_name VARCHAR(255) NOT NULL,
  guest_email VARCHAR(255) NOT NULL,
  guest_phone VARCHAR(50) NOT NULL,
  special_requests TEXT,
  -- Pricing (selected tier or calculated)
  selected_tier VARCHAR(255),
  base_amount DECIMAL(10,2) NOT NULL,
  addons_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  -- Status tracking (same statuses as bookings for consistency)
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','paid','completed','cancelled','no_show','expired')),
  payment_status VARCHAR(20) DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid','pending_verification','paid','refunded')),
  payment_method VARCHAR(30),
  payment_reference VARCHAR(255),
  payment_proof_url TEXT,
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  source VARCHAR(20) DEFAULT 'online'
    CHECK (source IN ('online','manual','phone','facebook','walk_in')),
  notes TEXT,
  created_by UUID REFERENCES admin_users(id),
  guest_id UUID REFERENCES guests(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_service_bookings_tenant ON service_bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_service ON service_bookings(service_type_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_date ON service_bookings(service_date);
CREATE INDEX IF NOT EXISTS idx_service_bookings_status ON service_bookings(status);
CREATE INDEX IF NOT EXISTS idx_service_bookings_ref ON service_bookings(reference_number);

-- 3. service_booking_addons — addons attached to service bookings
CREATE TABLE IF NOT EXISTS service_booking_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_booking_id UUID NOT NULL REFERENCES service_bookings(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES addons(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_svc_booking_addons ON service_booking_addons(service_booking_id);

-- 4. Update booking_status_log to support service bookings
ALTER TABLE booking_status_log
  ADD COLUMN IF NOT EXISTS service_booking_id UUID REFERENCES service_bookings(id) ON DELETE CASCADE;

-- Update the check constraint on booking_type to include 'service'
ALTER TABLE booking_status_log
  DROP CONSTRAINT IF EXISTS booking_status_log_booking_type_check;
ALTER TABLE booking_status_log
  ADD CONSTRAINT booking_status_log_booking_type_check
  CHECK (booking_type IN ('overnight','day_tour','service'));

CREATE INDEX IF NOT EXISTS idx_status_log_svc ON booking_status_log(service_booking_id);

-- 5. RLS policies (service role only for now)
ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_booking_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON service_types FOR ALL USING (false);
CREATE POLICY "Service role full access" ON service_bookings FOR ALL USING (false);
CREATE POLICY "Service role full access" ON service_booking_addons FOR ALL USING (false);

-- 6. Triggers for updated_at
CREATE TRIGGER set_updated_at_service_types
  BEFORE UPDATE ON service_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_service_bookings
  BEFORE UPDATE ON service_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Reference number generator for service bookings
CREATE OR REPLACE FUNCTION generate_service_reference_number()
RETURNS TEXT AS $$
DECLARE
  ref TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    ref := 'SV-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM service_bookings WHERE reference_number = ref) INTO exists_check;
    IF NOT exists_check THEN
      RETURN ref;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
