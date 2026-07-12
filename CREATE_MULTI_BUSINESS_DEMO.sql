-- Create multiple demo businesses for testing customer wallet
-- This will show how customers can have cards from different businesses

-- Business 1: Gloria Jeans (already exists - C1)
-- Keep existing Gloria Jeans with slug C1

-- Business 2: Pizza Palace
INSERT INTO businesses (
    name,
    slug,
    email,
    phone_number,
    address,
    brand_color,
    logo_url,
    description,
    is_active
) VALUES (
    'Pizza Palace',
    'PP1',
    'info@pizzapalace.om',
    '+968 9876 5432',
    'Ruwi, Muscat, Oman',
    '#dc2626',
    NULL,
    'Authentic Italian pizza and pasta',
    TRUE
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    is_active = TRUE;

-- Business 3: Salon Bliss
INSERT INTO businesses (
    name,
    slug,
    email,
    phone_number,
    address,
    brand_color,
    logo_url,
    description,
    is_active
) VALUES (
    'Salon Bliss',
    'SB1',
    'info@salonbliss.om',
    '+968 9555 1234',
    'Al Khuwair, Muscat, Oman',
    '#ec4899',
    NULL,
    'Premium beauty and wellness center',
    TRUE
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    is_active = TRUE;

-- Create a demo customer with the SAME phone number across all businesses
-- First get the phone number from existing Gloria Jeans customer
DO $$
DECLARE
    demo_phone TEXT;
    gloria_business_id UUID;
    pizza_business_id UUID;
    salon_business_id UUID;
BEGIN
    -- Get existing customer's phone number from Gloria Jeans
    SELECT phone_number INTO demo_phone 
    FROM customers 
    WHERE business_id = (SELECT id FROM businesses WHERE slug = 'C1')
    LIMIT 1;
    
    IF demo_phone IS NOT NULL THEN
        -- Get business IDs
        SELECT id INTO gloria_business_id FROM businesses WHERE slug = 'C1';
        SELECT id INTO pizza_business_id FROM businesses WHERE slug = 'PP1';
        SELECT id INTO salon_business_id FROM businesses WHERE slug = 'SB1';
        
        -- Create customer at Pizza Palace with same phone
        INSERT INTO customers (
            business_id,
            phone_number,
            full_name,
            total_visits,
            total_points,
            membership_tier,
            qr_code,
            is_active
        ) VALUES (
            pizza_business_id,
            demo_phone,
            'Ahmed Al-Said',
            7,
            140,
            'silver',
            pizza_business_id || '-' || demo_phone || '-pizza',
            TRUE
        );
        
        -- Create customer at Salon Bliss with same phone
        INSERT INTO customers (
            business_id,
            phone_number,
            full_name,
            total_visits,
            total_points,
            membership_tier,
            qr_code,
            is_active
        ) VALUES (
            salon_business_id,
            demo_phone,
            'Ahmed Al-Said',
            12,
            480,
            'vip',
            salon_business_id || '-' || demo_phone || '-salon',
            TRUE
        );
        
        RAISE NOTICE 'Created multi-business demo for phone: %', demo_phone;
    ELSE
        RAISE NOTICE 'No existing customer found in Gloria Jeans business';
    END IF;
END $$;

-- Create loyalty programs for new businesses
INSERT INTO loyalty_programs (
    business_id,
    name,
    type,
    required_stamps,
    reward_name,
    reward_description,
    is_active
) 
SELECT 
    id,
    'Pizza Loyalty Card',
    'stamp_card',
    10,
    'Free Large Pizza',
    'Get a free large pizza of your choice',
    TRUE
FROM businesses
WHERE slug = 'PP1'
ON CONFLICT DO NOTHING;

INSERT INTO loyalty_programs (
    business_id,
    name,
    type,
    points_for_reward,
    reward_name,
    reward_description,
    is_active
) 
SELECT 
    id,
    'Beauty Points Program',
    'points_based',
    500,
    'Free Facial Treatment',
    'Complimentary premium facial treatment',
    TRUE
FROM businesses
WHERE slug = 'SB1'
ON CONFLICT DO NOTHING;

-- Verify the setup
SELECT 
    b.name as business_name,
    b.slug,
    c.phone_number,
    c.full_name,
    c.total_visits,
    c.total_points,
    c.membership_tier
FROM customers c
JOIN businesses b ON c.business_id = b.id
WHERE c.phone_number = (
    SELECT phone_number 
    FROM customers 
    WHERE business_id = (SELECT id FROM businesses WHERE slug = 'C1')
    LIMIT 1
)
ORDER BY b.name;