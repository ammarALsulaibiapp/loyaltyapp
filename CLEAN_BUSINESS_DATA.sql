-- Check for whitespace or special characters in slug
SELECT 
    id, 
    name, 
    slug,
    LENGTH(slug) as slug_length,
    is_active,
    pg_typeof(slug) as slug_type
FROM businesses 
WHERE slug LIKE '%C1%';

-- Clean up any whitespace in slug and name
UPDATE businesses 
SET 
    slug = TRIM(slug),
    name = TRIM(name)
WHERE id = 'f28dd4a1-995a-4e50-8807-aced5a8c15bc';

-- Verify after cleanup
SELECT id, name, slug, LENGTH(slug) as slug_length, is_active 
FROM businesses 
WHERE id = 'f28dd4a1-995a-4e50-8807-aced5a8c15bc';

-- Test the exact query the app uses
SELECT * FROM businesses WHERE slug = 'C1' AND is_active = true;
