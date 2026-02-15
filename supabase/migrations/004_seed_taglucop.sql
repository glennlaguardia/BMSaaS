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
