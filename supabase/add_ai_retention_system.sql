-- =====================================================
-- AI RETENTION AUTOPILOT - DATABASE SCHEMA
-- =====================================================

-- Churn risk levels enum
CREATE TYPE churn_risk_level AS ENUM ('low', 'medium', 'high', 'critical');

-- Win-back campaign status
CREATE TYPE winback_status AS ENUM ('scheduled', 'sent', 'opened', 'clicked', 'converted', 'failed');

-- Customer churn analysis table
CREATE TABLE customer_churn_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    
    -- Risk Assessment
    churn_risk churn_risk_level NOT NULL,
    risk_score DECIMAL(5, 2) NOT NULL, -- 0.00 to 100.00
    
    -- Behavioral Data
    days_since_last_visit INTEGER,
    expected_next_visit_days INTEGER,
    average_visit_frequency DECIMAL(5, 2), -- visits per week
    visit_trend TEXT, -- 'increasing', 'stable', 'decreasing'
    
    -- Value Metrics
    lifetime_value DECIMAL(10, 2),
    average_spend DECIMAL(10, 2),
    total_visits INTEGER,
    
    -- Predictions
    predicted_next_visit DATE,
    churn_probability DECIMAL(5, 2), -- 0.00 to 100.00
    
    -- AI Insights
    key_factors JSONB, -- Array of reasons: ["decreased_frequency", "low_engagement"]
    recommended_action TEXT, -- AI suggestion
    
    analyzed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Win-back campaigns table
CREATE TABLE winback_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    churn_analysis_id UUID REFERENCES customer_churn_analysis(id) ON DELETE SET NULL,
    
    -- Campaign Details
    campaign_type TEXT NOT NULL, -- 'auto_winback', 'manual_campaign'
    offer_type TEXT NOT NULL, -- 'double_points', 'free_reward', 'discount'
    offer_value DECIMAL(10, 2),
    offer_description_en TEXT NOT NULL,
    offer_description_ar TEXT NOT NULL,
    
    -- Delivery
    channel notification_channel NOT NULL, -- 'sms', 'whatsapp', 'email'
    message_en TEXT NOT NULL,
    message_ar TEXT NOT NULL,
    sent_at TIMESTAMPTZ,
    
    -- Tracking
    status winback_status DEFAULT 'scheduled',
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    converted_at TIMESTAMPTZ, -- When customer returned
    
    -- Reward (if applicable)
    reward_id UUID REFERENCES rewards(id) ON DELETE SET NULL,
    reward_expires_at TIMESTAMPTZ,
    
    -- Results
    resulted_in_visit BOOLEAN DEFAULT FALSE,
    visit_id UUID REFERENCES visits(id) ON DELETE SET NULL,
    revenue_recovered DECIMAL(10, 2),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Retention Settings per business
