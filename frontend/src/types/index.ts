/**
 * Shared TypeScript types and interfaces
 */

export interface Customer {
  id: string
  business_id: string
  phone_number: string
  full_name: string | null
  total_visits: number
  total_spent: number
  points_balance: number
  created_at: string
  last_visit_date?: string
  visits?: Visit[]
}

export interface Visit {
  id: string
  customer_id: string
  business_id: string
  visit_date: string
  amount_spent: number
  points_earned: number
  loyalty_program_id?: string
  created_at: string
}

export interface LoyaltyProgram {
  id: string
  business_id: string
  name: string
  type: 'stamp_card' | 'points_based' | 'visit_based' | 'spend_based'
  required_stamps?: number
  visits_required?: number
  points_per_currency?: number
  reward_description: string
  is_active: boolean
  created_at: string
  visits_count?: number
}

export interface LoyaltyProgramProgress {
  id: string
  customer_id: string
  loyalty_program_id: string
  visit_count: number
  total_rewards_earned: number
  current_progress: number
  required_progress: number
  loyalty_program?: LoyaltyProgram
}

export interface Reward {
  id: string
  business_id: string
  name: string
  description: string
  points_required: number
  is_active: boolean
  created_at: string
}

export interface RedemptionHistory {
  id: string
  customer_id: string
  reward_id: string
  redeemed_at: string
  rewards?: Reward
}

export interface Business {
  id: string
  name: string
  slug: string
  email: string | null
  phone_number: string | null
  logo_url: string | null
  brand_color: string
  is_active: boolean
  self_service_enabled: boolean
  currency?: string
  owner_user_id: string | null
  created_at: string
  whatsapp_enabled?: boolean
  whatsapp_credentials?: Record<string, unknown>
  sms_enabled?: boolean
  sms_credentials?: Record<string, unknown>
}

export interface ChurnAnalysis {
  id: string
  customer_id: string
  business_id: string
  churn_risk: 'low' | 'medium' | 'high' | 'critical'
  risk_score: number
  days_since_last_visit: number
  expected_next_visit_days: number
  average_visit_frequency: number
  visit_trend: 'increasing' | 'stable' | 'decreasing'
  lifetime_value: number
  average_spend: number
  total_visits: number
  predicted_next_visit: string
  churn_probability: number
  key_factors: string[]
  recommended_action: string
  analyzed_at: string
  customers?: Pick<Customer, 'phone_number' | 'full_name'>
}

export interface WinbackCampaign {
  id: string
  customer_id: string
  business_id: string
  campaign_type: string
  offer_type: string
  offer_value: number
  offer_description_en: string
  offer_description_ar: string
  channel: string
  message_en: string
  message_ar: string
  status: 'scheduled' | 'sent' | 'opened' | 'clicked' | 'converted' | 'failed'
  sent_at?: string
  opened_at?: string
  clicked_at?: string
  converted_at?: string
  resulted_in_visit: boolean
  revenue_recovered?: number
  created_at: string
  customers?: Pick<Customer, 'phone_number' | 'full_name'>
}

export interface QRScanResult {
  data: string
}

export interface GoogleWalletPassData {
  iss: string
  aud: string
  typ: string
  iat: number
  payload: {
    loyaltyObjects: Array<{
      id: string
      classId: string
      state: string
      accountId: string
      accountName: string
      barcode?: {
        type: string
        value: string
      }
    }>
  }
}

export interface VisitData {
  loyalty_program_id: string
  amount_spent: number
}

export interface ApiError {
  error: string
  message?: string
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  success?: boolean
  message?: string
}
