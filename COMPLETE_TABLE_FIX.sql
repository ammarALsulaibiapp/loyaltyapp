-- COMPLETE FIX - Creates table and policies properly
-- Run this in Supabase SQL Editor

-- 1. Create customer_program_progress table if it doesn't exist
CREATE TABLE IF NOT EXISTS customer_program_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    loyalty_program_id UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
    visit_count INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    total_rewards_earned INTEGER DEFAULT 0,
    last_visit_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_id, loyalty_program_id)
);

-- 2. Enable RLS
ALTER TABLE customer_program_progress ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON customer_program_progress;
DROP POLICY IF EXISTS "Service role can manage all customer progress" ON customer_program_progress;
DROP POLICY IF EXISTS "Business users can view customer progress" ON customer_program_progress;
DROP POLICY IF EXISTS "Staff can update customer progress" ON customer_program_progress;

-- 4. Create simple working policy
CREATE POLICY "Allow all access for authenticated users" ON customer_program_progress
    FOR ALL USING (
        auth.role() = 'service_role' OR
        auth.uid() IS NOT NULL
    );

-- 5. Add missing column to visits if needed
ALTER TABLE visits ADD COLUMN IF NOT EXISTS points_earned DECIMAL(10,2) DEFAULT 0;

-- 6. Fix visits policies
DROP POLICY IF EXISTS "Staff can manage visits" ON visits;
CREATE POLICY "Allow visit access" ON visits
    FOR ALL USING (
        auth.role() = 'service_role' OR
        auth.uid() IS NOT NULL
    );

-- 7. Grant permissions
GRANT ALL ON customer_program_progress TO authenticated;
GRANT ALL ON customer_program_progress TO anon;
GRANT ALL ON visits TO authenticated;
GRANT ALL ON visits TO anon;