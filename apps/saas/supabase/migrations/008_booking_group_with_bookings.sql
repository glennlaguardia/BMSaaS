-- ============================================================
-- BudaBook — create_booking with optional group; create_booking_group_with_bookings
-- ============================================================

-- Add optional booking_group_id to create_booking
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
  p_addon_prices DECIMAL[] DEFAULT ARRAY[]::DECIMAL[],
  p_booking_group_id UUID DEFAULT NULL
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
  v_lock_key := ('x' || substring(p_room_id::text from 1 for 8))::bit(32)::bigint;
  PERFORM pg_advisory_xact_lock(v_lock_key);

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

  v_ref := generate_reference_number();

  INSERT INTO guests (tenant_id, first_name, last_name, email, phone, total_bookings, first_visit, last_visit)
  VALUES (p_tenant_id, p_guest_first_name, p_guest_last_name, p_guest_email, p_guest_phone, 1, p_check_in, p_check_in)
  ON CONFLICT (tenant_id, email) DO UPDATE SET
    phone = COALESCE(EXCLUDED.phone, guests.phone),
    total_bookings = guests.total_bookings + 1,
    last_visit = GREATEST(guests.last_visit, p_check_in),
    updated_at = now()
  RETURNING id INTO v_guest_id;

  INSERT INTO bookings (
    tenant_id, reference_number, room_id, accommodation_type_id,
    check_in_date, check_out_date, num_adults, num_children,
    guest_first_name, guest_last_name, guest_email, guest_phone,
    special_requests, base_amount, pax_surcharge, addons_amount,
    discount_amount, total_amount, source, created_by, guest_id,
    booking_group_id
  ) VALUES (
    p_tenant_id, v_ref, p_room_id, p_accommodation_type_id,
    p_check_in, p_check_out, p_num_adults, p_num_children,
    p_guest_first_name, p_guest_last_name, p_guest_email, p_guest_phone,
    p_special_requests, p_base_amount, p_pax_surcharge, p_addons_amount,
    p_discount_amount, p_total_amount, p_source, p_created_by, v_guest_id,
    p_booking_group_id
  )
  RETURNING id INTO v_booking_id;

  IF array_length(p_addon_ids, 1) IS NOT NULL THEN
    FOR v_i IN 1..array_length(p_addon_ids, 1) LOOP
      INSERT INTO booking_addons (booking_id, addon_id, quantity, unit_price, total_price)
      VALUES (v_booking_id, p_addon_ids[v_i], p_addon_quantities[v_i], p_addon_prices[v_i], p_addon_quantities[v_i] * p_addon_prices[v_i]);
    END LOOP;
  END IF;

  UPDATE guests
  SET total_spent = total_spent + p_total_amount,
      updated_at = now()
  WHERE id = v_guest_id;

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


-- Create booking group and child bookings in one transaction.
-- p_rooms: JSONB array of { room_id, accommodation_type_id, base_amount, pax_surcharge, addons_amount, total_amount, addon_ids, addon_quantities, addon_prices }
CREATE OR REPLACE FUNCTION create_booking_group_with_bookings(
  p_tenant_id UUID,
  p_check_in DATE,
  p_check_out DATE,
  p_num_adults INTEGER,
  p_num_children INTEGER,
  p_guest_first_name TEXT,
  p_guest_last_name TEXT,
  p_guest_email TEXT,
  p_guest_phone TEXT,
  p_special_requests TEXT DEFAULT NULL,
  p_source TEXT DEFAULT 'online',
  p_rooms JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_group_id UUID;
  v_group_ref TEXT;
  v_total_amount DECIMAL := 0;
  v_room JSONB;
  v_result JSONB;
  v_addon_ids UUID[];
  v_addon_quantities INTEGER[];
  v_addon_prices DECIMAL[];
  v_i INTEGER;
  v_idx INTEGER;
BEGIN
  IF jsonb_array_length(p_rooms) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'At least one room is required.');
  END IF;

  v_group_ref := generate_group_reference_number();

  SELECT COALESCE(SUM((r->>'total_amount')::DECIMAL), 0) INTO v_total_amount
  FROM jsonb_array_elements(p_rooms) AS r;

  INSERT INTO booking_groups (tenant_id, group_reference_number, total_amount)
  VALUES (p_tenant_id, v_group_ref, v_total_amount)
  RETURNING id INTO v_group_id;

  FOR v_idx IN 0..(jsonb_array_length(p_rooms) - 1) LOOP
    v_room := p_rooms->v_idx;
    v_addon_ids := ARRAY[]::UUID[];
    v_addon_quantities := ARRAY[]::INTEGER[];
    v_addon_prices := ARRAY[]::DECIMAL[];
    IF v_room ? 'addon_ids' AND jsonb_array_length(v_room->'addon_ids') > 0 THEN
      FOR v_i IN 0..(jsonb_array_length(v_room->'addon_ids') - 1) LOOP
        v_addon_ids := v_addon_ids || (v_room->'addon_ids'->>v_i)::UUID;
        v_addon_quantities := v_addon_quantities || COALESCE((v_room->'addon_quantities'->>v_i)::INTEGER, 1);
        v_addon_prices := v_addon_prices || COALESCE((v_room->'addon_prices'->>v_i)::DECIMAL, 0);
      END LOOP;
    END IF;

    v_result := create_booking(
      p_tenant_id,
      (v_room->>'room_id')::UUID,
      (v_room->>'accommodation_type_id')::UUID,
      p_check_in,
      p_check_out,
      p_num_adults,
      p_num_children,
      p_guest_first_name,
      p_guest_last_name,
      p_guest_email,
      p_guest_phone,
      p_special_requests,
      (v_room->>'base_amount')::DECIMAL,
      (v_room->>'pax_surcharge')::DECIMAL,
      (v_room->>'addons_amount')::DECIMAL,
      0,
      (v_room->>'total_amount')::DECIMAL,
      p_source,
      NULL,
      v_addon_ids,
      v_addon_quantities,
      v_addon_prices,
      v_group_id
    );

    IF NOT (v_result->>'success')::BOOLEAN THEN
      RAISE EXCEPTION 'Booking failed: %', v_result->>'error';
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'group_id', v_group_id,
    'group_reference_number', v_group_ref
  );
END;
$$ LANGUAGE plpgsql;
