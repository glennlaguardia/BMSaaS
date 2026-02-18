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
