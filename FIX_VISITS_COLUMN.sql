-- Add missing points_earned column to visits table
ALTER TABLE visits 
ADD COLUMN IF NOT EXISTS points_earned DECIMAL(10,2) DEFAULT 0;

-- Update RLS policy for visits
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON visits;
DROP POLICY IF EXISTS "Enable read access for all users" ON visits;
DROP POLICY IF EXISTS "Staff can manage visits" ON visits;

-- Simple policy that works
CREATE POLICY "Staff can manage visits" ON visits
    FOR ALL USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.business_id = visits.business_id
        )
    );