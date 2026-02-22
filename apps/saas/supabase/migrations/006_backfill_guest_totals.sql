-- ============================================================
-- BudaBook — Backfill guests.total_spent and guests.total_bookings
-- Idempotent: recomputes from current bookings and day_tour_bookings.
-- Excludes cancelled, expired, no_show.
-- Includes rows linked by guest_id OR (legacy) by tenant_id + guest_email when guest_id IS NULL.
-- ============================================================

UPDATE guests g
SET
  total_bookings = COALESCE(sub.booking_count, 0) + COALESCE(sub.day_tour_count, 0),
  total_spent = COALESCE(sub.booking_spent, 0) + COALESCE(sub.day_tour_spent, 0),
  updated_at = now()
FROM (
  SELECT
    g2.id,
    (SELECT COUNT(*)::integer FROM bookings b
     WHERE b.tenant_id = g2.tenant_id
       AND b.status NOT IN ('cancelled', 'expired', 'no_show')
       AND (b.guest_id = g2.id OR (b.guest_id IS NULL AND LOWER(TRIM(b.guest_email)) = LOWER(TRIM(g2.email))))) AS booking_count,
    (SELECT COALESCE(SUM(b.total_amount), 0) FROM bookings b
     WHERE b.tenant_id = g2.tenant_id
       AND b.status NOT IN ('cancelled', 'expired', 'no_show')
       AND (b.guest_id = g2.id OR (b.guest_id IS NULL AND LOWER(TRIM(b.guest_email)) = LOWER(TRIM(g2.email))))) AS booking_spent,
    (SELECT COUNT(*)::integer FROM day_tour_bookings d
     WHERE d.tenant_id = g2.tenant_id
       AND d.status NOT IN ('cancelled', 'expired', 'no_show')
       AND (d.guest_id = g2.id OR (d.guest_id IS NULL AND LOWER(TRIM(d.guest_email)) = LOWER(TRIM(g2.email))))) AS day_tour_count,
    (SELECT COALESCE(SUM(d.total_amount), 0) FROM day_tour_bookings d
     WHERE d.tenant_id = g2.tenant_id
       AND d.status NOT IN ('cancelled', 'expired', 'no_show')
       AND (d.guest_id = g2.id OR (d.guest_id IS NULL AND LOWER(TRIM(d.guest_email)) = LOWER(TRIM(g2.email))))) AS day_tour_spent
  FROM guests g2
) sub
WHERE g.id = sub.id;
