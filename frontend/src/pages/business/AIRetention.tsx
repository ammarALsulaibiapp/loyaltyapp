import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../stores/authStore'
import { useTranslation } from 'react-i18next'
import type { ChurnAnalysis, WinbackCampaign } from '../../types'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Users, TrendingDown, Send, CheckCircle, AlertTriangle, DollarSign, Settings, RefreshCw } from 'lucide-react'

export default function AIRetentionPage() {
  const { profile } = useAuthStore()
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'
  const [selectedRisk, setSelectedRisk] = useState<string>('all')

  // Fetch at-risk customers
  const { data: atRiskCustomers, isLoading, refetch } = useQuery({
    queryKey: ['at-risk-customers', profile?.business_id, selectedRisk],
    queryFn: async () => {
      if (!profile?.business_id) return []
      
      const riskParam = selectedRisk !== 'all' ? `&riskLevel=${selectedRisk}` : ''
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/ai-retention/analysis/${profile.business_id}?${riskParam}`,
        { headers: { 'x-api-key': import.meta.env.VITE_API_KEY } }
      )
      const result = await response.json()
      return result.data || []
    },
    enabled: !!profile?.business_id
  })

  // Fetch campaigns
  const { data: campaigns } = useQuery({
    queryKey: ['winback-campaigns', profile?.business_id],
    queryFn: async () => {
      if (!profile?.business_id) return []
      
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/ai-retention/campaigns/${profile.business_id}`,
        { headers: { 'x-api-key': import.meta.env.VITE_API_KEY } }
      )
      const result = await response.json()
      return result.data || []
    },
    enabled: !!profile?.business_id
  })

  // Fetch analytics
  const { data: analytics } = useQuery({
    queryKey: ['retention-analytics', profile?.business_id],
    queryFn: async () => {
      if (!profile?.business_id) return null
      
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/ai-retention/analytics/${profile.business_id}?days=30`,
        { headers: { 'x-api-key': import.meta.env.VITE_API_KEY } }
      )
      const result = await response.json()
      return result.data
    },
    enabled: !!profile?.business_id
  })

  // Run manual analysis
  const handleRunAnalysis = async () => {
    if (!profile?.business_id) return
    
    try {
      await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/ai-retention/analyze/${profile.business_id}`,
        {
          method: 'POST',
          headers: { 'x-api-key': import.meta.env.VITE_API_KEY }
        }
      )
      alert(isArabic ? '✅ تم تحليل العملاء بنجاح!' : '✅ Analysis completed!')
      refetch()
    } catch (error) {
      alert(isArabic ? '❌ فشل التحليل' : '❌ Analysis failed')
    }
  }

  const getRiskBadge = (risk: string) => {
    const badges = {
      low: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: '🟢', label: isArabic ? 'منخفض' : 'Low' },
      medium: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: '🟡', label: isArabic ? 'متوسط' : 'Medium' },
      high: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', icon: '🟠', label: isArabic ? 'عالي' : 'High' },
      critical: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: '🔴', label: isArabic ? 'حرج' : 'Critical' }
    }
    return badges[risk as keyof typeof badges] || badges.low
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      scheduled: { color: 'bg-blue-100 text-blue-800', label: isArabic ? 'مجدول' : 'Scheduled' },
      sent: { color: 'bg-purple-100 text-purple-800', label: isArabic ? 'تم الإرسال' : 'Sent' },
      opened: { color: 'bg-indigo-100 text-indigo-800', label: isArabic ? 'تم الفتح' : 'Opened' },
      converted: { color: 'bg-green-100 text-green-800', label: isArabic ? 'تم التحويل' : 'Converted' },
      failed: { color: 'bg-red-100 text-red-800', label: isArabic ? 'فشل' : 'Failed' }
    }
    return badges[status as keyof typeof badges] || badges.scheduled
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isArabic ? '🤖 نظام الاحتفاظ الذكي' : '🤖 AI Retention Autopilot'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isArabic 
              ? 'نظام ذكي يحدد العملاء المعرضين للمغادرة ويحاول استعادتهم تلقائياً'
              : 'AI-powered system that identifies at-risk customers and automatically wins them back'}
          </p>
        </div>
        <Button icon={<RefreshCw className="w-4 h-4" />} onClick={handleRunAnalysis}>
          {isArabic ? 'تحليل الآن' : 'Analyze Now'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isArabic ? 'عملاء معرضون للخطر' : 'At-Risk Customers'}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {analytics?.total_at_risk || 0}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isArabic ? 'حملات مرسلة' : 'Campaigns Sent'}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {analytics?.campaigns_sent || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Send className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isArabic ? 'عملاء تم إنقاذهم' : 'Customers Saved'}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {analytics?.customers_saved || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isArabic ? 'إيرادات مستردة' : 'Revenue Recovered'}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {analytics?.revenue_recovered?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Risk Filter */}
      <Card>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isArabic ? 'تصفية حسب المخاطر:' : 'Filter by Risk:'}
          </span>
          <div className="flex gap-2">
            {['all', 'critical', 'high', 'medium', 'low'].map((risk) => (
              <button
                key={risk}
                onClick={() => setSelectedRisk(risk)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                  selectedRisk === risk
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {risk === 'all' 
                  ? (isArabic ? 'الكل' : 'All')
                  : getRiskBadge(risk).label
                }
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* At-Risk Customers Table */}
      <Card 
        title={isArabic ? '📊 العملاء المعرضون للخطر' : '📊 At-Risk Customers'}
        subtitle={isArabic 
          ? 'العملاء الذين من المحتمل أن يتوقفوا عن الزيارة'
          : 'Customers likely to stop visiting'
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-start py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {isArabic ? 'العميل' : 'Customer'}
                </th>
                <th className="text-start py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {isArabic ? 'مستوى المخاطر' : 'Risk Level'}
                </th>
                <th className="text-start py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {isArabic ? 'أيام منذ آخر زيارة' : 'Days Since Visit'}
                </th>
                <th className="text-start py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {isArabic ? 'إجمالي الزيارات' : 'Total Visits'}
                </th>
                <th className="text-start py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {isArabic ? 'القيمة مدى الحياة' : 'Lifetime Value'}
                </th>
                <th className="text-start py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {isArabic ? 'الإجراء الموصى به' : 'AI Action'}
                </th>
              </tr>
            </thead>
            <tbody>
              {atRiskCustomers?.map((customer: ChurnAnalysis) => {
                const riskBadge = getRiskBadge(customer.churn_risk)
                return (
                  <tr
                    key={customer.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {customer.customers?.full_name || isArabic ? 'عميل' : 'Customer'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {customer.customers?.phone_number}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${riskBadge.color}`}>
                        <span>{riskBadge.icon}</span>
                        <span>{riskBadge.label}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {customer.days_since_last_visit} {isArabic ? 'يوم' : 'days'}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {customer.total_visits}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {customer.lifetime_value?.toFixed(2) || '0.00'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {customer.recommended_action === 'send_urgent_winback_with_high_value_offer' && (isArabic ? 'عرض قيم عاجل' : 'Urgent High-Value Offer')}
                        {customer.recommended_action === 'send_winback_with_special_offer' && (isArabic ? 'عرض خاص' : 'Special Offer')}
                        {customer.recommended_action === 'send_gentle_reminder' && (isArabic ? 'تذكير لطيف' : 'Gentle Reminder')}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {(!atRiskCustomers || atRiskCustomers.length === 0) && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {isArabic 
                ? '🎉 رائع! لا يوجد عملاء معرضون للخطر حالياً'
                : '🎉 Great! No at-risk customers right now'}
            </div>
          )}
        </div>
      </Card>

      {/* Recent Campaigns */}
      <Card 
        title={isArabic ? '📧 حملات الاستعادة الأخيرة' : '📧 Recent Win-Back Campaigns'}
        subtitle={isArabic 
          ? 'الحملات التلقائية المرسلة للعملاء المعرضين للخطر'
          : 'Automated campaigns sent to at-risk customers'
        }
      >
        <div className="space-y-3">
          {campaigns?.slice(0, 10).map((campaign: WinbackCampaign) => {
            const statusBadge = getStatusBadge(campaign.status)
            return (
              <div
                key={campaign.id}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {campaign.customers?.full_name || campaign.customers?.phone_number}
                      </span>
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${statusBadge.color}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {isArabic ? campaign.offer_description_ar : campaign.offer_description_en}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {isArabic ? campaign.message_ar : campaign.message_en}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        {isArabic ? 'تم الإرسال:' : 'Sent:'} {campaign.created_at ? new Date(campaign.created_at).toLocaleDateString(isArabic ? 'ar' : 'en') : 'N/A'}
                      </span>
                      {campaign.resulted_in_visit && (
                        <span className="text-green-600 font-medium">
                          ✅ {isArabic ? 'عاد العميل!' : 'Customer returned!'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {(!campaigns || campaigns.length === 0) && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {isArabic 
                ? 'لم يتم إرسال أي حملات بعد'
                : 'No campaigns sent yet'}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
