-- ============================================================
-- BudaBook Database — Migration 005: Populate Images for Taglucop
-- Updates accommodation types, rooms, and tenant with placeholder images
-- Inserts gallery images
-- ============================================================

-- 1. Accommodation Type Thumbnails & Images
UPDATE accommodation_types 
SET thumbnail_url = '/placeholders/cocoon-suite-exterior.png',
    images = '[ "/placeholders/cocoon-suite-exterior.png", "/placeholders/accommodation-interior.png" ]'::jsonb
WHERE id = 'a1b2c3d4-0001-0001-0001-000000000001';

UPDATE accommodation_types 
SET thumbnail_url = '/placeholders/dome-tent-exterior.png',
    images = '[ "/placeholders/dome-tent-exterior.png", "/placeholders/gallery-dome-interior.png" ]'::jsonb
WHERE id = 'a1b2c3d4-0001-0001-0001-000000000002';

UPDATE accommodation_types 
SET thumbnail_url = '/placeholders/premium-tent-exterior.png',
    images = '[ "/placeholders/premium-tent-exterior.png", "/placeholders/accommodation-interior.png" ]'::jsonb
WHERE id = 'a1b2c3d4-0001-0001-0001-000000000003';

UPDATE accommodation_types 
SET thumbnail_url = '/placeholders/tiny-house-exterior.png',
    images = '[ "/placeholders/tiny-house-exterior.png" ]'::jsonb
WHERE id = 'a1b2c3d4-0001-0001-0001-000000000004';

-- 2. Room Images (each room gets its accommodation type thumbnail + shared images)
-- Cocoon Suites
UPDATE rooms SET images = '[ "/placeholders/cocoon-suite-exterior.png", "/placeholders/accommodation-interior.png" ]'::jsonb
WHERE id = 'a1b2c3d4-0002-0001-0001-000000000001';
UPDATE rooms SET images = '[ "/placeholders/cocoon-suite-exterior.png", "/placeholders/gallery-sea-of-clouds.png" ]'::jsonb
WHERE id = 'a1b2c3d4-0002-0001-0001-000000000002';

-- Dome Tents
UPDATE rooms SET images = '[ "/placeholders/dome-tent-exterior.png", "/placeholders/gallery-dome-interior.png" ]'::jsonb
WHERE id = 'a1b2c3d4-0002-0002-0001-000000000001';
UPDATE rooms SET images = '[ "/placeholders/dome-tent-exterior.png", "/placeholders/about-farm-nature.png" ]'::jsonb
WHERE id = 'a1b2c3d4-0002-0002-0001-000000000002';
UPDATE rooms SET images = '[ "/placeholders/dome-tent-exterior.png", "/placeholders/gallery-sea-of-clouds.png" ]'::jsonb
WHERE id = 'a1b2c3d4-0002-0002-0001-000000000003';
UPDATE rooms SET images = '[ "/placeholders/dome-tent-exterior.png", "/placeholders/gallery-dome-interior.png" ]'::jsonb
WHERE id = 'a1b2c3d4-0002-0002-0001-000000000004';

-- Premium Tents
UPDATE rooms SET images = '[ "/placeholders/premium-tent-exterior.png", "/placeholders/accommodation-interior.png" ]'::jsonb
WHERE id = 'a1b2c3d4-0002-0003-0001-000000000001';
UPDATE rooms SET images = '[ "/placeholders/premium-tent-exterior.png", "/placeholders/gallery-sea-of-clouds.png" ]'::jsonb
WHERE id = 'a1b2c3d4-0002-0003-0001-000000000002';

-- Tiny Houses
UPDATE rooms SET images = '[ "/placeholders/tiny-house-exterior.png" ]'::jsonb
WHERE id = 'a1b2c3d4-0002-0004-0001-000000000001';
UPDATE rooms SET images = '[ "/placeholders/tiny-house-exterior.png", "/placeholders/about-farm-nature.png" ]'::jsonb
WHERE id = 'a1b2c3d4-0002-0004-0001-000000000002';
UPDATE rooms SET images = '[ "/placeholders/tiny-house-exterior.png" ]'::jsonb
WHERE id = 'a1b2c3d4-0002-0004-0001-000000000003';

