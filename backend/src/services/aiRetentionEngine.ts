import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface Customer {
  id: string
  business_id: string
  phone_number: string
  full_name: string | null
  total_visits: number
  total_spent: number
  created_at: string
  last_visit_date?: string
}

interface ChurnAnalysis {
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
}

export class AIRetentionEngine {
  /**
   * Main function: Analyze all customers for all businesses
   */
  async analyzeAllBusinesses() {
    console.log('🤖 AI Retention Engine: Starting analysis...')
    
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id')
      .eq('is_active', true)
    
    if (!businesses) return
    
    for (const business of businesses) {
      await this.analyzeBusinessCustomers(business.id)
    }
    
    console.log('✅ AI Retention Engine: Analysis complete')
  }

  /**
   * Analyze all customers for a single business
   */
  async analyzeBusinessCustomers(businessId: string) {
    // Get retention settings
    const { data: settings } = await supabase
      .from('retention_settings')
      .select('*')
      .eq('business_id', businessId)
      .single()
    
    if (!settings || !settings.auto_winback_enabled) {
      console.log(`⏭️  Skipping business ${businessId} - auto-winback disabled`)
      return
    }
    
    // Get all customers with visit history
    const { data: customers } = await supabase
      .from('customers')
      .select(`
        *,
        visits (
          visit_date,
          amount_spent
        )
      `)
      .eq('business_id', businessId)
      .gte('total_visits', settings.min_visits_before_analysis)
    
    if (!customers || customers.length === 0) return
    
    console.log(`📊 Analyzing ${customers.length} customers for business ${businessId}`)
    
    for (const customer of customers) {
      const analysis = this.calculateChurnRisk(customer as any, settings)
      
      // Save analysis to database
      await this.saveChurnAnalysis(analysis)
      
      // Trigger win-back if needed
      if (analysis.churn_risk === 'high' || analysis.churn_risk === 'critical') {
        await this.triggerWinBackCampaign(analysis, settings)
      }
    }
  }

