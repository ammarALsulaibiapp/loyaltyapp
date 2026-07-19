import { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { isDemoMode, mockBusinesses } from '../../lib/mockData'
import { supabase } from '../../lib/supabase'
import { UI_TIMING, QR_CONFIG } from '../../lib/constants'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { QrCode, Download, Printer, Copy, Check } from 'lucide-react'
import QRCode from 'qrcode'
import { useTranslation } from 'react-i18next'

interface Business {
  id: string
  name: string
  slug: string
  brand_color: string
}

export default function QRGenerator() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const { profile } = useAuthStore()
  const [business, setBusiness] = useState<Business | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [signupUrl, setSignupUrl] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const loadBusiness = async () => {
      if (!profile?.business_id) {
        console.log('❌ No business_id in profile:', profile)
        return
      }

      try {
        console.log('📍 Loading business for ID:', profile.business_id)
        
        // DEMO MODE
        if (isDemoMode()) {
          const mockBiz = mockBusinesses.find(b => b.id === profile.business_id)
          if (mockBiz) {
            console.log('✅ Found mock business:', mockBiz)
            setBusiness(mockBiz as Business)
            const url = `${window.location.origin}/signup?business=${mockBiz.slug}`
            setSignupUrl(url)
            console.log('📝 Signup URL:', url)
            
            // Generate QR code
            console.log('🔄 Generating QR code...')
            const qr = await QRCode.toDataURL(url, {
              width: 400,
              margin: 2,
              color: {
                dark: mockBiz.brand_color || '#000000',
                light: '#FFFFFF',
              },
            })
            console.log('✅ QR Code generated successfully')
            setQrDataUrl(qr)
          } else {
            console.error('❌ Mock business not found')
          }
          return
        }

        // Real mode
        const { data, error } = await supabase
          .from('businesses')
          .select('id, name, slug, brand_color')
          .eq('id', profile.business_id)
          .single()

        if (error) {
          console.error('❌ Supabase error:', error)
          throw error
        }
        
        console.log('✅ Business data:', data)
        setBusiness(data as Business)
        const url = `${window.location.origin}/signup?business=${(data as any).slug}`
        setSignupUrl(url)
        console.log('📝 Signup URL:', url)
        
        // Generate QR code
        console.log('🔄 Generating QR code...')
        const qr = await QRCode.toDataURL(url, {
          width: 400,
          margin: 2,
          color: {
            dark: (data as any).brand_color || '#000000',
            light: '#FFFFFF',
          },
        })
        console.log('✅ QR Code generated successfully, length:', qr.length)
        setQrDataUrl(qr)
      } catch (error) {
        console.error('❌ Error loading business:', error)
      }
    }

    loadBusiness()
  }, [profile])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(signupUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), UI_TIMING.COPY_FEEDBACK_DURATION)
  }

  const handleDownloadQR = () => {
    const link = document.createElement('a')
    link.download = `${business?.slug}-signup-qr.png`
    link.href = qrDataUrl
    link.click()
  }

  const handlePrintQR = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html dir="${isRTL ? 'rtl' : 'ltr'}">
          <head>
            <title>Signup QR Code - ${business?.name}</title>
            <style>
              body {
                margin: 0;
                padding: 40px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                text-align: center;
                background-color: #f8fafc;
              }
              .container {
                max-width: 500px;
                margin: 0 auto;
                background: white;
                padding: 40px;
                border-radius: 24px;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
              }
              h1 {
                color: ${business?.brand_color || '#0ea5e9'};
                margin-bottom: 8px;
                font-size: 28px;
                font-weight: 700;
              }
              p {
                color: #64748b;
                margin-bottom: 30px;
                font-size: 16px;
              }
              img {
                max-width: 320px;
                border: 8px solid ${business?.brand_color || '#0ea5e9'};
                border-radius: 24px;
                padding: 8px;
                background: white;
              }
              .footer {
                margin-top: 30px;
                font-size: 14px;
                color: #94a3b8;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>${t('signup.joinOurProgram', 'Join Our Loyalty Program!')}</h1>
              <p>${business?.name}</p>
              <img src="${qrDataUrl}" alt="Signup QR Code" />
              <div class="footer">
                <p>${t('card.scanToEarn', 'Scan this QR code with your phone to sign up')}</p>
              </div>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  if (!business) {
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
          {t('qr.generateQR', 'Generate signup QR codes for customers')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code Display */}
        <Card title={t('qr.loyaltySignup', 'Customer Signup QR Code')}>
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div
                className="p-6 rounded-2xl inline-block bg-white dark:bg-slate-800/80 shadow-md"
                style={{
                  border: `4px solid ${business.brand_color}`,
                }}
              >
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Signup QR Code"
                    className="w-64 h-64 mx-auto"
                  />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <QrCode className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                {business.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('qr.scanToJoin', 'Customers scan this to join your loyalty program')}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center flex-wrap">
              <Button
                icon={<Download className="w-4 h-4" />}
                onClick={handleDownloadQR}
                variant="outline"
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
          <Card title={t('qr.signupLink', 'Signup Link')}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('qr.shareLink', 'Share this link with customers:')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={signupUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none"
                  />
                  <Button
                    icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    onClick={handleCopyLink}
                    variant={copied ? 'primary' : 'outline'}
                  >
                    {copied ? t('common.copied', 'Copied!') : t('common.copy', 'Copy')}
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>💡 {t('common.tip', 'Tip:')}</strong> {t('qr.tipDesc', 'Share this link via WhatsApp, email, or social media!')}
                </p>
              </div>
            </div>
          </Card>

          <Card title={t('qr.instructions', 'How to Use')}>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">1</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{t('qr.step1', 'Print the QR Code')}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t('qr.step1desc', 'Display it at your counter, entrance, or tables')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">2</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{t('qr.step2', 'Customer Scans')}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t('qr.step2desc', 'They scan the QR code with their phone camera')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">3</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{t('auth.signUp', 'Sign Up')}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t('signup.phoneHelper', 'Customer enters phone, name, and birthday')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">4</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{t('qr.step3', 'Get Digital Card')}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t('qr.step3desc', 'They receive a digital loyalty card instantly')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">5</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{t('qr.step4', 'Next Visit')}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t('qr.step4desc', 'Customer gives phone number or shows their QR code')}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h4 className="font-bold text-yellow-900 dark:text-yellow-100 mb-2">
                🎉 {t('qr.freeSolution', '100% FREE Solution')}
              </h4>
              <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                <li>✓ {t('qr.free1', 'No SMS costs - customers scan QR')}</li>
                <li>✓ {t('qr.free2', 'No app store fees - web-based card')}</li>
                <li>✓ {t('qr.free3', 'Works on ALL phones - Android & iPhone')}</li>
                <li>✓ {t('qr.free4', 'Instant signup - no password needed')}</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
