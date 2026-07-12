import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { backendAPI } from '../../lib/api'
import { useAuthStore } from '../../stores/authStore'
import { isDemoMode, mockStaff } from '../../lib/mockData'
import { useTranslation } from 'react-i18next'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import { Plus, UserCog, Trash2, Copy } from 'lucide-react'
import { format } from 'date-fns'

export default function StaffPage() {
  const { profile } = useAuthStore()
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<any | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone_number: '',
    password: '',
  })

  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff', profile?.business_id],
    queryFn: async () => {
      if (!profile?.business_id) return []

      // DEMO MODE: Use mock data
      if (isDemoMode()) {
        return mockStaff.filter(s => s.business_id === profile.business_id)
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('business_id', profile.business_id)
        .order('created_at', { ascending: false})

      if (error) throw error
      return data
    },
  })

  const createStaffMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!profile?.business_id) throw new Error('No business ID')

      // DEMO MODE: Just show success message
      if (isDemoMode()) {
        return { success: true, message: 'Staff created in demo mode', password: data.password || generateRandomPassword() }
      }

      // Use the provided password or generate one
      const password = data.password || generateRandomPassword()
      
      // Call backend API to create user with service role
      const result = await backendAPI.createStaff({
        email: data.email,
        password: password,
        full_name: data.full_name,
        phone_number: data.phone_number,
        business_id: profile.business_id,
        requester_role: profile.role || 'business_admin'
      })

      return { success: true, user: result, password }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      // Store password for display
      setGeneratedPassword(result.password)
      // Don't close modal yet - show the password
      if (!formData.password) {
        setShowPassword(true)
      } else {
        setIsModalOpen(false)
        setFormData({ email: '', full_name: '', phone_number: '', password: '' })
        setGeneratedPassword('')
        alert(t('staff.alertCreated'))
      }
    },
    onError: (error: any) => {
      alert(`${t('staff.alertCreateError')}: ${error.message}`)
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

  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword()
    setFormData({ ...formData, password: newPassword })
  }

  const updateStaffMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: string; resetPassword?: boolean }) => {
      if (!editingStaff?.id) throw new Error('No staff ID')

      // DEMO MODE: Just show success message
      if (isDemoMode()) {
        return { success: true, message: 'Staff updated in demo mode' }
      }

      // Update profile
      const { error: profileError } = await (supabase
        .from('profiles') as any)
        .update({
          full_name: data.full_name,
          phone_number: data.phone_number,
        })
        .eq('id', editingStaff.id)

      if (profileError) throw profileError

      // Update email if changed (requires auth.users update)
      if (data.email !== editingStaff.email) {
        // Note: Updating email requires admin privileges or Edge Function
        // For now, we'll just update the profile email
        const { error: emailError } = await (supabase
          .from('profiles') as any)
          .update({ email: data.email })
          .eq('id', editingStaff.id)

        if (emailError) throw emailError
      }

      // Reset password if provided
      if (data.password && data.resetPassword) {
        // Note: This requires Supabase admin access or Edge Function
        // You'll need to implement this via an Edge Function that uses the service role
        console.log('Password reset requested for:', editingStaff.id)
        // TODO: Call edge function to reset password
      }

      return { success: true, password: data.password }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      if (result.password) {
        setGeneratedPassword(result.password)
        setShowPassword(true)
      } else {
        setIsEditModalOpen(false)
        setEditingStaff(null)
        setFormData({ email: '', full_name: '', phone_number: '', password: '' })
        alert(t('staff.alertUpdated'))
      }
    },
    onError: (error: any) => {
      alert(`${t('staff.alertUpdateError')}: ${error.message}`)
    },
  })

  const toggleStaffStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      if (isDemoMode()) {
        return { success: true }
      }

      const { error } = await (supabase
        .from('profiles') as any)
        .update({ is_active: !is_active })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
  })

  // Delete staff mutation
  const deleteStaffMutation = useMutation({
    mutationFn: async (staffId: string) => {
      if (isDemoMode()) {
        return { success: true }
      }

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', staffId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      alert(t('staff.alertDeleted'))
    },
    onError: (error: any) => {
      alert(`${t('staff.alertDeleteError')}: ${error.message}`)
    },
  })

  const openEditModal = (staff: any) => {
    setEditingStaff(staff)
    setFormData({
      email: staff.email || '',
      full_name: staff.full_name || '',
      phone_number: staff.phone_number || '',
      password: '',
    })
    setGeneratedPassword('')
    setShowPassword(false)
    setIsEditModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createStaffMutation.mutate(formData)
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingStaff) {
      updateStaffMutation.mutate({ 
        ...formData, 
        id: editingStaff.id,
        resetPassword: !!formData.password 
      })
    }
  }

  const handleCloseCreateModal = () => {
    setIsModalOpen(false)
    setFormData({ email: '', full_name: '', phone_number: '', password: '' })
    setGeneratedPassword('')
    setShowPassword(false)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setEditingStaff(null)
    setFormData({ email: '', full_name: '', phone_number: '', password: '' })
    setGeneratedPassword('')
    setShowPassword(false)
  }

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
      alert(t('common.copied'))
    } else {
      alert(`${t('common.copyThis')}:\n${text}`)
    }
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('staff.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('staff.manageTeam')}
          </p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
          {t('staff.addNew')}
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-start py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {t('customers.name')}
                </th>
                <th className="text-start py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {t('auth.email')}
                </th>
                <th className="text-start py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {t('customers.phoneNumber')}
                </th>
                <th className="text-start py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {t('staff.role')}
                </th>
                <th className="text-start py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {t('staff.status')}
                </th>
                <th className="text-start py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {t('staff.joined')}
                </th>
                <th className="text-start py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {staff?.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                    {member.full_name}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {member.email}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {member.phone_number || t('common.na')}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {(member.role as any) === 'business_admin' ? t('staff.businessAdmin') : (member.role as any) === 'staff' ? t('staff.staff') : member.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        member.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}
                    >
                      {member.is_active ? t('common.active') : t('common.inactive')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {format(new Date(member.created_at), 'MMM dd, yyyy')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(member)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        title="Edit Staff"
                      >
                        <UserCog className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(t('staff.confirmDelete', { name: member.full_name || member.email }))) {
                            deleteStaffMutation.mutate(member.id)
                          }
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        title="Delete Staff"
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

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseCreateModal}
        title={t('staff.addMember')}
        size="md"
      >
        {!showPassword ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('auth.fullName')}
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
            <Input
              label={t('auth.email')}
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              label={t('customers.phoneNumber')}
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            />
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('staff.password')}
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleGeneratePassword}
                >
                  {t('staff.generatePassword')}
                </Button>
              </div>
              <Input
                type="text"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={t('staff.passwordPlaceholder')}
                helperText={t('staff.passwordHelper')}
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={handleCloseCreateModal}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" loading={createStaffMutation.isPending}>
                {t('staff.addNew')}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3">
                {t('staff.createdSuccessTitle')}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">{t('auth.email')}:</span>
                    <p className="font-mono font-semibold text-gray-900 dark:text-white">{formData.email}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(formData.email)}
                  >
                    {t('common.copy')}
                  </Button>
                </div>
                <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">{t('staff.password')}:</span>
                    <p className="font-mono font-semibold text-gray-900 dark:text-white">{generatedPassword}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(generatedPassword)}
                  >
                    {t('common.copy')}
                  </Button>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {t('staff.createdSuccessHelper')}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button onClick={handleCloseCreateModal}>
                {t('common.done')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Staff Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        title={t('staff.editTitle')}
        size="md"
      >
        {!showPassword ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            <Input
              label={t('auth.fullName')}
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
            <Input
              label={t('auth.email')}
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              helperText={t('staff.editEmailHelper')}
            />
            <Input
              label={t('customers.phoneNumber')}
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            />
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('staff.resetPasswordOptional')}
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleGeneratePassword}
                  >
                    {t('staff.generateNewPassword')}
                  </Button>
                </div>
                <Input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={t('staff.resetPasswordPlaceholder')}
                  helperText={t('staff.resetPasswordHelper')}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={handleCloseEditModal}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" loading={updateStaffMutation.isPending}>
                {t('staff.updateStaff')}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3">
                {t('staff.updatedSuccessTitle')}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">{t('auth.email')}:</span>
                    <p className="font-mono font-semibold text-gray-900 dark:text-white">{formData.email}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(formData.email)}
                  >
                    {t('common.copy')}
                  </Button>
                </div>
                <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">{t('staff.newPassword')}:</span>
                    <p className="font-mono font-semibold text-gray-900 dark:text-white">{generatedPassword}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(generatedPassword)}
                  >
                    {t('common.copy')}
                  </Button>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {t('staff.updatedSuccessHelper')}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button onClick={handleCloseEditModal}>
                {t('common.done')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
