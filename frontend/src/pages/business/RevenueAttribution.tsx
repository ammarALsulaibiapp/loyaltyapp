import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../../lib/currencies'
import Card from '../../components/ui/Card'
import { DollarSign, TrendingUp, Users, Calendar, Award, Target } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'

export default function RevenueAttribution() {
  const { profile } = useAuthStore()
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'

  // Fetch business info
  const { data: business } = useQuery({
    queryKey: ['business', profile?.business_id],
    queryFn: async () => {
      if (!profile?.business_id) return null
      const { data } = await supabase
        .from('businesses')
        .select('currency')
        .eq('id', profile.business_id)
        .single()
      return data as { currency: string } | null
    },
    enabled: !!profile?.business_id,
  })

  // Fetch revenue attribution data
  const { data: revenueData, isLoading } = useQuery({
    queryKey: ['revenue-attribution', profile?.business_id],
    queryFn: async () => {
      if (!profile?.business_id) return null

      const now = new Date()
      const monthStart = startOfMonth(now)
      const lastMonthStart = startOfMonth(subDays(now, 30))
      const lastMonthEnd = endOfMonth(subDays(now, 30))

      // Get all customers with their visits this month
      const { data: customers } = await supabase
        .from('customers')
        .select(`
          id,
          phone_number,
          full_name,
          total_visits,
          total_spent,
          created_at,
          visits!inner(
            id,
            visit_date,
            amount_spent,
            points_earned
          )
        `)
        .eq('business_id', profile.business_id)

      if (!customers) return null

      // Calculate this month's revenue from loyalty customers
      let thisMonthRevenue = 0
      let thisMonthVisits = 0
      let returningCustomersRevenue = 0
      let newCustomersRevenue = 0
      let rewardDrivenRevenue = 0

      const customerRevenueMap = new Map()

      customers.forEach((customer: any) => {
        let customerThisMonthRevenue = 0
        let customerThisMonthVisits = 0

        customer.visits?.forEach((visit: any) => {
          const visitDate = new Date(visit.visit_date)
          
          if (visitDate >= monthStart) {
            const amount = parseFloat(visit.amount_spent) || 0
            customerThisMonthRevenue += amount
            thisMonthRevenue += amount
            customerThisMonthVisits++
            thisMonthVisits++

            // Check if customer is new or returning
            const customerCreatedDate = new Date(customer.created_at)
            if (customerCreatedDate < monthStart) {
              returningCustomersRevenue += amount
            } else {
              newCustomersRevenue += amount
            }

            // If customer earned points, it's reward-driven
            if (visit.points_earned && visit.points_earned > 0) {
              rewardDrivenRevenue += amount
            }
          }
        })

        if (customerThisMonthRevenue > 0) {
          customerRevenueMap.set(customer.id, {
            name: customer.full_name || customer.phone_number,
            revenue: customerThisMonthRevenue,
            visits: customerThisMonthVisits,
            total_visits: customer.total_visits
          })
        }
      })

      // Get last month data for comparison
      const { data: lastMonthCustomers } = await supabase
        .from('visits')
        .select('amount_spent')
        .eq('business_id', profile.business_id)
        .gte('visit_date', format(lastMonthStart, 'yyyy-MM-dd'))
        .lte('visit_date', format(lastMonthEnd, 'yyyy-MM-dd'))

      const lastMonthRevenue = lastMonthCustomers?.reduce((sum, v: any) => sum + (parseFloat(v.amount_spent) || 0), 0) || 0

      // Top revenue customers
      const topCustomers = Array.from(customerRevenueMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)

      // Calculate metrics
      const averageOrderValue = thisMonthVisits > 0 ? thisMonthRevenue / thisMonthVisits : 0
      const growthRate = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0

      return {
        thisMonthRevenue,
        lastMonthRevenue,
        thisMonthVisits,
        returningCustomersRevenue,
        newCustomersRevenue,
        rewardDrivenRevenue,
        averageOrderValue,
        growthRate,
        topCustomers,
        totalCustomers: customerRevenueMap.size
      }
    },
    enabled: !!profile?.business_id,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  const currency = business?.currency || 'USD'

  // Prepare chart data
  const revenueBreakdown = [
    { name: isArabic ? 'عملاء عائدون' : 'Returning Customers', value: revenueData?.returningCustomersRevenue || 0 },
    { name: isArabic ? 'عملاء جدد' : 'New Customers', value: revenueData?.newCustomersRevenue || 0 }
  ]

  const COLORS = ['#3B82F6', '#10B981']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {isArabic ? 'تحليل الإيرادات' : 'Revenue Attribution'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {isArabic ? 'تتبع الإيرادات من برنامج الولاء' : 'Track revenue from your loyalty program'}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isArabic ? 'إيرادات هذا الشهر' : 'This Month Revenue'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(revenueData?.thisMonthRevenue || 0, currency, isArabic)}
              </p>
              {revenueData?.growthRate !== undefined && (
                <p className={`text-sm mt-1 ${revenueData.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {revenueData.growthRate >= 0 ? '↑' : '↓'} {Math.abs(revenueData.growthRate).toFixed(1)}% 
                  {isArabic ? ' من الشهر الماضي' : ' vs last month'}
                </p>
              )}
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isArabic ? 'متوسط قيمة الطلب' : 'Average Order Value'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(revenueData?.averageOrderValue || 0, currency, isArabic)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {revenueData?.thisMonthVisits || 0} {isArabic ? 'زيارة' : 'visits'}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isArabic ? 'إيرادات مدفوعة بالمكافآت' : 'Reward-Driven Revenue'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(revenueData?.rewardDrivenRevenue || 0, currency, isArabic)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {revenueData?.thisMonthRevenue ? 
                  ((revenueData.rewardDrivenRevenue / revenueData.thisMonthRevenue) * 100).toFixed(0) : 0}%
                {isArabic ? ' من الإجمالي' : ' of total'}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isArabic ? 'العملاء النشطون' : 'Active Customers'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {revenueData?.totalCustomers || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {isArabic ? 'هذا الشهر' : 'this month'}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <Card title={isArabic ? 'تفصيل الإيرادات' : 'Revenue Breakdown'}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => formatCurrency(value, currency, isArabic)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Revenue Customers */}
        <Card title={isArabic ? 'أفضل 10 عملاء بالإيرادات' : 'Top 10 Revenue Customers'}>
          <div className="space-y-3">
            {revenueData?.topCustomers && revenueData.topCustomers.length > 0 ? (
              revenueData.topCustomers.map((customer: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {customer.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {customer.visits} {isArabic ? 'زيارة' : 'visits'} • {customer.total_visits} {isArabic ? 'إجمالي' : 'total'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white">
                      {formatCurrency(customer.revenue, currency, isArabic)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                {isArabic ? 'لا توجد بيانات متاحة' : 'No data available'}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ROI Summary */}
      <Card>
        <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {isArabic ? '💰 ملخص العائد على الاستثمار' : '💰 ROI Summary'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isArabic ? 'إيرادات برنامج الولاء' : 'Loyalty Program Revenue'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(revenueData?.thisMonthRevenue || 0, currency, isArabic)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isArabic ? 'النمو مقارنة بالشهر الماضي' : 'Growth vs Last Month'}
              </p>
              <p className={`text-2xl font-bold mt-1 ${(revenueData?.growthRate || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(revenueData?.growthRate || 0) >= 0 ? '+' : ''}{(revenueData?.growthRate || 0).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isArabic ? 'عملاء مساهمون' : 'Contributing Customers'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {revenueData?.totalCustomers || 0}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isArabic 
                ? `📊 برنامج الولاء الخاص بك يولد ${formatCurrency(revenueData?.thisMonthRevenue || 0, currency, isArabic)} هذا الشهر من ${revenueData?.totalCustomers || 0} عميل نشط.`
                : `📊 Your loyalty program is generating ${formatCurrency(revenueData?.thisMonthRevenue || 0, currency, isArabic)} this month from ${revenueData?.totalCustomers || 0} active customers.`
              }
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
