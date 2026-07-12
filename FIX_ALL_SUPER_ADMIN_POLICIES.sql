-- =====================================================
-- FIX ALL RLS POLICIES FOR SUPER ADMIN ACCESS
-- =====================================================
-- Run this ENTIRE file in Supabase SQL Editor
-- This allows Super Admin to manage everything

-- =====================================================
-- LOYALTY PROGRAMS - Allow Super Admin + Business Admin
-- =====================================================

DROP POLICY IF EXISTS "Business admin manage programs" ON loyalty_programs;
DROP POLICY IF EXISTS "Business view programs" ON loyalty_programs;

CREATE POLICY "Super admin full loyalty programs" 
ON loyalty_programs 
FOR ALL 
USING (is_super_admin());

CREATE POLICY "Business admin manage programs" 
ON loyalty_programs 
FOR ALL 
USING (business_id = get_user_business_id() AND is_business_admin());

CREATE POLICY "Business view programs" 
ON loyalty_programs 
FOR SELECT 
USING (business_id = get_user_business_id());

-- Keep public view for active programs
CREATE POLICY "Public view active programs" 
ON loyalty_programs 
FOR SELECT 
USING (is_active = true);

-- =====================================================
-- CUSTOMERS - Super Admin needs full access
-- =====================================================

-- Super Admin already has view access, add INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Super admin view customers" ON customers;

CREATE POLICY "Super admin full customers" 
ON customers 
FOR ALL 
USING (is_super_admin());

-- =====================================================
-- REWARDS - Super Admin needs full access
-- =====================================================

DROP POLICY IF EXISTS "Business manage rewards" ON rewards;

CREATE POLICY "Super admin full rewards" 
ON rewards 
FOR ALL 
USING (is_super_admin());

CREATE POLICY "Business manage rewards" 
ON rewards 
FOR ALL 
USING (business_id = get_user_business_id());

-- =====================================================
-- VISITS - Super Admin needs access
-- =====================================================

DROP POLICY IF EXISTS "Business manage visits" ON visits;

CREATE POLICY "Super admin full visits" 
ON visits 
FOR ALL 
USING (is_super_admin());

CREATE POLICY "Business manage visits" 
ON visits 
FOR ALL 
USING (business_id = get_user_business_id());

-- =====================================================
-- STAFF - Super Admin needs access
-- =====================================================

DROP POLICY IF EXISTS "Business view profiles" ON profiles;
DROP POLICY IF EXISTS "Super admin full profiles" ON profiles;

CREATE POLICY "Super admin full profiles" 
ON profiles 
FOR ALL 
USING (is_super_admin());

CREATE POLICY "Business view profiles" 
ON profiles 
FOR SELECT 
USING (business_id = get_user_business_id());

-- =====================================================
-- VERIFY ALL POLICIES
-- =====================================================

SELECT 
  tablename, 
  policyname, 
  cmd,
  CASE 
    WHEN policyname LIKE '%super_admin%' THEN '✅ Super Admin'
    WHEN policyname LIKE '%business%' THEN '👔 Business'
    ELSE '👤 Other'
  END as policy_type
FROM pg_policies
WHERE tablename IN ('loyalty_programs', 'customers', 'rewards', 'visits', 'profiles')
ORDER BY tablename, policyname;

-- Done! Now Super Admin can create loyalty programs
