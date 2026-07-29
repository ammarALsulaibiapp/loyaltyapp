import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useTranslation } from 'react-i18next'
import Card from '../../components/ui/Card'
import { MessageSquare, Send, Users, Filter, CheckCircle, XCircle, Clock, AlertTriangle, Wifi, WifiOff, History } from 'lucide-react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
const API_KEY = import.meta.env.VITE_API_KEY

export default function BulkMessaging() {
  const { profile } = useAuthStore()
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'
  const queryClient = useQueryClient()

  const [message, setMessage] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'tier' | 'tag' | 'visits' | 'inactive'>('all')
  const [selectedTier, setSelectedTier] = useState<string>('')
  const [selectedTag, setSelectedTag] = useState<string>('')
  const [minVisits, setMinVisits] = useState<number>(0)
  const [inactiveDays, setInactiveDays] = useState<number>(30)
  const [showPreview, setShowPreview] = useState(false)
  const [sendResults, setSendResults] = useState<any>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [testPhone, setTestPhone] = useState('')
  const [showTestModal, setShowTestModal] = useState(false)

  // Check WhatsApp status for this business
  const { data: whatsappStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['whatsapp-status', profile?.business_id],
    queryFn: async () => {
      if (!profile?.business_id) return null
      try {
        const response = await fetch(`${BACKEND_URL}/api/bulk-messaging/status/${profile.business_id}`, {
          headers: { 'x-api-key': API_KEY }
        })
        const data = await response.json()
        return data.whatsapp || null
      } catch {
        return null
      }
    },
    enabled: !!profile?.business_id,
  })

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

  // Fetch message history
  const { data: messageHistory = [] } = useQuery({
    queryKey: ['bulk-message-history', profile?.business_id],
    queryFn: async () => {
      if (!profile?.business_id) return []
      try {
        const response = await fetch(`${BACKEND_URL}/api/bulk-messaging/history/${profile.business_id}?limit=20`, {
          headers: { 'x-api-key': API_KEY }
        })
        const data = await response.json()
        return data.messages || []
      } catch {
        return []
      }
    },
    enabled: !!profile?.business_id,
  })

  // Send message mutation — REAL WhatsApp sending
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.business_id || !message.trim() || customers.length === 0) return

      const customerPhones = customers.map((c: any) => ({
        phone_number: c.phone_number,
        name: c.full_name || '',
      }))

      const response = await fetch(`${BACKEND_URL}/api/bulk-messaging/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({
          business_id: profile.business_id,
          message: message.trim(),
          customer_phones: customerPhones,
          filter_type: filterType,
          sent_by: profile.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send messages')
      }

      return data
    },
    onSuccess: (data: any) => {
      setSendResults(data?.results || null)
      setMessage('')
      setShowPreview(false)
      queryClient.invalidateQueries({ queryKey: ['bulk-message-history'] })
    },
    onError: (error: any) => {
      alert(isArabic
        ? `❌ فشل الإرسال: ${error.message}`
        : `❌ Failed to send: ${error.message}`
      )
    },
  })

  // Test message mutation
  const testMessageMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.business_id || !testPhone.trim()) return

      const response = await fetch(`${BACKEND_URL}/api/bulk-messaging/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({
          business_id: profile.business_id,
          test_phone_number: testPhone.trim(),
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Test failed')
      return data
    },
    onSuccess: () => {
      alert(isArabic ? '✅ تم إرسال رسالة الاختبار بنجاح!' : '✅ Test message sent successfully!')
      setShowTestModal(false)
      setTestPhone('')
    },
    onError: (error: any) => {
      alert(isArabic
        ? `❌ فشل الاختبار: ${error.message}`
        : `❌ Test failed: ${error.message}`
      )
    },
  })

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><CheckCircle className="w-3 h-3" /> {isArabic ? 'تم الإرسال' : 'Sent'}</span>
      case 'failed':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"><XCircle className="w-3 h-3" /> {isArabic ? 'فشل' : 'Failed'}</span>
      case 'partial':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"><AlertTriangle className="w-3 h-3" /> {isArabic ? 'جزئي' : 'Partial'}</span>
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"><Clock className="w-3 h-3" /> {status}</span>
    }
  }

  if (statusLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  // WhatsApp not configured — show setup prompt
  if (!whatsappStatus?.configured) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isArabic ? 'المراسلة الجماعية' : 'Bulk Messaging'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isArabic ? 'إرسال رسائل واتساب مستهدفة إلى عملائك' : 'Send targeted WhatsApp messages to your customers'}
          </p>
        </div>

        <Card>
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-4">
              <WifiOff className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {isArabic ? 'واتساب غير مفعل' : 'WhatsApp Not Configured'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
              {isArabic
                ? 'لاستخدام المراسلة الجماعية، يجب تفعيل واتساب بيزنس API من قبل المسؤول الفائق (Super Admin). تواصل مع مدير النظام لتفعيل الخدمة لك.'
                : 'To use bulk messaging, WhatsApp Business API must be enabled by your Super Admin. Contact your Super Admin to enable the service for your business.'}
            </p>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-left max-w-lg mx-auto">
              <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                📱 {isArabic ? 'كيفية الإعداد:' : 'How to set up:'}
              </h4>
              <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
                <li>{isArabic ? 'تواصل مع المسؤول الفائق (Super Admin)' : 'Contact your Super Admin'}</li>
                <li>{isArabic ? 'يقوم المسؤول بإدخال بيانات Meta WhatsApp API وتفعيل الخدمة لمتجرك' : 'Super Admin configures your Meta WhatsApp API credentials and enables access'}</li>
                <li>{isArabic ? 'ابدأ بإرسال الرسائل الجماعية فور التفعيل' : 'Start sending bulk messages once enabled'}</li>
              </ol>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isArabic ? 'المراسلة الجماعية' : 'Bulk Messaging'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isArabic ? 'إرسال رسائل واتساب مستهدفة إلى عملائك' : 'Send targeted WhatsApp messages to your customers'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <Wifi className="w-3.5 h-3.5" />
            {isArabic ? 'واتساب متصل' : 'WhatsApp Connected'}
          </span>
          <button
            onClick={() => setShowTestModal(true)}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            {isArabic ? '🧪 إرسال اختبار' : '🧪 Send Test'}
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <History className="w-4 h-4" />
            {isArabic ? 'السجل' : 'History'}
          </button>
        </div>
      </div>

      {/* Send Results */}
      {sendResults && (
        <Card>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${sendResults.failed === 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
              {sendResults.failed === 0
                ? <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                : <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              }
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {isArabic ? 'نتائج الإرسال' : 'Send Results'}
              </h3>
              <div className="flex gap-6 text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {isArabic ? 'الإجمالي' : 'Total'}: <strong>{sendResults.total}</strong>
                </span>
                <span className="text-green-600 dark:text-green-400">
                  ✅ {isArabic ? 'نجح' : 'Sent'}: <strong>{sendResults.sent}</strong>
                </span>
                {sendResults.failed > 0 && (
                  <span className="text-red-600 dark:text-red-400">
                    ❌ {isArabic ? 'فشل' : 'Failed'}: <strong>{sendResults.failed}</strong>
                  </span>
                )}
              </div>
              {sendResults.errors?.length > 0 && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-700 dark:text-red-300">
                  {sendResults.errors.slice(0, 5).map((err: any, i: number) => (
                    <div key={i}>{err.phone}: {err.error}</div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setSendResults(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </Card>
      )}

      {/* Message History */}
      {showHistory && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <History className="w-5 h-5" />
            {isArabic ? 'سجل الرسائل' : 'Message History'}
          </h2>
          {messageHistory.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-6">
              {isArabic ? 'لا توجد رسائل سابقة' : 'No messages sent yet'}
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {messageHistory.map((msg: any) => (
                <div key={msg.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(msg.status || 'pending')}
                      <span className="text-xs text-gray-500">
                        {new Date(msg.created_at).toLocaleString()}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {msg.success_count || 0}/{msg.recipient_count} {isArabic ? 'تم' : 'sent'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {msg.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

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
                  onClick={() => setShowPreview(!showPreview)}
                  disabled={!message.trim() || customers.length === 0}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isArabic ? 'معاينة' : 'Preview'}
                </button>
                <button
                  onClick={() => {
                    if (confirm(isArabic
                      ? `هل أنت متأكد من إرسال هذه الرسالة إلى ${customers.length} عميل عبر واتساب؟`
                      : `Are you sure you want to send this message to ${customers.length} customers via WhatsApp?`
                    )) {
                      sendMessageMutation.mutate()
                    }
                  }}
                  disabled={!message.trim() || customers.length === 0 || sendMessageMutation.isPending}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                  {sendMessageMutation.isPending
                    ? (isArabic ? 'جاري الإرسال...' : 'Sending...')
                    : (isArabic ? `إرسال واتساب (${customers.length})` : `Send WhatsApp (${customers.length})`)
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
                className="px-4 py-2 text-sm text-left bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {isArabic ? '📣 عرض خاص' : '📣 Special Offer'}
              </button>
              <button
                onClick={() => setMessage(isArabic
                  ? '💎 شكراً لولائك! لقد كسبت نقاط مكافأة. قم بزيارتنا قريباً لاستبدالها!'
                  : '💎 Thank you for your loyalty! You\'ve earned bonus points. Visit us soon to redeem!'
                )}
                className="px-4 py-2 text-sm text-left bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {isArabic ? '💎 مكافأة الولاء' : '💎 Loyalty Reward'}
              </button>
              <button
                onClick={() => setMessage(isArabic
                  ? '👋 نفتقدك! عد واحصل على مفاجأة خاصة في انتظارك.'
                  : '👋 We miss you! Come back and get a special surprise waiting for you.'
                )}
                className="px-4 py-2 text-sm text-left bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {isArabic ? '👋 نفتقدك' : '👋 We Miss You'}
              </button>
              <button
                onClick={() => setMessage(isArabic
                  ? '🎂 عيد ميلاد سعيد! استمتع بهدية خاصة منا في زيارتك القادمة!'
                  : '🎂 Happy Birthday! Enjoy a special gift from us on your next visit!'
                )}
                className="px-4 py-2 text-sm text-left bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
              <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {isArabic ? 'الرسائل المرسلة' : 'Messages Sent'}
                  </span>
                </div>
                <span className="font-bold text-purple-600 dark:text-purple-400">
                  {messageHistory.length}
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
                {customers.slice(0, 10).map((customer: any) => (
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
        </div>
      </div>

      {/* Test Message Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              🧪 {isArabic ? 'إرسال رسالة اختبار' : 'Send Test Message'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {isArabic
                ? 'أدخل رقم هاتف لإرسال رسالة اختبار والتحقق من اتصال واتساب API.'
                : 'Enter a phone number to send a test message and verify your WhatsApp API connection.'}
            </p>
            <input
              type="tel"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder={isArabic ? 'مثال: 96812345678' : 'e.g. 96812345678'}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowTestModal(false); setTestPhone('') }}
                className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => testMessageMutation.mutate()}
                disabled={!testPhone.trim() || testMessageMutation.isPending}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {testMessageMutation.isPending
                  ? (isArabic ? 'جاري الإرسال...' : 'Sending...')
                  : (isArabic ? 'إرسال اختبار' : 'Send Test')
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
