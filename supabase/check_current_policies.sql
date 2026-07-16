-- =====================================================
-- CHECK ALL POLICIES - SIMPLE VIEW
-- =====================================================

-- Show all policies
SELECT 
    tablename,
    policyname,
    cmd,
    roles,
    permissive
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('customers', 'profiles', 'loyalty_programs', 'rewards', 'businesses', 'visits')
ORDER BY tablename, cmd, policyname;

-- Show DELETE policies specifically
SELECT 
    tablename,
    policyname,
    roles
FROM pg_policies
WHERE schemaname = 'public'
AND cmd = 'DELETE'
AND tablename IN ('customers', 'profiles', 'loyalty_programs', 'rewards', 'businesses', 'visits')
ORDER BY tablename;
