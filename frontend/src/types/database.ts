export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'super_admin' | 'business_admin' | 'staff'
          business_id: string | null
          phone_number: string | null
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: 'super_admin' | 'business_admin' | 'staff'
          business_id?: string | null
          phone_number?: string | null
          avatar_url?: string | null
          is_active?: boolean
        }
        Update: {
          full_name?: string
          role?: 'super_admin' | 'business_admin' | 'staff'
          business_id?: string | null
          phone_number?: string | null
          avatar_url?: string | null
          is_active?: boolean
        }
      }
      businesses: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          brand_color: string
          phone_number: string | null
          email: string | null
          address: string | null
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          slug: string
          logo_url?: string | null
          brand_color?: string
          phone_number?: string | null
          email?: string | null
          address?: string | null
          description?: string | null
          is_active?: boolean
        }
        Update: {
          name?: string
          slug?: string
          logo_url?: string | null
          brand_color?: string
          phone_number?: string | null
          email?: string | null
          address?: string | null
          description?: string | null
          is_active?: boolean
        }
      }
      customers: {
        Row: {
          id: string
          business_id: string
          phone_number: string
          full_name: string | null
          birthday: string | null
          gender: string | null
          notes: string | null
          total_visits: number
          total_points: number
          total_spent: number
          membership_tier: 'bronze' | 'silver' | 'gold' | 'vip'
          qr_code: string
          wallet_card_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          business_id: string
          phone_number: string
          full_name?: string | null
          birthday?: string | null
          gender?: string | null
          notes?: string | null
          qr_code: string
          membership_tier?: 'bronze' | 'silver' | 'gold' | 'vip'
        }
        Update: {
          phone_number?: string
          full_name?: string | null
          birthday?: string | null
          gender?: string | null
          notes?: string | null
          is_active?: boolean
        }
      }
      loyalty_programs: {
        Row: {
          id: string
          business_id: string
          name: string
          description: string | null
          type: 'visit_based' | 'points_based' | 'stamp_card' | 'cashback' | 'membership_tier'
          required_visits: number | null
          points_per_currency: number | null
          points_for_reward: number | null
          required_stamps: number | null
          cashback_percentage: number | null
          reward_name: string
          reward_description: string | null
          reward_value: number | null
          is_active: boolean
          start_date: string | null
          end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          business_id: string
          name: string
          description?: string | null
          type: 'visit_based' | 'points_based' | 'stamp_card' | 'cashback' | 'membership_tier'
          required_visits?: number | null
          points_per_currency?: number | null
          points_for_reward?: number | null
          required_stamps?: number | null
          cashback_percentage?: number | null
          reward_name: string
          reward_description?: string | null
          reward_value?: number | null
          is_active?: boolean
          start_date?: string | null
          end_date?: string | null
        }
        Update: {
          name?: string
          description?: string | null
          is_active?: boolean
        }
      }
      visits: {
        Row: {
          id: string
          business_id: string
          customer_id: string
          staff_id: string | null
          loyalty_program_id: string | null
          visit_date: string
          amount_spent: number
          points_earned: number
          stamps_earned: number
          cashback_earned: number
          notes: string | null
          created_at: string
        }
        Insert: {
          business_id: string
          customer_id: string
          staff_id?: string | null
          loyalty_program_id?: string | null
          amount_spent?: number
          points_earned?: number
          stamps_earned?: number
          cashback_earned?: number
          notes?: string | null
        }
      }
      rewards: {
        Row: {
          id: string
          business_id: string
          customer_id: string
          loyalty_program_id: string
          reward_name: string
          reward_description: string | null
          reward_value: number | null
          is_redeemed: boolean
          earned_date: string
          redeemed_date: string | null
          redeemed_by: string | null
          expiry_date: string | null
          created_at: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          business_id: string
          plan_name: string
          max_customers: number
          max_staff: number
          start_date: string
          expiry_date: string
          renewal_date: string | null
          status: 'active' | 'expired' | 'suspended' | 'cancelled'
          monthly_price: number | null
          annual_price: number | null
          created_at: string
          updated_at: string
        }
      }
      invoices: {
        Row: {
          id: string
          business_id: string
          subscription_id: string | null
          invoice_number: string
          amount: number
          status: 'pending' | 'paid' | 'overdue' | 'cancelled'
          issue_date: string
          due_date: string
          paid_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
