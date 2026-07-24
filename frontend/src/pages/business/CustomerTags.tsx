import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useTranslation } from 'react-i18next'
import Card from '../../components/ui/Card'
import { Tag, Plus, X, Edit2, Save, Search, Users, Filter } from 'lucide-react'

interface CustomerTag {
  id: string
  business_id: string
  tag_name: string
  tag_color: string
  created_at: string
}

interface CustomerTagAssignment {
  customer_id: string
  tag_id: string
  assigned_at: string
}

const TAG_COLORS = [
  { value: '#3B82F6', label: 'Blue' },
  { value: '#10B981', label: 'Green' },
  { value: '#F59E0B', label: 'Orange' },
  { value: '#EF4444', label: 'Red' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#6366F1', label: 'Indigo' },
  { value: '#14B8A6', label: 'Teal' },
]

export default function CustomerTags() {
  const { profile } = useAuthStore()
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'
  const queryClient = useQueryClient()

  const [isCreatingTag, setIsCreatingTag] = useState(false)
  const [editingTagId, setEditingTagId] = useState<string | null>(null)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0].value)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null)

  // Fetch all tags
  const { data: tags = [], isLoading: tagsLoading } = useQuery({
    queryKey: ['customer-tags', profile?.business_id],
    queryFn: async () => {
      if (!profile?.business_id) return []
      const { data, error } = await supabase
        .from('customer_tags')
        .select('*')
        .eq('business_id', profile.business_id)
        .order('tag_name')
      
      if (error) throw error
      return data as CustomerTag[]
    },
    enabled: !!profile?.business_id,
  })

  // Fetch customers with their tags
  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['customers-with-tags', profile?.business_id, searchQuery, selectedTagFilter],
    queryFn: async () => {
      if (!profile?.business_id) return []
      
      let query = supabase
        .from('customers')
        .select(`
          id,
          phone_number,
          full_name,
          total_visits,
          total_spent,
          customer_tag_assignments(
            tag_id,
            customer_tags(id, tag_name, tag_color)
          )
        `)
        .eq('business_id', profile.business_id)

      // Apply search filter
      if (searchQuery) {
        query = query.or(`phone_number.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) throw error

      // Filter by selected tag if any
      let filteredData = data || []
      if (selectedTagFilter) {
        filteredData = filteredData.filter((customer: any) => 
          customer.customer_tag_assignments?.some((assignment: any) => 
            assignment.customer_tags?.id === selectedTagFilter
          )
        )
      }

      return filteredData
    },
    enabled: !!profile?.business_id,
  })

  // Create tag mutation
  const createTagMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.business_id || !newTagName.trim()) return

      const { error } = await supabase
        .from('customer_tags')
        .insert([{
          business_id: profile.business_id,
          tag_name: newTagName.trim(),
          tag_color: newTagColor,
        }] as any)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-tags'] })
      setNewTagName('')
      setNewTagColor(TAG_COLORS[0].value)
      setIsCreatingTag(false)
    },
  })

  // Update tag mutation
  const updateTagMutation = useMutation({
    mutationFn: async ({ id, tag_name, tag_color }: { id: string; tag_name: string; tag_color: string }) => {
      const { error } = await (supabase as any)
        .from('customer_tags')
        .update({ tag_name, tag_color })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-tags'] })
      queryClient.invalidateQueries({ queryKey: ['customers-with-tags'] })
      setEditingTagId(null)
    },
  })

  // Delete tag mutation
  const deleteTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      // First delete all assignments
      await supabase
        .from('customer_tag_assignments')
        .delete()
        .eq('tag_id', tagId)

      // Then delete the tag
      const { error } = await supabase
        .from('customer_tags')
        .delete()
        .eq('id', tagId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-tags'] })
      queryClient.invalidateQueries({ queryKey: ['customers-with-tags'] })
    },
  })

  // Assign tag to customer
  const assignTagMutation = useMutation({
    mutationFn: async ({ customerId, tagId }: { customerId: string; tagId: string }) => {
      const { error } = await supabase
        .from('customer_tag_assignments')
        .insert([{
          customer_id: customerId,
          tag_id: tagId,
        }] as any)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers-with-tags'] })
    },
  })

  // Remove tag from customer
  const removeTagMutation = useMutation({
    mutationFn: async ({ customerId, tagId }: { customerId: string; tagId: string }) => {
      const { error } = await supabase
        .from('customer_tag_assignments')
        .delete()
        .eq('customer_id', customerId)
        .eq('tag_id', tagId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers-with-tags'] })
    },
  })

  const getCustomerTags = (customer: any) => {
    return customer.customer_tag_assignments?.map((assignment: any) => assignment.customer_tags).filter(Boolean) || []
  }

  const getTagCount = (tagId: string) => {
    return customers.filter((customer: any) =>
      customer.customer_tag_assignments?.some((assignment: any) => assignment.customer_tags?.id === tagId)
    ).length
  }

  if (tagsLoading || customersLoading) {
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
          {isArabic ? 'وسوم العملاء' : 'Customer Tags'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {isArabic ? 'تنظيم وتصنيف عملائك باستخدام الوسوم' : 'Organize and categorize your customers with tags'}
        </p>
      </div>

      {/* Tags Management */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Tag className="w-5 h-5" />
            {isArabic ? 'الوسوم' : 'Tags'}
          </h2>
          {!isCreatingTag && (
            <button
              onClick={() => setIsCreatingTag(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              {isArabic ? 'إضافة وسم' : 'Add Tag'}
            </button>
          )}
        </div>

        {/* Create New Tag Form */}
        {isCreatingTag && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder={isArabic ? 'اسم الوسم' : 'Tag name'}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                {isArabic ? 'اللون:' : 'Color:'}
              </label>
              {TAG_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setNewTagColor(color.value)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    newTagColor === color.value ? 'border-gray-900 dark:border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color.value }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => createTagMutation.mutate()}
                disabled={!newTagName.trim() || createTagMutation.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {createTagMutation.isPending ? (isArabic ? 'جاري الحفظ...' : 'Saving...') : (isArabic ? 'حفظ' : 'Save')}
              </button>
              <button
                onClick={() => {
                  setIsCreatingTag(false)
                  setNewTagName('')
                  setNewTagColor(TAG_COLORS[0].value)
                }}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        )}

        {/* Tags List */}
        <div className="space-y-2">
          {tags.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              {isArabic ? 'لا توجد وسوم بعد. قم بإنشاء وسمك الأول!' : 'No tags yet. Create your first tag!'}
            </p>
          ) : (
            tags.map((tag) => (
              <div key={tag.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {editingTagId === tag.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      defaultValue={tag.tag_name}
                      id={`edit-tag-${tag.id}`}
                      className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                    />
                    <div className="flex gap-1">
                      {TAG_COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => {
                            const input = document.getElementById(`edit-tag-${tag.id}`) as HTMLInputElement
                            updateTagMutation.mutate({
                              id: tag.id,
                              tag_name: input.value,
                              tag_color: color.value,
                            })
                          }}
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: color.value }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => setEditingTagId(null)}
                      className="p-1 text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: tag.tag_color }}
                      />
                      <span className="font-medium text-gray-900 dark:text-white">{tag.tag_name}</span>
                      <span className="text-sm text-gray-500">
                        ({getTagCount(tag.id)} {isArabic ? 'عميل' : 'customers'})
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingTagId(tag.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(isArabic ? `هل تريد حذف الوسم "${tag.tag_name}"؟` : `Delete tag "${tag.tag_name}"?`)) {
                            deleteTagMutation.mutate(tag.id)
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Customers with Tags */}
      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Users className="w-5 h-5" />
            {isArabic ? 'العملاء' : 'Customers'}
          </h2>

          {/* Search and Filter */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isArabic ? 'بحث عن عميل...' : 'Search customers...'}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <select
              value={selectedTagFilter || ''}
              onChange={(e) => setSelectedTagFilter(e.target.value || null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="">{isArabic ? 'كل الوسوم' : 'All Tags'}</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.tag_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Customers List */}
        <div className="space-y-3">
          {customers.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              {isArabic ? 'لا يوجد عملاء' : 'No customers found'}
            </p>
          ) : (
            customers.map((customer: any) => {
              const customerTags = getCustomerTags(customer)
              const unassignedTags = tags.filter(
                (tag) => !customerTags.some((ct: any) => ct.id === tag.id)
              )

              return (
                <div key={customer.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {customer.full_name || customer.phone_number}
                      </h3>
                      <p className="text-sm text-gray-500">{customer.phone_number}</p>
                      <p className="text-sm text-gray-500">
                        {customer.total_visits} {isArabic ? 'زيارة' : 'visits'}
                      </p>
                    </div>
                  </div>

                  {/* Customer's Tags */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {customerTags.map((tag: any) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-white text-sm"
                        style={{ backgroundColor: tag.tag_color }}
                      >
                        {tag.tag_name}
                        <button
                          onClick={() => removeTagMutation.mutate({ customerId: customer.id, tagId: tag.id })}
                          className="hover:bg-white/20 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Add Tag Dropdown */}
                  {unassignedTags.length > 0 && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          assignTagMutation.mutate({ customerId: customer.id, tagId: e.target.value })
                          e.target.value = ''
                        }
                      }}
                      className="text-sm px-3 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">{isArabic ? '+ إضافة وسم' : '+ Add tag'}</option>
                      {unassignedTags.map((tag) => (
                        <option key={tag.id} value={tag.id}>
                          {tag.tag_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )
            })
          )}
        </div>
      </Card>
    </div>
  )
}
