import { Router, Request, Response } from 'express'
import axios from 'axios'
import { supabaseAdmin } from '../config/supabase'
import { requireApiKey } from '../middleware/auth'

const router = Router()

// Meta WhatsApp Cloud API base URL
const WHATSAPP_API_BASE = 'https://graph.facebook.com/v21.0'

// =====================================================
// Helper: Send a single WhatsApp message via Meta Cloud API
// =====================================================
async function sendWhatsAppMessage(
  phoneNumberId: string,
  accessToken: string,
  recipientPhone: string,
  messageText: string
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    // Normalize phone number: remove spaces, dashes, and ensure it starts with country code
    let phone = recipientPhone.replace(/[\s\-\(\)]/g, '')
    // Remove leading + if present (Meta API expects without +)
    if (phone.startsWith('+')) {
      phone = phone.substring(1)
    }
    // If starts with 0, assume Omani number and add 968
    if (phone.startsWith('0')) {
      phone = '968' + phone.substring(1)
    }

    const response = await axios.post(
      `${WHATSAPP_API_BASE}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: {
          preview_url: false,
          body: messageText,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000, // 15 second timeout per message
      }
    )

    return {
      success: true,
      messageId: response.data?.messages?.[0]?.id,
    }
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error?.message ||
      error.response?.data?.error?.error_data?.details ||
      error.message ||
      'Unknown error'

    console.error(`WhatsApp send failed to ${recipientPhone}:`, errorMessage)

    return {
      success: false,
      error: errorMessage,
    }
  }
}

// =====================================================
// POST /api/bulk-messaging/send
// Send bulk WhatsApp messages to customers
// =====================================================
router.post('/send', requireApiKey, async (req: Request, res: Response) => {
  try {
    const {
      business_id,
      message,
      customer_phones, // Array of { phone_number, name }
      filter_type,
      sent_by,
    } = req.body

    if (!business_id || !message?.trim() || !customer_phones?.length) {
      return res.status(400).json({
        error: 'Missing required fields: business_id, message, customer_phones',
      })
    }

    // Fetch business WhatsApp credentials
    const { data: business, error: bizError } = await supabaseAdmin
      .from('businesses')
      .select(
        'id, name, whatsapp_api_token, whatsapp_phone_number_id, whatsapp_business_account_id, whatsapp_api_enabled'
      )
      .eq('id', business_id)
      .single()

    if (bizError || !business) {
      return res.status(404).json({ error: 'Business not found' })
    }

    if (!business.whatsapp_api_enabled) {
      return res.status(403).json({
        error: 'WhatsApp API is not enabled for this business. Contact your admin.',
      })
    }

    if (!business.whatsapp_api_token || !business.whatsapp_phone_number_id) {
      return res.status(400).json({
        error: 'WhatsApp API credentials not configured. Go to Settings to add them.',
      })
    }

    // Send messages
    let successCount = 0
    let failCount = 0
    const errors: { phone: string; error: string }[] = []

    for (const customer of customer_phones) {
      if (!customer.phone_number) {
        failCount++
        errors.push({ phone: 'unknown', error: 'No phone number' })
        continue
      }

      const result = await sendWhatsAppMessage(
        business.whatsapp_phone_number_id,
        business.whatsapp_api_token,
        customer.phone_number,
        message.trim()
      )

      if (result.success) {
        successCount++
      } else {
        failCount++
        errors.push({
          phone: customer.phone_number,
          error: result.error || 'Unknown error',
        })
      }

      // Small delay between messages to avoid rate limiting
      if (customer_phones.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    // Log to bulk_messages table
    const { error: logError } = await supabaseAdmin
      .from('bulk_messages')
      .insert([
        {
          business_id,
          message: message.trim(),
          recipient_count: customer_phones.length,
          filter_type: filter_type || 'all',
          sent_by: sent_by || null,
          status: failCount === 0 ? 'sent' : successCount === 0 ? 'failed' : 'partial',
          success_count: successCount,
          fail_count: failCount,
          error_details: errors.length > 0 ? errors : null,
        },
      ] as any)

    if (logError) {
      console.error('Failed to log bulk message:', logError)
    }

    res.json({
      success: true,
      results: {
        total: customer_phones.length,
        sent: successCount,
        failed: failCount,
        errors: errors.slice(0, 10), // Return first 10 errors only
      },
    })
  } catch (error: any) {
    console.error('Bulk messaging error:', error)
    res.status(500).json({ error: 'Internal server error: ' + error.message })
  }
})

// =====================================================
// POST /api/bulk-messaging/test
// Send a test WhatsApp message to verify credentials
// =====================================================
router.post('/test', requireApiKey, async (req: Request, res: Response) => {
  try {
    const { business_id, test_phone_number } = req.body

    if (!business_id || !test_phone_number) {
      return res.status(400).json({
        error: 'Missing required fields: business_id, test_phone_number',
      })
    }

    // Fetch business WhatsApp credentials
    const { data: business, error: bizError } = await supabaseAdmin
      .from('businesses')
      .select(
        'id, name, whatsapp_api_token, whatsapp_phone_number_id, whatsapp_api_enabled'
      )
      .eq('id', business_id)
      .single()

    if (bizError || !business) {
      return res.status(404).json({ error: 'Business not found' })
    }

    if (!business.whatsapp_api_token || !business.whatsapp_phone_number_id) {
      return res.status(400).json({
        error: 'WhatsApp API credentials not configured.',
      })
    }

    const testMessage = `✅ Test message from ${business.name || 'SabaaaPass'}\n\nYour WhatsApp Business API is working correctly!\n\n🕐 ${new Date().toLocaleString()}`

    const result = await sendWhatsAppMessage(
      business.whatsapp_phone_number_id,
      business.whatsapp_api_token,
      test_phone_number,
      testMessage
    )

    if (result.success) {
      res.json({
        success: true,
        message: 'Test message sent successfully!',
        messageId: result.messageId,
      })
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        message: 'Failed to send test message. Check your credentials.',
      })
    }
  } catch (error: any) {
    console.error('Test message error:', error)
    res.status(500).json({ error: 'Internal server error: ' + error.message })
  }
})

// =====================================================
// GET /api/bulk-messaging/history/:businessId
// Get message history for a business
// =====================================================
router.get('/history/:businessId', requireApiKey, async (req: Request, res: Response) => {
  try {
    const { businessId } = req.params
    const { limit = '20' } = req.query

    const { data: messages, error } = await supabaseAdmin
      .from('bulk_messages')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit as string))

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch message history' })
    }

    res.json({ success: true, messages: messages || [] })
  } catch (error: any) {
    console.error('Get message history error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// =====================================================
// GET /api/bulk-messaging/status/:businessId
// Check if WhatsApp is configured for a business
// =====================================================
router.get('/status/:businessId', requireApiKey, async (req: Request, res: Response) => {
  try {
    const { businessId } = req.params

    const { data: business, error } = await supabaseAdmin
      .from('businesses')
      .select(
        'id, whatsapp_api_enabled, whatsapp_phone_number_id, whatsapp_business_account_id'
      )
      .eq('id', businessId)
      .single()

    if (error || !business) {
      return res.status(404).json({ error: 'Business not found' })
    }

    const isConfigured =
      !!business.whatsapp_phone_number_id && business.whatsapp_api_enabled

    res.json({
      success: true,
      whatsapp: {
        enabled: business.whatsapp_api_enabled || false,
        configured: isConfigured,
        has_credentials: !!business.whatsapp_phone_number_id,
      },
    })
  } catch (error: any) {
    console.error('Get WhatsApp status error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
