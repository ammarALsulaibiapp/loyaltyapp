-- Fix orphaned auth user (exists in auth.users but not in profiles)
-- This script finds the user by email and creates their profile

-- Step 1: Find the user ID from auth.users
-- Run this in Supabase SQL Editor to see the user ID:
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'owner@C1.com';

-- Step 2: Once you have the user ID, insert into profiles
-- Replace 'USER_ID_HERE' with the actual UUID from step 1
-- Replace 'BUSINESS_ID_HERE' with your business ID: f28dd4a1-995a-4e50-8807-aced5a8c15bc

INSERT INTO profiles (id, email, full_name, role, business_id, is_active, created_at, updated_at)
VALUES (
  'USER_ID_FROM_STEP_1_HERE',
  'owner@C1.com',
  'Gloria Jean''s Owner',
  'business_admin',
  'f28dd4a1-995a-4e50-8807-aced5a8c15bc',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  business_id = EXCLUDED.business_id,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Step 3: Update business to link owner
UPDATE businesses 
SET owner_user_id = 'USER_ID_FROM_STEP_1_HERE',
    self_service_enabled = true
WHERE id = 'f28dd4a1-995a-4e50-8807-aced5a8c15bc';

-- Step 4: Reset password using Supabase Dashboard
-- Go to: Authentication → Users → Find owner@C1.com → Click three dots → Reset Password
-- Or use the backend API after profile is created
