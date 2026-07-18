// AI Retention Engine - Business logic only, NO database imports
// Database calls are handled by the routes layer

interface Customer {
  id: string
  business_id: string
  phone_number: string
  full_name: string | null
  total_visits: number
  total_spent: number
  created_at: string
  last_visit_date?: string
  visits?: any[]
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
   * Calculate churn risk for a single customer
   * This is pure business logic - no database calls
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
}

export const aiRetentionEngine = new AIRetentionEngine()
