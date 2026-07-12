-- Check if RLS is enabled on businesses table
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'businesses';

-- Check what policies exist on businesses table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'businesses';

-- If no policies exist and RLS is enabled, NOTHING can be read by anon users!
