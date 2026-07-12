-- =====================================================
-- CREATE SUPER ADMIN PROFILE
-- =====================================================
-- Run this in Supabase SQL Editor after creating a user

-- Replace with YOUR actual email address
-- This creates the profile for the user you just created

INSERT INTO profiles (
    id, 
    email, 
    full_name, 
    role, 
    business_id,
    is_active
)
VALUES (
    'c46c07f4-f7ce-430e-802e-1a56a86c4945',  -- Your user ID
    (SELECT email FROM auth.users WHERE id = 'c46c07f4-f7ce-430e-802e-1a56a86c4945'),  -- Gets email from auth.users
    'Super Admin',  -- Name
    'super_admin',  -- Role (super_admin, business_admin, or staff)
    NULL,  -- No business_id for super admin
    TRUE  -- Active
)
ON CONFLICT (id) DO UPDATE
SET role = 'super_admin',
    full_name = 'Super Admin',
    is_active = TRUE;

-- Verify it worked
SELECT * FROM profiles WHERE id = 'c46c07f4-f7ce-430e-802e-1a56a86c4945';
