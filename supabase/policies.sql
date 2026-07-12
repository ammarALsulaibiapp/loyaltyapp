-- LoyaltyPass Row Level Security Policies
-- Complete tenant isolation and role-based access control

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS FOR RLS
-- =====================================================

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Get current user's business_id
CREATE OR REPLACE FUNCTION get_user_business_id()
RETURNS UUID AS $$
    SELECT business_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if user is business admin
CREATE OR REPLACE FUNCTION is_business_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'business_admin'
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Super admin can see all profiles
CREATE POLICY "Super admin can view all profiles"
    ON profiles FOR SELECT
    USING (is_super_admin());

-- Business admin can see profiles in their business
CREATE POLICY "Business admin can view business profiles"
    ON profiles FOR SELECT
    USING (
        business_id = get_user_business_id()
        AND get_user_role() IN ('business_admin', 'staff')
    );

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (id = auth.uid());

-- Super admin can insert any profile
CREATE POLICY "Super admin can insert profiles"
    ON profiles FOR INSERT
    WITH CHECK (is_super_admin());

-- Business admin can insert staff in their business
CREATE POLICY "Business admin can insert staff"
    ON profiles FOR INSERT
    WITH CHECK (
        is_business_admin()
        AND business_id = get_user_business_id()
    );

-- Super admin can update any profile
CREATE POLICY "Super admin can update profiles"
    ON profiles FOR UPDATE
    USING (is_super_admin());

-- Business admin can update staff in their business
CREATE POLICY "Business admin can update business profiles"
    ON profiles FOR UPDATE
    USING (
        is_business_admin()
        AND business_id = get_user_business_id()
    );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid());

-- =====================================================
-- BUSINESSES POLICIES
-- =====================================================

-- Super admin can do everything with businesses
CREATE POLICY "Super admin full access to businesses"
    ON businesses FOR ALL
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

-- Business admin and staff can view their own business
CREATE POLICY "Business users can view own business"
    ON businesses FOR SELECT
    USING (
        id = get_user_business_id()
        AND get_user_role() IN ('business_admin', 'staff')
    );

-- Business admin can update their own business
CREATE POLICY "Business admin can update own business"
    ON businesses FOR UPDATE
    USING (
        id = get_user_business_id()
        AND is_business_admin()
    );

-- =====================================================
-- SUBSCRIPTIONS POLICIES
-- =====================================================

-- Super admin can manage all subscriptions
CREATE POLICY "Super admin full access to subscriptions"
    ON subscriptions FOR ALL
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

-- Business admin can view their subscription
CREATE POLICY "Business admin can view subscription"
    ON subscriptions FOR SELECT
    USING (
        business_id = get_user_business_id()
        AND is_business_admin()
    );

-- =====================================================
-- CUSTOMERS POLICIES
-- =====================================================

-- Super admin can view all customers
CREATE POLICY "Super admin can view all customers"
    ON customers FOR SELECT
    USING (is_super_admin());

-- Business users can manage their business customers
CREATE POLICY "Business users can view customers"
    ON customers FOR SELECT
    USING (business_id = get_user_business_id());

CREATE POLICY "Business users can insert customers"
    ON customers FOR INSERT
    WITH CHECK (business_id = get_user_business_id());

CREATE POLICY "Business users can update customers"
    ON customers FOR UPDATE
    USING (business_id = get_user_business_id());

CREATE POLICY "Business admin can delete customers"
    ON customers FOR DELETE
    USING (
        business_id = get_user_business_id()
        AND is_business_admin()
    );

-- =====================================================
-- LOYALTY PROGRAMS POLICIES
-- =====================================================

-- Business users can manage their loyalty programs
CREATE POLICY "Business users can view loyalty programs"
    ON loyalty_programs FOR SELECT
    USING (business_id = get_user_business_id());

CREATE POLICY "Business admin can manage loyalty programs"
    ON loyalty_programs FOR ALL
    USING (
        business_id = get_user_business_id()
        AND is_business_admin()
    )
    WITH CHECK (
        business_id = get_user_business_id()
        AND is_business_admin()
    );

