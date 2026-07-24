import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useTranslation } from 'react-i18next'
import Card from '../../components/ui/Card'
import { MessageSquare, Send, Users, Filter, Tag, Calendar } from 'lucide-react'

interface Message {
  message: string
  recipients: number
}

export default function BulkMessaging() {
  const { profile } = useAuthStore()
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'

  const [message, setMessage] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'tier' | 'tag' | 'visits' | 'inactive'>('all')
  const [selectedTier, setSelectedTier] = useState<string>('')
  const [selectedTag, setSelectedTag] = useState<string>('')
  const [minVisits, setMinVisits] = useState<number>(0)
  const [inactiveDays, setInactiveDays] = useState<number>(30)
  const [previewRecipients, setPreviewRecipients] = useState<any[]>([])
  const [showPreview, setShowPreview] = useState(false)

  // Fetch tags
  const { data: tags = [] } = useQuery({
    queryKey: ['customer-tags', profile?.business_id],
    queryFn: async () => {
      if (!profile?.business_id) return []
      const { data } = await supabase
        .from('customer_tags')
        .select('*')
        .eq('business_id', profile.business_id)
      return data || []
    },
    enabled: !!profile?.business_id,
  })

  // Fetch customers based on filters
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['bulk-messaging-customers', profile?.business_id, filterType, selectedTier, selectedTag, minVisits, inactiveDays],
    queryFn: async () => {
      if (!profile?.business_id) return []

      let query = supabase
        .from('customers')
        .select(`
          id,
          phone_number,
          full_name,
          tier,
          total_visits,
          updated_at,
          customer_tag_assignments(
            tag_id,
            customer_tags(id, tag_name)
          )
        `)
        .eq('business_id', profile.business_id)

      // Apply filters
      if (filterType === 'tier' && selectedTier) {
        query = query.eq('tier', selectedTier)
      }

      if (filterType === 'visits') {
        query = query.gte('total_visits', minVisits)
      }

      if (filterType === 'inactive') {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - inactiveDays)
        query = query.lt('updated_at', cutoffDate.toISOString())
      }

      const { data, error } = await query

      if (error) throw error

      // Filter by tag if selected
      let filteredData = data || []
      if (filterType === 'tag' && selectedTag) {
        filteredData = filteredData.filter((customer: any) =>
          customer.customer_tag_assignments?.some((assignment: any) =>
            assignment.customer_tags?.id === selectedTag
          )
        )
      }

      return filteredData
    },
    enabled: !!profile?.business_id,
  })

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.business_id || !message.trim() || customers.length === 0) return

      // Create message log
      const { data: messageLog, error: logError } = await supabase
        .from('bulk_messages')
        .insert([{
          business_id: profile.business_id,
          message: message.trim(),
          recipient_count: customers.length,
          filter_type: filterType,
          sent_by: profile.id,
        }] as any)
        .select()
        .single()

      if (logError) throw logError

      // In a real app, you'd integrate with SMS/WhatsApp API here
      // For now, we just log it to the database
      
      return messageLog
    },
    onSuccess: () => {
      alert(isArabic 
        ? `✅ تم إرسال الرسالة إلى ${customers.length} عميل بنجاح!`
        : `✅ Message sent successfully to ${customers.length} customers!`
      )
      setMessage('')
      setShowPreview(false)
    },
    onError: (error: any) => {
      alert(isArabic 
        ? '❌ فشل إرسال الرسالة'
        : '❌ Failed to send message'
      )
      console.error(error)
    },
  })

  // Preview recipients
  const handlePreview = () => {
    setPreviewRecipients(customers.slice(0, 10)) // Show first 10
    setShowPreview(true)
  }

  const getFilterDescription = () => {
    switch (filterType) {
      case 'all':
        return isArabic ? 'جميع العملاء' : 'All customers'
      case 'tier':
        return isArabic ? `المستوى: ${selectedTier}` : `Tier: ${selectedTier}`
      case 'tag':
        const tag: any = tags.find((t: any) => t.id === selectedTag)
        return isArabic ? `الوسم: ${tag?.tag_name}` : `Tag: ${tag?.tag_name}`
      case 'visits':
        return isArabic ? `${minVisits}+ زيارات` : `${minVisits}+ visits`
      case 'inactive':
        return isArabic ? `غير نشط لمدة ${inactiveDays} يوم` : `Inactive for ${inactiveDays} days`
      default:
        return ''
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {isArabic ? 'المراسلة الجماعية' : 'Bulk Messaging'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {isArabic ? 'إرسال رسائل مستهدفة إلى عملائك' : 'Send targeted messages to your customers'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Message Composer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filter Selection */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5" />
              {isArabic ? 'تصفية المستلمين' : 'Filter Recipients'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isArabic ? 'نوع التصفية' : 'Filter Type'}
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">{isArabic ? 'جميع العملاء' : 'All Customers'}</option>
                  <option value="tier">{isArabic ? 'حسب المستوى' : 'By Tier'}</option>
                  <option value="tag">{isArabic ? 'حسب الوسم' : 'By Tag'}</option>
                  <option value="visits">{isArabic ? 'حسب عدد الزيارات' : 'By Visit Count'}</option>
                  <option value="inactive">{isArabic ? 'العملاء غير النشطين' : 'Inactive Customers'}</option>
                </select>
              </div>

              {/* Tier Filter */}
              {filterType === 'tier' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {isArabic ? 'المستوى' : 'Tier'}
                  </label>
                  <select
                    value={selectedTier}
                    onChange={(e) => setSelectedTier(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">{isArabic ? 'اختر المستوى' : 'Select tier'}</option>
                    <option value="vip">VIP</option>
                    <option value="gold">Gold</option>
                    <option value="silver">Silver</option>
                    <option value="bronze">Bronze</option>
                  </select>
                </div>
              )}

              {/* Tag Filter */}
              {filterType === 'tag' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {isArabic ? 'الوسم' : 'Tag'}
                  </label>
                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">{isArabic ? 'اختر الوسم' : 'Select tag'}</option>
                    {tags.map((tag: any) => (
                      <option key={tag.id} value={tag.id}>
                        {tag.tag_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Visits Filter */}
              {filterType === 'visits' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {isArabic ? 'الحد الأدنى من الزيارات' : 'Minimum Visits'}
                  </label>
                  <input
                    type="number"
                    value={minVisits}
                    onChange={(e) => setMinVisits(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    min="0"
                  />
                </div>
              )}

              {/* Inactive Days Filter */}
              {filterType === 'inactive' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {isArabic ? 'عدد الأيام غير النشطة' : 'Inactive Days'}
                  </label>
                  <input
                    type="number"
                    value={inactiveDays}
                    onChange={(e) => setInactiveDays(parseInt(e.target.value) || 30)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    min="1"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {isArabic ? 'المستلمون المحددون:' : 'Selected recipients:'}
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {customers.length} {isArabic ? 'عميل' : 'customers'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Message Composer */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5" />
              {isArabic ? 'كتابة الرسالة' : 'Compose Message'}
            </h2>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={isArabic 
                ? 'اكتب رسالتك هنا...'
                : 'Write your message here...'
              }
              className="w-full h-48 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white resize-none"
            />

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {message.length} {isArabic ? 'حرف' : 'characters'}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handlePreview}
                  disabled={!message.trim() || customers.length === 0}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isArabic ? 'معاينة' : 'Preview'}
                </button>
                <button
                  onClick={() => sendMessageMutation.mutate()}
                  disabled={!message.trim() || customers.length === 0 || sendMessageMutation.isPending}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  {sendMessageMutation.isPending 
                    ? (isArabic ? 'جاري الإرسال...' : 'Sending...') 
                    : (isArabic ? 'إرسال' : 'Send')
                  }
                </button>
              </div>
            </div>
          </Card>

          {/* Quick Message Templates */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {isArabic ? 'قوالب سريعة' : 'Quick Templates'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <button
                onClick={() => setMessage(isArabic 
                  ? '🎉 عرض خاص! احصل على خصم 20٪ على زيارتك القادمة. صالح لمدة 7 أيام فقط!'
                  : '🎉 Special offer! Get 20% off your next visit. Valid for 7 days only!'
                )}
                className="px-4 py-2 text-sm text-left bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
              >
                {isArabic ? '📣 عرض خاص' : '📣 Special Offer'}
              </button>
              <button
                onClick={() => setMessage(isArabic 
                  ? '💎 شكراً لولائك! لقد كسبت نقاط مكافأة. قم بزيارتنا قريباً لاستبدالها!'
                  : '💎 Thank you for your loyalty! You\'ve earned bonus points. Visit us soon to redeem!'
                )}
                className="px-4 py-2 text-sm text-left bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
              >
                {isArabic ? '💎 مكافأة الولاء' : '💎 Loyalty Reward'}
              </button>
              <button
                onClick={() => setMessage(isArabic 
                  ? '👋 نفتقدك! عد واحصل على مفاجأة خاصة في انتظارك.'
                  : '👋 We miss you! Come back and get a special surprise waiting for you.'
                )}
                className="px-4 py-2 text-sm text-left bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
              >
                {isArabic ? '👋 نفتقدك' : '👋 We Miss You'}
              </button>
              <button
                onClick={() => setMessage(isArabic 
                  ? '🎂 عيد ميلاد سعيد! استمتع بهدية خاصة منا في زيارتك القادمة!'
                  : '🎂 Happy Birthday! Enjoy a special gift from us on your next visit!'
                )}
                className="px-4 py-2 text-sm text-left bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
              >
                {isArabic ? '🎂 عيد ميلاد' : '🎂 Birthday'}
              </button>
            </div>
          </Card>
        </div>

        {/* Right: Preview & Stats */}
        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {isArabic ? 'الإحصائيات' : 'Statistics'}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {isArabic ? 'المستلمون' : 'Recipients'}
                  </span>
                </div>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {customers.length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {isArabic ? 'التصفية' : 'Filter'}
                  </span>
                </div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {getFilterDescription()}
                </span>
              </div>
            </div>
          </Card>

          {/* Preview Recipients */}
          {showPreview && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {isArabic ? 'معاينة المستلمين' : 'Preview Recipients'}
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {previewRecipients.map((customer: any) => (
                  <div key={customer.id} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {customer.full_name || customer.phone_number}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {customer.phone_number}
                    </div>
                  </div>
                ))}
                {customers.length > 10 && (
                  <p className="text-center text-sm text-gray-500 pt-2">
                    {isArabic 
                      ? `+ ${customers.length - 10} المزيد من العملاء`
                      : `+ ${customers.length - 10} more customers`
                    }
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Important Note */}
          <Card>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
                {isArabic ? '⚠️ ملاحظة مهمة' : '⚠️ Important Note'}
              </h4>
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                {isArabic 
                  ? 'هذه الميزة تسجل الرسائل في النظام. قم بدمج خدمة SMS/WhatsApp API للإرسال الفعلي.'
                  : 'This feature logs messages in the system. Integrate SMS/WhatsApp API for actual sending.'
                }
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
