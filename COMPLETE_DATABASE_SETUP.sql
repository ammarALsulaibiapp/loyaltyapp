-- =====================================================
-- LOYALTYPASS COMPLETE DATABASE SETUP
-- =====================================================
-- Run this entire file in your Supabase SQL Editor
-- This includes: Schema + Policies + Initial Setup
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUMS
-- =====================================================

-- User roles enum
CREATE TYPE user_role AS ENUM ('super_admin', 'business_admin', 'staff');

-- Subscription status enum
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'suspended', 'cancelled');

-- Loyalty program types enum
CREATE TYPE loyalty_program_type AS ENUM ('visit_based', 'points_based', 'stamp_card', 'cashback', 'membership_tier');

-- Membership tier enum
CREATE TYPE membership_tier AS ENUM ('bronze', 'silver', 'gold', 'vip');

-- Invoice status enum
CREATE TYPE invoice_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');

-- Notification channel enum
CREATE TYPE notification_channel AS ENUM ('sms', 'whatsapp', 'email');

-- =====================================================
-- TABLES
-- =====================================================

-- BUSINESSES TABLE (must be created first for foreign keys)
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    brand_color TEXT DEFAULT '#0ea5e9',
    phone_number TEXT,
    email TEXT,
    address TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    self_service_enabled BOOLEAN DEFAULT FALSE,
    owner_user_id UUID, -- Will reference profiles later
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROFILES TABLE
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'staff',
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    phone_number TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Now add foreign key to businesses.owner_user_id
ALTER TABLE businesses 
ADD CONSTRAINT fk_businesses_owner 
FOREIGN KEY (owner_user_id) 
REFERENCES profiles(id) ON DELETE SET NULL;

-- SUBSCRIPTIONS TABLE
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL,
    max_customers INTEGER NOT NULL,
    max_staff INTEGER NOT NULL,
    start_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    renewal_date DATE,
    status subscription_status DEFAULT 'active',
    monthly_price DECIMAL(10, 2),
    annual_price DECIMAL(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id)
);

-- CUSTOMERS TABLE (Phone-based, no login required)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    full_name TEXT,
    birthday DATE,
    gender TEXT,
    notes TEXT,
    total_visits INTEGER DEFAULT 0,
    total_points DECIMAL(10, 2) DEFAULT 0,
    total_spent DECIMAL(10, 2) DEFAULT 0,
    membership_tier membership_tier DEFAULT 'bronze',
    qr_code TEXT UNIQUE NOT NULL,
    wallet_card_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, phone_number)
);

-- LOYALTY PROGRAMS TABLE
CREATE TABLE loyalty_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type loyalty_program_type NOT NULL,
    required_visits INTEGER,
    points_per_currency DECIMAL(10, 2),
    points_for_reward INTEGER,
    required_stamps INTEGER,
    cashback_percentage DECIMAL(5, 2),
    reward_name TEXT NOT NULL,
    reward_description TEXT,
    reward_value DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- VISITS TABLE
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    loyalty_program_id UUID REFERENCES loyalty_programs(id) ON DELETE SET NULL,
    visit_date TIMESTAMPTZ DEFAULT NOW(),
    amount_spent DECIMAL(10, 2) DEFAULT 0,
    points_earned DECIMAL(10, 2) DEFAULT 0,
    stamps_earned INTEGER DEFAULT 0,
    cashback_earned DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REWARDS TABLE
CREATE TABLE rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    loyalty_program_id UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
    reward_name TEXT NOT NULL,
    reward_description TEXT,
    reward_value DECIMAL(10, 2),
    is_redeemed BOOLEAN DEFAULT FALSE,
    earned_date TIMESTAMPTZ DEFAULT NOW(),
    redeemed_date TIMESTAMPTZ,
    redeemed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    expiry_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REWARD REDEMPTIONS TABLE
CREATE TABLE reward_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    redemption_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INVOICES TABLE
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    invoice_number TEXT UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status invoice_status DEFAULT 'pending',
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WALLET CARDS TABLE
CREATE TABLE wallet_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    apple_pass_url TEXT,
    apple_pass_serial TEXT UNIQUE,
    apple_pass_data JSONB,
    google_pass_url TEXT,
    google_pass_id TEXT UNIQUE,
    google_pass_data JSONB,
    qr_code_data TEXT NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(customer_id, business_id)
);

