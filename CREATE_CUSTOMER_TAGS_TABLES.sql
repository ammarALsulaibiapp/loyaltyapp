-- Create customer_tags table
CREATE TABLE IF NOT EXISTS customer_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  tag_color TEXT NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(business_id, tag_name)
);

-- Create customer_tag_assignments table
CREATE TABLE IF NOT EXISTS customer_tag_assignments (
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES customer_tags(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (customer_id, tag_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_customer_tags_business ON customer_tags(business_id);
CREATE INDEX IF NOT EXISTS idx_tag_assignments_customer ON customer_tag_assignments(customer_id);
CREATE INDEX IF NOT EXISTS idx_tag_assignments_tag ON customer_tag_assignments(tag_id);

-- Enable RLS
ALTER TABLE customer_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tag_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view tags from their business" ON customer_tags;
DROP POLICY IF EXISTS "Business admins can manage tags" ON customer_tags;
DROP POLICY IF EXISTS "Users can view tag assignments from their business" ON customer_tag_assignments;
DROP POLICY IF EXISTS "Business admins can manage tag assignments" ON customer_tag_assignments;

-- RLS Policies for customer_tags
CREATE POLICY "Users can view tags from their business"
  ON customer_tags FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Business admins can manage tags"
  ON customer_tags FOR ALL
  USING (
    business_id IN (
      SELECT business_id FROM profiles WHERE id = auth.uid() AND role IN ('business_admin', 'super_admin')
    )
  );

-- RLS Policies for customer_tag_assignments
CREATE POLICY "Users can view tag assignments from their business"
  ON customer_tag_assignments FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE business_id IN (
        SELECT business_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Business admins can manage tag assignments"
  ON customer_tag_assignments FOR ALL
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE business_id IN (
        SELECT business_id FROM profiles WHERE id = auth.uid() AND role IN ('business_admin', 'staff', 'super_admin')
      )
    )
  );
