-- =====================================================
-- FIX INSERT/UPDATE POLICIES FOR SERVICE ROLE
-- Allow backend (service_role) to create/update profiles
-- =====================================================

-- PROFILES TABLE - Service role full access
DROP POLICY IF EXISTS "Service role full access to profiles" ON profiles;
CREATE POLICY "Service role full access to profiles"
ON profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verify
SELECT 
    tablename,
    policyname,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'profiles'
AND 'service_role' = ANY(roles)
ORDER BY cmd, policyname;