-- =====================================================
-- VISITS POLICIES
-- =====================================================

-- Business users can manage visits
CREATE POLICY "Business users can view visits"
    ON visits FOR SELECT
    USING (business_id = get_user_business_id());

CREATE POLICY "Business users can insert visits"
    ON visits FOR INSERT
    WITH CHECK (business_id = get_user_business_id());

CREATE POLICY "Business users can update visits"
    ON visits FOR UPDATE
    USING (
        business_id = get_user_business_id()
        AND is_business_admin()
    );

-- =====================================================
-- REWARDS POLICIES
-- =====================================================

-- Business users can view and manage rewards
CREATE POLICY "Business users can view rewards"
    ON rewards FOR SELECT
    USING (business_id = get_user_business_id());

CREATE POLICY "System can create rewards"
    ON rewards FOR INSERT
    WITH CHECK (business_id = get_user_business_id());

CREATE POLICY "Business users can update rewards"
    ON rewards FOR UPDATE
    USING (business_id = get_user_business_id());

-- =====================================================
-- REWARD REDEMPTIONS POLICIES
-- =====================================================

-- Business users can manage redemptions
CREATE POLICY "Business users can view redemptions"
    ON reward_redemptions FOR SELECT
    USING (business_id = get_user_business_id());

CREATE POLICY "Business users can insert redemptions"
    ON reward_redemptions FOR INSERT
    WITH CHECK (business_id = get_user_business_id());

-- =====================================================
-- INVOICES POLICIES
-- =====================================================

-- Super admin can manage all invoices
CREATE POLICY "Super admin full access to invoices"
    ON invoices FOR ALL
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

-- Business admin can view their invoices
CREATE POLICY "Business admin can view invoices"
    ON invoices FOR SELECT
    USING (
        business_id = get_user_business_id()
        AND is_business_admin()
    );

-- =====================================================
-- WALLET CARDS POLICIES
-- =====================================================

-- Business users can manage wallet cards
CREATE POLICY "Business users can view wallet cards"
    ON wallet_cards FOR SELECT
    USING (business_id = get_user_business_id());

CREATE POLICY "Business users can manage wallet cards"
    ON wallet_cards FOR ALL
    USING (business_id = get_user_business_id())
    WITH CHECK (business_id = get_user_business_id());

-- =====================================================
-- NOTIFICATION SETTINGS POLICIES
-- =====================================================

-- Business admin can manage notification settings
CREATE POLICY "Business admin can manage notification settings"
    ON notification_settings FOR ALL
    USING (
        business_id = get_user_business_id()
        AND is_business_admin()
    )
    WITH CHECK (
        business_id = get_user_business_id()
        AND is_business_admin()
    );

-- =====================================================
-- PLATFORM SETTINGS POLICIES
-- =====================================================

-- Only super admin can manage platform settings
CREATE POLICY "Super admin full access to platform settings"
    ON platform_settings FOR ALL
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

-- =====================================================
-- AUDIT LOGS POLICIES
-- =====================================================

-- Super admin can view all audit logs
CREATE POLICY "Super admin can view all audit logs"
    ON audit_logs FOR SELECT
    USING (is_super_admin());

-- Business admin can view their business audit logs
CREATE POLICY "Business admin can view business audit logs"
    ON audit_logs FOR SELECT
    USING (
        business_id = get_user_business_id()
        AND is_business_admin()
    );

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (true);

-- =====================================================
-- STORAGE POLICIES (for Supabase Storage)
-- =====================================================

-- Business logos bucket
-- Super admin can upload/update business logos
-- Business admin can view their own logo

-- Create storage bucket (run in Supabase dashboard)
-- Bucket name: business-logos
-- Public: false

-- Wallet cards bucket
-- Bucket name: wallet-cards
-- Public: false

-- Note: Storage policies should be configured in Supabase Dashboard:
-- 1. Go to Storage > Policies
-- 2. Create policies for each bucket
-- 3. Allow super_admin full access
-- 4. Allow business users to access their own files
