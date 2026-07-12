-- SIMPLE FIX - Just make visits work
-- Run this in Supabase SQL Editor

-- Make sure visits table has all required columns
ALTER TABLE visits 
ADD COLUMN IF NOT EXISTS points_earned DECIMAL(10,2) DEFAULT 0;

-- Enable RLS if not enabled
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- Basic policy for visits
DROP POLICY IF EXISTS "Staff can manage visits" ON visits;
CREATE POLICY "Staff can manage visits" ON visits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.business_id = visits.business_id
            AND p.role IN ('business_admin', 'staff', 'super_admin')
        )
    );

-- Remove any broken triggers temporarily
DROP TRIGGER IF EXISTS trigger_initialize_progress ON visits;
DROP TRIGGER IF EXISTS trigger_check_and_create_reward ON visits;