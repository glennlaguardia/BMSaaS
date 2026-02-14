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
