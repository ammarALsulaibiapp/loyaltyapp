import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { isDemoMode, mockRewards } from '../../lib/mockData'
import Card from '../../components/ui/Card'
import { Gift, Check, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'

export default function RewardsPage() {
  const { t } = useTranslation()
  const { profile } = useAuthStore()

  const { data: rewards, isLoading } = useQuery({
    queryKey: ['rewards', profile?.business_id],
    queryFn: async () => {
      if (!profile?.business_id) return []

      if (isDemoMode()) {
        return mockRewards.filter(r => r.business_id === profile.business_id)
      }

      const { data, error } = await supabase
        .from('rewards')
        .select(`
          *,
          customers (
            phone_number,
            full_name
          ),
          loyalty_programs (
            name
          )
        `)
        .eq('business_id', profile.business_id)
        .order('earned_date', { ascending: false })

      if (error) throw error
      return data
    },
  })

  const availableRewards = rewards?.filter((r) => !r.is_redeemed) || []
  const redeemedRewards = rewards?.filter((r) => r.is_redeemed) || []

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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('rewards.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t('rewards.trackRewards')}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('rewards.total')}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {rewards?.length || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Gift className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('rewards.available')}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {availableRewards.length}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('rewards.redeemed')}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {redeemedRewards.length}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Available Rewards */}
      <Card title={t('rewards.availableRewards')} subtitle={`${availableRewards.length} ${t('rewards.readyToRedeem')}`}>
        <div className="space-y-3">
          {availableRewards.map((reward) => (
            <div
              key={reward.id}
              className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                  <Gift className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {reward.reward_name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {reward.customers?.full_name || 'Unnamed'} • {reward.customers?.phone_number}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('rewards.earned')} {reward.earned_date && format(new Date(reward.earned_date), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-sm font-medium rounded-full">
                {t('rewards.pending')}
              </span>
            </div>
          ))}
          {availableRewards.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              {t('rewards.noAvailable')}
            </p>
          )}
        </div>
      </Card>

      {/* Redeemed Rewards */}
      <Card title={t('rewards.redeemedRewards')} subtitle={t('rewards.redemptionHistory')}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-start py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {t('rewards.reward')}
                </th>
                <th className="text-start py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {t('customers.customer')}
                </th>
                <th className="text-start py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {t('rewards.program')}
                </th>
                <th className="text-start py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {t('rewards.earned')}
                </th>
                <th className="text-start py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {t('rewards.redeemed')}
                </th>
              </tr>
            </thead>
            <tbody>
              {redeemedRewards.map((reward) => (
                <tr
                  key={reward.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                    {reward.reward_name}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    <div className="text-sm">
                      <div>{reward.customers?.full_name || 'Unnamed'}</div>
                      <div className="text-xs">{reward.customers?.phone_number}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {reward.loyalty_programs?.name || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {reward.earned_date && format(new Date(reward.earned_date), 'MMM dd, yyyy')}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {reward.redeemed_date
                      ? format(new Date(reward.redeemed_date), 'MMM dd, yyyy')
                      : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {redeemedRewards.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              {t('rewards.noRedeemed')}
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}
