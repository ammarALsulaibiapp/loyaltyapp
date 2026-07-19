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

interface Subscription {
  id: string
  plan_name: string
  expiry_date: string
  businesses?: {
    name: string
    email: string
  }
}

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
          monthlyRevenue: 0,
          annualRevenue: 0,
        }
      }

      const [
        businessesResult,
        subscriptionsResult,
        customersResult,
        visitsResult,
        rewardsResult,
        invoicesResult,
      ] = await Promise.all([
        supabase.from('businesses').select('id, is_active'),
        supabase.from('subscriptions').select('id, status'),
        supabase.from('customers').select('id'),
        supabase.from('visits').select('id'),
        supabase.from('rewards').select('id, is_redeemed'),
        supabase.from('invoices').select('amount, status, issue_date'),
      ])

      const businesses = (businessesResult.data || []) as any[]
      const subscriptions = (subscriptionsResult.data || []) as any[]
      const invoices = (invoicesResult.data || []) as any[]

      // Calculate revenue
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      
      const monthlyRevenue = invoices
        .filter(inv => {
          const invDate = new Date(inv.issue_date)
          return invDate.getMonth() === currentMonth && 
                 invDate.getFullYear() === currentYear &&
                 inv.status === 'paid'
        })
        .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0)
      
      const annualRevenue = invoices
        .filter(inv => {
          const invDate = new Date(inv.issue_date)
          return invDate.getFullYear() === currentYear && inv.status === 'paid'
        })
        .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0)

      return {
        totalBusinesses: businesses.length,
        activeBusinesses: businesses.filter((b) => b.is_active).length,
        activeSubscriptions: subscriptions.filter((s) => s.status === 'active').length,
        expiredSubscriptions: subscriptions.filter((s) => s.status === 'expired' || s.status === 'inactive').length,
        totalCustomers: customersResult.data?.length || 0,
        totalVisits: visitsResult.data?.length || 0,
        totalRewardsRedeemed: (rewardsResult.data as any[])?.filter((r) => r.is_redeemed).length || 0,
        monthlyRevenue,
        annualRevenue,
      }
    },
  })

  // Fetch expiring subscriptions (< 30 days)
  const { data: expiringSoon } = useQuery({
    queryKey: ['expiring-subscriptions'],
    queryFn: async () => {
      if (isDemoMode()) return []
      
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          businesses (
            name,
            email
          )
        `)
        .eq('status', 'active')
        .lte('expiry_date', thirtyDaysFromNow.toISOString())
        .order('expiry_date', { ascending: true })
      
      if (error) throw error
      return data || []
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
                {stats?.monthlyRevenue?.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Paid invoices this month</p>
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
                {stats?.annualRevenue?.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Paid invoices this year</p>
            </div>
            <div className="p-3 bg-teal-100 dark:bg-teal-900 rounded-lg">
              <TrendingUp className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Expiring Subscriptions Warning */}
      {expiringSoon && expiringSoon.length > 0 && (
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <XCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  ⚠️ Expiring Soon ({expiringSoon.length})
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Businesses with subscriptions expiring in next 30 days
                </p>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                      Business
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                      Plan
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                      Expires
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                      Days Left
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expiringSoon.map((sub: Subscription) => {
                    const daysLeft = Math.ceil((new Date(sub.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    return (
                      <tr key={sub.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {sub.businesses?.name || 'Unknown'}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {sub.businesses?.email}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {sub.plan_name || 'Standard'}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {new Date(sub.expiry_date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                            daysLeft <= 7
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : daysLeft <= 14
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            {daysLeft} days
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

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