  /**
   * Calculate churn risk for a single customer
   */
  calculateChurnRisk(customer: any, settings: any): ChurnAnalysis {
    const visits = customer.visits || []
    const totalVisits = visits.length
    
    // Calculate days since last visit
    const lastVisit = visits.length > 0 
      ? new Date(visits.sort((a: any, b: any) => 
          new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime()
        )[0].visit_date)
      : new Date(customer.created_at)
    
    const daysSinceLastVisit = Math.floor(
      (Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    // Calculate average visit frequency (visits per week)
    const customerAgeDays = Math.floor(
      (Date.now() - new Date(customer.created_at).getTime()) / (1000 * 60 * 60 * 24)
    )
    const averageVisitFrequency = (totalVisits / customerAgeDays) * 7 // per week
    
    // Expected days until next visit
    const expectedNextVisitDays = averageVisitFrequency > 0 
      ? Math.round(7 / averageVisitFrequency) 
      : 30
    
    // Determine churn risk
    let churnRisk: 'low' | 'medium' | 'high' | 'critical' = 'low'
    let riskScore = 0
    
    if (daysSinceLastVisit >= settings.critical_risk_days) {
      churnRisk = 'critical'
      riskScore = 90 + Math.min((daysSinceLastVisit - settings.critical_risk_days), 10)
    } else if (daysSinceLastVisit >= settings.high_risk_days) {
      churnRisk = 'high'
      riskScore = 70 + ((daysSinceLastVisit - settings.high_risk_days) / 
        (settings.critical_risk_days - settings.high_risk_days)) * 20
    } else if (daysSinceLastVisit >= settings.medium_risk_days) {
      churnRisk = 'medium'
      riskScore = 40 + ((daysSinceLastVisit - settings.medium_risk_days) / 
        (settings.high_risk_days - settings.medium_risk_days)) * 30
    } else {
      riskScore = (daysSinceLastVisit / settings.medium_risk_days) * 40
    }
    
    // Calculate visit trend (last 3 visits vs previous 3)
    let visitTrend: 'increasing' | 'stable' | 'decreasing' = 'stable'
    if (visits.length >= 6) {
      const recent = visits.slice(0, 3)
      const previous = visits.slice(3, 6)
      const recentAvg = recent.reduce((sum: number, v: any) => sum + (v.amount_spent || 0), 0) / 3
      const previousAvg = previous.reduce((sum: number, v: any) => sum + (v.amount_spent || 0), 0) / 3
      
      if (recentAvg > previousAvg * 1.1) visitTrend = 'increasing'
      else if (recentAvg < previousAvg * 0.9) visitTrend = 'decreasing'
    }
    
    // Key factors
    const keyFactors: string[] = []
    if (daysSinceLastVisit > expectedNextVisitDays * 1.5) {
      keyFactors.push('overdue_visit')
    }
    if (visitTrend === 'decreasing') {
      keyFactors.push('decreasing_spend')
    }
    if (averageVisitFrequency < 0.5) {
      keyFactors.push('low_frequency')
    }
    if (customer.total_spent < 50) {
      keyFactors.push('low_lifetime_value')
    }
    
    // AI Recommendation
    let recommendedAction = ''
    if (churnRisk === 'critical') {
      recommendedAction = 'send_urgent_winback_with_high_value_offer'
    } else if (churnRisk === 'high') {
      recommendedAction = 'send_winback_with_special_offer'
    } else if (churnRisk === 'medium') {
      recommendedAction = 'send_gentle_reminder'
    }
    
    // Predicted next visit
    const predictedNextVisit = new Date(lastVisit.getTime() + expectedNextVisitDays * 24 * 60 * 60 * 1000)
    
    return {
      customer_id: customer.id,
      business_id: customer.business_id,
      churn_risk: churnRisk,
      risk_score: Math.round(riskScore * 100) / 100,
      days_since_last_visit: daysSinceLastVisit,
      expected_next_visit_days: expectedNextVisitDays,
      average_visit_frequency: Math.round(averageVisitFrequency * 100) / 100,
      visit_trend: visitTrend,
      lifetime_value: customer.total_spent || 0,
      average_spend: totalVisits > 0 ? (customer.total_spent || 0) / totalVisits : 0,
      total_visits: totalVisits,
      predicted_next_visit: predictedNextVisit.toISOString().split('T')[0],
      churn_probability: riskScore,
      key_factors: keyFactors,
      recommended_action: recommendedAction
    }
  }

  /**
   * Save churn analysis to database
   */
  async saveChurnAnalysis(analysis: ChurnAnalysis) {
    await supabase
      .from('customer_churn_analysis')
      .insert({
        ...analysis,
        key_factors: JSON.stringify(analysis.key_factors)
      })
  }

  /**
   * Trigger automated win-back campaign
   */
  async triggerWinBackCampaign(analysis: ChurnAnalysis, settings: any) {
    // Check if customer already has recent campaign
    const { data: recentCampaigns } = await supabase
      .from('winback_campaigns')
      .select('*')
      .eq('customer_id', analysis.customer_id)
      .gte('created_at', new Date(Date.now() - settings.days_between_campaigns * 24 * 60 * 60 * 1000).toISOString())
    
    if (recentCampaigns && recentCampaigns.length > 0) {
      console.log(`⏭️  Skipping campaign for customer ${analysis.customer_id} - recent campaign exists`)
      return
    }
    
    // Get customer details
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', analysis.customer_id)
      .single()
    
    if (!customer) return
    
    // Generate personalized offer
    const offer = this.generateOffer(analysis, settings, customer)
    
    // Create campaign
    const { data: campaign } = await supabase
      .from('winback_campaigns')
      .insert({
        customer_id: analysis.customer_id,
        business_id: analysis.business_id,
        campaign_type: 'auto_winback',
        offer_type: offer.type,
        offer_value: offer.value,
        offer_description_en: offer.description_en,
        offer_description_ar: offer.description_ar,
        channel: settings.preferred_channel,
        message_en: offer.message_en,
        message_ar: offer.message_ar,
        status: 'scheduled'
      })
      .select()
      .single()
    
    console.log(`📧 Win-back campaign created for customer ${customer.full_name || customer.phone_number}`)
    
    // Send notification (would integrate with notification service)
    // await this.sendNotification(campaign, customer, settings)
  }

  /**
   * Generate personalized offer based on churn risk
   */
  generateOffer(analysis: ChurnAnalysis, settings: any, customer: any) {
    let offerType = settings.default_offer_type
    let offerValue = 0
    let descriptionEn = ''
    let descriptionAr = ''
    let messageEn = ''
    let messageAr = ''
    
    const customerName = customer.full_name || 'Valued Customer'
    const customerNameAr = customer.full_name || 'عميلنا العزيز'
    
    if (analysis.churn_risk === 'critical') {
      offerType = 'free_reward'
      offerValue = analysis.average_spend * 0.5
      descriptionEn = `Free reward worth ${offerValue} on your next visit!`
      descriptionAr = `مكافأة مجانية بقيمة ${offerValue} في زيارتك القادمة!`
      messageEn = `Hi ${customerName}! We miss you! 😊 It's been ${analysis.days_since_last_visit} days. Come back this week and get a FREE reward! Valid for 7 days.`
      messageAr = `مرحباً ${customerNameAr}! نحن نفتقدك! 😊 مضى ${analysis.days_since_last_visit} يوماً. عد إلينا هذا الأسبوع واحصل على مكافأة مجانية! صالحة لمدة 7 أيام.`
    } else if (analysis.churn_risk === 'high') {
      offerType = 'double_points'
      offerValue = settings.bonus_points * 2
      descriptionEn = `Double points (${offerValue} pts) on your next visit!`
      descriptionAr = `نقاط مضاعفة (${offerValue} نقطة) في زيارتك القادمة!`
      messageEn = `Hey ${customerName}! ⭐ Special offer: Get DOUBLE POINTS on your next visit! Don't miss out. Valid for 5 days.`
      messageAr = `مرحباً ${customerNameAr}! ⭐ عرض خاص: احصل على نقاط مضاعفة في زيارتك القادمة! لا تفوت الفرصة. صالح لمدة 5 أيام.`
    } else {
      offerType = 'bonus_points'
      offerValue = settings.bonus_points
      descriptionEn = `Bonus ${offerValue} points on your next visit!`
      descriptionAr = `${offerValue} نقطة إضافية في زيارتك القادمة!`
      messageEn = `Hi ${customerName}! Come visit us soon and earn ${offerValue} bonus points! 🎁`
      messageAr = `مرحباً ${customerNameAr}! قم بزيارتنا قريباً واحصل على ${offerValue} نقطة إضافية! 🎁`
    }
    
    return {
      type: offerType,
      value: offerValue,
      description_en: descriptionEn,
      description_ar: descriptionAr,
      message_en: messageEn,
      message_ar: messageAr
    }
  }

  /**
   * Calculate retention analytics for a business
   */
  async calculateRetentionAnalytics(businessId: string, startDate: Date, endDate: Date) {
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
    
    if (!analyses || !campaigns) return
    
    const analytics = {
      business_id: businessId,
      period_start: startDate.toISOString().split('T')[0],
      period_end: endDate.toISOString().split('T')[0],
      total_at_risk: analyses.filter(a => a.churn_risk !== 'low').length,
      medium_risk_count: analyses.filter(a => a.churn_risk === 'medium').length,
      high_risk_count: analyses.filter(a => a.churn_risk === 'high').length,
      critical_risk_count: analyses.filter(a => a.churn_risk === 'critical').length,
      campaigns_sent: campaigns.filter(c => c.status === 'sent').length,
      campaigns_opened: campaigns.filter(c => c.opened_at).length,
      campaigns_clicked: campaigns.filter(c => c.clicked_at).length,
      customers_saved: campaigns.filter(c => c.resulted_in_visit).length,
      total_revenue_at_risk: analyses.reduce((sum, a) => sum + (a.lifetime_value || 0), 0),
      revenue_recovered: campaigns.reduce((sum, c) => sum + (c.revenue_recovered || 0), 0),
      conversion_rate: campaigns.length > 0 
        ? (campaigns.filter(c => c.resulted_in_visit).length / campaigns.length) * 100 
        : 0
    }
    
    // Save analytics
    await supabase
      .from('retention_analytics')
      .insert(analytics)
    
    return analytics
  }
}

export const aiRetentionEngine = new AIRetentionEngine()
