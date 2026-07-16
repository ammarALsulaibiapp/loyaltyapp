-- Check INSERT policies for service_role
SELECT 
    schemaname,
    tablename,
    policyname,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'profiles'
AND cmd = 'INSERT'
ORDER BY tablename, policyname;
