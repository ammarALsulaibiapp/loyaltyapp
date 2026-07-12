-- Fix notification_settings table RLS policies
-- Error: 406 Not Acceptable means RLS is blocking the query

-- Drop existing policies if any
DROP POLICY IF EXISTS "Business notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Business admin can manage notification settings" ON notification_settings;

-- Create simple policy for business users
CREATE POLICY "Business users can manage notification settings"
ON notification_settings FOR ALL
USING (
    business_id IN (
        SELECT business_id FROM profiles WHERE id = auth.uid()
    )
);

-- Allow super admins full access
CREATE POLICY "Super admin can manage all notification settings"
ON notification_settings FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
    )
);

-- Make sure RLS is enabled
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'notification_settings'
ORDER BY policyname;
