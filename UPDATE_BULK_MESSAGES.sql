-- Update bulk_messages table with status, success_count, fail_count, and error_details
ALTER TABLE bulk_messages
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent',
ADD COLUMN IF NOT EXISTS success_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS fail_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS error_details JSONB;
