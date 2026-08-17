import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { backendAPI } from '../../lib/api'
import { useAuthStore } from '../../stores/authStore'
import { isDemoMode, mockCustomers } from '../../lib/mockData'
import { useTranslation } from 'react-i18next'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import PhoneInput from '../../components/ui/PhoneInput'
import { Plus, Search, QrCode, Eye, Gift, Trash2, Phone, Mail, Calendar, Users, TrendingUp, Award } from 'lucide-react'
import { format } from 'date-fns'

interface Customer {
  id: string
  phone_number: string
  full_name: string | null
  total_visits: number
  total_points: number
  membership_tier: string
  created_at: string
  qr_code: string
}

export default function CustomersPage() {
  const { profile } = useAuthStore()
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [formData, setFormData] = useState({
    phone_number: '',
    full_name: '',
    birthday: '',
    gender: '',
    notes: '',
  })

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchQuery])

  // Fetch customers - only when search query exists
  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', profile?.business_id, debouncedSearchQuery],
    queryFn: async () => {
      if (!profile?.business_id) return []
      
      // Don't fetch anything if no search query
      if (!debouncedSearchQuery || debouncedSearchQuery.length < 2) {
        return []
      }

      if (isDemoMode()) {
        let filtered = mockCustomers.filter(c => c.business_id === profile.business_id)
        
        const query = debouncedSearchQuery.toLowerCase()
        filtered = filtered.filter(c => 
          c.phone_number.toLowerCase().includes(query) ||
          c.full_name?.toLowerCase().includes(query)
        )
        
        return filtered as Customer[]
      }

      let query = supabase
        .from('customers')
        .select('*')
        .eq('business_id', profile.business_id)
        .or(`phone_number.ilike.%${debouncedSearchQuery}%,full_name.ilike.%${debouncedSearchQuery}%`)
        .order('created_at', { ascending: false })
        .limit(50) // Limit results for performance

      const { data, error } = await query
      if (error) throw error
      return data as Customer[]
    },
    enabled: !!profile?.business_id,
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!profile?.business_id) throw new Error('No business ID')

      const { data: newCustomer, error } = await (supabase.from('customers') as any).insert({
        ...data,
        business_id: profile.business_id,
      }).select().single()

      if (error) throw error
      
      if (newCustomer) {
        await (supabase.from('customers') as any)
          .update({ qr_code: (newCustomer as any).id })
          .eq('id', (newCustomer as any).id)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setIsModalOpen(false)
      resetForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (customerId: string) => {
      if (isDemoMode()) return { success: true }
      const { error } = await supabase.from('customers').delete().eq('id', customerId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setSelectedCustomer(null)
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async (customerIds: string[]) => {
      if (isDemoMode()) return { success: true }
      try {
        const result = await backendAPI.bulkDeleteCustomers(customerIds)
        if (!result || !result.success) {
          throw new Error('Delete operation failed')
        }
        return result
      } catch (error: any) {
        throw new Error(error.message || 'Failed to delete customers')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setSelectedIds([])
      alert(`✅ ${selectedIds.length} customer(s) deleted permanently!`)
    },
    onError: (error: any) => {
      alert(`❌ Error: ${error.message}`)
    },
  })

  const handleSelectAll = () => {
    if (customers && selectedIds.length === customers.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(customers?.map((c: Customer) => c.id) || [])
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
    if (confirm(`⚠️ Delete ${selectedIds.length} customer(s) permanently?\n\nThis will remove all their visits, points, and rewards.\n\nThis action CANNOT be undone!`)) {
      bulkDeleteMutation.mutate(selectedIds)
    }
  }

  const resetForm = () => {
    setFormData({
      phone_number: '',
      full_name: '',
      birthday: '',
      gender: '',
      notes: '',
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  const stats = [
    { label: t('dashboard.totalCustomers', 'Total Customers'), value: customers?.length || 0, icon: Users, color: 'blue' },
    { label: t('dashboard.newThisWeek', 'New This Week'), value: Math.floor((customers?.length || 0) * 0.1), icon: TrendingUp, color: 'green' },
    { label: t('dashboard.activeMembers', 'Active Members'), value: Math.floor((customers?.length || 0) * 0.7), icon: Award, color: 'purple' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('nav.customers', 'Customers')}</h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">
            {t('customers.description', 'Manage your customer database and loyalty members')}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-[#ff6b9d] to-[#ff8eb3] text-white px-4 py-2.5 rounded-lg text-[13px] font-semibold hover:shadow-md transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('customers.addNewTitle', 'Add Customer')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 bg-${stat.color}-50 rounded-lg`}>
                  <Icon className={`w-5 h-5 text-${stat.color}-600`} />
                </div>
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder={t('customers.searchPlaceholder') || 'Search by name or phone number...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all shadow-sm placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            )}
          </div>
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              className="px-5 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-red-500/30"
            >
              <Trash2 className="w-4 h-4" />
              {t('common.delete', 'Delete')} ({selectedIds.length})
            </button>
          )}
          <div className="flex items-center gap-1.5 bg-white dark:bg-gray-700 rounded-xl p-1.5 shadow-sm border border-gray-200 dark:border-gray-600">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
            >
              {t('common.grid', 'Grid')}
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${viewMode === 'table' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
            >
              {t('common.table', 'Table')}
            </button>
          </div>
        </div>
        
        {/* Search hint */}
        {searchQuery.length > 0 && searchQuery.length < 2 && (
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5" />
            {t('customers.typeToSearch')}
          </p>
        )}
      </div>

      {/* Customer Grid */}
      {!searchQuery || searchQuery.length < 2 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center mb-4">
            <Search className="w-10 h-10 text-blue-500 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('customers.searchForCustomers')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
            {t('customers.searchTypeHint')}
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('customers.searching')}</p>
        </div>
      ) : !customers || customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mb-4">
            <Users className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('customers.noResultsFound')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
            {t('customers.noMatch', { query: searchQuery })}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {customers?.map((customer) => (
            <div
              key={customer.id}
              className={`bg-white dark:bg-gray-800 rounded-xl p-5 border ${selectedIds.includes(customer.id) ? 'border-[#ff6b9d] ring-2 ring-[#ff6b9d]/20' : 'border-gray-100 dark:border-gray-700'} shadow-sm hover:shadow-md transition-all group`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(customer.id)}
                    onChange={() => handleSelectOne(customer.id)}
                    className="w-4 h-4 rounded border-gray-300 text-[#ff6b9d] focus:ring-[#ff6b9d]"
                  />
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff6b9d] to-[#ff8eb3] flex items-center justify-center text-white font-bold text-base shadow-md">
                    {customer.full_name?.charAt(0)?.toUpperCase() || customer.phone_number.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[14px] text-gray-900 dark:text-white">
                      {customer.full_name || t('customers.unknown')}
                    </h3>
                    <p className="text-[12px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {customer.phone_number}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">{t('card.visits', 'Visits')}</p>
                  <p className="text-[15px] font-bold text-gray-900 dark:text-white">{customer.total_visits || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">{t('card.points', 'Points')}</p>
                  <p className="text-[15px] font-bold text-gray-900 dark:text-white">{customer.total_points || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">{t('customers.tier', 'Tier')}</p>
                  <p className="text-[15px] font-bold text-gray-900 dark:text-white">{customer.membership_tier || 'Bronze'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button 
                  onClick={() => window.open(`/card/${customer.id}`, '_blank')}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-[12px] font-medium transition-all"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {t('common.view', 'View')}
                </button>
                <button 
                  onClick={() => {
                    const qrUrl = `${window.location.origin}/card/${customer.id}`
                    navigator.clipboard.writeText(qrUrl)
                    alert(`Customer QR URL copied: ${qrUrl}`)
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-[12px] font-medium transition-all"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  {t('customers.qr', 'QR')}
                </button>
                <button
                  onClick={() => deleteMutation.mutate(customer.id)}
                  className="px-3 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-5 py-3 text-start text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === customers?.length && customers?.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-[#ff6b9d] focus:ring-[#ff6b9d]"
                    />
                  </th>
                  <th className="px-5 py-3 text-start text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{t('common.customer', 'Customer')}</th>
                  <th className="px-5 py-3 text-start text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{t('common.phone', 'Phone')}</th>
                  <th className="px-5 py-3 text-start text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{t('card.visits', 'Visits')}</th>
                  <th className="px-5 py-3 text-start text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{t('card.points', 'Points')}</th>
                  <th className="px-5 py-3 text-start text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{t('customers.tier', 'Tier')}</th>
                  <th className="px-5 py-3 text-start text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{t('common.joined', 'Joined')}</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{t('common.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {customers?.map((customer) => (
                  <tr key={customer.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${selectedIds.includes(customer.id) ? 'bg-[#ff6b9d]/5' : ''}`}>
                    <td className="px-5 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(customer.id)}
                        onChange={() => handleSelectOne(customer.id)}
                        className="w-4 h-4 rounded border-gray-300 text-[#ff6b9d] focus:ring-[#ff6b9d]"
                      />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ff6b9d] to-[#ff8eb3] flex items-center justify-center text-white font-semibold text-sm">
                          {customer.full_name?.charAt(0)?.toUpperCase() || customer.phone_number.charAt(0)}
                        </div>
                        <span className="font-medium text-[13px] text-gray-900 dark:text-white">
                          {customer.full_name || t('customers.unknown')}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[13px] text-gray-600 dark:text-gray-400">{customer.phone_number}</td>
                    <td className="px-5 py-4 text-[13px] font-semibold text-gray-900 dark:text-white">{customer.total_visits || 0}</td>
                    <td className="px-5 py-4 text-[13px] font-semibold text-gray-900 dark:text-white">{customer.total_points || 0}</td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-md text-[11px] font-semibold">
                        {customer.membership_tier || 'Bronze'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[12px] text-gray-500 dark:text-gray-400">
                      {format(new Date(customer.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => window.open(`/card/${customer.id}`, '_blank')}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-all"
                          title="View customer card"
                        >
                          <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button 
                          onClick={() => {
                            const qrUrl = `${window.location.origin}/card/${customer.id}`
                            navigator.clipboard.writeText(qrUrl)
                            alert(`Customer QR URL copied: ${qrUrl}`)
                          }}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-all"
                          title="Copy customer QR URL"
                        >
                          <QrCode className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(customer.id)}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                          title="Delete customer"
                        >
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          resetForm()
        }}
        title={t('customers.addNewTitle')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <PhoneInput
            label={t('customers.phoneNumber')}
            value={formData.phone_number}
            onChange={(value) => setFormData({ ...formData, phone_number: value })}
            required
          />
          <Input
            label={t('customers.fullName')}
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          />
          <Input
            label={t('customers.birthday')}
            type="date"
            value={formData.birthday}
            onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
          />
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false)
                resetForm()
              }}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-[13px] font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#ff6b9d] to-[#ff8eb3] text-white rounded-lg text-[13px] font-semibold hover:shadow-md transition-all disabled:opacity-50"
            >
              {createMutation.isPending ? t('common.loading') : t('customers.addNew')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
