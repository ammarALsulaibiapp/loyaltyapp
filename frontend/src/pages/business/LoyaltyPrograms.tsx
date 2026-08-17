import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { backendAPI } from '../../lib/api'
import { useAuthStore } from '../../stores/authStore'
import { isDemoMode, mockLoyaltyPrograms, mockBusinesses } from '../../lib/mockData'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import {
  Plus,
  Trash2,
  Coffee,
  Star,
  DollarSign,
  Award,
  Building2,
  Sparkles,
  CheckCircle2,
  XCircle,
  Search,
  Gift,
  Layers,
  Percent,
  Check,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

type ProgramType = 'stamp_card' | 'visit_based' | 'points_based' | 'cashback'

export default function LoyaltyProgramsPage() {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'
  const { profile } = useAuthStore()
  const queryClient = useQueryClient()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [businesses, setBusinesses] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const isSuperAdmin = profile?.role === 'super_admin'
  const businessId = isSuperAdmin ? selectedBusinessId : profile?.business_id

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'stamp_card' as ProgramType,
    required_visits: 5,
    points_per_currency: 1,
    points_for_reward: 100,
    required_stamps: 5,
    cashback_percentage: 5,
    reward_name: '',
    reward_description: '',
    reward_value: 0,
  })

  // Fetch Loyalty Programs
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
      return data || []
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
      alert(t('loyalty.alertDeleted', 'Program deleted successfully!'))
    },
    onError: (error: any) => {
      alert(`${t('loyalty.alertDeleteError', 'Delete error')}: ${error.message}`)
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async (programIds: string[]) => {
      if (isDemoMode()) return { success: true }
      const result = await backendAPI.bulkDeleteLoyaltyPrograms(programIds)
      if (!result || !result.success) throw new Error('Delete operation failed')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-programs'] })
      setSelectedIds([])
      alert(`✅ ${selectedIds.length} program(s) deleted permanently!`)
    },
    onError: (error: any) => {
      alert(`❌ Error: ${error.message}`)
    },
  })

  const handleSelectAll = () => {
    if (selectedIds.length === filteredPrograms.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredPrograms.map(p => p.id))
    }
  }

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return
    if (confirm(`⚠️ Delete ${selectedIds.length} program(s) permanently?\n\nThis action CANNOT be undone!`)) {
      bulkDeleteMutation.mutate(selectedIds)
    }
  }

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

  // Filter Programs
  const filteredPrograms = useMemo(() => {
    if (!programs) return []
    return (programs as any[]).filter(p => {
      const matchesTab = activeTab === 'all' || p.type === activeTab
      const matchesSearch = !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.reward_name && p.reward_name.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesTab && matchesSearch
    })
  }, [programs, activeTab, searchQuery])

  // Get Styling Config per Program Type
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'stamp_card':
        return {
          icon: Coffee,
          gradient: 'from-amber-500 via-orange-500 to-yellow-500',
          badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
          borderHover: 'hover:border-amber-500/50',
          glow: 'shadow-amber-500/10',
          label: isArabic ? 'بطاقة الأختام' : 'Stamp Card',
        }
      case 'points_based':
        return {
          icon: Star,
          gradient: 'from-blue-500 via-indigo-500 to-cyan-500',
          badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
          borderHover: 'hover:border-blue-500/50',
          glow: 'shadow-blue-500/10',
          label: isArabic ? 'برنامج النقاط' : 'Points Based',
        }
      case 'visit_based':
        return {
          icon: Award,
          gradient: 'from-purple-500 via-pink-500 to-rose-500',
          badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
          borderHover: 'hover:border-purple-500/50',
          glow: 'shadow-purple-500/10',
          label: isArabic ? 'زيارات تكرارية' : 'Visit Based',
        }
      case 'cashback':
        return {
          icon: DollarSign,
          gradient: 'from-emerald-500 via-teal-500 to-green-500',
          badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
          borderHover: 'hover:border-emerald-500/50',
          glow: 'shadow-emerald-500/10',
          label: isArabic ? 'استرداد نقدي' : 'Cashback',
        }
      default:
        return {
          icon: Award,
          gradient: 'from-gray-500 to-slate-600',
          badgeBg: 'bg-gray-100 text-gray-800',
          borderHover: 'hover:border-gray-500',
          glow: 'shadow-gray-500/10',
          label: type,
        }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <Sparkles className="w-8 h-8 text-amber-500" />
            {t('loyalty.title', 'Loyalty Programs')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('loyalty.manageLoyalty', 'Design and manage custom loyalty cards for your business')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <Button
              variant="outline"
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              className="!bg-red-50 !text-red-600 !border-red-200 hover:!bg-red-100"
            >
              <Trash2 className="w-4 h-4" />
              {t('common.delete', 'Delete')} ({selectedIds.length})
            </Button>
          )}
          <Button
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
            disabled={isSuperAdmin && !businessId}
            className="shadow-lg shadow-blue-500/20"
          >
            {t('loyalty.createProgram', 'Create Program')}
          </Button>
        </div>
      </div>

      {/* Super Admin: Business Selector */}
      {isSuperAdmin && (
        <Card>
          <div className="max-w-md">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('loyalty.selectBusiness', 'Select Business')}
            </label>
            <select
              value={selectedBusinessId}
              onChange={(e) => setSelectedBusinessId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- {t('common.select', 'Select')} --</option>
              {businesses.map((biz) => (
                <option key={biz.id} value={biz.id}>
                  {biz.name}
                </option>
              ))}
            </select>
          </div>
        </Card>
      )}

      {/* Quick Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: isArabic ? 'الكل' : 'All', icon: Layers },
            { id: 'stamp_card', label: isArabic ? 'بطاقة الأختام' : 'Stamp Cards', icon: Coffee },
            { id: 'points_based', label: isArabic ? 'النقاط' : 'Points Based', icon: Star },
            { id: 'visit_based', label: isArabic ? 'الزيارات' : 'Visit Based', icon: Award },
            { id: 'cashback', label: isArabic ? 'استرداد نقدي' : 'Cashback', icon: DollarSign },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder={isArabic ? 'بحث عن برنامج...' : 'Search programs...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Program Cards Grid */}
      {!businessId && isSuperAdmin ? (
        <Card>
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t('common.selectBusiness', 'Please select a business')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('loyalty.selectBusiness', 'Choose a business from the dropdown above to manage its loyalty programs')}
            </p>
          </div>
        </Card>
      ) : filteredPrograms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map((program) => {
            const config = getTypeConfig(program.type)
            const TypeIcon = config.icon
            const isSelected = selectedIds.includes(program.id)

            return (
              <div
                key={program.id}
                className={`relative bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-gray-200/80 dark:border-slate-800 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${config.glow} ${
                  isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''
                }`}
              >
                {/* Top Banner Gradient Bar */}
                <div className={`h-3 bg-gradient-to-r ${config.gradient}`} />

                <div className="p-6 space-y-4">
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectOne(program.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg shadow-black/10 shrink-0`}>
                        <TypeIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-white text-base truncate">
                          {program.name}
                        </h3>
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-extrabold rounded-full ${config.badgeBg} mt-0.5`}>
                          {config.label}
                        </span>
                      </div>
                    </div>

                    {/* Active Status Badge */}
                    <button
                      onClick={() => toggleProgramMutation.mutate({ id: program.id, is_active: program.is_active })}
                      className={`px-3 py-1 text-xs font-bold rounded-full transition-all flex items-center gap-1 ${
                        program.is_active
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 hover:bg-emerald-200'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${program.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                      {program.is_active ? (isArabic ? 'مفعل' : 'Active') : (isArabic ? 'غير مفعل' : 'Inactive')}
                    </button>
                  </div>

                  {/* Description */}
                  {program.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {program.description}
                    </p>
                  )}

                  {/* Visual Preview / Rules Widget */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                    {program.type === 'stamp_card' && (
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-2">
                          <span className="font-medium">{isArabic ? 'معاينة بطاقة الأختام:' : 'Stamp Card Preview:'}</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            {program.required_stamps} {isArabic ? 'أختام' : 'stamps'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {Array.from({ length: Math.min(program.required_stamps || 5, 10) }).map((_, idx) => (
                            <div
                              key={idx}
                              className={`w-7 h-7 rounded-xl border flex items-center justify-center text-xs ${
                                idx === (program.required_stamps || 5) - 1
                                  ? 'border-amber-500 bg-amber-500 text-white font-bold shadow-md'
                                  : 'border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                              }`}
                            >
                              {idx === (program.required_stamps || 5) - 1 ? '🎁' : '☕'}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {program.type === 'points_based' && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">{isArabic ? 'معدل النقاط:' : 'Points Rate:'}</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {program.points_per_currency} {isArabic ? 'نقطة / عملة' : 'pts / spend'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">{isArabic ? 'النقاط المطلوبة للمكافأة:' : 'Points Needed for Reward:'}</span>
                          <span className="font-bold text-gray-900 dark:text-white">
                            {program.points_for_reward} {isArabic ? 'نقطة' : 'pts'}
                          </span>
                        </div>
                      </div>
                    )}

                    {program.type === 'visit_based' && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">{isArabic ? 'الزيارات المطلوبة:' : 'Required Visits:'}</span>
                          <span className="font-bold text-purple-600 dark:text-purple-400">
                            {program.required_visits} {isArabic ? 'زيارات' : 'visits'}
                          </span>
                        </div>
                      </div>
                    )}

                    {program.type === 'cashback' && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">{isArabic ? 'نسبة الاسترداد النقدي:' : 'Cashback Percentage:'}</span>
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                            {program.cashback_percentage}% {isArabic ? 'استرداد' : 'Cashback'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Reward Details Box */}
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase tracking-wide font-bold">{isArabic ? 'المكافأة' : 'Reward'}</p>
                      <p className="font-bold text-blue-600 dark:text-blue-400 text-sm flex items-center gap-1.5 mt-0.5">
                        <Gift className="w-4 h-4 text-pink-500" />
                        {program.reward_name}
                      </p>
                    </div>

                    {program.reward_value > 0 && (
                      <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-extrabold text-xs rounded-xl">
                        {program.reward_value} {isArabic ? 'قيمة' : 'Value'}
                      </span>
                    )}
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <button
                      onClick={() => toggleProgramMutation.mutate({ id: program.id, is_active: program.is_active })}
                      className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                        program.is_active
                          ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300'
                      }`}
                    >
                      {program.is_active ? (isArabic ? 'تعطيل البرنامج' : 'Deactivate') : (isArabic ? 'تفعيل البرنامج' : 'Activate')}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(t('loyalty.confirmDelete', { name: program.name }))) {
                          deleteProgramMutation.mutate(program.id)
                        }
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                      title="Delete Program"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <Card>
          <div className="text-center py-16">
            <Award className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {t('loyalty.noPrograms', 'No loyalty programs yet')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto text-sm">
              {t('loyalty.createFirst', 'Create your first loyalty program to start engaging customers and driving repeat sales')}
            </p>
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
              {t('loyalty.createProgram', 'Create Program')}
            </Button>
          </div>
        </Card>
      )}

      {/* Modern Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('loyalty.createProgram', 'Create Loyalty Program')}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label={t('loyalty.programName', 'Program Name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={isArabic ? 'مثال: بطاقة القهوة المجانية' : 'e.g. Free Coffee Loyalty Card'}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('loyalty.description', 'Description')} ({t('loyalty.optional', 'Optional')})
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder={isArabic ? 'وصف مختصر لشروط البرنامج للعملاء' : 'Short description for customers'}
            />
          </div>

          {/* Visual Program Type Picker */}
          <div>
            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
              {t('loyalty.programType', 'Select Program Type')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'stamp_card', label: isArabic ? 'بطاقة أختام' : 'Stamp Card', icon: Coffee, color: 'border-amber-500 bg-amber-50/50 text-amber-700' },
                { id: 'points_based', label: isArabic ? 'نقاط الشراء' : 'Points Based', icon: Star, color: 'border-blue-500 bg-blue-50/50 text-blue-700' },
                { id: 'visit_based', label: isArabic ? 'زيارات مكررة' : 'Visit Based', icon: Award, color: 'border-purple-500 bg-purple-50/50 text-purple-700' },
                { id: 'cashback', label: isArabic ? 'كاش باك' : 'Cashback', icon: DollarSign, color: 'border-emerald-500 bg-emerald-50/50 text-emerald-700' },
              ].map((tItem) => {
                const isSelected = formData.type === tItem.id
                return (
                  <button
                    key={tItem.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: tItem.id as ProgramType })}
                    className={`p-3 rounded-2xl border-2 text-center transition-all ${
                      isSelected
                        ? `${tItem.color} font-bold shadow-md`
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <span className="text-sm">{tItem.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Conditional Fields Based on Type */}
          {formData.type === 'stamp_card' && (
            <Input
              label={t('loyalty.requiredStamps', 'Required Stamps for Reward')}
              type="number"
              value={formData.required_stamps}
              onChange={(e) =>
                setFormData({ ...formData, required_stamps: parseInt(e.target.value, 10) || 0 })
              }
              min={1}
              required
            />
          )}

          {formData.type === 'visit_based' && (
            <Input
              label={t('loyalty.requiredVisits', 'Required Visits for Reward')}
              type="number"
              value={formData.required_visits}
              onChange={(e) =>
                setFormData({ ...formData, required_visits: parseInt(e.target.value, 10) || 0 })
              }
              min={1}
              required
            />
          )}

          {formData.type === 'points_based' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('loyalty.pointsPerCurrency', 'Points Earned Per Spend')}
                type="number"
                step="0.1"
                value={formData.points_per_currency}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    points_per_currency: parseFloat(e.target.value) || 0,
                  })
                }
                min={0}
                required
              />
              <Input
                label={t('loyalty.pointsForReward', 'Points Required for Reward')}
                type="number"
                value={formData.points_for_reward}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    points_for_reward: parseInt(e.target.value, 10) || 0,
                  })
                }
                min={1}
                required
              />
            </div>
          )}

          {formData.type === 'cashback' && (
            <Input
              label={t('loyalty.cashbackPercentage', 'Cashback Percentage (%)')}
              type="number"
              step="0.1"
              value={formData.cashback_percentage}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  cashback_percentage: parseFloat(e.target.value) || 0,
                })
              }
              min={0}
              max={100}
              required
            />
          )}

          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h4 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
              <Gift className="w-4 h-4 text-pink-500" />
              {isArabic ? 'تفاصيل الجائزة والمكافأة' : 'Reward Details'}
            </h4>

            <Input
              label={t('loyalty.rewardName', 'Reward Name')}
              value={formData.reward_name}
              onChange={(e) => setFormData({ ...formData, reward_name: e.target.value })}
              placeholder={isArabic ? 'مثال: مشروب مجاني أو خصم 20%' : 'e.g. Free Beverage or 20% Off'}
              required
            />

            <Input
              label={t('loyalty.rewardDescription', 'Reward Description') + ' (' + t('loyalty.optional', 'Optional') + ')'}
              value={formData.reward_description}
              onChange={(e) =>
                setFormData({ ...formData, reward_description: e.target.value })
              }
              placeholder={t('loyalty.rewardDescription', 'Optional details about the reward')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              {t('loyalty.createProgram', 'Create Program')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
