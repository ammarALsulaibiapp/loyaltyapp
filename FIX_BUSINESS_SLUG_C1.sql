-- Check what businesses exist
SELECT id, name, slug, is_active FROM businesses ORDER BY created_at DESC;

-- If you see your business but slug is wrong, update it to C1:
-- Replace 'YOUR_BUSINESS_ID' with the actual ID from the query above
UPDATE businesses 
SET slug = 'C1' 
WHERE id = 'YOUR_BUSINESS_ID';

-- OR if you want to create a new business with slug C1:
INSERT INTO businesses (
    name,
    slug,
    email,
    phone_number,
    address,
    brand_color,
    description,
    is_active
) VALUES (
    'Coffee Paradise',
    'C1',
    'info@coffeeparadise.com',
    '+968 9123 4567',
    'Muscat, Oman',
    '#8B4513',
    'Premium coffee shop with loyalty rewards',
    TRUE
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    is_active = TRUE;

-- Verify the business exists
SELECT id, name, slug, is_active FROM businesses WHERE slug = 'C1';

-- Make sure the business has at least one active loyalty program
SELECT id, name, type, is_active 
FROM loyalty_programs 
WHERE business_id = (SELECT id FROM businesses WHERE slug = 'C1');

-- If no loyalty program exists, create one:
INSERT INTO loyalty_programs (
    business_id,
    name,
    type,
    required_visits,
    required_stamps,
    points_for_reward,
    reward_name,
    reward_description,
    is_active
) 
SELECT 
    id,
    'Coffee Loyalty Card',
    'stamp_card',
    NULL,
    8,
    NULL,
    'Free Coffee',
    'Get a free coffee of your choice',
    TRUE
FROM businesses
WHERE slug = 'C1'
ON CONFLICT DO NOTHING;

-- Final verification
SELECT 
    b.name as business_name,
    b.slug,
    b.is_active as business_active,
    lp.name as program_name,
    lp.type,
    lp.is_active as program_active
FROM businesses b
LEFT JOIN loyalty_programs lp ON lp.business_id = b.id
WHERE b.slug = 'C1';
