import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { backendAPI } from '../../lib/api'
import { useAuthStore } from '../../stores/authStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Toggle from '../../components/ui/Toggle'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { Plus, Edit, Trash2, Pause, Play, Key, Mail, Copy, Check, Shield, Bell, MessageSquare, Send, CreditCard, Search } from 'lucide-react'
import { format } from 'date-fns'
import { isDemoMode, mockBusinesses } from '../../lib/mockData'
import { useTranslation } from 'react-i18next'

interface Business {
  id: string
  name: string
  slug: string
  email: string | null
  phone_number: string | null
  logo_url: string | null
  brand_color: string
  is_active: boolean
  self_service_enabled: boolean
  currency?: string
  owner_user_id: string | null
  created_at: string
}

export default function BusinessesPage() {
  const { t } = useTranslation()
  const { profile } = useAuthStore()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isEditBusinessDataModal, setIsEditBusinessDataModal] = useState(false)
  const [isNotificationSettingsModal, setIsNotificationSettingsModal] = useState(false)
  const [isSubscriptionModal, setIsSubscriptionModal] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [businessToDelete, setBusinessToDelete] = useState<Business | null>(null)
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null)
  const [currentSubscription, setCurrentSubscription] = useState<any>(null)
  const [subscriptionData, setSubscriptionData] = useState({
    plan_name: 'Standard',
    monthly_price: '10',
    annual_price: '100',
    max_customers: '1000',
    max_staff: '10',
    start_date: new Date().toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'active',
  })
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [newOwnerPassword, setNewOwnerPassword] = useState('')
  const [copied, setCopied] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [notificationSettings, setNotificationSettings] = useState({
    whatsapp_enabled: false,
    whatsapp_provider: 'twilio',
    whatsapp_credentials: { account_sid: '', auth_token: '', phone_number: '' },
    sms_enabled: false,
    sms_provider: 'twilio',
    sms_credentials: { account_sid: '', auth_token: '', phone_number: '' },
  })
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    email: '',
    phone_number: '',
    brand_color: '#0ea5e9',
    logo_url: '',
    currency: 'OMR',
  })
  const [editFormData, setEditFormData] = useState({
    name: '',
    slug: '',
    email: '',
    phone_number: '',
    brand_color: '#0ea5e9',
    logo_url: '',
    currency: 'OMR',
    password: '',
  })

  // Fetch businesses
  const { data: businesses, isLoading } = useQuery({
    queryKey: ['businesses'],
    queryFn: async () => {
      // DEMO MODE: Return mock data
      if (isDemoMode()) {
        return mockBusinesses
      }

      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Business[]
    },
  })

  // Create business mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: newBusiness, error } = await (supabase.from('businesses') as any).insert(data).select().single()
      if (error) throw error
      
      // Auto-create default subscription
      const { error: subError } = await (supabase.from('subscriptions') as any).insert([{
        business_id: newBusiness.id,
        plan_name: 'Standard',
        monthly_price: 10,
        annual_price: 100,
        max_customers: 1000,
        max_staff: 10,
        start_date: new Date().toISOString().split('T')[0],
        expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active',
      }])
      if (subError) console.error('Failed to create subscription:', subError)
      
      return newBusiness
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
      queryClient.invalidateQueries({ queryKey: ['super-admin-stats'] })
      queryClient.invalidateQueries({ queryKey: ['expiring-subscriptions'] })
      setIsModalOpen(false)
      resetForm()
      alert('✅ Business created with active subscription!')
    },
  })

  // Update business mutation
  const updateMutation = useMutation({
    mutationFn: async (data: typeof editFormData & { id: string }) => {
      if (isDemoMode()) {
        return { success: true, message: 'Business updated in demo mode' }
      }

      const { error } = await (supabase.from('businesses') as any)
        .update({
          name: data.name,
          slug: data.slug,
          email: data.email,
          phone_number: data.phone_number,
          brand_color: data.brand_color,
          logo_url: data.logo_url,
          currency: data.currency,
        })
        .eq('id', data.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
      setIsEditBusinessDataModal(false)
      setEditingBusiness(null)
      alert('Business updated successfully!')
    },
    onError: (error: any) => {
      alert(`Error updating business: ${error.message}`)
    },
  })

  // Delete business mutation
  const deleteMutation = useMutation({
    mutationFn: async (businessId: string) => {
      if (isDemoMode()) {
        // Demo mode: just show success
        return
      }

      const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', businessId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
      alert('✅ Business deleted successfully!')
    },
    onError: (error: any) => {
      alert(`❌ Error deleting business: ${error.message}`)
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async (businessIds: string[]) => {
      if (isDemoMode()) return { success: true }
      try {
        const result = await backendAPI.bulkDeleteBusinesses(businessIds)
        if (!result || !result.success) {
          throw new Error('Delete operation failed')
        }
        return result
      } catch (error: any) {
        throw new Error(error.message || 'Failed to delete businesses')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
      setSelectedIds([])
      alert(`✅ ${selectedIds.length} business(es) and all related data deleted permanently!`)
    },
    onError: (error: any) => {
      alert(`❌ Error: ${error.message}`)
    },
  })

  const handleSelectAll = () => {
    if (selectedIds.length === businesses?.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(businesses?.map(b => b.id) || [])
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
    setIsBulkDeleteConfirmOpen(true)
  }

  const confirmBulkDelete = () => {
    if (deleteConfirmText === 'DELETE') {
      bulkDeleteMutation.mutate(selectedIds)
      setIsBulkDeleteConfirmOpen(false)
      setDeleteConfirmText('')
    }
  }

  const handleSingleDelete = (business: Business) => {
    setBusinessToDelete(business)
    setIsDeleteConfirmOpen(true)
  }

  const confirmSingleDelete = () => {
    if (businessToDelete) {
      deleteMutation.mutate(businessToDelete.id)
      setIsDeleteConfirmOpen(false)
      setBusinessToDelete(null)
    }
  }

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      if (isDemoMode()) {
        // Demo mode: just show success
        return
      }
      const { error } = await (supabase.from('businesses') as any)
        .update({ is_active: !is_active })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
    },
  })

  // Toggle self-service
  const toggleSelfServiceMutation = useMutation({
    mutationFn: async ({ businessId, enabled }: { businessId: string; enabled: boolean }) => {
      console.log('=== TOGGLE SELF-SERVICE DEBUG ===')
      console.log('Profile:', profile)
      console.log('Profile role:', profile?.role)
      console.log('Enabled:', enabled)
      
      if (!profile?.role) {
        throw new Error('Profile not loaded. Please refresh and try again.')
      }
      
      if (profile.role !== 'super_admin') {
        throw new Error(`Access denied. Your role is '${profile.role}' but 'super_admin' is required.`)
      }
      
      if (isDemoMode()) {
        // Demo mode: just show success
        if (enabled) {
          const business = mockBusinesses.find(b => b.id === businessId)
          if (business) {
            const email = business.email || `owner@${business.slug}.com`
            const password = generateRandomPassword()
            setOwnerEmail(email)
            setGeneratedPassword(password)
          }
        }
        return
      }

      const business = businesses?.find(b => b.id === businessId)
      if (!business) throw new Error('Business not found')

      if (enabled) {
        // Create owner account using backend API
        const email = business.email || `owner@${business.slug}.com`
        const password = generateRandomPassword()
        
        try {
          // Call backend to create user with service role
          console.log('Profile role:', profile?.role, 'Full profile:', profile)
          const result = await backendAPI.createBusinessOwner({
            email,
            password,
            full_name: `${business.name} Owner`,
            business_id: businessId,
            requester_role: profile?.role || 'super_admin'
          })

          // Update business to enable self-service and link owner
          const { error } = await (supabase.from('businesses') as any)
            .update({ 
              self_service_enabled: true,
              owner_user_id: result.user_id
            })
            .eq('id', businessId)
          
          if (error) throw error
          
          setOwnerEmail(email)
          setGeneratedPassword(password)
        } catch (error: any) {
          throw new Error(`Failed to create owner account: ${error.message}`)
        }
      } else {
        // Disable self-service
        const { error } = await (supabase.from('businesses') as any)
          .update({ self_service_enabled: false })
          .eq('id', businessId)
        
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
    },
  })

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const handleGenerateNewPassword = () => {
    const newPassword = generateRandomPassword()
    setNewOwnerPassword(newPassword)
  }

  const handleResetOwnerPassword = async () => {
    if (!editingBusiness || !newOwnerPassword) return

    if (isDemoMode()) {
      setGeneratedPassword(newOwnerPassword)
      setNewOwnerPassword('')
      alert('Password updated in demo mode!')
      return
    }

    try {
      const email = `owner@${editingBusiness.slug}.com`
      
      // Just call the backend to create/update the owner account
      const result = await backendAPI.createBusinessOwner({
        email: email,
        password: newOwnerPassword,
        full_name: `${editingBusiness.name} Owner`,
        business_id: editingBusiness.id,
        requester_role: profile?.role || 'super_admin'
      })
      
      setOwnerEmail(email)
      setGeneratedPassword(newOwnerPassword)
      setNewOwnerPassword('')
      alert('Password set successfully! Owner can now login.')
      
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleCopyCredentials = () => {
    const text = `Email: ${ownerEmail}\nPassword: ${generatedPassword}`
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else {
      alert(`Credentials:\n\nEmail: ${ownerEmail}\nPassword: ${generatedPassword}`)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
      alert(`${label} copied!`)
    } else {
      alert(`${label}:\n${text}`)
    }
  }

  const openEditModal = (business: Business) => {
    setEditingBusiness(business)
    setOwnerEmail(`owner@${business.slug}.com`)
    setGeneratedPassword('')
    setIsEditModalOpen(true)
  }

  const openEditBusinessDataModal = (business: Business) => {
    setEditingBusiness(business)
    setEditFormData({
      name: business.name,
      slug: business.slug,
      email: business.email || '',
      phone_number: business.phone_number || '',
      brand_color: business.brand_color || '#0ea5e9',
      logo_url: business.logo_url || '',
      currency: (business as any).currency || 'OMR',
      password: '',
    })
    setIsEditBusinessDataModal(true)
  }

  const openNotificationSettings = async (business: Business) => {
    setEditingBusiness(business)
    
    // Fetch current settings
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/notifications/settings/${business.id}`, {
        headers: { 'x-api-key': import.meta.env.VITE_API_KEY }
      })
      const data = await response.json()
      
      if (data.settings) {
        setNotificationSettings({
          whatsapp_enabled: data.settings.whatsapp_enabled || false,
          whatsapp_provider: 'twilio',
          whatsapp_credentials: { account_sid: '', auth_token: '', phone_number: '' },
          sms_enabled: data.settings.sms_enabled || false,
          sms_provider: 'twilio',
          sms_credentials: { account_sid: '', auth_token: '', phone_number: '' },
        })
      }
    } catch (error) {
      console.error('Failed to fetch notification settings:', error)
    }
    
    setIsNotificationSettingsModal(true)
  }

  const saveNotificationSettings = async () => {
    if (!editingBusiness) return

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/notifications/settings/${editingBusiness.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_API_KEY
        },
        body: JSON.stringify(notificationSettings)
      })

      const data = await response.json()
      
      if (data.success) {
        alert('✅ Notification settings saved!')
        setIsNotificationSettingsModal(false)
        queryClient.invalidateQueries({ queryKey: ['businesses'] })
      } else {
        alert('❌ Error: ' + data.error)
      }
    } catch (error: any) {
      alert('❌ Error: ' + error.message)
    }
  }

  const openSubscriptionModal = async (business: Business) => {
    setEditingBusiness(business)
    
    // Fetch existing subscription
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('business_id', business.id)
      .maybeSingle()
    
    if (data) {
      setCurrentSubscription(data)
      setSubscriptionData({
        plan_name: (data as any).plan_name || 'Standard',
        monthly_price: (data as any).monthly_price?.toString() || '10',
        annual_price: (data as any).annual_price?.toString() || '100',
        max_customers: (data as any).max_customers?.toString() || '1000',
        max_staff: (data as any).max_staff?.toString() || '10',
        start_date: (data as any).start_date || new Date().toISOString().split('T')[0],
        expiry_date: (data as any).expiry_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: (data as any).status || 'active',
      })
    } else {
      setCurrentSubscription(null)
      setSubscriptionData({
        plan_name: 'Standard',
        monthly_price: '10',
        annual_price: '100',
        max_customers: '1000',
        max_staff: '10',
        start_date: new Date().toISOString().split('T')[0],
        expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active',
      })
    }
    
    setIsSubscriptionModal(true)
  }

  const saveSubscription = async () => {
    if (!editingBusiness) return

    try {
      if (currentSubscription) {
        // Update existing
        const { error } = await (supabase
          .from('subscriptions') as any)
          .update([{
            plan_name: subscriptionData.plan_name,
            monthly_price: parseFloat(subscriptionData.monthly_price),
            annual_price: parseFloat(subscriptionData.annual_price),
            max_customers: parseInt(subscriptionData.max_customers),
            max_staff: parseInt(subscriptionData.max_staff),
            start_date: subscriptionData.start_date,
            expiry_date: subscriptionData.expiry_date,
            status: subscriptionData.status,
          }])
          .eq('id', (currentSubscription as any).id)
        
        if (error) throw error
      } else {
        // Create new
        const { error } = await (supabase
          .from('subscriptions') as any)
          .insert([{
            business_id: editingBusiness.id,
            plan_name: subscriptionData.plan_name,
            monthly_price: parseFloat(subscriptionData.monthly_price),
            annual_price: parseFloat(subscriptionData.annual_price),
            max_customers: parseInt(subscriptionData.max_customers),
            max_staff: parseInt(subscriptionData.max_staff),
            start_date: subscriptionData.start_date,
            expiry_date: subscriptionData.expiry_date,
            status: subscriptionData.status,
          }])
        
        if (error) throw error
      }
      
      alert('✅ Subscription saved!')
      setIsSubscriptionModal(false)
      queryClient.invalidateQueries({ queryKey: ['super-admin-stats'] })
      queryClient.invalidateQueries({ queryKey: ['expiring-subscriptions'] })
    } catch (error: any) {
      alert('❌ Error: ' + error.message)
    }
  }

  const handleGeneratePasswordForEdit = () => {
    const newPassword = generateRandomPassword()
    setEditFormData({ ...editFormData, password: newPassword } as any)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      email: '',
      phone_number: '',
      brand_color: '#0ea5e9',
      logo_url: '',
      currency: 'OMR',
    })
    setEditingBusiness(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingBusiness) {
      updateMutation.mutate({ ...editFormData, id: editingBusiness.id })
    }
  }

  const openCreateModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  // Filtered businesses based on search
  const filteredBusinesses = useMemo(() => {
    if (!businesses) return []
    
    if (!searchQuery) return businesses
    
    return businesses.filter(business =>
      business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.phone_number?.includes(searchQuery)
    )
  }, [businesses, searchQuery])

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('businesses.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('businesses.manageBusinesses')}
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
          <Button icon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
            {t('businesses.addNew')}
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by business name, slug, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredBusinesses.length} of {businesses?.length || 0} businesses
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-start py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === businesses?.length && businesses?.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th className="text-start py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {t('businesses.name')}
                </th>
                <th className="text-start py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {t('businesses.slug', 'Slug')}
                </th>
                <th className="text-start py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {t('businesses.email')}
                </th>
                <th className="text-start py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {t('businesses.status')}
                </th>
                <th className="text-start py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {t('businesses.selfService', 'Self-Service')}
                </th>
                <th className="text-start py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {t('businesses.createdAt')}
                </th>
                <th className="text-start py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {t('businesses.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBusinesses?.map((business) => (
                <tr
                  key={business.id}
                  className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${selectedIds.includes(business.id) ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
                >
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(business.id)}
                      onChange={() => handleSelectOne(business.id)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                    {business.name}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {business.slug}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    <div className="text-sm">
                      {business.email && <div>{business.email}</div>}
                      {business.phone_number && <div>{business.phone_number}</div>}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        business.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}
                    >
                      {business.is_active ? t('common.active') : t('businesses.suspended', 'Suspended')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {business.self_service_enabled ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        <Shield className="w-3 h-3" />
                        {t('common.enabled', 'Enabled')}
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        {t('common.disabled', 'Disabled')}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {business.created_at ? format(new Date(business.created_at), 'MMM dd, yyyy') : 'N/A'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          toggleActiveMutation.mutate({
                            id: business.id,
                            is_active: business.is_active,
                          })
                        }
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        title={business.is_active ? 'Suspend' : 'Activate'}
                      >
                        {business.is_active ? (
                          <Pause className="w-4 h-4 text-orange-600" />
                        ) : (
                          <Play className="w-4 h-4 text-green-600" />
                        )}
                      </button>
                      <button
                        onClick={() => openEditBusinessDataModal(business)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        title={t('businesses.editBusiness', 'Edit Business Data')}
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => openEditModal(business)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        title="Manage Self-Service"
                      >
                        <Key className="w-4 h-4 text-purple-600" />
                      </button>
                      <button
                        onClick={() => openNotificationSettings(business)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        title="Notification Settings"
                      >
                        <Bell className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => openSubscriptionModal(business)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        title="Manage Subscription"
                      >
                        <CreditCard className="w-4 h-4 text-green-600" />
                      </button>
                      <button 
                        onClick={() => handleSingleDelete(business)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        title="Delete Business"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('businesses.addNew')}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('businesses.name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label={t('businesses.slug', 'Slug')}
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            helperText={t('businesses.slugHelp', 'Unique identifier (e.g., coffee-shop-123)')}
            required
          />
          <Input
            label={t('businesses.logoUrl', 'Logo URL')}
            value={formData.logo_url}
            onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
            placeholder="https://example.com/logo.png"
            helperText={t('businesses.logoUrlHelp', 'Paste image URL')}
          />
          <Input
            label={t('businesses.ownerEmail', 'Owner Login Email (Optional)')}
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="owner@example.com"
          />
          <Input
            label={t('businesses.phone', 'Phone Number')}
            value={formData.phone_number}
            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('businesses.currency', 'Currency')}
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
            >
              <option value="OMR">OMR - Omani Rial</option>
              <option value="SAR">SAR - Saudi Riyal</option>
              <option value="AED">AED - UAE Dirham</option>
              <option value="KWD">KWD - Kuwaiti Dinar</option>
              <option value="BHD">BHD - Bahraini Dinar</option>
              <option value="QAR">QAR - Qatari Riyal</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="EGP">EGP - Egyptian Pound</option>
              <option value="JOD">JOD - Jordanian Dinar</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('businesses.brandColor', 'Brand Color')}
            </label>
            <input
              type="color"
              value={formData.brand_color}
              onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })}
              className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              {t('common.create')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Business Data Modal */}
      <Modal
        isOpen={isEditBusinessDataModal}
        onClose={() => setIsEditBusinessDataModal(false)}
        title={t('businesses.editBusiness', 'Edit Business Information')}
        size="lg"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label={t('businesses.name')}
            value={editFormData.name}
            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            required
          />
          <Input
            label={t('businesses.slug', 'Slug')}
            value={editFormData.slug}
            onChange={(e) => setEditFormData({ ...editFormData, slug: e.target.value })}
            helperText={t('businesses.slugHelp', 'Unique identifier')}
            required
          />
          <Input
            label={t('businesses.logoUrl', 'Logo URL')}
            value={editFormData.logo_url}
            onChange={(e) => setEditFormData({ ...editFormData, logo_url: e.target.value })}
            placeholder="https://example.com/logo.png"
            helperText={t('businesses.logoUrlHelp', 'Paste image URL')}
          />
          <Input
            label={t('businesses.email', 'Email')}
            type="email"
            value={editFormData.email}
            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
            helperText="Business contact email (NOT for login - use Self-Service for login)"
          />
          <Input
            label={t('businesses.phone')}
            value={editFormData.phone_number}
            onChange={(e) => setEditFormData({ ...editFormData, phone_number: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('businesses.currency', 'Currency')}
            </label>
            <select
              value={editFormData.currency}
              onChange={(e) => setEditFormData({ ...editFormData, currency: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
            >
              <option value="OMR">OMR - Omani Rial</option>
              <option value="SAR">SAR - Saudi Riyal</option>
              <option value="AED">AED - UAE Dirham</option>
              <option value="KWD">KWD - Kuwaiti Dinar</option>
              <option value="BHD">BHD - Bahraini Dinar</option>
              <option value="QAR">QAR - Qatari Riyal</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="EGP">EGP - Egyptian Pound</option>
              <option value="JOD">JOD - Jordanian Dinar</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('businesses.brandColor', 'Brand Color')}
            </label>
            <input
              type="color"
              value={editFormData.brand_color}
              onChange={(e) => setEditFormData({ ...editFormData, brand_color: e.target.value })}
              className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600"
            />
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-3">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>💡 {t('common.tip', 'Tip:')}</strong> {t('businesses.credentialsTip', 'To set login credentials for the business owner, use the Key icon to enable Self-Service Access.')}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsEditBusinessDataModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={updateMutation.isPending}>
              {t('businesses.updateBusiness', 'Update Business')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Business Modal with Self-Service Toggle */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={t('businesses.manageBusiness', 'Manage Business')}
        size="lg"
      >
        {editingBusiness && (
          <div className="space-y-6">
            {/* Business Info */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {editingBusiness.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Slug: {editingBusiness.slug}
              </p>
              {editingBusiness.email && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Email: {editingBusiness.email}
                </p>
              )}
            </div>

            {/* Self-Service Toggle */}
            <Card title={`🔑 ${t('businesses.selfService', 'Self-Service Access')}`}>
              <div className="space-y-4">
                <Toggle
                  enabled={editingBusiness.self_service_enabled}
                  onChange={(enabled) => {
                    toggleSelfServiceMutation.mutate({
                      businessId: editingBusiness.id,
                      enabled,
                    })
                  }}
                  label={t('businesses.enableSelfService', 'Enable Self-Service Access')}
                  description={t('businesses.selfServiceDesc', 'Allow business owner to login and manage their own loyalty programs, QR codes, and customers')}
                />

                {editingBusiness.self_service_enabled || generatedPassword ? (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3 mb-4">
                      <Key className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                          {t('businesses.ownerLogin', 'Owner Login Credentials')}
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                            <div>
                              <span className="text-blue-700 dark:text-blue-300 font-medium">
                                Email:
                              </span>{' '}
                              <span className="text-blue-900 dark:text-blue-100 font-mono">
                                {ownerEmail}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              icon={<Copy className="w-3 h-3" />}
                              onClick={() => copyToClipboard(ownerEmail, 'Email')}
                            >
                              Copy
                            </Button>
                          </div>
                          {generatedPassword && (
                            <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                              <div>
                                <span className="text-blue-700 dark:text-blue-300 font-medium">
                                  {t('auth.password', 'Password')}:
                                </span>{' '}
                                <span className="text-blue-900 dark:text-blue-100 font-mono">
                                  {generatedPassword}
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                icon={<Copy className="w-3 h-3" />}
                                onClick={() => copyToClipboard(generatedPassword, 'Password')}
                              >
                                {t('common.copy', 'Copy')}
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Password Reset Section */}
                        <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-700">
                          <h5 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                            🔄 {t('staff.newPassword', 'Reset Owner Password')}
                          </h5>
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Input
                                type="text"
                                value={newOwnerPassword}
                                onChange={(e) => setNewOwnerPassword(e.target.value)}
                                placeholder={t('staff.newPassword', 'Enter new password or generate')}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleGenerateNewPassword}
                              >
                                {t('staff.generatePassword', 'Generate')}
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              onClick={handleResetOwnerPassword}
                              disabled={!newOwnerPassword}
                            >
                              {t('common.update', 'Update Password')}
                            </Button>
                          </div>
                        </div>

                        {generatedPassword && (
                          <div className="mt-3 flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              onClick={handleCopyCredentials}
                            >
                              {copied ? t('common.copied', 'Copied!') : t('businesses.copyCredentials', 'Copy All Credentials')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              icon={<Mail className="w-4 h-4" />}
                            >
                              {t('businesses.emailToOwner', 'Email to Owner')}
                            </Button>
                          </div>
                        )}

                        <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-700">
                          <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">
                            ⚠️ {t('businesses.important', 'Important:')}
                          </p>
                          <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                            <li>• {t('businesses.sendCredentials', 'Send these credentials securely')}</li>
                            <li>• {t('businesses.ownerCanLogin', 'They can login at the same URL you use')}</li>
                            <li>• {t('businesses.onlyTheirData', 'They will see ONLY their business data')}</li>
                            <li>• {t('businesses.dataPreserved', 'All customer data is preserved')}</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('businesses.selfServiceDisabled', 'Self-service is currently disabled.')}
                    </p>
                  </div>
                )}

                {/* What They Can Do */}
                {editingBusiness.self_service_enabled && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                      ✅ {t('businesses.whenEnabled', 'When self-service is enabled, business owner can:')}
                    </h4>
                    <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                      <li>• {t('businesses.canGenerateQR', 'Generate their own QR codes')}</li>
                      <li>• {t('businesses.canManagePrograms', 'Create and manage loyalty programs')}</li>
                      <li>• {t('businesses.canViewCustomers', 'View all customers')}</li>
                      <li>• {t('businesses.canManageStaff', 'Add and manage staff accounts')}</li>
                      <li>• {t('businesses.canViewReports', 'View reports and analytics')}</li>
                      <li>• {t('businesses.canManageSettings', 'Manage business settings')}</li>
                    </ul>
                  </div>
                )}
              </div>
            </Card>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                {t('common.close', 'Close')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Notification Settings Modal */}
      <Modal
        isOpen={isNotificationSettingsModal}
        onClose={() => setIsNotificationSettingsModal(false)}
        title={`📱 Notification Settings - ${editingBusiness?.name || ''}`}
        size="lg"
      >
        <div className="space-y-6">
          {/* WhatsApp Settings */}
          <Card title="💬 WhatsApp Notifications">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Provider
                </label>
                <select
                  value={notificationSettings.whatsapp_provider}
                  onChange={(e) => setNotificationSettings({
                    ...notificationSettings,
                    whatsapp_provider: e.target.value
                  })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                >
                  <option value="twilio">Twilio</option>
                  <option value="meta">Meta Business API</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <Input
                label="Account SID / API Key"
                value={notificationSettings.whatsapp_credentials.account_sid}
                onChange={(e) => setNotificationSettings({
                  ...notificationSettings,
                  whatsapp_credentials: {
                    ...notificationSettings.whatsapp_credentials,
                    account_sid: e.target.value
                  }
                })}
                placeholder="Enter Account SID"
              />

              <Input
                label="Auth Token / Secret"
                type="password"
                value={notificationSettings.whatsapp_credentials.auth_token}
                onChange={(e) => setNotificationSettings({
                  ...notificationSettings,
                  whatsapp_credentials: {
                    ...notificationSettings.whatsapp_credentials,
                    auth_token: e.target.value
                  }
                })}
                placeholder="Enter Auth Token"
              />

              <Input
                label="WhatsApp Phone Number (with country code)"
                value={notificationSettings.whatsapp_credentials.phone_number}
                onChange={(e) => setNotificationSettings({
                  ...notificationSettings,
                  whatsapp_credentials: {
                    ...notificationSettings.whatsapp_credentials,
                    phone_number: e.target.value
                  }
                })}
                placeholder="+96812345678"
              />

              <div className="pt-3">
                <Toggle
                  enabled={notificationSettings.whatsapp_enabled}
                  onChange={(enabled) => setNotificationSettings({
                    ...notificationSettings,
                    whatsapp_enabled: enabled
                  })}
                  label="Enable WhatsApp Notifications"
                  description="Business can toggle this on/off"
                />
              </div>
            </div>
          </Card>

          {/* SMS Settings */}
          <Card title="📱 SMS Notifications">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Provider
                </label>
                <select
                  value={notificationSettings.sms_provider}
                  onChange={(e) => setNotificationSettings({
                    ...notificationSettings,
                    sms_provider: e.target.value
                  })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                >
                  <option value="twilio">Twilio</option>
                  <option value="aws_sns">AWS SNS</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <Input
                label="Account SID / API Key"
                value={notificationSettings.sms_credentials.account_sid}
                onChange={(e) => setNotificationSettings({
                  ...notificationSettings,
                  sms_credentials: {
                    ...notificationSettings.sms_credentials,
                    account_sid: e.target.value
                  }
                })}
                placeholder="Enter Account SID"
              />

              <Input
                label="Auth Token / Secret"
                type="password"
                value={notificationSettings.sms_credentials.auth_token}
                onChange={(e) => setNotificationSettings({
                  ...notificationSettings,
                  sms_credentials: {
                    ...notificationSettings.sms_credentials,
                    auth_token: e.target.value
                  }
                })}
                placeholder="Enter Auth Token"
              />

              <Input
                label="SMS Phone Number (with country code)"
                value={notificationSettings.sms_credentials.phone_number}
                onChange={(e) => setNotificationSettings({
                  ...notificationSettings,
                  sms_credentials: {
                    ...notificationSettings.sms_credentials,
                    phone_number: e.target.value
                  }
                })}
                placeholder="+96812345678"
              />

              <div className="pt-3">
                <Toggle
                  enabled={notificationSettings.sms_enabled}
                  onChange={(enabled) => setNotificationSettings({
                    ...notificationSettings,
                    sms_enabled: enabled
                  })}
                  label="Enable SMS Notifications"
                  description="Business can toggle this on/off"
                />
              </div>
            </div>
          </Card>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-900 dark:text-yellow-100">
              <strong>💡 Tip:</strong> Once you save API credentials, notifications will auto-enable. Business owners can toggle them on/off in their settings.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
            <Button variant="outline" onClick={() => setIsNotificationSettingsModal(false)}>
              Cancel
            </Button>
            <Button onClick={saveNotificationSettings}>
              Save Settings
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false)
          setBusinessToDelete(null)
        }}
        onConfirm={confirmSingleDelete}
        title="Delete Business"
        message={`⚠️ Delete ${businessToDelete?.name}?\n\nThis will permanently delete:\n• The business\n• All customers\n• All loyalty programs\n• All visits and rewards\n• All staff accounts\n\nThis action CANNOT be undone!`}
        confirmText="Delete"
        type="danger"
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isBulkDeleteConfirmOpen}
        onClose={() => {
          setIsBulkDeleteConfirmOpen(false)
          setDeleteConfirmText('')
        }}
        onConfirm={confirmBulkDelete}
        title="Delete Multiple Businesses"
        message={`⚠️ DELETE ${selectedIds.length} BUSINESS(ES) PERMANENTLY?\n\nThis will CASCADE DELETE:\n• All businesses\n• All staff accounts\n• All loyalty programs\n• All customers\n• All visits & rewards\n\n🚨 THIS ACTION CANNOT BE UNDONE! 🚨`}
        confirmText="Delete All"
        type="danger"
        requireTyping="DELETE"
        onTypingChange={setDeleteConfirmText}
        typingValue={deleteConfirmText}
      />

      {/* Subscription Modal */}
      <Modal
        isOpen={isSubscriptionModal}
        onClose={() => setIsSubscriptionModal(false)}
        title={`💳 Subscription - ${editingBusiness?.name || ''}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>💡 Info:</strong> {currentSubscription ? 'Editing existing subscription' : 'Creating new subscription for this business'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Plan Name
            </label>
            <select
              value={subscriptionData.plan_name}
              onChange={(e) => setSubscriptionData({ ...subscriptionData, plan_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            >
              <option value="Basic">Basic</option>
              <option value="Standard">Standard</option>
              <option value="Premium">Premium</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Monthly Price"
              type="number"
              value={subscriptionData.monthly_price}
              onChange={(e) => setSubscriptionData({ ...subscriptionData, monthly_price: e.target.value })}
              placeholder="10"
            />
            <Input
              label="Annual Price"
              type="number"
              value={subscriptionData.annual_price}
              onChange={(e) => setSubscriptionData({ ...subscriptionData, annual_price: e.target.value })}
              placeholder="100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Max Customers"
              type="number"
              value={subscriptionData.max_customers}
              onChange={(e) => setSubscriptionData({ ...subscriptionData, max_customers: e.target.value })}
              placeholder="1000"
            />
            <Input
              label="Max Staff"
              type="number"
              value={subscriptionData.max_staff}
              onChange={(e) => setSubscriptionData({ ...subscriptionData, max_staff: e.target.value })}
              placeholder="10"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={subscriptionData.start_date}
              onChange={(e) => setSubscriptionData({ ...subscriptionData, start_date: e.target.value })}
            />
            <Input
              label="Expiry Date"
              type="date"
              value={subscriptionData.expiry_date}
              onChange={(e) => setSubscriptionData({ ...subscriptionData, expiry_date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={subscriptionData.status}
              onChange={(e) => setSubscriptionData({ ...subscriptionData, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {currentSubscription && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-900 dark:text-green-100">
                <strong>✅ Current Status:</strong> {currentSubscription.status}
              </p>
              <p className="text-xs text-green-800 dark:text-green-200 mt-1">
                Created: {new Date(currentSubscription.created_at).toLocaleDateString()}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
            <Button variant="outline" onClick={() => setIsSubscriptionModal(false)}>
              Cancel
            </Button>
            <Button onClick={saveSubscription}>
              {currentSubscription ? 'Update Subscription' : 'Create Subscription'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
