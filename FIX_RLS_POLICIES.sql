-- Check if RLS is enabled on businesses table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'businesses';

-- Check existing policies on businesses table
SELECT * FROM pg_policies WHERE tablename = 'businesses';

-- DISABLE RLS temporarily to test (CAUTION: Only for testing!)
-- ALTER TABLE businesses DISABLE ROW LEVEL SECURITY;

-- OR create a policy to allow public SELECT on active businesses
DROP POLICY IF EXISTS "Public businesses are viewable by everyone" ON businesses;

CREATE POLICY "Public businesses are viewable by everyone"
ON businesses FOR SELECT
USING (is_active = true);

-- Enable RLS if not already enabled
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'businesses';

-- Test the query that should work now
SELECT * FROM businesses WHERE slug = 'C1' AND is_active = true;