CREATE TABLE retention_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID UNIQUE NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    
    -- Enable/Disable
    auto_winback_enabled BOOLEAN DEFAULT TRUE,
    
    -- Thresholds
    medium_risk_days INTEGER DEFAULT 14, -- No visit in X days = medium risk
    high_risk_days INTEGER DEFAULT 21,
    critical_risk_days INTEGER DEFAULT 30,
    
    -- Campaign Settings
    max_campaigns_per_customer INTEGER DEFAULT 3, -- Don't spam
    days_between_campaigns INTEGER DEFAULT 7,
    
    -- Offer Configuration
    default_offer_type TEXT DEFAULT 'double_points', -- 'double_points', 'free_reward', 'discount'
    discount_percentage DECIMAL(5, 2) DEFAULT 10.00,
    bonus_points INTEGER DEFAULT 50,
    
    -- Notification Channel
    preferred_channel notification_channel DEFAULT 'whatsapp',
    
    -- AI Behavior
    min_visits_before_analysis INTEGER DEFAULT 2, -- Need history to predict
    analysis_frequency_hours INTEGER DEFAULT 24, -- Run AI every 24 hours
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics summary table
CREATE TABLE retention_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Customers at Risk
    total_at_risk INTEGER DEFAULT 0,
    medium_risk_count INTEGER DEFAULT 0,
    high_risk_count INTEGER DEFAULT 0,
    critical_risk_count INTEGER DEFAULT 0,
    
    -- Campaign Performance
    campaigns_sent INTEGER DEFAULT 0,
    campaigns_opened INTEGER DEFAULT 0,
    campaigns_clicked INTEGER DEFAULT 0,
    customers_saved INTEGER DEFAULT 0, -- Returned after campaign
    
    -- Financial Impact
    total_revenue_at_risk DECIMAL(10, 2) DEFAULT 0,
    revenue_recovered DECIMAL(10, 2) DEFAULT 0,
    roi_percentage DECIMAL(5, 2), -- Return on investment
    
    -- Effectiveness
    conversion_rate DECIMAL(5, 2), -- % of campaigns that saved customer
    average_days_to_return DECIMAL(5, 2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_churn_analysis_customer ON customer_churn_analysis(customer_id);
CREATE INDEX idx_churn_analysis_business ON customer_churn_analysis(business_id);
CREATE INDEX idx_churn_analysis_risk ON customer_churn_analysis(churn_risk);
CREATE INDEX idx_churn_analysis_date ON customer_churn_analysis(analyzed_at);

CREATE INDEX idx_winback_customer ON winback_campaigns(customer_id);
CREATE INDEX idx_winback_business ON winback_campaigns(business_id);
CREATE INDEX idx_winback_status ON winback_campaigns(status);
CREATE INDEX idx_winback_sent ON winback_campaigns(sent_at);

CREATE INDEX idx_retention_analytics_business ON retention_analytics(business_id);
CREATE INDEX idx_retention_analytics_period ON retention_analytics(period_start, period_end);

-- RLS Policies
ALTER TABLE customer_churn_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE winback_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_analytics ENABLE ROW LEVEL SECURITY;

-- Service role full access (for backend cron jobs)
CREATE POLICY "Service role full access to churn_analysis" ON customer_churn_analysis FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access to winback_campaigns" ON winback_campaigns FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access to retention_settings" ON retention_settings FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access to retention_analytics" ON retention_analytics FOR ALL TO service_role USING (true);

-- Business admins can view their own data
CREATE POLICY "Business admins view churn_analysis" ON customer_churn_analysis FOR SELECT
    USING (
        business_id IN (
            SELECT business_id FROM profiles WHERE id = auth.uid() AND role IN ('business_admin', 'super_admin')
        )
    );

CREATE POLICY "Business admins view winback_campaigns" ON winback_campaigns FOR SELECT
    USING (
        business_id IN (
            SELECT business_id FROM profiles WHERE id = auth.uid() AND role IN ('business_admin', 'super_admin')
        )
    );

CREATE POLICY "Business admins manage retention_settings" ON retention_settings FOR ALL
    USING (
        business_id IN (
            SELECT business_id FROM profiles WHERE id = auth.uid() AND role IN ('business_admin', 'super_admin')
        )
    );

CREATE POLICY "Business admins view retention_analytics" ON retention_analytics FOR SELECT
    USING (
        business_id IN (
            SELECT business_id FROM profiles WHERE id = auth.uid() AND role IN ('business_admin', 'super_admin')
        )
    );

-- Insert default retention settings for all existing businesses
INSERT INTO retention_settings (business_id)
SELECT id FROM businesses
ON CONFLICT (business_id) DO NOTHING;

-- Function to auto-create retention settings on new business
CREATE OR REPLACE FUNCTION create_default_retention_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO retention_settings (business_id)
    VALUES (NEW.id)
    ON CONFLICT (business_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_retention_settings
AFTER INSERT ON businesses
FOR EACH ROW
EXECUTE FUNCTION create_default_retention_settings();

COMMENT ON TABLE customer_churn_analysis IS 'AI-powered churn risk analysis for each customer';
COMMENT ON TABLE winback_campaigns IS 'Automated win-back campaigns sent to at-risk customers';
COMMENT ON TABLE retention_settings IS 'Configurable settings for AI retention system per business';
COMMENT ON TABLE retention_analytics IS 'Performance metrics for retention campaigns';
