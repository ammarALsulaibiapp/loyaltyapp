-- =====================================================
-- CREATE TEST BUSINESS INSTANTLY
-- =====================================================
-- Run this in Supabase SQL Editor

-- Create a test business
INSERT INTO businesses (
    name,
    slug,
    email,
    phone_number,
    brand_color,
    is_active
)
VALUES (
    'Coffee Paradise',
    'coffee-paradise',
    'test@coffeeparadise.com',
    '+968 9111 1111',
    '#8B4513',
    TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- Create a default loyalty program for this business
INSERT INTO loyalty_programs (
    business_id,
    name,
    description,
    type,
    required_stamps,
    reward_name,
    reward_description,
    is_active
)
SELECT 
    id,
    'Coffee Loyalty Card',
    'Buy 5 coffees, get 1 free!',
    'stamp_card',
    5,
    'Free Coffee',
    'One free coffee of any size',
    TRUE
FROM businesses
WHERE slug = 'coffee-paradise'
ON CONFLICT DO NOTHING;

-- Verify it was created
SELECT id, name, slug, is_active FROM businesses WHERE slug = 'coffee-paradise';
SELECT id, name, type FROM loyalty_programs WHERE business_id = (SELECT id FROM businesses WHERE slug = 'coffee-paradise');

-- Done! Now your QR code for 'coffee-paradise' will work!
