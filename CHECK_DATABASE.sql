-- =====================================================
-- CHECK YOUR DATABASE
-- =====================================================
-- Run this in Supabase SQL Editor to see what's wrong

-- 1. Check if you have any businesses
SELECT 
    id, 
    name, 
    slug, 
    is_active,
    created_at
FROM businesses
ORDER BY created_at DESC;

-- 2. Check if slug matches what you're using in QR
-- Replace 'coffee-paradise' with your actual slug
SELECT * FROM businesses WHERE slug = 'coffee-paradise';

-- 3. Check all active businesses
SELECT name, slug FROM businesses WHERE is_active = TRUE;

-- 4. If you see a business but slug is different, update it:
-- UPDATE businesses SET slug = 'coffee-paradise' WHERE id = 'YOUR_BUSINESS_ID';

-- 5. If is_active is FALSE, activate it:
-- UPDATE businesses SET is_active = TRUE WHERE slug = 'coffee-paradise';
