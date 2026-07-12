-- =====================================================
-- SIMPLE FIX FOR LOYALTY PROGRAMS - SUPER ADMIN ACCESS
-- =====================================================
-- Run this in Supabase SQL Editor

-- Drop ALL existing loyalty_programs policies
DROP POLICY IF EXISTS "Business admin manage programs" ON loyalty_programs;
DROP POLICY IF EXISTS "Business view programs" ON loyalty_programs;
DROP POLICY IF EXISTS "Public view active programs" ON loyalty_programs;
DROP POLICY IF EXISTS "Super admin full loyalty programs" ON loyalty_programs;

-- Recreate with correct permissions
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

CREATE POLICY "Public view active programs" 
ON loyalty_programs 
FOR SELECT 
USING (is_active = true);

-- Verify
SELECT tablename, policyname FROM pg_policies WHERE tablename = 'loyalty_programs';
