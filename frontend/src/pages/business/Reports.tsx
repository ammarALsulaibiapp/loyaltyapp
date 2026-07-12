import { useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Download, FileText, BarChart3, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function ReportsPage() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  })

  const reports = [
    {
      id: 1,
      keyName: 'reports.customerActivity',
      keyDesc: 'reports.customerActivityDesc',
      name: 'Customer Activity Report',
      description: 'Detailed customer visit and spending patterns',
      icon: TrendingUp,
      color: 'blue',
    },
    {
      id: 2,
      keyName: 'reports.rewardsSummary',
      keyDesc: 'reports.rewardsSummaryDesc',
      name: 'Rewards Summary',
      description: 'Rewards earned and redeemed statistics',
      icon: FileText,
      color: 'green',
    },
    {
      id: 3,
      keyName: 'reports.customerRetention',
      keyDesc: 'reports.customerRetentionDesc',
      name: 'Customer Retention',
      description: 'Customer retention and churn analysis',
      icon: BarChart3,
      color: 'purple',
    },
    {
      id: 4,
      keyName: 'reports.revenueReport',
      keyDesc: 'reports.revenueReportDesc',
      name: 'Revenue Report',
      description: 'Financial overview and revenue trends',
      icon: TrendingUp,
      color: 'yellow',
    },
  ]

  const handleGenerateReport = (reportId: number, format: 'pdf' | 'excel' | 'csv') => {
    // Generate report data
    const reportData = {
      id: reportId,
      generated: new Date().toISOString(),
      dateRange,
      data: {
        totalCustomers: 268,
        totalVisits: 1245,
        totalRewards: 156,
        revenue: '$8,500',
      }
    }

    if (format === 'csv') {
      // Generate CSV
      const csvContent = `Report Generated,${reportData.generated}\nDate Range,${dateRange.start} to ${dateRange.end}\n\nMetric,Value\nTotal Customers,${reportData.data.totalCustomers}\nTotal Visits,${reportData.data.totalVisits}\nTotal Rewards,${reportData.data.totalRewards}\nRevenue,${reportData.data.revenue}`
      
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${reportId}-${Date.now()}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      alert(t('reports.csvSuccess', '✅ CSV report downloaded!'))
    } else if (format === 'excel') {
      // Generate simple Excel-compatible CSV
      const csvContent = `Report Generated,${reportData.generated}\nDate Range,${dateRange.start} to ${dateRange.end}\n\nMetric,Value\nTotal Customers,${reportData.data.totalCustomers}\nTotal Visits,${reportData.data.totalVisits}\nTotal Rewards,${reportData.data.totalRewards}\nRevenue,${reportData.data.revenue}`
      
      const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${reportId}-${Date.now()}.xls`
      a.click()
      window.URL.revokeObjectURL(url)
      alert(t('reports.excelSuccess', '✅ Excel report downloaded!'))
    } else {
      // PDF - Create a printable HTML version
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html dir="${isRTL ? 'rtl' : 'ltr'}">
            <head>
              <title>Report ${reportId}</title>
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background-color: #f8fafc; }
                .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
                h1 { color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: ${isRTL ? 'right' : 'left'}; }
                th { background-color: #0ea5e9; color: white; }
                .meta { color: #64748b; margin: 10px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>${t('reports.title', 'Reports')} #${reportId}</h1>
                <div class="meta">${t('common.date', 'Date')}: ${new Date().toLocaleString()}</div>
                <div class="meta">${t('reports.startDate', 'Start Date')}: ${dateRange.start} ${t('reports.endDate', 'End Date')}: ${dateRange.end}</div>
                <table>
                  <tr><th>${t('reports.metric', 'Metric')}</th><th>${t('reports.value', 'Value')}</th></tr>
                  <tr><td>${t('reports.totalCustomers', 'Total Customers')}</td><td>${reportData.data.totalCustomers}</td></tr>
                  <tr><td>${t('reports.totalVisits', 'Total Visits')}</td><td>${reportData.data.totalVisits}</td></tr>
                  <tr><td>${t('reports.rewardsGiven', 'Rewards Given')}</td><td>${reportData.data.totalRewards}</td></tr>
                  <tr><td>${t('invoices.amount', 'Amount')}</td><td>${reportData.data.revenue}</td></tr>
                </table>
              </div>
              <script>
                window.onload = () => {
                  setTimeout(() => {
                    window.print()
                  }, 500)
                }
              </script>
            </body>
          </html>
        `)
        printWindow.document.close()
      }
      alert(t('reports.pdfSuccess', '✅ PDF report opened! Use browser print to save as PDF.'))
    }
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('reports.title', 'Reports')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t('reports.generateExport', 'Generate and export business analytics')}
        </p>
      </div>

      {/* Date Range Filter */}
      <Card title={t('reports.parameters', 'Report Parameters')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('reports.startDate', 'Start Date')}
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('reports.endDate', 'End Date')}
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </Card>

      {/* Available Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => {
          const Icon = report.icon
          return (
            <Card key={report.id}>
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 bg-primary-100/50 dark:bg-primary-950/40 rounded-lg`}
                >
                  <Icon className={`w-6 h-6 text-primary-600 dark:text-primary-400`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    {t(report.keyName, report.name)}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t(report.keyDesc, report.description)}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<Download className="w-4 h-4" />}
                      onClick={() => handleGenerateReport(report.id, 'pdf')}
                    >
                      PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<Download className="w-4 h-4" />}
                      onClick={() => handleGenerateReport(report.id, 'excel')}
                    >
                      Excel
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<Download className="w-4 h-4" />}
                      onClick={() => handleGenerateReport(report.id, 'csv')}
                    >
                      CSV
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Quick Stats */}
      <Card title={t('reports.quickStatistics', 'Quick Statistics')} subtitle={t('reports.overview', 'Overview of key metrics')}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">268</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('reports.totalCustomers', 'Total Customers')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">1,245</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('reports.totalVisits', 'Total Visits')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">156</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('reports.rewardsGiven', 'Rewards Given')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">78%</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('reports.retentionRate', 'Retention Rate')}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
