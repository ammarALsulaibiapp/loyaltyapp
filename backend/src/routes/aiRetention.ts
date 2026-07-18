import { Router } from 'express'
import { aiRetentionEngine } from '../services/aiRetentionEngine'
import { createClient } from '@supabase/supabase-js'

const router = Router()

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
 * POST /api/ai-retention/analyze/:businessId
 * Trigger manual analysis for a business
 */
router.post('/analyze/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params
    
    await aiRetentionEngine.analyzeBusinessCustomers(businessId)
    
    res.json({ success: true, message: 'Analysis completed' })
  } catch (error: any) {
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
    
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - parseInt(days as string) * 24 * 60 * 60 * 1000)
    
    const analytics = await aiRetentionEngine.calculateRetentionAnalytics(
      businessId,
      startDate,
      endDate
    )
    
    res.json({ success: true, data: analytics })
  } catch (error: any) {
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

/**
 * POST /api/ai-retention/run-all
 * Run AI analysis for all businesses (for cron job)
 */
router.post('/run-all', async (req, res) => {
  try {
    await aiRetentionEngine.analyzeAllBusinesses()
    
    res.json({ success: true, message: 'AI analysis completed for all businesses' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
