-- =====================================================
-- FIX DELETE POLICIES FOR BULK DELETE SYSTEM
-- Allow service role to delete from all tables
-- =====================================================

-- CUSTOMERS TABLE
DROP POLICY IF EXISTS "Service role can delete customers" ON customers;
CREATE POLICY "Service role can delete customers"
ON customers
FOR DELETE
TO service_role
USING (true);

-- PROFILES TABLE (Staff)
DROP POLICY IF EXISTS "Service role can delete profiles" ON profiles;
CREATE POLICY "Service role can delete profiles"
ON profiles
FOR DELETE
TO service_role
USING (true);

-- LOYALTY PROGRAMS TABLE
DROP POLICY IF EXISTS "Service role can delete programs" ON loyalty_programs;
CREATE POLICY "Service role can delete programs"
ON loyalty_programs
FOR DELETE
TO service_role
USING (true);

-- REWARDS TABLE
DROP POLICY IF EXISTS "Service role can delete rewards" ON rewards;
CREATE POLICY "Service role can delete rewards"
ON rewards
FOR DELETE
TO service_role
USING (true);

-- BUSINESSES TABLE
DROP POLICY IF EXISTS "Service role can delete businesses" ON businesses;
CREATE POLICY "Service role can delete businesses"
ON businesses
FOR DELETE
TO service_role
USING (true);

-- VISITS TABLE (will be cascade deleted when customer deleted)
DROP POLICY IF EXISTS "Service role can delete visits" ON visits;
CREATE POLICY "Service role can delete visits"
ON visits
FOR DELETE
TO service_role
USING (true);

-- =====================================================
-- VERIFY POLICIES CREATED
-- =====================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN ('customers', 'profiles', 'loyalty_programs', 'rewards', 'businesses', 'visits')
AND policyname LIKE '%Service role%'
ORDER BY tablename, policyname;
