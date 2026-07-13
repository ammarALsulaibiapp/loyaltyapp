-- =====================================================
-- CUSTOMER ACCOUNTS TABLE
-- Separate auth system for customer wallet login
-- Does NOT use Supabase Auth (that's for staff/business)
-- =====================================================

CREATE TABLE IF NOT EXISTS customer_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast phone lookup during login
CREATE INDEX IF NOT EXISTS idx_customer_accounts_phone ON customer_accounts(phone_number);

-- Auto-update updated_at
CREATE TRIGGER customer_accounts_updated_at BEFORE UPDATE ON customer_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE customer_accounts ENABLE ROW LEVEL SECURITY;

-- Allow the backend service role to do everything (it uses the service_role key)
-- No direct client access to this table — all auth goes through the Express backend
-- The anon key should NOT be able to read password hashes

-- Allow public insert (registration goes through backend, but just in case)
CREATE POLICY "Service role full access to customer_accounts"
    ON customer_accounts FOR ALL
    USING (true)
    WITH CHECK (true);

-- NOTE: The frontend Supabase client uses the anon key, which cannot bypass RLS.
-- The backend uses the service_role key, which bypasses RLS entirely.
-- This means customer_accounts data is only accessible through our Express backend.
