-- Add WhatsApp API fields to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS whatsapp_api_token TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_business_account_id TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_api_enabled BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN businesses.whatsapp_api_token IS 'WhatsApp Business API access token';
COMMENT ON COLUMN businesses.whatsapp_phone_number_id IS 'WhatsApp phone number ID';
COMMENT ON COLUMN businesses.whatsapp_business_account_id IS 'WhatsApp Business Account ID';
COMMENT ON COLUMN businesses.whatsapp_api_enabled IS 'Whether WhatsApp API is enabled for this business';