-- 3. Gallery Images
INSERT INTO gallery_images (tenant_id, image_url, alt_text, category, sort_order, is_active) VALUES
('a1b2c3d4-e5f6-7890-abcd-000000000001', '/placeholders/hero-resort.png', 'Taglucop Strawberry Hills highland resort panorama', 'accommodation', 1, true),
('a1b2c3d4-e5f6-7890-abcd-000000000001', '/placeholders/cocoon-suite-exterior.png', 'Cocoon Suite nestled in pine forest', 'accommodation', 2, true),
('a1b2c3d4-e5f6-7890-abcd-000000000001', '/placeholders/dome-tent-exterior.png', 'Geodesic dome tent with mountain views', 'accommodation', 3, true),
('a1b2c3d4-e5f6-7890-abcd-000000000001', '/placeholders/gallery-dome-interior.png', 'Luxury dome tent interior with cozy bedding', 'accommodation', 4, true),
('a1b2c3d4-e5f6-7890-abcd-000000000001', '/placeholders/premium-tent-exterior.png', 'Premium glamping tent overlooking the valley', 'accommodation', 5, true),
('a1b2c3d4-e5f6-7890-abcd-000000000001', '/placeholders/tiny-house-exterior.png', 'Modern tiny house surrounded by flowers', 'accommodation', 6, true),
('a1b2c3d4-e5f6-7890-abcd-000000000001', '/placeholders/gallery-sea-of-clouds.png', 'Breathtaking sea of clouds at sunrise', 'nature', 7, true),
('a1b2c3d4-e5f6-7890-abcd-000000000001', '/placeholders/gallery-aerial.png', 'Aerial view of the resort and surroundings', 'nature', 8, true),
('a1b2c3d4-e5f6-7890-abcd-000000000001', '/placeholders/about-farm-nature.png', 'Highland strawberry fields at golden hour', 'nature', 9, true),
('a1b2c3d4-e5f6-7890-abcd-000000000001', '/placeholders/gallery-infinity-pool.png', 'Infinity pool with sea of clouds panorama', 'activity', 10, true),
('a1b2c3d4-e5f6-7890-abcd-000000000001', '/placeholders/gallery-strawberry-picking.png', 'Strawberry picking experience in the highlands', 'activity', 11, true),
('a1b2c3d4-e5f6-7890-abcd-000000000001', '/placeholders/gallery-bonfire-night.png', 'Cozy bonfire night under the stars', 'activity', 12, true),
('a1b2c3d4-e5f6-7890-abcd-000000000001', '/placeholders/gallery-dining.png', 'Farm-to-table dining with mountain views', 'dining', 13, true),
('a1b2c3d4-e5f6-7890-abcd-000000000001', '/placeholders/about-resort-aerial.png', 'Aerial view of dome tents and tiny houses', 'accommodation', 14, true)
ON CONFLICT DO NOTHING;

-- 4. Update Hero section content with background image
UPDATE website_sections 
SET content = jsonb_set(content, '{background_image}', '"/placeholders/hero-resort.png"')
WHERE tenant_id = 'a1b2c3d4-e5f6-7890-abcd-000000000001' 
  AND section_type = 'hero';

-- 5. Update About section with images
UPDATE website_sections 
SET content = jsonb_set(
  jsonb_set(content, '{images}', '["/placeholders/about-resort-aerial.png", "/placeholders/about-farm-nature.png"]'::jsonb),
  '{background_image}', '"/placeholders/about-resort-aerial.png"'
)
WHERE tenant_id = 'a1b2c3d4-e5f6-7890-abcd-000000000001' 
  AND section_type = 'about';
