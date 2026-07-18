# 🧪 Test AI Retention System

## Quick API Tests

Replace `YOUR_BUSINESS_ID` and `YOUR_API_KEY` with real values.

### 1. Get Retention Settings
```bash
curl https://loyaltyapp-production-0301.up.railway.app/api/ai-retention/settings/YOUR_BUSINESS_ID \
  -H "x-api-key: YOUR_API_KEY"
```

**Expected:** Returns settings like `auto_winback_enabled: true`, thresholds, etc.

---

### 2. Run AI Analysis (Manually)
```bash
curl -X POST https://loyaltyapp-production-0301.up.railway.app/api/ai-retention/run-analysis/YOUR_BUSINESS_ID \
  -H "x-api-key: YOUR_API_KEY"
```

**Expected:** 
```json
{
  "success": true,
  "message": "AI analysis completed",
  "data": {
    "customersAnalyzed": 10,
    "atRiskCustomers": 3,
    "campaignsCreated": 2
  }
}
```

---

### 3. Get At-Risk Customers
```bash
curl https://loyaltyapp-production-0301.up.railway.app/api/ai-retention/analysis/YOUR_BUSINESS_ID \
  -H "x-api-key: YOUR_API_KEY"
```

**Expected:** Array of customers with risk levels:
```json
{
  "success": true,
  "data": [
    {
      "customer_id": "...",
      "customer_name": "Ahmed",
      "customer_phone": "96890123456",
      "churn_risk": "high",
      "risk_score": "78.50",
      "days_since_last_visit": 25,
      "total_visits": 12
    }
  ]
}
```

---

### 4. Get Campaigns
```bash
curl https://loyaltyapp-production-0301.up.railway.app/api/ai-retention/campaigns/YOUR_BUSINESS_ID \
  -H "x-api-key: YOUR_API_KEY"
```

**Expected:** Array of campaigns:
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "customer_name": "Ahmed",
      "customer_phone": "96890123456",
      "offer_type": "double_points",
      "message_en": "We miss you Ahmed! Come back...",
      "message_ar": "نفتقدك أحمد! عد واحصل...",
      "status": "scheduled",
      "created_at": "2026-07-18T..."
    }
  ]
}
```

---

### 5. Get Analytics
```bash
curl https://loyaltyapp-production-0301.up.railway.app/api/ai-retention/analytics/YOUR_BUSINESS_ID \
  -H "x-api-key: YOUR_API_KEY"
```

**Expected:** Summary data:
```json
{
  "success": true,
  "data": {
    "atRiskCustomers": {
      "total": 5,
      "medium": 2,
      "high": 2,
      "critical": 1
    },
    "campaignPerformance": {
      "totalSent": 10,
      "opened": 6,
      "converted": 3,
      "conversionRate": "30.00"
    },
    "revenueImpact": {
      "totalAtRisk": "5000.00",
      "recovered": "1500.00"
    }
  }
}
```

---

### 6. Update Settings
```bash
curl -X PUT https://loyaltyapp-production-0301.up.railway.app/api/ai-retention/settings/YOUR_BUSINESS_ID \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "auto_winback_enabled": true,
    "medium_risk_days": 10,
    "high_risk_days": 20,
    "critical_risk_days": 30,
    "default_offer_type": "double_points"
  }'
```

**Expected:** 
```json
{
  "success": true,
  "message": "Settings updated successfully"
}
```

---

## Frontend Page Test

1. Go to: https://mahfazaty.sabaasoul.com/login
2. Login as Business Admin
3. Click **"الاحتفاظ الذكي"** (AI Retention) in sidebar
4. You should see:
   - At-Risk Customers table (with filter buttons)
   - Campaign Performance cards
   - Analytics dashboard
   - Refresh button to run analysis

---

## Database Verification (Supabase SQL Editor)

### Check tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN (
  'customer_churn_analysis', 
  'winback_campaigns', 
  'retention_settings', 
  'retention_analytics'
);
```

### Check default settings created:
```sql
SELECT * FROM retention_settings;
```

Should show one row per business with defaults.

### Check if analysis ran:
```sql
SELECT COUNT(*) FROM customer_churn_analysis;
```

Should show > 0 if you ran analysis.

### Check campaigns:
```sql
SELECT 
  c.full_name,
  wc.offer_type,
  wc.status,
  wc.message_en,
  wc.created_at
FROM winback_campaigns wc
JOIN customers c ON wc.customer_id = c.id
ORDER BY wc.created_at DESC
LIMIT 10;
```

---

## Expected Behavior After Setup

1. **First visit to AI Retention page:**
   - Should load without errors
   - May show "No at-risk customers" if analysis hasn't run

2. **Click Refresh button:**
   - Triggers AI analysis
   - After few seconds, at-risk customers appear
   - Campaigns are auto-created

3. **Filter by risk level:**
   - Click "Critical", "High", "Medium" buttons
   - Table filters accordingly

4. **Analytics cards:**
   - Show real numbers from database
   - Color-coded risk indicators

---

## Common Issues

**Issue:** API returns 404  
**Solution:** Backend might not be deployed. Check Railway logs.

**Issue:** Empty data  
**Solution:** Need customer data with visits. Create test data first.

**Issue:** SQL errors when running migration  
**Solution:** Some tables might already exist. Drop them first or check for conflicts.

**Issue:** Frontend shows loading forever  
**Solution:** Check browser console for errors. Verify backend URL in `.env`

---

## Success Indicators ✅

- [ ] SQL migration ran without errors
- [ ] `/api/ai-retention/*` endpoints return 200
- [ ] AI Retention page loads
- [ ] At-risk customers appear after analysis
- [ ] Campaigns show in table
- [ ] Analytics dashboard shows numbers
- [ ] Arabic/English switch works correctly

---

**Ready? Run the tests and watch your AI Retention system come alive!** 🚀
