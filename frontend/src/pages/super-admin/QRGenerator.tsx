import { useEffect, useState } from 'react'
import { isDemoMode, mockBusinesses } from '../../lib/mockData'
import { supabase } from '../../lib/supabase'
import { UI_TIMING, QR_CONFIG } from '../../lib/constants'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import { QrCode, Download, Printer, Copy, Check, Store } from 'lucide-react'
import QRCode from 'qrcode'
import { useTranslation } from 'react-i18next'

interface Business {
  id: string
  name: string
  slug: string
  brand_color: string
  logo_url: string | null
  phone_number: string | null
  email: string | null
  is_active: boolean
}

export default function SuperAdminQRGenerator() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [signupUrl, setSignupUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load all businesses
  useEffect(() => {
    const loadBusinesses = async () => {
      try {
        // DEMO MODE
        if (isDemoMode()) {
          setBusinesses(mockBusinesses as Business[])
          setLoading(false)
          return
        }

        // Real mode
        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .order('name')

        if (error) throw error
        setBusinesses(data || [])
      } catch (error) {
        console.error('Error loading businesses:', error)
      } finally {
        setLoading(false)
      }
    }

    loadBusinesses()
  }, [])

  // Generate QR when business is selected
  useEffect(() => {
    const generateQR = async () => {
      if (!selectedBusinessId) {
        setSelectedBusiness(null)
        setQrDataUrl('')
        setSignupUrl('')
        return
      }

      const business = businesses.find(b => b.id === selectedBusinessId)
      if (!business) return

      setSelectedBusiness(business)

      const url = `${window.location.origin}/signup?business=${business.slug}`
      setSignupUrl(url)

      try {
        const qr = await QRCode.toDataURL(url, {
          width: 500,
          margin: 2,
          color: {
            dark: business.brand_color || '#000000',
            light: '#FFFFFF',
          },
        })
        setQrDataUrl(qr)
      } catch (error) {
        console.error('Error generating QR:', error)
      }
    }

    generateQR()
  }, [selectedBusinessId, businesses])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(signupUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), UI_TIMING.COPY_FEEDBACK_DURATION)
  }

  const handleDownloadQR = () => {
    if (!selectedBusiness) return
    const link = document.createElement('a')
    link.download = `${selectedBusiness.slug}-loyalty-qr.png`
    link.href = qrDataUrl
    link.click()
  }

  const handlePrintQR = () => {
    if (!selectedBusiness) return
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html dir="${isRTL ? 'rtl' : 'ltr'}">
          <head>
            <title>${selectedBusiness.name} - Loyalty QR Code</title>
            <style>
              @page {
                size: A4;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 60px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                text-align: center;
                background: white;
              }
              .header {
                margin-bottom: 40px;
              }
              h1 {
                color: ${selectedBusiness.brand_color || '#0ea5e9'};
                font-size: 48px;
                margin-bottom: 10px;
                font-weight: 800;
              }
              .business-name {
                font-size: 36px;
                color: #334155;
                margin-bottom: 30px;
                font-weight: 600;
              }
              .qr-container {
                background: white;
                padding: 30px;
                border: 8px solid ${selectedBusiness.brand_color || '#0ea5e9'};
                border-radius: 24px;
                display: inline-block;
                margin: 20px auto;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
              }
              img {
                width: 400px;
                height: 400px;
                display: block;
              }
              .instructions {
                margin-top: 40px;
                font-size: 28px;
                color: #475569;
                font-weight: 500;
                line-height: 1.6;
              }
              .benefits {
                margin-top: 40px;
                text-align: ${isRTL ? 'right' : 'left'};
                max-width: 600px;
                margin-left: auto;
                margin-right: auto;
                padding: 0 20px;
              }
              .benefit {
                font-size: 24px;
                margin: 15px 0;
                color: #1e293b;
                font-weight: 500;
              }
              .footer {
                margin-top: 60px;
                font-size: 18px;
                color: #94a3b8;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🎁 ${t('signup.joinOurProgram', 'JOIN OUR LOYALTY PROGRAM!')}</h1>
              <div class="business-name">${selectedBusiness.name}</div>
            </div>
            
            <div class="qr-container">
              <img src="${qrDataUrl}" alt="Loyalty QR Code" />
            </div>
            
            <div class="instructions">
              📱 ${t('card.scanToEarn', 'Scan this QR code with your phone camera')}
            </div>
            
            <div class="benefits">
              <div class="benefit">✅ ${t('signup.benefit1', 'Earn rewards with every visit')}</div>
              <div class="benefit">✅ ${t('signup.benefit2', 'Get exclusive discounts')}</div>
              <div class="benefit">✅ ${t('signup.benefit3', 'Special birthday treats')}</div>
              <div class="benefit">✅ ${t('signup.benefit4', 'Free digital loyalty card')}</div>
            </div>
            
            <div class="footer">
              <p>Powered by SabaaaPass</p>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      
      // Wait for images to load before printing
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('qr.title', 'QR Code Generator')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t('qr.generateQR', 'Generate signup QR codes for your business clients')}
        </p>
      </div>

      {/* Business Selection */}
      <Card title={t('common.selectBusiness', 'Select Business')}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('qr.chooseBusiness', 'Choose a business to generate QR code:')}
            </label>
            <select
              value={selectedBusinessId}
              onChange={(e) => setSelectedBusinessId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              <option value="">-- {t('common.selectBusiness', 'Select Business')} --</option>
              {businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name} {!business.is_active && `(${t('common.inactive', 'Inactive')})`}
                </option>
              ))}
            </select>
          </div>

          {selectedBusiness && (
            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Store className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    {selectedBusiness.name}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    {selectedBusiness.email || selectedBusiness.phone_number || t('common.noContact', 'No contact info')}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Slug: {selectedBusiness.slug} • Color: {selectedBusiness.brand_color}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* QR Code Display */}
      {selectedBusiness && qrDataUrl && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title={t('qr.loyaltySignup', 'Customer Signup QR Code')}>
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div
                  className="p-8 rounded-2xl inline-block bg-white dark:bg-slate-800 shadow-xl"
                  style={{
                    border: `6px solid ${selectedBusiness.brand_color}`,
                  }}
                >
                  <img
                    src={qrDataUrl}
                    alt="Signup QR Code"
                    className="w-80 h-80 mx-auto"
                  />
                </div>
              </div>

              <div>
                <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">
                  {selectedBusiness.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('qr.customerLoyalty', 'Customer Loyalty Program')}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center flex-wrap">
                <Button
                  icon={<Download className="w-4 h-4" />}
                  onClick={handleDownloadQR}
                >
                  {t('common.download', 'Download')}
                </Button>
                <Button
                  icon={<Printer className="w-4 h-4" />}
                  onClick={handlePrintQR}
                  variant="outline"
                >
                  {t('common.print', 'Print')}
                </Button>
              </div>
            </div>
          </Card>

          {/* Instructions and Link */}
          <div className="space-y-6">
            <Card title={t('qr.shareLink', 'Share Signup Link')}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('qr.directURL', 'Direct signup URL:')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={signupUrl}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm font-mono focus:outline-none"
                    />
                    <Button
                      icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      onClick={handleCopyLink}
                      variant={copied ? 'primary' : 'outline'}
                      size="sm"
                    >
                      {copied ? t('common.copied', 'Copied!') : t('common.copy', 'Copy')}
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-900 dark:text-yellow-100 font-semibold mb-2">
                    💡 {t('qr.howToShare', 'How to Share with Business Owner:')}
                  </p>
                  <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                    <li>✓ {t('qr.emailQR', 'Email them the QR image')}</li>
                    <li>✓ {t('qr.sendWhatsApp', 'Send via WhatsApp')}</li>
                    <li>✓ {t('qr.printDeliver', 'Print and deliver')}</li>
                    <li>✓ {t('qr.shareLink', 'Share the signup link')}</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card title={t('qr.instructions', 'Instructions for Business Owner')}>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">1</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{t('qr.step1', 'Display the QR Code')}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {t('qr.step1desc', 'Print and place at counter, entrance, or on tables')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">2</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{t('qr.step2', 'Customers Scan & Sign Up')}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {t('qr.step2desc', 'They scan with phone camera and fill the signup form')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">3</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{t('qr.step3', 'Get Digital Card')}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {t('qr.step3desc', 'Customer receives loyalty card with visual stamps instantly')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">4</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{t('qr.step4', 'Return Visits')}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {t('qr.step4desc', 'Customer gives phone number, staff looks up and adds visit')}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-bold text-green-900 dark:text-green-100 mb-2">
                  🎉 {t('qr.freeSolution', '100% FREE for Your Clients')}
                </h4>
                <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                  <li>✓ {t('qr.free1', 'No SMS costs - QR code signup')}</li>
                  <li>✓ {t('qr.free2', 'No app development needed')}</li>
                  <li>✓ {t('qr.free3', 'Works on all phones instantly')}</li>
                  <li>✓ {t('qr.free4', 'Share via WhatsApp/Email for free')}</li>
                  <li>✓ {t('qr.free5', 'Professional digital loyalty cards')}</li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* No Business Selected */}
      {!selectedBusiness && (
        <Card>
          <div className="text-center py-12">
            <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t('common.selectBusiness', 'Select a Business')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('qr.chooseBusiness', 'Choose a business from the dropdown above to generate their loyalty signup QR code')}
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
