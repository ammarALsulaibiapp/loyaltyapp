import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../../lib/currencies'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import {
  Download,
  FileText,
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  Gift,
  Search,
  Filter,
  ArrowUpRight,
  Sparkles,
  Printer,
  FileSpreadsheet,
} from 'lucide-react'
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from 'date-fns'

type ReportType = 'activity' | 'rewards' | 'retention' | 'revenue'
type DatePreset = 'today' | '7days' | '30days' | 'month' | 'year' | 'all' | 'custom'

export default function ReportsPage() {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'
  const { profile } = useAuthStore()

  const [activeReport, setActiveReport] = useState<ReportType>('activity')
  const [preset, setPreset] = useState<DatePreset>('30days')
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [searchQuery, setSearchQuery] = useState('')

  // Handle Preset Changes
  const applyPreset = (newPreset: DatePreset) => {
    setPreset(newPreset)
    const now = new Date()
    let start = ''
    let end = format(now, 'yyyy-MM-dd')

    switch (newPreset) {
      case 'today':
        start = format(now, 'yyyy-MM-dd')
        break
      case '7days':
        start = format(subDays(now, 7), 'yyyy-MM-dd')
        break
      case '30days':
        start = format(subDays(now, 30), 'yyyy-MM-dd')
        break
      case 'month':
        start = format(startOfMonth(now), 'yyyy-MM-dd')
        end = format(endOfMonth(now), 'yyyy-MM-dd')
        break
      case 'year':
        start = format(startOfYear(now), 'yyyy-MM-dd')
        break
      case 'all':
        start = '2020-01-01'
        break
      default:
        return
    }

    setStartDate(start)
    setEndDate(end)
  }

  // Fetch Business Info
  const { data: business } = useQuery({
    queryKey: ['business-info', profile?.business_id],
    queryFn: async () => {
      if (!profile?.business_id) return null
      const { data } = await supabase
        .from('businesses')
        .select('name, currency, logo_url')
        .eq('id', profile.business_id)
        .single()
      return data as { name: string; currency: string; logo_url: string | null } | null
    },
    enabled: !!profile?.business_id,
  })

  const currency = business?.currency || 'OMR'

  // Query Real Detailed Reports Data Filtered By Date Range
  const { data: reportData, isLoading } = useQuery({
    queryKey: ['enterprise-reports', profile?.business_id, startDate, endDate],
    queryFn: async () => {
      if (!profile?.business_id) return null

      const startISO = `${startDate}T00:00:00`
      const endISO = `${endDate}T23:59:59`

      // 1. Fetch Customers
      const { data: customers = [] } = await supabase
        .from('customers')
        .select('id, full_name, phone_number, membership_tier, total_visits, total_spent, total_points, created_at')
        .eq('business_id', profile.business_id)

      // 2. Fetch Visits in Date Range
      const { data: visits = [] } = await supabase
        .from('visits')
        .select('id, customer_id, visit_date, amount_spent, points_earned, notes, customers(full_name, phone_number)')
        .eq('business_id', profile.business_id)
        .gte('visit_date', startDate)
        .lte('visit_date', endDate)
        .order('visit_date', { ascending: false })

      // 3. Fetch Rewards Redeemed in Date Range
      const { data: rewards = [] } = await supabase
        .from('rewards')
        .select('id, reward_name, reward_description, is_redeemed, redeemed_date, created_at, customer_id, customers(full_name, phone_number)')
        .eq('business_id', profile.business_id)
        .eq('is_redeemed', true)
        .gte('redeemed_date', startISO)
        .lte('redeemed_date', endISO)
        .order('redeemed_date', { ascending: false })

      // 4. Calculate Customer Activity Breakdown
      const customerActivity = (customers || []).map((c: any) => {
        const cVisits = (visits || []).filter((v: any) => v.customer_id === c.id)
        const periodSpent = cVisits.reduce((sum: number, v: any) => sum + (parseFloat(v.amount_spent) || 0), 0)
        return {
          id: c.id,
          name: c.full_name || (isArabic ? 'عميل بدون اسم' : 'Unnamed Customer'),
          phone: c.phone_number,
          tier: c.membership_tier || 'bronze',
          totalVisits: c.total_visits || 0,
          periodVisits: cVisits.length,
          periodSpent,
          totalSpent: c.total_spent || 0,
          points: c.total_points || 0,
          createdAt: c.created_at,
        }
      })

      // 5. Calculate Revenue Breakdown
      const totalRevenue = (visits || []).reduce((sum: number, v: any) => sum + (parseFloat(v.amount_spent) || 0), 0)
      const avgOrderValue = (visits || []).length > 0 ? totalRevenue / (visits || []).length : 0

      // 6. Calculate Retention Metrics
      const activeCustomerIds = new Set((visits || []).map((v: any) => v.customer_id))
      const activeCount = activeCustomerIds.size
      const repeatCustomers = (customers || []).filter((c: any) => c.total_visits > 1).length
      const retentionRate = (customers || []).length > 0 ? Math.round((repeatCustomers / (customers || []).length) * 100) : 0

      return {
        summary: {
          totalCustomers: (customers || []).length,
          activeCustomers: activeCount,
          periodVisits: (visits || []).length,
          totalRevenue,
          avgOrderValue,
          rewardsRedeemed: (rewards || []).length,
          retentionRate,
        },
        customerActivity,
        visits,
        rewards,
      }
    },
    enabled: !!profile?.business_id,
  })

  // Filtered rows based on Search Query
  const filteredCustomerActivity = useMemo(() => {
    if (!reportData?.customerActivity) return []
    if (!searchQuery.trim()) return reportData.customerActivity
    const q = searchQuery.toLowerCase()
    return reportData.customerActivity.filter(
      (item: any) =>
        item.name.toLowerCase().includes(q) || item.phone.includes(q)
    )
  }, [reportData?.customerActivity, searchQuery])

  const filteredVisits = useMemo(() => {
    if (!reportData?.visits) return []
    if (!searchQuery.trim()) return reportData.visits
    const q = searchQuery.toLowerCase()
    return reportData.visits.filter(
      (v: any) =>
        v.customers?.full_name?.toLowerCase().includes(q) ||
        v.customers?.phone_number?.includes(q)
    )
  }, [reportData?.visits, searchQuery])

  const filteredRewards = useMemo(() => {
    if (!reportData?.rewards) return []
    if (!searchQuery.trim()) return reportData.rewards
    const q = searchQuery.toLowerCase()
    return reportData.rewards.filter(
      (r: any) =>
        r.reward_name?.toLowerCase().includes(q) ||
        r.customers?.full_name?.toLowerCase().includes(q) ||
        r.customers?.phone_number?.includes(q)
    )
  }, [reportData?.rewards, searchQuery])

  // Export CSV Handler (Exports full real records)
  const handleExportCSV = () => {
    if (!reportData) return
    let csvRows: string[] = []
    let filename = `report-${activeReport}-${startDate}-to-${endDate}.csv`

    if (activeReport === 'activity') {
      csvRows.push('Customer Name,Phone Number,Tier,Period Visits,Total Visits,Period Spent,Total Spent,Points')
      filteredCustomerActivity.forEach((c: any) => {
        csvRows.push(`"${c.name}","${c.phone}","${c.tier}",${c.periodVisits},${c.totalVisits},${c.periodSpent},${c.totalSpent},${c.points}`)
      })
    } else if (activeReport === 'revenue') {
      csvRows.push('Visit Date,Customer Name,Phone Number,Amount Spent,Points Earned,Notes')
      filteredVisits.forEach((v: any) => {
        csvRows.push(`"${v.visit_date}","${v.customers?.full_name || ''}","${v.customers?.phone_number || ''}",${v.amount_spent || 0},${v.points_earned || 0},"${v.notes || ''}"`)
      })
    } else if (activeReport === 'rewards') {
      csvRows.push('Reward Name,Customer Name,Phone Number,Redeemed Date')
      filteredRewards.forEach((r: any) => {
        csvRows.push(`"${r.reward_name}","${r.customers?.full_name || ''}","${r.customers?.phone_number || ''}","${r.redeemed_date || r.created_at}"`)
      })
    } else if (activeReport === 'retention') {
      csvRows.push('Metric,Value')
      csvRows.push(`Total Customers,${reportData.summary.totalCustomers}`)
      csvRows.push(`Active Customers (Selected Period),${reportData.summary.activeCustomers}`)
      csvRows.push(`Retention Rate,${reportData.summary.retentionRate}%`)
      csvRows.push(`Total Visits,${reportData.summary.periodVisits}`)
    }

    const csvContent = '\uFEFF' + csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  // PDF Print Handler (Renders styled printable document)
  const handlePrintPDF = () => {
    if (!reportData) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const bizName = business?.name || 'SabaaaPass Business'
    const reportTitle =
      activeReport === 'activity'
        ? isArabic ? 'تقرير نشاط العملاء' : 'Customer Activity Report'
        : activeReport === 'revenue'
        ? isArabic ? 'تقرير الإيرادات والمبيعات' : 'Revenue & Sales Report'
        : activeReport === 'rewards'
        ? isArabic ? 'تقرير ملخص المكافآت' : 'Rewards Summary Report'
        : isArabic ? 'تقرير الاحتفاظ بالعملاء' : 'Customer Retention Report'

    let tableHTML = ''

    if (activeReport === 'activity') {
      tableHTML = `
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>${isArabic ? 'اسم العميل' : 'Customer Name'}</th>
              <th>${isArabic ? 'رقم الهاتف' : 'Phone'}</th>
              <th>${isArabic ? 'المستوى' : 'Tier'}</th>
              <th>${isArabic ? 'زيارات الفترة' : 'Period Visits'}</th>
              <th>${isArabic ? 'إنفاق الفترة' : 'Period Spent'}</th>
            </tr>
          </thead>
          <tbody>
            ${filteredCustomerActivity.map((c: any, i: number) => `
              <tr>
                <td>${i + 1}</td>
                <td><strong>${c.name}</strong></td>
                <td>${c.phone}</td>
                <td>${c.tier.toUpperCase()}</td>
                <td>${c.periodVisits}</td>
                <td>${formatCurrency(c.periodSpent, currency, isArabic)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
    } else if (activeReport === 'revenue') {
      tableHTML = `
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>${isArabic ? 'التاريخ' : 'Date'}</th>
              <th>${isArabic ? 'اسم العميل' : 'Customer'}</th>
              <th>${isArabic ? 'الهاتف' : 'Phone'}</th>
              <th>${isArabic ? 'المبلغ' : 'Amount'}</th>
            </tr>
          </thead>
          <tbody>
            ${filteredVisits.map((v: any, i: number) => `
              <tr>
                <td>${i + 1}</td>
                <td>${v.visit_date}</td>
                <td><strong>${v.customers?.full_name || 'Customer'}</strong></td>
                <td>${v.customers?.phone_number || '-'}</td>
                <td>${formatCurrency(v.amount_spent || 0, currency, isArabic)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
    } else if (activeReport === 'rewards') {
      tableHTML = `
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>${isArabic ? 'المكافأة' : 'Reward'}</th>
              <th>${isArabic ? 'اسم العميل' : 'Customer'}</th>
              <th>${isArabic ? 'الهاتف' : 'Phone'}</th>
              <th>${isArabic ? 'تاريخ الاسترداد' : 'Redeemed Date'}</th>
            </tr>
          </thead>
          <tbody>
            ${filteredRewards.map((r: any, i: number) => `
              <tr>
                <td>${i + 1}</td>
                <td><strong>${r.reward_name}</strong></td>
                <td>${r.customers?.full_name || '-'}</td>
                <td>${r.customers?.phone_number || '-'}</td>
                <td>${new Date(r.redeemed_date || r.created_at).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="${isArabic ? 'rtl' : 'ltr'}">
        <head>
          <title>${reportTitle} - ${bizName}</title>
          <style>
            body { font-family: 'Cairo', 'Segoe UI', sans-serif; padding: 30px; color: #0f172a; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: center; border-b: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px; }
            .biz-title { font-size: 22px; font-weight: bold; color: #1e3a8a; }
            .report-title { font-size: 18px; color: #475569; margin-top: 4px; }
            .meta { font-size: 12px; color: #64748b; margin-bottom: 20px; background: #f8fafc; padding: 12px; rounded: 8px; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 25px; }
            .stat-card { background: #f1f5f9; padding: 12px; border-radius: 8px; text-align: center; }
            .stat-val { font-size: 18px; font-weight: bold; color: #0284c7; }
            .stat-lbl { font-size: 11px; color: #64748b; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: ${isArabic ? 'right' : 'left'}; }
            th { background-color: #1e40af; color: white; }
            tr:nth-child(even) { background-color: #f8fafc; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="biz-title">${bizName}</div>
              <div class="report-title">${reportTitle}</div>
            </div>
            <div style="text-align: right; font-size: 12px; color: #64748b;">
              <div>${isArabic ? 'تاريخ التقرير:' : 'Generated:'} ${new Date().toLocaleDateString()}</div>
              <div>${isArabic ? 'النظام:' : 'Platform:'} SabaaaPass Loyalty</div>
            </div>
          </div>

          <div class="meta">
            📅 <strong>${isArabic ? 'الفترة الزمنية:' : 'Date Range:'}</strong> ${startDate} ${isArabic ? 'إلى' : 'to'} ${endDate}
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-val">${reportData.summary.totalCustomers.toLocaleString()}</div>
              <div class="stat-lbl">${isArabic ? 'إجمالي العملاء' : 'Total Customers'}</div>
            </div>
            <div class="stat-card">
              <div class="stat-val">${reportData.summary.periodVisits.toLocaleString()}</div>
              <div class="stat-lbl">${isArabic ? 'زيارات الفترة' : 'Period Visits'}</div>
            </div>
            <div class="stat-card">
              <div class="stat-val">${formatCurrency(reportData.summary.totalRevenue, currency, isArabic)}</div>
              <div class="stat-lbl">${isArabic ? 'إجمالي الإيرادات' : 'Total Revenue'}</div>
            </div>
            <div class="stat-card">
              <div class="stat-val">${reportData.summary.retentionRate}%</div>
              <div class="stat-lbl">${isArabic ? 'معدل الاحتفاظ' : 'Retention Rate'}</div>
            </div>
          </div>

          ${tableHTML}

          <script>
            window.onload = () => { setTimeout(() => { window.print(); }, 400); }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            {isArabic ? 'تقارير وتحليلات الأعمال' : 'Reports & Business Analytics'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isArabic
              ? 'تحليل المبيعات، نشاط العملاء، واستخراج تقارير تفصيلية جاهزة للطباعة والتصدير'
              : 'Analyze sales, customer activity, and export detailed printable reports'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            icon={<FileSpreadsheet className="w-4 h-4 text-green-600" />}
            onClick={handleExportCSV}
            disabled={isLoading || !reportData}
          >
            {isArabic ? 'تصدير Excel / CSV' : 'Export CSV'}
          </Button>
          <Button
            icon={<Printer className="w-4 h-4" />}
            onClick={handlePrintPDF}
            disabled={isLoading || !reportData}
          >
            {isArabic ? 'طباعة / PDF' : 'Print PDF'}
          </Button>
        </div>
      </div>

      {/* Date Range & Preset Controls */}
      <Card>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
            <span className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              {isArabic ? 'الفترة الزمنية للتقرير:' : 'Report Time Period:'}
            </span>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: 'today', label: isArabic ? 'اليوم' : 'Today' },
                { key: '7days', label: isArabic ? '7 أيام' : '7 Days' },
                { key: '30days', label: isArabic ? '30 يوم' : '30 Days' },
                { key: 'month', label: isArabic ? 'هذا الشهر' : 'This Month' },
                { key: 'year', label: isArabic ? 'هذه السنة' : 'This Year' },
                { key: 'all', label: isArabic ? 'الكل' : 'All Time' },
              ].map((p) => (
                <button
                  key={p.key}
                  onClick={() => applyPreset(p.key as DatePreset)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    preset === p.key
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                {isArabic ? 'من تاريخ' : 'Start Date'}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setPreset('custom')
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                {isArabic ? 'إلى تاريخ' : 'End Date'}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setPreset('custom')
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between min-w-0">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">
                {isArabic ? 'إجمالي المبيعات' : 'Total Revenue'}
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1 truncate">
                {formatCurrency(reportData?.summary.totalRevenue || 0, currency, isArabic)}
              </p>
              <p className="text-xs text-gray-400 mt-1 truncate">
                {isArabic ? 'في الفترة المحددة' : 'in selected period'}
              </p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between min-w-0">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">
                {isArabic ? 'زيارات الفترة' : 'Period Visits'}
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1 truncate">
                {(reportData?.summary.periodVisits || 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-1 truncate">
                {isArabic ? 'زيارة مسجلة' : 'recorded visits'}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between min-w-0">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">
                {isArabic ? 'متوسط قيمة الزيارة' : 'Avg Order Value'}
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1 truncate">
                {formatCurrency(reportData?.summary.avgOrderValue || 0, currency, isArabic)}
              </p>
              <p className="text-xs text-gray-400 mt-1 truncate">
                {isArabic ? 'لكل عملية شراء' : 'per visit'}
              </p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400 shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between min-w-0">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">
                {isArabic ? 'المكافآت المستردة' : 'Rewards Claimed'}
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1 truncate">
                {(reportData?.summary.rewardsRedeemed || 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-1 truncate">
                {isArabic ? 'مكافأة مستعملة' : 'redeemed rewards'}
              </p>
            </div>
            <div className="p-3 bg-pink-50 dark:bg-pink-900/30 rounded-xl text-pink-600 dark:text-pink-400 shrink-0">
              <Gift className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Report Selection Tabs */}
      <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl gap-1 overflow-x-auto no-scrollbar">
        {[
          { id: 'activity', label: isArabic ? '👤 نشاط العملاء' : '👤 Customer Activity' },
          { id: 'revenue', label: isArabic ? '💰 سجل الإيرادات' : '💰 Revenue History' },
          { id: 'rewards', label: isArabic ? '🎁 استرداد المكافآت' : '🎁 Rewards Redeemed' },
          { id: 'retention', label: isArabic ? '🔄 تحليل الاحتفاظ' : '🔄 Retention & Churn' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id as ReportType)}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeReport === tab.id
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report Data Table Preview */}
      <Card>
        <div className="space-y-4">
          {/* Table Search Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              {activeReport === 'activity' && (isArabic ? 'بيانات نشاط العملاء' : 'Customer Activity Data')}
              {activeReport === 'revenue' && (isArabic ? 'سجل المبيعات والزيارات' : 'Sales & Visits Log')}
              {activeReport === 'rewards' && (isArabic ? 'سجل استرداد الجوائز' : 'Rewards Redemption Log')}
              {activeReport === 'retention' && (isArabic ? 'ملخص الاحتفاظ بالعملاء' : 'Retention Summary')}
            </h3>

            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder={isArabic ? 'بحث بالاسم أو الهاتف...' : 'Search name or phone...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Table Container */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
              {activeReport === 'activity' && (
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500 font-semibold border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-4 py-3">{isArabic ? 'العميل' : 'Customer'}</th>
                      <th className="px-4 py-3">{isArabic ? 'الهاتف' : 'Phone'}</th>
                      <th className="px-4 py-3">{isArabic ? 'المستوى' : 'Tier'}</th>
                      <th className="px-4 py-3 text-center">{isArabic ? 'زيارات الفترة' : 'Period Visits'}</th>
                      <th className="px-4 py-3 text-center">{isArabic ? 'إجمالي الزيارات' : 'Total Visits'}</th>
                      <th className="px-4 py-3 text-right">{isArabic ? 'أنفق بالفترة' : 'Period Spent'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredCustomerActivity.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-500">
                          {isArabic ? 'لا توجد بيانات مطابقة' : 'No records found'}
                        </td>
                      </tr>
                    ) : (
                      filteredCustomerActivity.map((c: any) => (
                        <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                            {c.name}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.phone}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 uppercase">
                              {c.tier}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-blue-600 dark:text-blue-400">
                            {c.periodVisits}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                            {c.totalVisits}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(c.periodSpent, currency, isArabic)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {activeReport === 'revenue' && (
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500 font-semibold border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-4 py-3">{isArabic ? 'تاريخ الزيارة' : 'Visit Date'}</th>
                      <th className="px-4 py-3">{isArabic ? 'اسم العميل' : 'Customer Name'}</th>
                      <th className="px-4 py-3">{isArabic ? 'رقم الهاتف' : 'Phone'}</th>
                      <th className="px-4 py-3 text-right">{isArabic ? 'المبلغ المستلم' : 'Amount Spent'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredVisits.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-gray-500">
                          {isArabic ? 'لا توجد عمليات للشراء بالفترة المحددة' : 'No visit records in this period'}
                        </td>
                      </tr>
                    ) : (
                      filteredVisits.map((v: any) => (
                        <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                            {v.visit_date}
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">
                            {v.customers?.full_name || (isArabic ? 'عميل زائر' : 'Guest Customer')}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {v.customers?.phone_number || '-'}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(parseFloat(v.amount_spent) || 0, currency, isArabic)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {activeReport === 'rewards' && (
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500 font-semibold border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-4 py-3">{isArabic ? 'المكافأة' : 'Reward'}</th>
                      <th className="px-4 py-3">{isArabic ? 'العميل' : 'Customer'}</th>
                      <th className="px-4 py-3">{isArabic ? 'الهاتف' : 'Phone'}</th>
                      <th className="px-4 py-3 text-right">{isArabic ? 'تاريخ الاسترداد' : 'Redeemed Date'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredRewards.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-gray-500">
                          {isArabic ? 'لا توجد مكافآت مستردة بالفترة المحددة' : 'No reward redemptions in this period'}
                        </td>
                      </tr>
                    ) : (
                      filteredRewards.map((r: any) => (
                        <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-3 font-semibold text-purple-600 dark:text-purple-400">
                            🎁 {r.reward_name}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                            {r.customers?.full_name || '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {r.customers?.phone_number || '-'}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-500">
                            {new Date(r.redeemed_date || r.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {activeReport === 'retention' && (
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {reportData?.summary.totalCustomers.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{isArabic ? 'إجمالي قاعدة العملاء' : 'Total Customer Base'}</p>
                    </div>
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-center">
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {reportData?.summary.activeCustomers.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{isArabic ? 'نشطون في هذه الفترة' : 'Active in Selected Period'}</p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-center">
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {reportData?.summary.retentionRate}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{isArabic ? 'معدل العملاء العائدين' : 'Repeat Customer Rate'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
