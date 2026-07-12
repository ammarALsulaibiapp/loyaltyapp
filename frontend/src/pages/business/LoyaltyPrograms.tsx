import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { isDemoMode, mockLoyaltyPrograms, mockBusinesses } from '../../lib/mockData'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import { Plus, Edit, Trash2, Coffee, Star, DollarSign, Award, Building2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function LoyaltyProgramsPage() {
  const { t } = useTranslation()
  const { profile } = useAuthStore()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [businesses, setBusinesses] = useState<any[]>([])
  
  const isSuperAdmin = profile?.role === 'super_admin'
  const businessId = isSuperAdmin ? selectedBusinessId : profile?.business_id
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'stamp_card' as 'visit_based' | 'points_based' | 'stamp_card' | 'cashback',
    required_visits: 5,
    points_per_currency: 1,
    points_for_reward: 100,
    required_stamps: 5,
    cashback_percentage: 5,
    reward_name: '',
    reward_description: '',
    reward_value: 0,
  })

  const { data: programs, isLoading } = useQuery({
    queryKey: ['loyalty-programs', businessId],
    enabled: isSuperAdmin ? !!businessId : !!profile?.business_id,
    queryFn: async () => {
      if (!businessId) return []

      if (isDemoMode()) {
        return mockLoyaltyPrograms.filter(p => p.business_id === businessId)
      }

      const { data, error } = await supabase
        .from('loyalty_programs')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  })
  
  // Load businesses for super admin
  useQuery({
    queryKey: ['businesses'],
    enabled: isSuperAdmin,
    queryFn: async () => {
      if (isDemoMode()) {
        setBusinesses(mockBusinesses)
        return mockBusinesses
      }
      
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name')
      
      if (error) throw error
      setBusinesses(data || [])
      return data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!businessId) throw new Error('No business selected')

      // Create the loyalty program
      const { error } = await supabase
        .from('loyalty_programs')
        .insert({
          ...data,
          business_id: businessId,
          is_active: true,
        } as any)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-programs'] })
      setIsModalOpen(false)
      resetForm()
    },
  })

  // Toggle program active/inactive
  const toggleProgramMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      if (isDemoMode()) return { success: true }

      const { error } = await (supabase
        .from('loyalty_programs') as any)
        .update({ is_active: !is_active })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-programs'] })
    },
  })

  // Delete program
  const deleteProgramMutation = useMutation({
    mutationFn: async (programId: string) => {
      if (isDemoMode()) return { success: true }

      const { error } = await supabase
        .from('loyalty_programs')
        .delete()
        .eq('id', programId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-programs'] })
      alert(t('loyalty.alertDeleted'))
    },
    onError: (error: any) => {
      alert(`${t('loyalty.alertDeleteError')}: ${error.message}`)
    },
  })

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'stamp_card',
      required_visits: 5,
      points_per_currency: 1,
      points_for_reward: 100,
      required_stamps: 5,
      cashback_percentage: 5,
      reward_name: '',
      reward_description: '',
      reward_value: 0,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('loyalty.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('loyalty.manageLoyalty')}
          </p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)} disabled={isSuperAdmin && !businessId}>
          {t('loyalty.createProgram')}
        </Button>
      </div>

      {/* Super Admin: Business Selector */}
      {isSuperAdmin && (
        <Card>
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('loyalty.selectBusiness')}
            </label>
            <select
              value={selectedBusinessId}
              onChange={(e) => setSelectedBusinessId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="">-- {t('common.select')} --</option>
              {businesses.map((biz) => (
                <option key={biz.id} value={biz.id}>
                  {biz.name}
                </option>
              ))}
            </select>
          </div>
        </Card>
      )}

      {!businessId && isSuperAdmin ? (
        <Card>
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t('common.selectBusiness')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('loyalty.selectBusiness')}
            </p>
          </div>
        </Card>
      ) : programs && (programs as any).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(programs as any[]).map((program) => (
            <Card key={program.id}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                    {program.type === 'stamp_card' || program.type === 'visit_based' ? (
                      <Coffee className="w-6 h-6 text-white" />
                    ) : program.type === 'points_based' ? (
                      <Star className="w-6 h-6 text-white" />
                    ) : program.type === 'cashback' ? (
                      <DollarSign className="w-6 h-6 text-white" />
                    ) : (
                      <Award className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {program.name}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {t('loyalty.' + program.type)}
                    </span>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    program.is_active
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}
                >
                  {program.is_active ? t('loyalty.active', 'Active') : t('loyalty.inactive', 'Inactive')}
                </span>
              </div>

              {program.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {program.description}
                </p>
              )}

              <div className="space-y-2 mb-4">
                {program.type === 'stamp_card' && (
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('loyalty.requiredStamps', 'Required Stamps:')} </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {program.required_stamps}
                    </span>
                  </div>
                )}
                {program.type === 'visit_based' && (
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('loyalty.requiredVisits', 'Required Visits:')} </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {program.required_visits}
                    </span>
                  </div>
                )}
                {program.type === 'points_based' && (
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('loyalty.pointsExp', 'Points Needed:')} </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {program.points_for_reward}
                    </span>
                  </div>
                )}
                {program.type === 'cashback' && (
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('loyalty.cashback', 'Cashback:')} </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {program.cashback_percentage}%
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('rewards.reward', 'Reward')}:</p>
                <p className="font-semibold text-primary-600 dark:text-primary-400">
                  {program.reward_name}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => toggleProgramMutation.mutate({ id: program.id, is_active: program.is_active })}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg ${
                    program.is_active
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300'
                      : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300'
                  }`}
                  disabled={toggleProgramMutation.isPending}
                >
                  {program.is_active ? t('loyalty.deactivate', 'Deactivate') : t('loyalty.activate', 'Activate')}
                </button>
                <button
                  onClick={() => {
                    if (confirm(t('loyalty.confirmDelete', { name: program.name }))) {
                      deleteProgramMutation.mutate(program.id)
                    }
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  title="Delete Program"
                  disabled={deleteProgramMutation.isPending}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t('loyalty.noPrograms')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('loyalty.createFirst')}
            </p>
            <Button onClick={() => setIsModalOpen(true)}>{t('loyalty.createProgram')}</Button>
          </div>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('loyalty.createProgram')}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('loyalty.programName')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={t('loyalty.programName')}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('loyalty.description')} ({t('loyalty.optional')})
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              rows={3}
              placeholder={t('loyalty.description')}
            />
          </div>

          <Select
            label={t('loyalty.programType')}
            value={formData.type}
            onChange={(e) =>
              setFormData({
                ...formData,
                type: e.target.value as typeof formData.type,
              })
            }
            required
          >
            <option value="stamp_card">{t('loyalty.stampCard')} ({t('loyalty.collectStamps')})</option>
            <option value="visit_based">{t('loyalty.visitBased')}</option>
            <option value="points_based">{t('loyalty.pointsBased')} ({t('loyalty.earnPointsPerSpend')})</option>
            <option value="cashback">{t('loyalty.cashback')}</option>
          </Select>

          {/* Conditional Fields Based on Type */}
          {formData.type === 'stamp_card' && (
            <Input
              label={t('loyalty.requiredStamps')}
              type="number"
              value={formData.required_stamps}
              onChange={(e) =>
                setFormData({ ...formData, required_stamps: parseInt(e.target.value) })
              }
              min={1}
              required
            />
          )}

          {formData.type === 'visit_based' && (
            <Input
              label={t('loyalty.requiredVisits')}
              type="number"
              value={formData.required_visits}
              onChange={(e) =>
                setFormData({ ...formData, required_visits: parseInt(e.target.value) })
              }
              min={1}
              required
            />
          )}

          {formData.type === 'points_based' && (
            <>
              <Input
                label={t('loyalty.pointsPerCurrency')}
                type="number"
                step="0.1"
                value={formData.points_per_currency}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    points_per_currency: parseFloat(e.target.value),
                  })
                }
                min={0}
                required
              />
              <Input
                label={t('loyalty.pointsForReward')}
                type="number"
                value={formData.points_for_reward}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    points_for_reward: parseInt(e.target.value),
                  })
                }
                min={1}
                required
              />
            </>
          )}

          {formData.type === 'cashback' && (
            <Input
              label={t('loyalty.cashbackPercentage')}
              type="number"
              step="0.1"
              value={formData.cashback_percentage}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  cashback_percentage: parseFloat(e.target.value),
                })
              }
              min={0}
              max={100}
              required
            />
          )}

          <Input
            label={t('loyalty.rewardName')}
            value={formData.reward_name}
            onChange={(e) => setFormData({ ...formData, reward_name: e.target.value })}
            placeholder={t('loyalty.rewardName')}
            required
          />

          <Input
            label={t('loyalty.rewardDescription') + ' (' + t('loyalty.optional') + ')'}
            value={formData.reward_description}
            onChange={(e) =>
              setFormData({ ...formData, reward_description: e.target.value })
            }
            placeholder={t('loyalty.rewardDescription')}
          />

          <Input
            label={t('loyalty.rewardValue') + ' (' + t('loyalty.optional') + ')'}
            type="number"
            step="0.01"
            value={formData.reward_value}
            onChange={(e) =>
              setFormData({ ...formData, reward_value: parseFloat(e.target.value) })
            }
            placeholder="0.00"
          />

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              {t('loyalty.createProgram')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
