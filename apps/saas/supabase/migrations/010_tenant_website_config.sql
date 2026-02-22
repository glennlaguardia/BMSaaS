-- ============================================================
-- BudaBook — Migration 010: Tenant Website & Service Config
-- ============================================================
-- Adds columns needed for:
-- 1. Redirect-back from booking flow to client website
-- 2. Handler notification email
-- 3. Configurable service types per tenant

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS notification_email TEXT,
  ADD COLUMN IF NOT EXISTS enabled_service_types JSONB DEFAULT '["accommodation","day_tour"]';

-- Add comment for clarity
COMMENT ON COLUMN tenants.website_url IS 'Client website URL for redirect-back after booking';
COMMENT ON COLUMN tenants.notification_email IS 'Email for receiving new booking notifications';
COMMENT ON COLUMN tenants.enabled_service_types IS 'JSON array of enabled service types, e.g. ["accommodation","day_tour","venue_reservation"]';
