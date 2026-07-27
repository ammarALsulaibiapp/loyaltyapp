import { Router } from 'express'
import { supabaseAdmin } from '../config/supabase'
import { requireApiKey, requireSuperAdmin } from '../middleware/auth'

const router = Router()

// =====================================================
// GET /api/notifications/settings/:businessId
// Get notification settings for a business
// =====================================================
router.get('/settings/:businessId', requireApiKey, async (req, res) => {
  try {
    const { businessId } = req.params

    const { data: business, error } = await supabaseAdmin
      .from('businesses')
      .select('id, name, whatsapp_api_token, whatsapp_phone_number_id, whatsapp_business_account_id, whatsapp_api_enabled')
      .eq('id', businessId)
      .single()

    if (error || !business) {
      return res.status(404).json({ error: 'Business not found' })
    }

    res.json({
      success: true,
      settings: {
        whatsapp_api_enabled: business.whatsapp_api_enabled || false,
        whatsapp_api_token: business.whatsapp_api_token || '',
        whatsapp_phone_number_id: business.whatsapp_phone_number_id || '',
        whatsapp_business_account_id: business.whatsapp_business_account_id || '',
        whatsapp_configured: !!(business.whatsapp_api_token && business.whatsapp_phone_number_id),
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
      whatsapp_api_enabled,
      whatsapp_api_token,
      whatsapp_phone_number_id,
      whatsapp_business_account_id,
    } = req.body

    const updateData: any = {}

    if (whatsapp_api_enabled !== undefined) updateData.whatsapp_api_enabled = whatsapp_api_enabled
    if (whatsapp_api_token !== undefined) updateData.whatsapp_api_token = whatsapp_api_token
    if (whatsapp_phone_number_id !== undefined) updateData.whatsapp_phone_number_id = whatsapp_phone_number_id
    if (whatsapp_business_account_id !== undefined) updateData.whatsapp_business_account_id = whatsapp_business_account_id

    const { error } = await supabaseAdmin
      .from('businesses')
      .update(updateData)
      .eq('id', businessId)

    if (error) {
      console.error('Update notification settings error:', error)
      return res.status(500).json({ error: 'Failed to update settings' })
    }

    res.json({ success: true, message: 'WhatsApp settings updated successfully' })
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
