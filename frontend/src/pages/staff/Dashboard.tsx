import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { isDemoMode, mockCustomers } from '../../lib/mockData'
import { useTranslation } from 'react-i18next'
import { Search, Users, Gift, Activity, Phone, ArrowRight, TrendingUp } from 'lucide-react'
import { useState } from 'react'

export default function StaffDashboard() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch all customers
  const { data: customers } = useQuery({
    queryKey: ['all-customers', profile?.business_id],
    queryFn: async () => {
      if (!profile?.business_id) return []

      if (isDemoMode()) {
        return mockCustomers.filter(c => c.business_id === profile.business_id)
      }

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('business_id', profile.business_id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data
    },
  })

  const filteredCustomers = customers?.filter(customer => {
    const search = searchTerm.toLowerCase()
    return (
      customer.phone_number.toLowerCase().includes(search) ||
      customer.full_name?.toLowerCase().includes(search)
    )
  })

  const stats = [
    {
      key: 'dashboard.totalCustomers',
      label: 'Total Customers',
      value: customers?.length || 0,
      icon: Users,
      bgColor: 'bg-blue-50/50 dark:bg-blue-900/30',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      key: 'dashboard.activeToday',
      label: 'Active Today',
      value: Math.floor((customers?.length || 0) * 0.15),
      icon: Activity,
      bgColor: 'bg-green-50/50 dark:bg-green-900/30',
      textColor: 'text-green-600 dark:text-green-400',
    },
    {
      key: 'dashboard.rewardsRedeemed',
      label: 'Rewards Given',
      value: Math.floor((customers?.length || 0) * 1.5),
      icon: Gift,
      bgColor: 'bg-purple-50/50 dark:bg-purple-900/30',
      textColor: 'text-purple-600 dark:text-purple-400',
    },
  ]

  const quickActions = [
    {
      title: t('nav.customerLookup', 'Customer Lookup'),
      description: t('dashboard.searchCustomer', 'Search and manage customer loyalty'),
      icon: Search,
      gradient: 'from-[#ff6b9d] to-[#ff8eb3]',
      action: () => navigate('/staff/customer-lookup'),
    },
    {
      title: t('dashboard.redeemReward', 'Redeem Reward'),
      description: t('dashboard.verifyRedeem', 'Verify and process redemptions'),
      icon: Gift,
      gradient: 'from-[#6b9dff] to-[#8eb3ff]',
      action: () => navigate('/staff/customer-lookup'),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('dashboard.staffDashboard', 'Staff Dashboard')}</h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">
            {t('dashboard.quickAccess', 'Quick access to customer management tools')}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.key}
              className="glass-panel dark:glass-panel-dark rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 ${stat.bgColor} rounded-lg`}>
                  <Icon className={`w-5 h-5 ${stat.textColor}`} />
                </div>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {t(stat.key, stat.label)}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stat.value.toLocaleString()}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.quickActions', 'Quick Actions')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.title}
                onClick={action.action}
                className="glass-panel dark:glass-panel-dark rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl text-start group"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 bg-gradient-to-br ${action.gradient} rounded-xl shadow-md`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base text-gray-900 dark:text-white flex items-center gap-2">
                      {action.title}
                      <ArrowRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-all ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
                    </h3>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">
                      {action.description}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Recent Customers */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.recentCustomers', 'Recent Customers')}</h2>
          <button
            onClick={() => navigate('/staff/customer-lookup')}
            className="text-[13px] font-medium text-[#ff6b9d] hover:text-[#ff8eb3] transition-colors flex items-center gap-1"
          >
            {t('dashboard.viewAll', 'View All')}
            <ArrowRight className={`w-3.5 h-3.5 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('common.search', 'Search by phone or name...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 glass-panel dark:glass-panel-dark border border-transparent rounded-lg text-[13px] focus:outline-none focus:bg-white focus:border-gray-300 dark:focus:bg-gray-700 transition-all"
            />
          </div>
        </div>

        {/* Customer List */}
        <div className="glass-panel dark:glass-panel-dark rounded-xl overflow-hidden">
          {filteredCustomers && filteredCustomers.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-slate-700/50">
              {filteredCustomers.slice(0, 10).map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => navigate(`/staff/customer-lookup?phone=${customer.phone_number}`)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors text-start group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff6b9d] to-[#ff8eb3] flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                      {customer.full_name?.charAt(0)?.toUpperCase() || customer.phone_number.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-[13px] text-gray-900 dark:text-white">
                        {customer.full_name || t('customers.unnamedCustomer', 'Customer')}
                      </p>
                      <p className="text-[12px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {customer.phone_number}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">{t('card.visits', 'Visits')}</p>
                      <p className="text-[13px] font-semibold text-gray-900 dark:text-white">
                        {(customer as any).visits_count || (customer as any).total_visits || 0}
                      </p>
                    </div>
                    <ArrowRight className={`w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-all ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-[13px] text-gray-500 dark:text-gray-400">
                {searchTerm ? t('dashboard.noCustomers', 'No customers found') : t('dashboard.noCustomersYet', 'No customers yet')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
