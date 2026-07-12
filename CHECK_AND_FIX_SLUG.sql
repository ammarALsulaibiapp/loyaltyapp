-- Check all businesses and their slugs
SELECT id, name, slug, is_active FROM businesses;

-- Check specifically for C1 (case-insensitive)
SELECT id, name, slug, is_active FROM businesses WHERE slug ILIKE 'C1';

-- Check if there are duplicates
SELECT slug, COUNT(*) as count 
FROM businesses 
WHERE slug ILIKE 'C1'
GROUP BY slug;

-- Make sure C1 is active
UPDATE businesses 
SET is_active = true 
WHERE slug ILIKE 'C1';

-- Verify the change
SELECT id, name, slug, is_active FROM businesses WHERE slug ILIKE 'C1';
