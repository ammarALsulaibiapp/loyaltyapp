-- ============================================================
-- Fix RLS Policies for customer_program_progress - Run on Supabase SQL Editor
-- ============================================================

-- Enable RLS on customer_program_progress table
ALTER TABLE customer_program_progress ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow service_role full access (for API operations)
CREATE POLICY "Service role can manage all customer progress" ON customer_program_progress
    FOR ALL USING (auth.role() = 'service_role');

-- Policy 2: Allow authenticated users to view progress for their business
CREATE POLICY "Business users can view customer progress" ON customer_program_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM customers c
            JOIN profiles p ON p.business_id = c.business_id
            WHERE c.id = customer_program_progress.customer_id
            AND p.id = auth.uid()
        )
    );

-- Policy 3: Allow staff to update progress (through triggers)
CREATE POLICY "Staff can update customer progress" ON customer_program_progress
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM customers c
            JOIN profiles p ON p.business_id = c.business_id
            WHERE c.id = customer_program_progress.customer_id
            AND p.id = auth.uid()
            AND p.role IN ('business_admin', 'staff', 'super_admin')
        )
    );

-- Grant necessary permissions
GRANT ALL ON customer_program_progress TO authenticated;
GRANT ALL ON customer_program_progress TO service_role;