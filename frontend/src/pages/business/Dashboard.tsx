import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { isDemoMode, mockCustomers, mockRewards } from '../../lib/mockData'
import { useTranslation } from 'react-i18next'
import Card from '../../components/ui/Card'
import { Users, Activity, Gift, TrendingUp, Award, UserPlus } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { format, subDays } from 'date-fns'

export default function BusinessDashboard() {
  const { profile } = useAuthStore()
  const { t } = useTranslation()

  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['business-stats', profile?.business_id],
    queryFn: async () => {
      if (!profile?.business_id) return null

      // DEMO MODE: Use mock data
      if (isDemoMode()) {
        const businessCustomers = mockCustomers.filter(c => c.business_id === profile.business_id)
        const businessRewards = mockRewards.filter(r => r.business_id === profile.business_id)
        const totalVisits = businessCustomers.reduce((acc, c) => acc + c.total_visits, 0)

        return {
          totalCustomers: businessCustomers.length,
          newCustomers: 1,
          visitsToday: 5,
          totalVisits,
          rewardsRedeemed: businessRewards.filter((r) => r.is_redeemed).length,
          activeRewards: businessRewards.filter((r) => !r.is_redeemed).length,
        }
      }

      const [
        customersResult,
        visitsResult,
        rewardsResult,
        todayVisitsResult,
      ] = await Promise.all([
        supabase
          .from('customers')
          .select('id, created_at')
          .eq('business_id', profile.business_id),
        supabase
          .from('visits')
          .select('id, visit_date')
          .eq('business_id', profile.business_id),
        supabase
          .from('rewards')
          .select('id, is_redeemed')
          .eq('business_id', profile.business_id),
        supabase
          .from('visits')
          .select('id')
          .eq('business_id', profile.business_id)
          .gte('visit_date', format(new Date(), 'yyyy-MM-dd')),
      ])

      const customers: any[] = customersResult.data || []
      const visits: any[] = visitsResult.data || []
      const rewards: any[] = rewardsResult.data || []

      // Calculate new customers this week
      const oneWeekAgo = subDays(new Date(), 7)
      const newCustomers = customers.filter(
        (c) => new Date(c.created_at) >= oneWeekAgo
      ).length

      return {
        totalCustomers: customers.length,
        newCustomers,
        visitsToday: (todayVisitsResult.data as any[])?.length || 0,
        totalVisits: visits.length,
        rewardsRedeemed: rewards.filter((r) => r.is_redeemed).length,
        activeRewards: rewards.filter((r) => !r.is_redeemed).length,
      }
    },
  })

  // Mock data for charts - should be replaced with real data from visits table
  const { data: visitChartData } = useQuery<{ day: string; visits: number }[]>({
    queryKey: ['visit-chart', profile?.business_id],
    queryFn: async (): Promise<{ day: string; visits: number }[]> => {
      if (!profile?.business_id) return visitData
      
      if (isDemoMode()) return visitData
      
      // Fetch last 7 days of visit data
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i)
        return {
          date: format(date, 'yyyy-MM-dd'),
          day: format(date, 'EEE')
        }
      })
      
      const { data: visits } = await supabase
        .from('visits')
        .select('visit_date')
        .eq('business_id', profile.business_id)
        .gte('visit_date', last7Days[0].date)
      
      return last7Days.map(day => ({
        day: day.day,
        visits: (visits as any[])?.filter((v: any) => v.visit_date === day.date).length || 0
      }))
    }
  })

  const visitData: { day: string; visits: number }[] = visitChartData || [
    { day: 'Mon', visits: 0 },
    { day: 'Tue', visits: 0 },
    { day: 'Wed', visits: 0 },
    { day: 'Thu', visits: 0 },
    { day: 'Fri', visits: 0 },
    { day: 'Sat', visits: 0 },
    { day: 'Sun', visits: 0 },
  ]

  const { data: customerGrowthData } = useQuery<{ month: string; customers: number }[]>({
    queryKey: ['customer-growth', profile?.business_id],
    queryFn: async (): Promise<{ month: string; customers: number }[]> => {
      const defaultData = [
        { month: 'Jan', customers: 0 },
        { month: 'Feb', customers: 0 },
        { month: 'Mar', customers: 0 },
        { month: 'Apr', customers: 0 },
        { month: 'May', customers: 0 },
        { month: 'Jun', customers: 0 },
      ]
      
      if (!profile?.business_id) return defaultData
      
      if (isDemoMode()) return defaultData
      
      // Fetch last 6 months of customer growth
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date()
        date.setMonth(date.getMonth() - (5 - i))
        return {
          month: format(date, 'MMM'),
          startDate: format(new Date(date.getFullYear(), date.getMonth(), 1), 'yyyy-MM-dd'),
          endDate: format(new Date(date.getFullYear(), date.getMonth() + 1, 0), 'yyyy-MM-dd')
        }
      })
      
      const results = await Promise.all(
        last6Months.map(async (month) => {
          const { data } = await supabase
            .from('customers')
            .select('id')
            .eq('business_id', profile.business_id!)
            .lte('created_at', month.endDate + 'T23:59:59')
          
          return {
            month: month.month,
            customers: data?.length || 0
          }
        })
      )
      
      return results
    }
  })

  const customerGrowth: { month: string; customers: number }[] = customerGrowthData || [
    { month: 'Jan', customers: 0 },
    { month: 'Feb', customers: 0 },
    { month: 'Mar', customers: 0 },
    { month: 'Apr', customers: 0 },
    { month: 'May', customers: 0 },
    { month: 'Jun', customers: 0 },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('dashboard.title')}</h1>
        <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">
          {t('dashboard.welcome')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="glass-panel dark:glass-panel-dark rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-blue-50/50 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {t('dashboard.totalCustomers')}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stats?.totalCustomers || 0}
            </p>
            <p className="text-[12px] text-green-600 dark:text-green-400 mt-1 font-medium">
              +{stats?.newCustomers || 0} {t('dashboard.thisWeek', 'this week')}
            </p>
          </div>
        </div>

        <div className="glass-panel dark:glass-panel-dark rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-green-50/50 dark:bg-green-900/30 rounded-lg">
              <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {t('dashboard.visitsToday')}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stats?.visitsToday || 0}
            </p>
            <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-1 font-medium">
              {stats?.totalVisits || 0} {t('dashboard.totalVisits').toLowerCase()}
            </p>
          </div>
        </div>

        <div className="glass-panel dark:glass-panel-dark rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-purple-50/50 dark:bg-purple-900/30 rounded-lg">
              <UserPlus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {t('dashboard.newCustomers')}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stats?.newCustomers || 0}
            </p>
            <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-1 font-medium">{t('dashboard.last7Days', 'Last 7 days')}</p>
          </div>
        </div>

        <div className="glass-panel dark:glass-panel-dark rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-yellow-50/50 dark:bg-yellow-900/30 rounded-lg">
              <Gift className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {t('dashboard.rewardsRedeemed')}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stats?.rewardsRedeemed || 0}
            </p>
            <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-1 font-medium">{t('dashboard.allTime', 'All time')}</p>
          </div>
        </div>

        <div className="glass-panel dark:glass-panel-dark rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-pink-50/50 dark:bg-pink-900/30 rounded-lg">
              <Award className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {t('dashboard.activeRewards')}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stats?.activeRewards || 0}
            </p>
            <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-1 font-medium">{t('dashboard.readyToRedeem', 'Ready to redeem')}</p>
          </div>
        </div>

        <div className="glass-panel dark:glass-panel-dark rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-indigo-50/50 dark:bg-indigo-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {t('nav.loyaltyPrograms')}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">3</p>
            <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-1 font-medium">{t('dashboard.activeCampaigns', 'Active campaigns')}</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="glass-panel dark:glass-panel-dark rounded-xl p-5">
          <div className="mb-4">
            <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">{t('dashboard.weeklyVisits')}</h3>
            <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">{t('dashboard.weeklyVisitsDesc', 'Customer visits over the last 7 days')}</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={visitData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" style={{ fontSize: '12px' }} />
                <YAxis style={{ fontSize: '12px' }} />
                <Tooltip />
                <Bar dataKey="visits" fill="#ff6b9d" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel dark:glass-panel-dark rounded-xl p-5">
          <div className="mb-4">
            <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">{t('dashboard.customerGrowth')}</h3>
            <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">{t('dashboard.customerGrowthDesc', 'Total customers over time')}</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={customerGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" style={{ fontSize: '12px' }} />
                <YAxis style={{ fontSize: '12px' }} />
                <Tooltip />
                <Line type="monotone" dataKey="customers" stroke="#ff6b9d" strokeWidth={3} dot={{ fill: '#ff6b9d', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-panel dark:glass-panel-dark rounded-xl p-5">
        <div className="mb-4">
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">{t('dashboard.recentActivity')}</h3>
          <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">{t('dashboard.recentActivityDesc', 'Latest customer interactions')}</p>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-slate-700/30 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-[#ff6b9d] to-[#ff8eb3] rounded-full flex items-center justify-center shadow-sm">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-[13px] text-gray-900 dark:text-white">
                    {t('dashboard.customerEarned', 'Customer #{{id}} earned a reward', { id: 1000 + i })}
                  </p>
                  <p className="text-[12px] text-gray-500 dark:text-gray-400">
                    {t('dashboard.hoursAgo', '{{count}} hours ago', { count: i })}
                  </p>
                </div>
              </div>
              <span className="text-[12px] font-semibold text-green-600 dark:text-green-400">
                {t('dashboard.pointsEarnedDesc', '+{{points}} pts', { points: 50 })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
