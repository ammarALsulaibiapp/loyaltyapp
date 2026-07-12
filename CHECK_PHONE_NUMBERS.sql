-- Check what phone numbers actually exist in the customers table
SELECT 
    c.phone_number,
    c.full_name,
    b.name as business_name,
    b.slug as business_slug,
    c.total_visits,
    c.total_points,
    c.membership_tier
FROM customers c
JOIN businesses b ON c.business_id = b.id
ORDER BY c.phone_number;

-- Check the exact phone number you're using
SELECT 
    phone_number,
    LENGTH(phone_number) as phone_length,
    business_id,
    full_name
FROM customers 
WHERE phone_number LIKE '%90966269%' 
   OR phone_number LIKE '%966269%'
   OR phone_number = '90966269'
   OR phone_number = '+96890966269';

-- Check all customers for Gloria Jeans business
SELECT 
    phone_number,
    full_name,
    total_visits
FROM customers 
WHERE business_id = (SELECT id FROM businesses WHERE slug = 'C1')
LIMIT 5;