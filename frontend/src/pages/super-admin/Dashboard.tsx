import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { isDemoMode, mockBusinesses, mockCustomers, mockRewards } from '../../lib/mockData'
import Card from '../../components/ui/Card'
import { useTranslation } from 'react-i18next'
import {
  Building2,
  CheckCircle,
  XCircle,
  Users,
  Activity,
  Gift,
  DollarSign,
  TrendingUp,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function SuperAdminDashboard() {
  const { t } = useTranslation()

  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['super-admin-stats'],
    queryFn: async () => {
      // DEMO MODE: Use mock data
      if (isDemoMode()) {
        return {
          totalBusinesses: mockBusinesses.length,
          activeBusinesses: mockBusinesses.filter((b) => b.is_active).length,
          activeSubscriptions: 2,
          expiredSubscriptions: 0,
          totalCustomers: mockCustomers.length,
          totalVisits: mockCustomers.reduce((acc, c) => acc + c.total_visits, 0),
          totalRewardsRedeemed: mockRewards.filter((r) => r.is_redeemed).length,
        }
      }

      const [
        businessesResult,
        subscriptionsResult,
        customersResult,
        visitsResult,
        rewardsResult,
      ] = await Promise.all([
        supabase.from('businesses').select('id, is_active'),
        supabase.from('subscriptions').select('id, status'),
        supabase.from('customers').select('id'),
        supabase.from('visits').select('id'),
        supabase.from('rewards').select('id, is_redeemed'),
      ])

      const businesses = (businessesResult.data || []) as any[]
      const subscriptions = (subscriptionsResult.data || []) as any[]

      return {
        totalBusinesses: businesses.length,
        activeBusinesses: businesses.filter((b) => b.is_active).length,
        activeSubscriptions: subscriptions.filter((s) => s.status === 'active').length,
        expiredSubscriptions: subscriptions.filter((s) => s.status === 'expired').length,
        totalCustomers: customersResult.data?.length || 0,
        totalVisits: visitsResult.data?.length || 0,
        totalRewardsRedeemed: (rewardsResult.data as any[])?.filter((r) => r.is_redeemed).length || 0,
      }
    },
  })

  // Mock monthly revenue data
  const monthlyData = [
    { month: 'Jan', revenue: 4500 },
    { month: 'Feb', revenue: 5200 },
    { month: 'Mar', revenue: 4800 },
    { month: 'Apr', revenue: 6100 },
    { month: 'May', revenue: 7200 },
    { month: 'Jun', revenue: 8500 },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('dashboard.superAdminTitle', 'Super Admin Dashboard')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t('dashboard.platformOverview', 'Platform overview and analytics')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('nav.businesses', 'Total Businesses')}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stats?.totalBusinesses || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.activeSubscriptions', 'Active Subscriptions')}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stats?.activeSubscriptions || 0}
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
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.expiredSubscriptions', 'Expired Subscriptions')}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stats?.expiredSubscriptions || 0}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.totalCustomers', 'Total Customers')}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stats?.totalCustomers || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.totalVisits', 'Total Visits')}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stats?.totalVisits || 0}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Activity className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.rewardsRedeemed', 'Rewards Redeemed')}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stats?.totalRewardsRedeemed || 0}
              </p>
            </div>
            <div className="p-3 bg-pink-100 dark:bg-pink-900 rounded-lg">
              <Gift className="w-6 h-6 text-pink-600 dark:text-pink-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.monthlyRevenue', 'Monthly Revenue')}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                8,500 {t('dashboard.mixed', 'Mixed')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Multi-currency</p>
            </div>
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
              <DollarSign className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.annualRevenue', 'Annual Revenue')}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                68,300 {t('dashboard.mixed', 'Mixed')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Multi-currency</p>
            </div>
            <div className="p-3 bg-teal-100 dark:bg-teal-900 rounded-lg">
              <TrendingUp className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card title={t('dashboard.monthlyRevenue', 'Monthly Revenue')} subtitle={t('dashboard.revenueTrend', 'Revenue trend over the last 6 months')}>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
