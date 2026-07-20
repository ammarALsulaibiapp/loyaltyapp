import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { isDemoMode, mockInvoices, mockBusinesses } from '../../lib/mockData'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import { useTranslation } from 'react-i18next'
import { Plus, FileText, CheckCircle, Search, Trash2, Filter } from 'lucide-react'
import { format } from 'date-fns'

interface Invoice {
  id: string
  business_id: string
  invoice_number: string
  amount: number
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  issue_date: string
  due_date: string
  paid_date: string | null
  businesses: {
    name: string
    currency?: string
  }
}

export default function InvoicesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<Invoice | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [formData, setFormData] = useState({
    business_id: '',
    amount: '',
    issue_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
  })

  const generateInvoiceHTML = (invoice: Invoice, lang: 'en' | 'ar') => {
    const isAr = lang === 'ar'
    const dir = isAr ? 'rtl' : 'ltr'
    const fontClass = isAr ? "font-family: 'Cairo', sans-serif;" : "font-family: 'Inter', sans-serif;"
    
    const invoiceStatus = invoice?.status || 'pending'
    const amountVal = typeof invoice?.amount === 'number' ? invoice.amount : parseFloat(invoice?.amount || '0') || 0
    const invoiceNum = invoice?.invoice_number || 'N/A'
    const businessName = invoice?.businesses?.name || 'Unknown Business'
    const currencyCode = invoice?.businesses?.currency || 'USD'
    
    // Currency symbols - different for English vs Arabic
    const currencySymbolsAr: Record<string, string> = {
      'OMR': 'ر.ع.',
      'SAR': 'ر.س',
      'AED': 'د.إ',
      'KWD': 'د.ك',
      'BHD': 'د.ب',
      'QAR': 'ر.ق',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'EGP': 'ج.م',
      'JOD': 'د.ا',
    }
    
    const currencySymbolsEn: Record<string, string> = {
      'OMR': 'OMR',
      'SAR': 'SAR',
      'AED': 'AED',
      'KWD': 'KWD',
      'BHD': 'BHD',
      'QAR': 'QAR',
      'USD': 'USD',
      'EUR': 'EUR',
      'GBP': 'GBP',
      'EGP': 'EGP',
      'JOD': 'JOD',
    }
    
    const currency = isAr ? (currencySymbolsAr[currencyCode] || currencyCode) : (currencySymbolsEn[currencyCode] || currencyCode)

    const statusLabels = {
      paid: isAr ? 'مدفوع' : 'PAID',
      pending: isAr ? 'معلق' : 'PENDING',
      overdue: isAr ? 'متأخر' : 'OVERDUE',
      cancelled: isAr ? 'ملغي' : 'CANCELLED',
    }

    const statusColors = {
      paid: 'color: #16a34a; background-color: #f0fdf4;',
      pending: 'color: #ca8a04; background-color: #fef9c3;',
      overdue: 'color: #dc2626; background-color: #fef2f2;',
      cancelled: 'color: #4b5563; background-color: #f3f4f6;',
    }

    const labels = {
      invoice: isAr ? 'فاتورة' : 'INVOICE',
      invoiceNumber: isAr ? 'رقم الفاتورة' : 'Invoice Number',
      issueDate: isAr ? 'تاريخ الإصدار' : 'Issue Date',
      dueDate: isAr ? 'تاريخ الاستحقاق' : 'Due Date',
      business: isAr ? 'الشركة / المشترك' : 'Business / Subscriber',
      amount: isAr ? 'المبلغ' : 'Amount',
      status: isAr ? 'الحالة' : 'Status',
      description: isAr ? 'الوصف' : 'Description',
      platformFee: isAr ? 'اشتراك منصة سبأ باس للولاء الرقمي' : 'SabaaaPass Digital Loyalty Platform Subscription',
      total: isAr ? 'المجموع الإجمالي' : 'Total Amount',
      thankYou: isAr ? 'شكراً لتعاملكم معنا!' : 'Thank you for your business!',
      billedBy: isAr ? 'الجهة المصدرة' : 'Billed By',
      platformName: 'SabaaaPass',
      platformAddress: isAr ? 'سلطنة عمان' : 'Sultanate of Oman',
      platformEmail: 'support@sabaasoul.com',
    }

    let issueDateFormatted = 'N/A'
    let dueDateFormatted = 'N/A'
    try {
      if (invoice?.issue_date) {
        issueDateFormatted = format(new Date(invoice.issue_date), 'yyyy-MM-dd')
      }
      if (invoice?.due_date) {
        dueDateFormatted = format(new Date(invoice.due_date), 'yyyy-MM-dd')
      }
    } catch (e) {
      console.error(e)
    }

    return `
      <!DOCTYPE html>
      <html lang="${lang}" dir="${dir}">
      <head>
        <meta charset="utf-8">
        <title>${labels.invoice} - ${invoiceNum}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body {
            ${fontClass}
          }
          @media print {
            body {
              background-color: white;
              color: black;
            }
            .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body class="bg-gray-50 text-gray-800 p-6 md:p-12">
        <div class="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <div class="flex justify-end gap-3 mb-8 no-print">
            <button onclick="window.print()" class="px-4 py-2 bg-[#ff6b9d] text-white font-semibold rounded-lg text-sm shadow hover:opacity-90 transition">
              ${isAr ? 'طباعة / حفظ كـ PDF' : 'Print / Save as PDF'}
            </button>
            <button onclick="window.close()" class="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg text-sm hover:bg-gray-300 transition">
              ${isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>

          <div class="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-6 mb-8 gap-4">
            <div class="flex items-center gap-3">
              <img src="https://mahfazaty.sabaasoul.com/logo.png" alt="SabaaaPass" style="width: 48px; height: 48px; border-radius: 12px;">
              <div>
                <h1 class="text-3xl font-extrabold text-[#3B82F6]">${labels.invoice}</h1>
                <p class="text-sm text-gray-500 mt-1">${labels.invoiceNumber}: <span class="font-bold text-gray-700">${invoiceNum}</span></p>
              </div>
            </div>
            <div class="text-end">
              <span class="px-3 py-1.5 rounded-full text-xs font-bold uppercase" style="${statusColors[invoiceStatus] || ''}">
                ${statusLabels[invoiceStatus] || invoiceStatus}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 text-[14px]">
            <div>
              <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">${labels.billedBy}</h3>
              <p class="font-bold text-gray-900 text-[15px]">${labels.platformName}</p>
              <p class="text-gray-600 mt-1">${labels.platformAddress}</p>
              <p class="text-gray-500 mt-0.5">${labels.platformEmail}</p>
            </div>

            <div>
              <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">${labels.business}</h3>
              <p class="font-bold text-gray-900 text-[15px]">${businessName}</p>
              <p class="text-gray-600 mt-1">${labels.invoiceNumber}: ${invoiceNum}</p>
              <div class="flex gap-4 mt-2 text-xs text-gray-500">
                <div><strong>${labels.issueDate}:</strong> ${issueDateFormatted}</div>
                <div><strong>${labels.dueDate}:</strong> ${dueDateFormatted}</div>
              </div>
            </div>
          </div>

          <div class="border border-gray-100 rounded-lg overflow-hidden mb-8">
            <table class="w-full text-left md:text-start">
              <thead class="bg-gray-50 text-gray-500 text-xs font-bold border-b border-gray-100">
                <tr>
                  <th class="py-3 px-4 text-[12px] uppercase">${labels.description}</th>
                  <th class="py-3 px-4 text-end text-[12px] uppercase">${labels.amount}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 text-[13px]">
                <tr>
                  <td class="py-4 px-4 font-medium text-gray-900">
                    ${labels.platformFee}
                  </td>
                  <td class="py-4 px-4 text-end font-semibold text-gray-900">
                    ${amountVal.toFixed(2)} ${currency}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex justify-end mb-8">
            <div class="w-full md:w-64 border-t border-gray-200 pt-4">
              <div class="flex justify-between items-center text-gray-900">
                <span class="font-bold text-[14px]">${labels.total}</span>
                <span class="text-xl font-extrabold text-[#ff6b9d]">${amountVal.toFixed(2)} ${currency}</span>
              </div>
            </div>
          </div>

          <div class="text-center border-t border-gray-100 pt-6 mt-12 text-sm text-gray-400">
            <p class="italic">${labels.thankYou}</p>
            <p class="text-xs mt-1">&copy; ${new Date().getFullYear()} ${labels.platformName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  const handlePrintInvoice = (invoice: Invoice, lang: 'en' | 'ar') => {
    const htmlContent = generateInvoiceHTML(invoice, lang)
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
    }
  }

  // Fetch invoices
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      // DEMO MODE: Use mock data
      if (isDemoMode()) {
        return mockInvoices as Invoice[]
      }

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          businesses (
            name,
            currency
          )
        `)
        .order('issue_date', { ascending: false })

      if (error) throw error
      return data as Invoice[]
    },
  })

  // Fetch businesses for dropdown
  const { data: businesses } = useQuery({
    queryKey: ['businesses-list'],
    queryFn: async () => {
      // DEMO MODE: Use mock data
      if (isDemoMode()) {
        return mockBusinesses.filter(b => b.is_active).map(b => ({ id: b.id, name: b.name }))
      }

      const { data, error } = await supabase
        .from('businesses')
        .select('id, name')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return data
    },
  })

  // Mark invoice as paid
  const markPaidMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await (supabase
        .from('invoices') as any)
        .update({
          status: 'paid',
          paid_date: new Date().toISOString(),
        })
        .eq('id', invoiceId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })

  // Delete invoice mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      if (isDemoMode()) {
        const index = mockInvoices.findIndex(inv => inv.id === invoiceId)
        if (index > -1) mockInvoices.splice(index, 1)
        return
      }

      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      alert('✅ Invoice deleted successfully!')
    },
  })

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    if (!invoices) return []
    
    return invoices.filter(invoice => {
      const matchesSearch = 
        invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.businesses.name.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [invoices, searchQuery, statusFilter])

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (newInvoice: typeof formData) => {
      const invoiceNumber = `INV-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`
      
      if (isDemoMode()) {
        const business = businesses?.find(b => b.id === newInvoice.business_id)
        const businessName = business?.name || 'Unknown Business'
        const businessCurrency = (business as any)?.currency || 'OMR'
        ;(mockInvoices as any).unshift({
          id: Math.random().toString(),
          business_id: newInvoice.business_id,
          invoice_number: invoiceNumber,
          amount: parseFloat(newInvoice.amount),
          status: 'pending' as const,
          issue_date: newInvoice.issue_date,
          due_date: newInvoice.due_date,
          paid_date: null,
          businesses: {
            name: businessName,
            currency: businessCurrency,
          }
        })
        return
      }

      const { error } = await (supabase
        .from('invoices') as any)
        .insert([{
          business_id: newInvoice.business_id,
          invoice_number: invoiceNumber,
          amount: parseFloat(newInvoice.amount),
          status: 'pending',
          issue_date: newInvoice.issue_date,
          due_date: newInvoice.due_date,
        }])

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      setIsModalOpen(false)
      setFormData({
        business_id: '',
        amount: '',
        issue_date: format(new Date(), 'yyyy-MM-dd'),
        due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.business_id || !formData.amount) return
    createInvoiceMutation.mutate(formData)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-800'
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('invoices.title', 'Invoices')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('invoices.manageInvoices', 'Manage invoices and payments')}
          </p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
          {t('invoices.generateInvoice', 'Generate Invoice')}
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by invoice number or business name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredInvoices.length} of {invoices?.length || 0} invoices
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-start py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {t('invoices.invoiceNumber', 'Invoice Number')}
                </th>
                <th className="text-start py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {t('invoices.business', 'Business')}
                </th>
                <th className="text-start py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {t('invoices.amount', 'Amount')}
                </th>
                <th className="text-start py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {t('invoices.status', 'Status')}
                </th>
                <th className="text-start py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {t('invoices.issueDate', 'Issue Date')}
                </th>
                <th className="text-start py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {t('invoices.dueDate', 'Due Date')}
                </th>
                <th className="text-start py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {t('invoices.actions', 'Actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices?.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                    {invoice.invoice_number}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {invoice.businesses.name}
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    {invoice.amount.toFixed(2)} {(() => {
                      const currencyCode = invoice.businesses.currency || 'USD'
                      const symbolsAr: Record<string, string> = {
                        'OMR': 'ر.ع.',
                        'SAR': 'ر.س',
                        'AED': 'د.إ',
                        'KWD': 'د.ك',
                        'BHD': 'د.ب',
                        'QAR': 'ر.ق',
                        'USD': '$',
                        'EUR': '€',
                        'GBP': '£',
                        'EGP': 'ج.م',
                        'JOD': 'د.ا',
                      }
                      return symbolsAr[currencyCode] || currencyCode
                    })()}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        invoice.status
                      )}`}
                    >
                      {t(`invoices.${invoice.status}`, invoice.status.toUpperCase())}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {format(new Date(invoice.issue_date), 'MMM dd, yyyy')}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {invoice.status === 'pending' && (
                        <button
                          onClick={() => markPaidMutation.mutate(invoice.id)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          title={t('invoices.markAsPaid', 'Mark as Paid')}
                        >
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedInvoiceForPrint(invoice)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        title={t('invoices.printInvoice', 'Print Invoice')}
                      >
                        <FileText className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Delete this invoice? This cannot be undone.')) {
                            deleteInvoiceMutation.mutate(invoice.id)
                          }
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        title="Delete Invoice"
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

      {/* Generate Invoice Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('invoices.generateInvoice', 'Generate Invoice')}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('invoices.business', 'Business')}
            </label>
            <select
              value={formData.business_id}
              onChange={(e) => setFormData({ ...formData, business_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              required
            >
              <option value="">{t('common.select', 'Select a business')}</option>
              {businesses?.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label={t('invoices.amount', 'Amount')}
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />
          <Input
            label={t('invoices.issueDate', 'Issue Date')}
            type="date"
            value={formData.issue_date}
            onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
            required
          />
          <Input
            label={t('invoices.dueDate', 'Due Date')}
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            required
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" disabled={createInvoiceMutation.isPending}>
              {createInvoiceMutation.isPending ? t('common.loading', 'Generating...') : t('invoices.generateInvoice', 'Generate Invoice')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Print Options Modal */}
      <Modal
        isOpen={!!selectedInvoiceForPrint}
        onClose={() => setSelectedInvoiceForPrint(null)}
        title={t('invoices.printInvoice', 'Print / Download Invoice')}
        size="sm"
      >
        <div className="space-y-4 py-2 text-start">
          <p className="text-[13px] text-gray-600 dark:text-gray-400">
            {t('invoices.choosePrintLanguage', 'Choose the language to generate the invoice in:')}
          </p>
          <div className="flex flex-col gap-2.5 pt-2">
            <button
              onClick={() => {
                if (selectedInvoiceForPrint) {
                  handlePrintInvoice(selectedInvoiceForPrint, 'en')
                  setSelectedInvoiceForPrint(null)
                }
              }}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg text-[13px] transition flex items-center justify-center gap-2"
            >
              English Invoice
            </button>
            <button
              onClick={() => {
                if (selectedInvoiceForPrint) {
                  handlePrintInvoice(selectedInvoiceForPrint, 'ar')
                  setSelectedInvoiceForPrint(null)
                }
              }}
              className="w-full py-2 bg-gradient-to-r from-[#ff6b9d] to-[#ff8eb3] hover:shadow text-white font-semibold rounded-lg text-[13px] transition flex items-center justify-center gap-2"
            >
              الفاتورة باللغة العربية (Arabic Invoice)
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
