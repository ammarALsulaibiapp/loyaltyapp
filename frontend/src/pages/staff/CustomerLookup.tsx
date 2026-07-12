import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { isDemoMode } from '../../lib/mockData'
import { useTranslation } from 'react-i18next'
import { formatCurrency, getCurrencySymbol } from '../../lib/currencies'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import { Search, Plus, Gift, UserPlus } from 'lucide-react'

export default function CustomerLookup() {
  const { profile } = useAuthStore()
  const queryClient = useQueryClient()
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false)
  const [visitData, setVisitData] = useState({
    amount_spent: '',
    loyalty_program_id: '',
  })
  const [isQuickRegisterOpen, setIsQuickRegisterOpen] = useState(false)
  const [quickRegData, setQuickRegData] = useState({
    full_name: '',
    phone_number: '',
  })

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchQuery])

  // Fetch business data to get logo
  const { data: business } = useQuery({
    queryKey: ['business', profile?.business_id],
    queryFn: async () => {
      if (!profile?.business_id) return null
      if (isDemoMode()) return null

      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', profile.business_id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!profile?.business_id,
  })
  // Fetch ALL customers with search filter
  const { data: customers, isLoading } = useQuery({
    queryKey: ['all-customers', profile?.business_id, debouncedSearchQuery],
    queryFn: async () => {
      if (!profile?.business_id) return []
      if (isDemoMode()) return []

      let query = supabase
        .from('customers')
        .select('*')
        .eq('business_id', profile.business_id)
        .order('created_at', { ascending: false })

      if (debouncedSearchQuery) {
        query = query.or(`phone_number.ilike.%${debouncedSearchQuery}%,full_name.ilike.%${debouncedSearchQuery}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return data
    },
    enabled: !!profile?.business_id,
  })

  // Fetch loyalty programs with visit counts for selected customer
  // Only shows programs assigned to this customer
  const { data: programs } = useQuery<any[]>({
    queryKey: ['programs-with-counts', profile?.business_id, selectedCustomer?.id],
    queryFn: async () => {
      if (!profile?.business_id || !selectedCustomer?.id) return []

      if (isDemoMode()) return []

      // First, check if customer has any program assignments
      const { data: assignments } = await supabase
        .from('customer_program_assignments')
        .select('loyalty_program_id')
        .eq('customer_id', selectedCustomer.id)
        .eq('is_active', true)

      // Get programs - either assigned ones or all active programs if no assignments
      let query = supabase
        .from('loyalty_programs')
        .select('*')
        .eq('business_id', profile.business_id)
        .eq('is_active', true)

      // If customer has specific assignments, only show those
      if (assignments && (assignments as any).length > 0) {
        const programIds = (assignments as any[]).map(a => a.loyalty_program_id)
        query = query.in('id', programIds)
      }

      const { data: progs } = await query

      if (!progs) return []
      // Get progress for each program
      const withCounts = await Promise.all(
        (progs as any[]).map(async (prog: any) => {
          // Use total_visits from customer record instead of customer_program_progress
          const progress = { visit_count: selectedCustomer.total_visits || 0, total_rewards_earned: 0 }

          if (!progress) {
            const { count } = await supabase
              .from('visits')
              .select('*', { count: 'exact', head: true })
              .eq('customer_id', selectedCustomer.id)
              .eq('loyalty_program_id', prog.id)

            return { 
              ...prog, 
              visits_count: count || 0,
              total_rewards_earned: 0
            }
          }

          return { 
            ...prog, 
            visits_count: (progress as any).visit_count || 0,
            total_rewards_earned: (progress as any).total_rewards_earned || 0
          }
        })
      )

      return withCounts
    },
    enabled: !!selectedCustomer && !!profile?.business_id,
  })

  // Fetch rewards for selected customer
  const { data: rewards } = useQuery<any[]>({
    queryKey: ['customer-rewards', selectedCustomer?.id],
    queryFn: async () => {
      if (!selectedCustomer?.id) return []
      if (isDemoMode()) return []

      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('customer_id', selectedCustomer.id)
        .eq('is_redeemed', false)

      if (error) throw error
      return data
    },
    enabled: !!selectedCustomer,
  })
  // Fetch redemption history for selected customer
  const { data: redemptionHistory } = useQuery<any[]>({
    queryKey: ['customer-redemptions', selectedCustomer?.id],
    queryFn: async () => {
      if (!selectedCustomer?.id) return []
      if (isDemoMode()) return []

      const { data, error } = await supabase
        .from('reward_redemptions')
        .select(`
          *,
          rewards (
            reward_name,
            reward_description
          ),
          profiles (
            full_name
          )
        `)
        .eq('customer_id', selectedCustomer.id)
        .order('redemption_date', { ascending: false })
        .limit(5)

      if (error) throw error
      return data
    },
    enabled: !!selectedCustomer,
  })

  // Add visit mutation
  const addVisitMutation = useMutation({
    mutationFn: async (data: typeof visitData) => {
      if (!profile?.business_id || !selectedCustomer) throw new Error('Missing data')
      if (isDemoMode()) return { success: true }

      // Calculate points using the program's points_per_currency multiplier
      const amountSpent = parseFloat(data.amount_spent) || 0
      let pointsEarned = amountSpent
      if (data.loyalty_program_id && programs) {
        const selectedProgram = programs.find((p: any) => p.id === data.loyalty_program_id)
        if (selectedProgram?.points_per_currency) {
          pointsEarned = amountSpent * selectedProgram.points_per_currency
        }
      }

      const { error } = await (supabase.from('visits') as any).insert({
        business_id: profile.business_id,
        customer_id: selectedCustomer.id,
        staff_id: profile.id,
        loyalty_program_id: data.loyalty_program_id || null,
        amount_spent: amountSpent,
        points_earned: pointsEarned,
      })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-customers'] })
      queryClient.invalidateQueries({ queryKey: ['programs-with-counts'] })
      queryClient.invalidateQueries({ queryKey: ['customer-rewards'] })
      setIsVisitModalOpen(false)
      setVisitData({ amount_spent: '', loyalty_program_id: '' })
      alert(t('lookup.visitAdded'))
    },
  })
  // Redeem reward
  const redeemMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      if (!profile?.business_id || !selectedCustomer) throw new Error('Missing data')

      const { error } = await (supabase.from('reward_redemptions') as any).insert({
        business_id: profile.business_id,
        customer_id: selectedCustomer.id,
        reward_id: rewardId,
        staff_id: profile.id,
      })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-rewards'] })
      queryClient.invalidateQueries({ queryKey: ['programs-with-counts'] })
      queryClient.invalidateQueries({ queryKey: ['all-customers'] })
      alert(t('lookup.rewardRedeemed'))
    },
  })

  const handleAddVisit = (e: React.FormEvent) => {
    e.preventDefault()
    addVisitMutation.mutate(visitData)
  }

  // Quick register mutation
  const quickRegisterMutation = useMutation({
    mutationFn: async (data: typeof quickRegData) => {
      if (!profile?.business_id) throw new Error('Missing business')
      if (isDemoMode()) return { success: true }

      const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert({
          business_id: profile.business_id,
          full_name: data.full_name || null,
          phone_number: data.phone_number,
        } as any)
        .select()
        .single()

      if (error) throw error
      return newCustomer
    },
    onSuccess: (newCustomer) => {
      queryClient.invalidateQueries({ queryKey: ['all-customers'] })
      setIsQuickRegisterOpen(false)
      setQuickRegData({ full_name: '', phone_number: '' })
      if (newCustomer && typeof newCustomer === 'object' && 'id' in newCustomer) {
        setSelectedCustomer(newCustomer)
      }
      alert(t('lookup.customerRegistered', 'Customer registered successfully!'))
    },
  })

  const handleQuickRegister = (e: React.FormEvent) => {
    e.preventDefault()
    quickRegisterMutation.mutate(quickRegData)
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('lookup.title')}</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {customers?.length || 0} {t('dashboard.allCustomers')}
        </div>
      </div>

      {/* Search */}
      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={t('lookup.enterPhone')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </Card>

      {/* All Customers as Cards */}
      {!selectedCustomer && customers && customers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((customer: any) => (
            <Card 
              key={customer.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedCustomer(customer)}
            >
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    {customer.full_name || t('lookup.guest')}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    customer.membership_tier === 'vip' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                    customer.membership_tier === 'gold' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    customer.membership_tier === 'silver' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
                    'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                  }`}>
                    {customer.membership_tier.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">📱 {customer.phone_number}</p>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('lookup.totalVisits')}</p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{customer.total_visits}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('lookup.totalPoints')}</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">{customer.total_points}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('lookup.totalSpent')}</p>
                    <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {(business as any)?.currency ? formatCurrency(customer.total_spent, (business as any).currency, isArabic) : `$${customer.total_spent.toFixed(0)}`}
                    </p>
                  </div>
                </div>
                <Button size="sm" className="w-full mt-2">
                  {t('customers.viewDetails')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* No customers found */}
      {!selectedCustomer && customers && customers.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{t('dashboard.noCustomers')}</p>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery ? `${t('lookup.noCustomerWithPhone')} "${searchQuery}"` : t('dashboard.noCustomers')}
            </p>
            {searchQuery && (
              <Button
                icon={<UserPlus className="w-4 h-4" />}
                onClick={() => {
                  setQuickRegData({ ...quickRegData, phone_number: searchQuery })
                  setIsQuickRegisterOpen(true)
                }}
              >
                {t('lookup.quickRegister', 'Quick Register')}
              </Button>
            )}
          </div>
        </Card>
      )}
      {/* Selected Customer Details */}
      {selectedCustomer && (
        <>
          {/* Back Button */}
          <Button 
            variant="outline" 
            onClick={() => setSelectedCustomer(null)}
            className="mb-4"
          >
            ← {t('common.close')}
          </Button>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('lookup.totalVisits')}</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{selectedCustomer.total_visits}</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('lookup.totalPoints')}</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{selectedCustomer.total_points}</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('lookup.totalSpent')}</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {(business as any)?.currency ? formatCurrency(selectedCustomer.total_spent, (business as any).currency, isArabic) : `$${selectedCustomer.total_spent.toFixed(2)}`}
                </p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('lookup.name')}</p>
                <p className="text-xl font-bold dark:text-white">{selectedCustomer.full_name || t('lookup.guest')}</p>
              </div>
            </Card>
          </div>

          {/* Add Visit Button */}
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setIsVisitModalOpen(true)}>
            {t('lookup.addVisit')}
          </Button>

          {/* STAMP CARDS */}
          {programs && programs.map((program: any) => {
            const completed = program.visits_count || 0
            const required = program.required_stamps || program.visits_required || 8
            const remaining = Math.max(0, required - completed)
            const stamps = Array.from({ length: required }, (_, i) => i < completed)
            const isComplete = remaining === 0

            return (
              <Card key={program.id}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{program.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{program.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('lookup.progress')}</p>
                      <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        {completed}/{required}
                      </p>
                    </div>
                  </div>
                  {/* Stamps Grid */}
                  <div className="grid grid-cols-4 gap-3 mb-6">
                    {stamps.map((filled, idx) => {
                      const isLastStamp = idx === required - 1
                      
                      return (
                        <div
                          key={idx}
                          className="flex flex-col items-center transform hover:scale-105 transition-all duration-300"
                        >
                          {filled ? (
                            (business as any)?.logo_url ? (
                              <div className="relative">
                                <div className="w-16 h-16 bg-white shadow-md rounded-xl p-2 border-2 border-primary-100 dark:border-primary-900/30 flex items-center justify-center">
                                  <img
                                    src={(business as any).logo_url}
                                    alt="stamp"
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                                {isLastStamp && isComplete && (
                                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg rounded-xl flex items-center justify-center">
                                <Gift className="w-8 h-8 text-white" />
                              </div>
                            )
                          ) : (
                            <div className="w-16 h-16 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center">
                              {(business as any)?.logo_url ? (
                                <img
                                  src={(business as any).logo_url}
                                  alt="empty"
                                  className="w-3/4 h-3/4 object-contain opacity-20 grayscale"
                                />
                              ) : (
                                <Gift className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Program Stats */}
                  <div className="bg-gray-50 dark:bg-gray-900/30 p-4 rounded-xl">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-1">
                          {remaining > 0 ? t('lookup.remaining') : t('lookup.completed')}
                        </p>
                        <p className="text-3xl font-black text-gray-900 dark:text-white">
                          {remaining > 0 ? remaining : '✓'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                          {t('lookup.totalEarned')}
                        </p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {program.total_rewards_earned || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
          {/* Available Rewards */}
          {rewards && rewards.length > 0 && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-yellow-600" />
                  {t('lookup.availableRewards')} ({rewards.length})
                </h3>
                <div className="space-y-4">
                  {rewards.map((reward: any) => (
                    <div
                      key={reward.id}
                      className="group p-5 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 border-2 border-yellow-200/50 dark:border-yellow-700/50 rounded-2xl shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                          <Gift className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">{reward.reward_name}</p>
                          {reward.reward_description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {reward.reward_description}
                            </p>
                          )}
                          <div className="mt-3 flex items-center gap-2">
                            <div className="inline-block px-3 py-1 bg-yellow-100 dark:bg-yellow-900/50 rounded-full">
                              <p className="text-xs text-yellow-800 dark:text-yellow-300 font-bold uppercase tracking-wider">
                                ✨ {t('lookup.readyToRedeem')}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => redeemMutation.mutate(reward.id)}
                              disabled={redeemMutation.isPending}
                              className="bg-green-600 text-white"
                            >
                              {redeemMutation.isPending ? t('common.loading') : t('lookup.redeem')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Redemption History */}
          {redemptionHistory && redemptionHistory.length > 0 && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  {t('lookup.redemptionHistory')}
                </h3>
                <div className="space-y-3">
                  {redemptionHistory.map((redemption: any) => (
                    <div key={redemption.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {redemption.rewards?.reward_name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t('lookup.redeemedBy')} {redemption.profiles?.full_name}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(redemption.redemption_date).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </>
      )}
      {/* Add Visit Modal */}
      <Modal isOpen={isVisitModalOpen} onClose={() => setIsVisitModalOpen(false)} title={t('lookup.addVisit')}>
        <form onSubmit={handleAddVisit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {programs?.map((program: any) => {
              const selectedProgram = programs?.find((p: any) => p.id === visitData.loyalty_program_id)
              const isSpendRequired = !selectedProgram || (selectedProgram.type !== 'stamp_card' && selectedProgram.type !== 'visit_based')
              return (
                <Input
                  label={t('lookup.amountSpent')}
                  type="number"
                  step="0.01"
                  value={visitData.amount_spent}
                  onChange={(e) => setVisitData({ ...visitData, amount_spent: e.target.value })}
                  placeholder="0.00"
                  required={isSpendRequired}
                />
              )
            })}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('lookup.loyaltyProgram')}
              </label>
              <select
                value={visitData.loyalty_program_id}
                onChange={(e) => setVisitData({ ...visitData, loyalty_program_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">{t('lookup.selectProgram')}</option>
                {programs?.map((program: any) => (
                  <option key={program.id} value={program.id}>
                    {program.name} ({program.type})
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsVisitModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={addVisitMutation.isPending}>
              {addVisitMutation.isPending ? t('common.loading') : t('lookup.addVisit')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Quick Register Modal */}
      <Modal isOpen={isQuickRegisterOpen} onClose={() => setIsQuickRegisterOpen(false)} title={t('lookup.quickRegister')}>
        <form onSubmit={handleQuickRegister} className="space-y-4">
          <Input
            label={t('lookup.fullName')}
            value={quickRegData.full_name}
            onChange={(e) => setQuickRegData({ ...quickRegData, full_name: e.target.value })}
            placeholder={t('lookup.optional')}
          />
          <Input
            label={t('lookup.phoneNumber')}
            type="tel"
            value={quickRegData.phone_number}
            onChange={(e) => setQuickRegData({ ...quickRegData, phone_number: e.target.value })}
            placeholder="+968 9123 4567"
            required
          />
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsQuickRegisterOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={quickRegisterMutation.isPending}>
              {quickRegisterMutation.isPending ? t('common.loading') : t('lookup.register')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}