-- =====================================================
-- FIX LOYALTY PROGRAMS POLICY FOR SUPER ADMIN
-- =====================================================
-- Run this in Supabase SQL Editor

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Business admin manage programs" ON loyalty_programs;

-- Create new policy that allows BOTH Super Admin AND Business Admin
CREATE POLICY "Super admin and business admin manage programs" 
ON loyalty_programs 
FOR ALL 
USING (
  -- Super admin can access all programs
  is_super_admin() 
  OR 
  -- Business admin can only access their own business programs
  (business_id = get_user_business_id() AND is_business_admin())
);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'loyalty_programs';
