-- Delete the orphaned user owner@C1.com from Supabase Auth
-- Run this in Supabase SQL Editor

-- This will delete the user from auth.users
-- You need to do this through Supabase Dashboard instead:
-- 1. Go to Supabase Dashboard
-- 2. Authentication → Users
-- 3. Find owner@C1.com
-- 4. Click the three dots menu
-- 5. Click "Delete User"

-- OR use this SQL if you have superuser access:
-- DELETE FROM auth.users WHERE email = 'owner@C1.com';

-- After deleting, the backend will be able to create a fresh user
