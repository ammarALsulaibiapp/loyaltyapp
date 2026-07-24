-- Create bulk_messages table
CREATE TABLE IF NOT EXISTS bulk_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  recipient_count INTEGER NOT NULL,
  filter_type TEXT NOT NULL,
  sent_by UUID NOT NULL REFERENCES profiles(id),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_bulk_messages_business ON bulk_messages(business_id);
CREATE INDEX IF NOT EXISTS idx_bulk_messages_sent_at ON bulk_messages(sent_at);

-- Enable RLS
ALTER TABLE bulk_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view messages from their business" ON bulk_messages;
DROP POLICY IF EXISTS "Business admins can send messages" ON bulk_messages;

-- RLS Policies
CREATE POLICY "Users can view messages from their business"
  ON bulk_messages FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Business admins can send messages"
  ON bulk_messages FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM profiles WHERE id = auth.uid() AND role IN ('business_admin', 'super_admin')
    )
  );
