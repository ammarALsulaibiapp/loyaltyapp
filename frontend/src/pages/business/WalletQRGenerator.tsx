import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { QrCode, Download, Printer, Copy, Check, Wallet } from 'lucide-react'
import QRCode from 'qrcode'

export default function WalletQRGenerator() {
  const { t } = useTranslation()
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [walletUrl, setWalletUrl] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const generateWalletQR = async () => {
      console.log('💳 Generating Wallet QR code...')
      const url = `${window.location.origin}/wallet/register`
      console.log('📝 Wallet URL:', url)
      setWalletUrl(url)
      
      try {
        console.log('🔄 Creating QR code...')
        const qr = await QRCode.toDataURL(url, {
          width: 400,
          margin: 2,
          color: {
            dark: '#8B5CF6',
            light: '#FFFFFF',
          },
        })
        console.log('✅ Wallet QR generated successfully, length:', qr.length)
        setQrDataUrl(qr)
      } catch (error) {
        console.error('❌ Error generating wallet QR:', error)
      }
    }

    generateWalletQR()
  }, [])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(walletUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadQR = () => {
    const link = document.createElement('a')
    link.download = 'loyalty-wallet-qr.png'
    link.href = qrDataUrl
    link.click()
  }

  const handlePrintQR = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Loyalty Wallet QR Code</title>
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
                color: #8B5CF6;
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
                border: 8px solid #8B5CF6;
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
              <h1>📱 Join Loyalty Wallet</h1>
              <p>Scan to create your digital wallet</p>
              <img src="${qrDataUrl}" alt="Wallet QR Code" />
              <div class="footer">
                <p>Collect stamps from all your favorite shops in one place</p>
              </div>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          💳 Wallet QR Generator
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Generate a QR code for customers to register their digital wallet
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Wallet Registration QR Code">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-6 rounded-2xl inline-block bg-white dark:bg-slate-800/80 shadow-md border-4 border-purple-600">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Wallet QR Code"
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
                📱 Digital Loyalty Wallet
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Customers scan this to create their wallet account
              </p>
            </div>

            <div className="flex gap-3 justify-center flex-wrap">
              <Button
                icon={<Download className="w-4 h-4" />}
                onClick={handleDownloadQR}
                variant="outline"
              >
                Download
              </Button>
              <Button
                icon={<Printer className="w-4 h-4" />}
                onClick={handlePrintQR}
                variant="outline"
              >
                Print
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card title="Wallet Link">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Share this registration link:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={walletUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none"
                  />
                  <Button
                    icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    onClick={handleCopyLink}
                    variant={copied ? 'primary' : 'outline'}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-sm text-purple-900 dark:text-purple-100">
                  <strong>💡 Tip:</strong> Share via WhatsApp, SMS, or display at your counter!
                </p>
              </div>
            </div>
          </Card>

          <Card title="How It Works">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">1</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Customer Scans Wallet QR</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Opens wallet registration page
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">2</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Register Account</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Enter phone, name, and create password
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">3</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Scan Shop QR Codes</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Use wallet scanner to add shops
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">4</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">All Cards in One Place</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    View stamps from multiple shops in wallet
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-bold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Multi-Shop Wallet Benefits
              </h4>
              <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                <li>✓ One wallet for all participating shops</li>
                <li>✓ Customers login with password (secure)</li>
                <li>✓ Access from any device</li>
                <li>✓ Easy to add new shops via QR scanner</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
