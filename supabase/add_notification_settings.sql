-- =====================================================
-- ADD NOTIFICATION SETTINGS TO BUSINESSES TABLE
-- =====================================================

-- Add notification columns to businesses table
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_provider TEXT, -- 'twilio', 'meta', 'other'
ADD COLUMN IF NOT EXISTS whatsapp_credentials JSONB, -- { account_sid, auth_token, phone_number }
ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_provider TEXT, -- 'twilio', 'aws_sns', 'other'
ADD COLUMN IF NOT EXISTS sms_credentials JSONB; -- { account_sid, auth_token, phone_number }

-- Comments for clarity
COMMENT ON COLUMN businesses.whatsapp_enabled IS 'Toggle WhatsApp notifications on/off';
COMMENT ON COLUMN businesses.whatsapp_provider IS 'WhatsApp provider type: twilio, meta, other';
COMMENT ON COLUMN businesses.whatsapp_credentials IS 'Encrypted WhatsApp API credentials (JSON)';
COMMENT ON COLUMN businesses.sms_enabled IS 'Toggle SMS notifications on/off';
COMMENT ON COLUMN businesses.sms_provider IS 'SMS provider type: twilio, aws_sns, other';
COMMENT ON COLUMN businesses.sms_credentials IS 'Encrypted SMS API credentials (JSON)';

-- =====================================================
-- NOTIFICATION LOGS TABLE (Track sent notifications)
-- =====================================================

CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL, -- 'whatsapp', 'sms'
    event_type TEXT NOT NULL, -- 'signup', 'reward_earned', 'reward_redeemed', 'visit_added'
    recipient_phone TEXT NOT NULL,
    message_body TEXT NOT NULL,
    provider TEXT NOT NULL, -- 'twilio', 'meta', etc.
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_notification_logs_business ON notification_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_customer ON notification_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created ON notification_logs(created_at DESC);

-- RLS policies
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access to notification_logs"
    ON notification_logs FOR ALL
    USING (true)
    WITH CHECK (true);
