-- =====================================================
-- CREATE BUSINESS ADMIN ACCOUNT FOR TESTING
-- =====================================================
-- This creates a business admin who can manage loyalty programs

-- Step 1: Get your business ID
SELECT id, name, slug FROM businesses LIMIT 1;
-- Copy the ID from the result

-- Step 2: Create auth user (replace email and password)
-- Run in Supabase Dashboard → Authentication → Users → Add User
-- Email: business@test.com
-- Password: test123
-- Then copy the User ID

-- Step 3: Create profile (replace the IDs below)
INSERT INTO profiles (
    id,  -- User ID from step 2
    email,
    full_name,
    role,
    business_id,  -- Business ID from step 1
    is_active
)
VALUES (
    'PASTE_USER_ID_HERE',  -- From authentication
    'business@test.com',
    'Business Admin',
    'business_admin',  -- THIS IS THE KEY!
    'PASTE_BUSINESS_ID_HERE',  -- From businesses table
    TRUE
);

-- Step 4: Verify
SELECT * FROM profiles WHERE role = 'business_admin';

-- Now logout and login as:
-- Email: business@test.com
-- Password: test123
-- You'll see "Loyalty Programs" in the sidebar!
