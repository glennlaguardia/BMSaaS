-- ============================================================
-- BudaBook — Booking groups for multi-room bookings
-- One group reference per multi-room booking; legacy single-room
-- bookings have booking_group_id NULL.
-- ============================================================

-- Table: booking_groups (must exist before the function that references it)
CREATE TABLE IF NOT EXISTS booking_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  group_reference_number VARCHAR(20) UNIQUE NOT NULL,
  total_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_booking_groups_tenant ON booking_groups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_booking_groups_ref ON booking_groups(group_reference_number);

-- Add booking_group_id to bookings (nullable for legacy single-room)
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS booking_group_id UUID REFERENCES booking_groups(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_booking_group ON bookings(booking_group_id);

-- Trigger for updated_at
CREATE TRIGGER set_updated_at_booking_groups
  BEFORE UPDATE ON booking_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Group reference number generator (distinct from single booking refs)
CREATE OR REPLACE FUNCTION generate_group_reference_number()
RETURNS TEXT AS $$
DECLARE
  ref TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    ref := 'GB-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM booking_groups WHERE group_reference_number = ref) INTO exists_check;
    IF NOT exists_check THEN
      RETURN ref;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
