import axios from 'axios'
import { supabaseAdmin } from '../config/supabase'

// =====================================================
// NOTIFICATION SERVICE
// Supports multiple providers: Twilio, Meta, etc.
// =====================================================

interface NotificationCredentials {
  account_sid?: string
  auth_token?: string
  phone_number?: string
  access_token?: string
  [key: string]: any
}

interface SendNotificationParams {
  businessId: string
  customerId: string
  recipientPhone: string
  message: string
  eventType: 'signup' | 'reward_earned' | 'reward_redeemed' | 'visit_added'
  notificationType: 'whatsapp' | 'sms'
}

// =====================================================
// SEND WHATSAPP MESSAGE
// =====================================================
async function sendWhatsApp(
  provider: string,
  credentials: NotificationCredentials,
  toPhone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (provider === 'twilio') {
      // Twilio WhatsApp API
      const { account_sid, auth_token, phone_number } = credentials
      
      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${account_sid}/Messages.json`,
        new URLSearchParams({
          From: `whatsapp:${phone_number}`,
          To: `whatsapp:${toPhone}`,
          Body: message
        }),
        {
          auth: {
            username: account_sid!,
            password: auth_token!
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      )
      
      return { success: true }
    } else if (provider === 'meta') {
      // Meta Business API (Graph API)
      const { access_token, phone_number_id } = credentials
      
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${phone_number_id}/messages`,
        {
          messaging_product: 'whatsapp',
          to: toPhone,
          type: 'text',
          text: { body: message }
        },
        {
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      return { success: true }
    } else {
      return { success: false, error: 'Unsupported WhatsApp provider' }
    }
  } catch (error: any) {
    console.error('WhatsApp send error:', error.response?.data || error.message)
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    }
  }
}

// =====================================================
// SEND SMS MESSAGE
// =====================================================
async function sendSMS(
  provider: string,
  credentials: NotificationCredentials,
  toPhone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (provider === 'twilio') {
      // Twilio SMS API
      const { account_sid, auth_token, phone_number } = credentials
      
      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${account_sid}/Messages.json`,
        new URLSearchParams({
          From: phone_number!,
          To: toPhone,
          Body: message
        }),
        {
          auth: {
            username: account_sid!,
            password: auth_token!
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      )
      
      return { success: true }
    } else if (provider === 'aws_sns') {
      // AWS SNS (would need AWS SDK)
      // TODO: Implement AWS SNS if needed
      return { success: false, error: 'AWS SNS not yet implemented' }
    } else {
      return { success: false, error: 'Unsupported SMS provider' }
    }
  } catch (error: any) {
    console.error('SMS send error:', error.response?.data || error.message)
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    }
  }
}

// =====================================================
// MAIN: SEND NOTIFICATION
// =====================================================
export async function sendNotification(params: SendNotificationParams): Promise<boolean> {
  const { businessId, customerId, recipientPhone, message, eventType, notificationType } = params

  try {
    // Fetch business notification settings
    const { data: business, error: fetchError } = await supabaseAdmin
      .from('businesses')
      .select(`
        whatsapp_enabled,
        whatsapp_provider,
        whatsapp_credentials,
        sms_enabled,
        sms_provider,
        sms_credentials
      `)
      .eq('id', businessId)
      .single()

    if (fetchError || !business) {
      console.error('Business not found for notification')
      return false
    }

    let result: { success: boolean; error?: string }
    let provider: string = ''

    if (notificationType === 'whatsapp') {
      if (!business.whatsapp_enabled || !business.whatsapp_credentials) {
        console.log('WhatsApp not enabled for this business')
        return false
      }
      provider = business.whatsapp_provider
      result = await sendWhatsApp(
        business.whatsapp_provider,
        business.whatsapp_credentials,
        recipientPhone,
        message
      )
    } else if (notificationType === 'sms') {
      if (!business.sms_enabled || !business.sms_credentials) {
        console.log('SMS not enabled for this business')
        return false
      }
      provider = business.sms_provider
      result = await sendSMS(
        business.sms_provider,
        business.sms_credentials,
        recipientPhone,
        message
      )
    } else {
      return false
    }

    // Log the notification attempt
    await supabaseAdmin.from('notification_logs').insert({
      business_id: businessId,
      customer_id: customerId,
      notification_type: notificationType,
      event_type: eventType,
      recipient_phone: recipientPhone,
      message_body: message,
      provider: provider,
      status: result.success ? 'sent' : 'failed',
      error_message: result.error,
      sent_at: result.success ? new Date().toISOString() : null
    })

    return result.success
  } catch (error: any) {
    console.error('Notification service error:', error)
    return false
  }
}
