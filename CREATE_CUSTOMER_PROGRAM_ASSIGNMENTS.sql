-- Create customer_program_assignments table
-- This allows assigning specific loyalty programs to specific customers
-- Instead of showing all programs to all customers

CREATE TABLE IF NOT EXISTS customer_program_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    loyalty_program_id UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    UNIQUE(customer_id, loyalty_program_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_program_assignments_customer 
ON customer_program_assignments(customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_program_assignments_program 
ON customer_program_assignments(loyalty_program_id);

CREATE INDEX IF NOT EXISTS idx_customer_program_assignments_business 
ON customer_program_assignments(business_id);

-- Enable RLS
ALTER TABLE customer_program_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Business users can view their customer program assignments"
ON customer_program_assignments FOR SELECT
USING (
    business_id IN (
        SELECT business_id FROM profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Business admins can insert customer program assignments"
ON customer_program_assignments FOR INSERT
WITH CHECK (
    business_id IN (
        SELECT business_id FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('business_admin', 'super_admin')
    )
);

CREATE POLICY "Business admins can update customer program assignments"
ON customer_program_assignments FOR UPDATE
USING (
    business_id IN (
        SELECT business_id FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('business_admin', 'super_admin')
    )
);

CREATE POLICY "Business admins can delete customer program assignments"
ON customer_program_assignments FOR DELETE
USING (
    business_id IN (
        SELECT business_id FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('business_admin', 'super_admin')
    )
);

-- Add comment
COMMENT ON TABLE customer_program_assignments IS 'Assigns specific loyalty programs to specific customers. If no assignment exists, customer sees all programs.';

-- Optional: Migrate existing data (auto-assign all active programs to all existing customers)
-- Uncomment if you want to auto-assign all programs to existing customers:
/*
INSERT INTO customer_program_assignments (customer_id, loyalty_program_id, business_id, assigned_by, is_active)
SELECT 
    c.id as customer_id,
    lp.id as loyalty_program_id,
    c.business_id,
    NULL as assigned_by,
    TRUE as is_active
FROM customers c
CROSS JOIN loyalty_programs lp
WHERE c.business_id = lp.business_id
  AND lp.is_active = TRUE
ON CONFLICT (customer_id, loyalty_program_id) DO NOTHING;
*/