-- NOTIFICATION SETTINGS TABLE
CREATE TABLE notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    whatsapp_enabled BOOLEAN DEFAULT FALSE,
    email_enabled BOOLEAN DEFAULT FALSE,
    notify_customer_created BOOLEAN DEFAULT TRUE,
    notify_reward_earned BOOLEAN DEFAULT TRUE,
    notify_reward_redeemed BOOLEAN DEFAULT FALSE,
    notify_birthday BOOLEAN DEFAULT TRUE,
    notify_membership_upgrade BOOLEAN DEFAULT TRUE,
    sms_provider TEXT,
    sms_config JSONB,
    whatsapp_provider TEXT,
    whatsapp_config JSONB,
    email_provider TEXT,
    email_config JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PLATFORM SETTINGS TABLE
CREATE TABLE platform_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUDIT LOG TABLE
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_customers_phone ON customers(business_id, phone_number);
CREATE INDEX idx_customers_qr ON customers(qr_code);
CREATE INDEX idx_visits_customer ON visits(customer_id, visit_date DESC);
CREATE INDEX idx_visits_business ON visits(business_id, visit_date DESC);
CREATE INDEX idx_rewards_customer ON rewards(customer_id, is_redeemed);
CREATE INDEX idx_rewards_business ON rewards(business_id, earned_date DESC);
CREATE INDEX idx_redemptions_customer ON reward_redemptions(customer_id, redemption_date DESC);
CREATE INDEX idx_redemptions_business ON reward_redemptions(business_id, redemption_date DESC);
CREATE INDEX idx_invoices_business ON invoices(business_id, issue_date DESC);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_audit_logs_business ON audit_logs(business_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER businesses_updated_at BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER loyalty_programs_updated_at BEFORE UPDATE ON loyalty_programs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER notification_settings_updated_at BEFORE UPDATE ON notification_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Generate QR code function
CREATE OR REPLACE FUNCTION generate_qr_code(p_customer_id UUID, p_business_id UUID)
RETURNS TEXT AS $$
DECLARE
    qr_data TEXT;
BEGIN
    qr_data := encode(
        digest(
            p_customer_id::TEXT || p_business_id::TEXT || NOW()::TEXT || gen_random_uuid()::TEXT,
            'sha256'
        ),
        'hex'
    );
    RETURN qr_data;
END;
$$ LANGUAGE plpgsql;

-- Auto-reward function
CREATE OR REPLACE FUNCTION check_and_unlock_rewards(p_customer_id UUID, p_loyalty_program_id UUID)
RETURNS VOID AS $$
DECLARE
    v_program loyalty_programs%ROWTYPE;
    v_customer customers%ROWTYPE;
    v_visit_count INTEGER;
    v_stamps INTEGER;
    v_should_unlock BOOLEAN := FALSE;
BEGIN
    SELECT * INTO v_program FROM loyalty_programs WHERE id = p_loyalty_program_id;
    SELECT * INTO v_customer FROM customers WHERE id = p_customer_id;
    
    CASE v_program.type
        WHEN 'visit_based' THEN
            SELECT COUNT(*) INTO v_visit_count
            FROM visits WHERE customer_id = p_customer_id AND loyalty_program_id = p_loyalty_program_id;
            IF v_visit_count >= v_program.required_visits THEN
                v_should_unlock := TRUE;
            END IF;
        WHEN 'points_based' THEN
            IF v_customer.total_points >= v_program.points_for_reward THEN
                v_should_unlock := TRUE;
            END IF;
        WHEN 'stamp_card' THEN
            SELECT COALESCE(SUM(stamps_earned), 0) INTO v_stamps
            FROM visits WHERE customer_id = p_customer_id AND loyalty_program_id = p_loyalty_program_id;
            IF v_stamps >= v_program.required_stamps THEN
                v_should_unlock := TRUE;
            END IF;
    END CASE;
    
    IF v_should_unlock THEN
        INSERT INTO rewards (business_id, customer_id, loyalty_program_id, reward_name, reward_description, reward_value)
        VALUES (v_program.business_id, p_customer_id, p_loyalty_program_id, v_program.reward_name, v_program.reward_description, v_program.reward_value);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Update customer totals
CREATE OR REPLACE FUNCTION update_customer_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE customers
    SET total_visits = total_visits + 1,
        total_points = total_points + NEW.points_earned,
        total_spent = total_spent + NEW.amount_spent,
        updated_at = NOW()
    WHERE id = NEW.customer_id;
    
    IF NEW.loyalty_program_id IS NOT NULL THEN
        PERFORM check_and_unlock_rewards(NEW.customer_id, NEW.loyalty_program_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER visits_update_totals AFTER INSERT ON visits
    FOR EACH ROW EXECUTE FUNCTION update_customer_totals();

-- Mark reward redeemed
CREATE OR REPLACE FUNCTION mark_reward_redeemed()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE rewards SET is_redeemed = TRUE, redeemed_date = NEW.redemption_date, redeemed_by = NEW.staff_id
    WHERE id = NEW.reward_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER redemptions_mark_reward AFTER INSERT ON reward_redemptions
    FOR EACH ROW EXECUTE FUNCTION mark_reward_redeemed();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
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

-- Helper functions
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_business_id()
RETURNS UUID AS $$
    SELECT business_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin');
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_business_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'business_admin');
$$ LANGUAGE sql SECURITY DEFINER;

-- PROFILES POLICIES
CREATE POLICY "Super admin full profiles" ON profiles FOR ALL USING (is_super_admin());
CREATE POLICY "Business view profiles" ON profiles FOR SELECT USING (business_id = get_user_business_id());
CREATE POLICY "View own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Update own profile" ON profiles FOR UPDATE USING (id = auth.uid());

-- BUSINESSES POLICIES
CREATE POLICY "Super admin full businesses" ON businesses FOR ALL USING (is_super_admin());
CREATE POLICY "Business view own" ON businesses FOR SELECT USING (id = get_user_business_id());
CREATE POLICY "Business admin update" ON businesses FOR UPDATE USING (id = get_user_business_id() AND is_business_admin());

-- CUSTOMERS POLICIES
CREATE POLICY "Super admin view customers" ON customers FOR SELECT USING (is_super_admin());
CREATE POLICY "Business manage customers" ON customers FOR ALL USING (business_id = get_user_business_id());

-- PUBLIC ACCESS FOR SIGNUP AND CARDS
CREATE POLICY "Public can create customers" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can view customer by ID" ON customers FOR SELECT USING (true);

-- LOYALTY PROGRAMS POLICIES
CREATE POLICY "Business view programs" ON loyalty_programs FOR SELECT USING (business_id = get_user_business_id());
CREATE POLICY "Business admin manage programs" ON loyalty_programs FOR ALL USING (business_id = get_user_business_id() AND is_business_admin());
CREATE POLICY "Public view active programs" ON loyalty_programs FOR SELECT USING (is_active = true);

-- VISITS POLICIES
CREATE POLICY "Business manage visits" ON visits FOR ALL USING (business_id = get_user_business_id());

-- REWARDS POLICIES
CREATE POLICY "Business manage rewards" ON rewards FOR ALL USING (business_id = get_user_business_id());
CREATE POLICY "Public view rewards by customer" ON rewards FOR SELECT USING (true);

-- REWARD REDEMPTIONS POLICIES
CREATE POLICY "Business manage redemptions" ON reward_redemptions FOR ALL USING (business_id = get_user_business_id());

-- INVOICES POLICIES
CREATE POLICY "Super admin invoices" ON invoices FOR ALL USING (is_super_admin());
CREATE POLICY "Business view invoices" ON invoices FOR SELECT USING (business_id = get_user_business_id() AND is_business_admin());

-- SUBSCRIPTIONS POLICIES
CREATE POLICY "Super admin subscriptions" ON subscriptions FOR ALL USING (is_super_admin());
CREATE POLICY "Business view subscription" ON subscriptions FOR SELECT USING (business_id = get_user_business_id());

-- OTHER TABLES
CREATE POLICY "Business wallet cards" ON wallet_cards FOR ALL USING (business_id = get_user_business_id());
CREATE POLICY "Business notification settings" ON notification_settings FOR ALL USING (business_id = get_user_business_id() AND is_business_admin());
CREATE POLICY "Super admin platform settings" ON platform_settings FOR ALL USING (is_super_admin());
CREATE POLICY "Audit logs access" ON audit_logs FOR SELECT USING (is_super_admin() OR business_id = get_user_business_id());
CREATE POLICY "Insert audit logs" ON audit_logs FOR INSERT WITH CHECK (true);

-- =====================================================
-- DONE!
-- =====================================================
-- Your database is now ready!
-- Next: Create your first super admin user via Supabase Auth
-- Then run: UPDATE profiles SET role = 'super_admin' WHERE email = 'your@email.com';
