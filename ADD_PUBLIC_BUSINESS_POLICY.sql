-- Add policy to allow anonymous users to view active businesses
-- This is needed for the public signup page to work
CREATE POLICY "Public can view active businesses for signup"
ON businesses FOR SELECT
TO anon
USING (is_active = true);

-- Verify all policies now
SELECT 
    policyname,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'businesses'
ORDER BY cmd, policyname;

-- Test the query as anonymous user would see it
SELECT id, name, slug, is_active 
FROM businesses 
WHERE slug = 'C1' AND is_active = true;
