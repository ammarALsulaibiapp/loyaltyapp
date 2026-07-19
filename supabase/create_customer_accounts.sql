-- Create customer_accounts table for wallet authentication
-- This is separate from the customers table (which stores loyalty card data)
-- Run this ONCE in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS customer_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster phone number lookups
CREATE INDEX IF NOT EXISTS idx_customer_accounts_phone ON customer_accounts(phone_number);

-- RLS Policies
ALTER TABLE customer_accounts ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (backend uses service_role key)
CREATE POLICY "Service role full access to customer_accounts" 
    ON customer_accounts FOR ALL 
    TO service_role 
    USING (true);

COMMENT ON TABLE customer_accounts IS 'Customer wallet authentication accounts (separate from loyalty customers table)';
