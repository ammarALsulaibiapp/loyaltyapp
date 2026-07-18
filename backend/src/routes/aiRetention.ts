import { Router } from 'express'
import { aiRetentionEngine } from '../services/aiRetentionEngine'
import { createClient } from '@supabase/supabase-js'

const router = Router()

// Create Supabase client lazily to avoid WebSocket issues
function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  )
}

// Middleware to check API key
const requireApiKey = (req: any, res: any, next: any) => {
  const apiKey = req.headers['x-api-key']
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

router.use(requireApiKey)

/**
 * GET /api/ai-retention/analysis/:businessId
 * Get churn analysis for a business
 */
router.get('/analysis/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params
    const { riskLevel } = req.query // Optional filter: 'low', 'medium', 'high', 'critical'
    
    const supabase = getSupabase()
    
    let query = supabase
      .from('customer_churn_analysis')
      .select(`
        *,
        customers (
          phone_number,
          full_name
        )
      `)
      .eq('business_id', businessId)
      .order('risk_score', { ascending: false })
    
    if (riskLevel) {
      query = query.eq('churn_risk', riskLevel)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    res.json({ success: true, data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/ai-retention/run-analysis/:businessId
 * Trigger manual analysis for a business
 */
router.post('/run-analysis/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params
    
    const supabase = getSupabase()
    
    // Get retention settings
    const { data: settings, error: settingsError } = await supabase
      .from('retention_settings')
      .select('*')
      .eq('business_id', businessId)
      .single()
    
    if (settingsError) throw settingsError
    
    if (!settings || !settings.auto_winback_enabled) {
      return res.json({ success: false, message: 'Auto win-back is disabled for this business' })
    }
    
    // Get all customers with visit history
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select(`
        *,
        visits (
          visit_date,
          amount_spent
        )
      `)
      .eq('business_id', businessId)
      .gte('total_visits', settings.min_visits_before_analysis || 2)
    
    if (customersError) throw customersError
    
    if (!customers || customers.length === 0) {
      return res.json({ success: true, message: 'No customers to analyze', data: { customersAnalyzed: 0, atRiskCustomers: 0, campaignsCreated: 0 } })
    }
    
    let atRiskCount = 0
    let campaignsCreated = 0
    
    // Analyze each customer
    for (const customer of customers) {
      const analysis = aiRetentionEngine.calculateChurnRisk(customer, settings)
      
      // Save analysis
      await supabase
        .from('customer_churn_analysis')
        .insert({
          ...analysis,
          key_factors: JSON.stringify(analysis.key_factors)
        })
      
      if (analysis.churn_risk !== 'low') {
        atRiskCount++
      }
      
      // Create win-back campaign for high/critical risk
      if (analysis.churn_risk === 'high' || analysis.churn_risk === 'critical') {
        // Check if customer already has recent campaign
        const { data: recentCampaigns } = await supabase
          .from('winback_campaigns')
          .select('*')
          .eq('customer_id', analysis.customer_id)
          .gte('created_at', new Date(Date.now() - (settings.days_between_campaigns || 7) * 24 * 60 * 60 * 1000).toISOString())
        
        if (!recentCampaigns || recentCampaigns.length === 0) {
          // Generate offer
          const offer = aiRetentionEngine.generateOffer(analysis, settings, customer)
          
          // Create campaign
          await supabase
            .from('winback_campaigns')
            .insert({
              customer_id: analysis.customer_id,
              business_id: analysis.business_id,
              campaign_type: 'auto_winback',
              offer_type: offer.type,
              offer_value: offer.value,
              offer_description_en: offer.description_en,
              offer_description_ar: offer.description_ar,
              channel: settings.preferred_channel || 'whatsapp',
              message_en: offer.message_en,
              message_ar: offer.message_ar,
              status: 'scheduled'
            })
          
          campaignsCreated++
        }
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Analysis completed',
      data: {
        customersAnalyzed: customers.length,
        atRiskCustomers: atRiskCount,
        campaignsCreated: campaignsCreated
      }
    })
  } catch (error: any) {
    console.error('AI Retention Analysis Error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/ai-retention/campaigns/:businessId
 * Get win-back campaigns for a business
 */
router.get('/campaigns/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params
    const { status } = req.query // Optional filter
    
    const supabase = getSupabase()
    
    let query = supabase
      .from('winback_campaigns')
      .select(`
        *,
        customers (
          phone_number,
          full_name
        )
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
    
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    res.json({ success: true, data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/ai-retention/analytics/:businessId
 * Get retention analytics for a business
 */
router.get('/analytics/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params
    const { days = 30 } = req.query
    
    const supabase = getSupabase()
    
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - parseInt(days as string) * 24 * 60 * 60 * 1000)
    
    // Get all churn analyses in period
    const { data: analyses } = await supabase
      .from('customer_churn_analysis')
      .select('*')
      .eq('business_id', businessId)
      .gte('analyzed_at', startDate.toISOString())
      .lte('analyzed_at', endDate.toISOString())
    
    // Get all campaigns in period
    const { data: campaigns } = await supabase
      .from('winback_campaigns')
      .select('*')
      .eq('business_id', businessId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
    
    const analytics = {
      atRiskCustomers: {
        total: analyses?.filter(a => a.churn_risk !== 'low').length || 0,
        medium: analyses?.filter(a => a.churn_risk === 'medium').length || 0,
        high: analyses?.filter(a => a.churn_risk === 'high').length || 0,
        critical: analyses?.filter(a => a.churn_risk === 'critical').length || 0,
      },
      campaignPerformance: {
        totalSent: campaigns?.filter(c => c.status === 'sent').length || 0,
        opened: campaigns?.filter(c => c.opened_at).length || 0,
        converted: campaigns?.filter(c => c.resulted_in_visit).length || 0,
        conversionRate: campaigns && campaigns.length > 0 
          ? ((campaigns.filter(c => c.resulted_in_visit).length / campaigns.length) * 100).toFixed(2)
          : '0.00'
      },
      revenueImpact: {
        totalAtRisk: analyses?.reduce((sum, a) => sum + (parseFloat(a.lifetime_value) || 0), 0).toFixed(2) || '0.00',
        recovered: campaigns?.reduce((sum, c) => sum + (parseFloat(c.revenue_recovered) || 0), 0).toFixed(2) || '0.00'
      }
    }
    
    res.json({ success: true, data: analytics })
  } catch (error: any) {
    console.error('AI Retention Analytics Error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/ai-retention/settings/:businessId
 * Get retention settings for a business
 */
router.get('/settings/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params
    
    const supabase = getSupabase()
    
    const { data, error } = await supabase
      .from('retention_settings')
      .select('*')
      .eq('business_id', businessId)
      .single()
    
    if (error) throw error
    
    res.json({ success: true, settings: data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * PUT /api/ai-retention/settings/:businessId
 * Update retention settings for a business
 */
router.put('/settings/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params
    const settings = req.body
    
    const supabase = getSupabase()
    
    const { data, error } = await supabase
      .from('retention_settings')
      .update(settings)
      .eq('business_id', businessId)
      .select()
      .single()
    
    if (error) throw error
    
    res.json({ success: true, settings: data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
