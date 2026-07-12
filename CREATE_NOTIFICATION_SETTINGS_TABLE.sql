-- Create notification_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID UNIQUE NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    
    -- Notification channels
    sms_enabled BOOLEAN DEFAULT FALSE,
    whatsapp_enabled BOOLEAN DEFAULT FALSE,
    email_enabled BOOLEAN DEFAULT FALSE,
    
    -- Notification events
    notify_customer_created BOOLEAN DEFAULT TRUE,
    notify_reward_earned BOOLEAN DEFAULT TRUE,
    notify_reward_redeemed BOOLEAN DEFAULT FALSE,
    notify_birthday BOOLEAN DEFAULT TRUE,
    notify_membership_upgrade BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Business notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Business admin can manage notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Business users can manage notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Super admin can manage all notification settings" ON notification_settings;

-- Create NEW simple policies
CREATE POLICY "Business users view notification settings"
ON notification_settings FOR SELECT
USING (
    business_id IN (
        SELECT business_id FROM profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Business users update notification settings"
ON notification_settings FOR UPDATE
USING (
    business_id IN (
        SELECT business_id FROM profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Business users insert notification settings"
ON notification_settings FOR INSERT
WITH CHECK (
    business_id IN (
        SELECT business_id FROM profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Super admin full access notification settings"
ON notification_settings FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
    )
);

-- Create default notification settings for existing businesses that don't have them
INSERT INTO notification_settings (business_id, sms_enabled, whatsapp_enabled, email_enabled)
SELECT id, false, false, false
FROM businesses
WHERE id NOT IN (SELECT business_id FROM notification_settings WHERE business_id IS NOT NULL)
ON CONFLICT (business_id) DO NOTHING;

-- Verify
SELECT * FROM notification_settings LIMIT 5;
