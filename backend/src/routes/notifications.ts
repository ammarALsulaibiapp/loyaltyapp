import { Router } from 'express'
import { supabaseAdmin } from '../config/supabase'
import { requireApiKey, requireSuperAdmin } from '../middleware/auth'

const router = Router()

// =====================================================
// GET /api/notifications/settings/:businessId
// Get notification settings for a business
// =====================================================
router.get('/settings/:businessId', requireApiKey, requireSuperAdmin, async (req, res) => {
  try {
    const { businessId } = req.params

    const { data: business, error } = await supabaseAdmin
      .from('businesses')
      .select('id, name, whatsapp_enabled, whatsapp_provider, whatsapp_credentials, sms_enabled, sms_provider, sms_credentials')
      .eq('id', businessId)
      .single()

    if (error || !business) {
      return res.status(404).json({ error: 'Business not found' })
    }

    res.json({
      success: true,
      settings: {
        whatsapp_enabled: business.whatsapp_enabled || false,
        whatsapp_provider: business.whatsapp_provider || null,
        whatsapp_configured: !!business.whatsapp_credentials,
        sms_enabled: business.sms_enabled || false,
        sms_provider: business.sms_provider || null,
        sms_configured: !!business.sms_credentials
      }
    })
  } catch (error: any) {
    console.error('Get notification settings error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// =====================================================
// PUT /api/notifications/settings/:businessId
// Update notification settings for a business (Super Admin only)
// =====================================================
router.put('/settings/:businessId', requireApiKey, requireSuperAdmin, async (req, res) => {
  try {
    const { businessId } = req.params
    const {
      whatsapp_enabled,
      whatsapp_provider,
      whatsapp_credentials,
      sms_enabled,
      sms_provider,
      sms_credentials
    } = req.body

    const updateData: any = {}

    // WhatsApp settings
    if (whatsapp_enabled !== undefined) updateData.whatsapp_enabled = whatsapp_enabled
    if (whatsapp_provider !== undefined) updateData.whatsapp_provider = whatsapp_provider
    if (whatsapp_credentials !== undefined) updateData.whatsapp_credentials = whatsapp_credentials

    // SMS settings
    if (sms_enabled !== undefined) updateData.sms_enabled = sms_enabled
    if (sms_provider !== undefined) updateData.sms_provider = sms_provider
    if (sms_credentials !== undefined) updateData.sms_credentials = sms_credentials

    const { error } = await supabaseAdmin
      .from('businesses')
      .update(updateData)
      .eq('id', businessId)

    if (error) {
      console.error('Update notification settings error:', error)
      return res.status(500).json({ error: 'Failed to update settings' })
    }

    res.json({ success: true, message: 'Notification settings updated' })
  } catch (error: any) {
    console.error('Update notification settings error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// =====================================================
// POST /api/notifications/toggle/:businessId
// Toggle notifications on/off (Business can do this for themselves)
// =====================================================
router.post('/toggle/:businessId', requireApiKey, async (req, res) => {
  try {
    const { businessId } = req.params
    const { notification_type, enabled } = req.body // 'whatsapp' or 'sms'

    const updateData: any = {}
    if (notification_type === 'whatsapp') {
      updateData.whatsapp_enabled = enabled
    } else if (notification_type === 'sms') {
      updateData.sms_enabled = enabled
    } else {
      return res.status(400).json({ error: 'Invalid notification type' })
    }

    const { error } = await supabaseAdmin
      .from('businesses')
      .update(updateData)
      .eq('id', businessId)

    if (error) {
      return res.status(500).json({ error: 'Failed to toggle notification' })
    }

    res.json({ success: true, message: `${notification_type} notifications ${enabled ? 'enabled' : 'disabled'}` })
  } catch (error: any) {
    console.error('Toggle notification error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// =====================================================
// GET /api/notifications/logs/:businessId
// Get notification logs for a business
// =====================================================
router.get('/logs/:businessId', requireApiKey, async (req, res) => {
  try {
    const { businessId } = req.params
    const { limit = '50' } = req.query

    const { data: logs, error } = await supabaseAdmin
      .from('notification_logs')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit as string))

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch logs' })
    }

    res.json({ success: true, logs })
  } catch (error: any) {
    console.error('Get notification logs error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
