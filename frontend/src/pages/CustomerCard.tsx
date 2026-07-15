import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLanguageStore } from '../stores/languageStore'
import { useTranslation } from 'react-i18next'
import { Gift, Award, Activity, QrCode as QrCodeIcon, Coffee, Star, Download, Wallet } from 'lucide-react'
import QRCode from 'qrcode'
import { isDemoMode, mockCustomers, mockRewards, mockLoyaltyPrograms } from '../lib/mockData'
import { generateSecureWalletURL } from '../lib/walletSecurity'

interface CustomerData {
  id: string
  business_id: string
  full_name: string | null
  phone_number: string
  total_visits: number
  total_points: number
  membership_tier: string
  qr_code: string
  birthday: string | null
  businesses: {
    name: string
    logo_url: string | null
    brand_color: string
  }
}

interface Reward {
  id: string
  reward_name: string
  reward_description: string | null
  earned_date: string
}

interface LoyaltyProgramProgress {
  program_name: string
  program_type: string
  current_progress: number
  required_amount: number
  reward_name: string
}

export default function CustomerCard() {
  const { customerId } = useParams()
  const { language } = useLanguageStore()
  const { t } = useTranslation()
  const [customer, setCustomer] = useState<CustomerData | null>(null)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loyaltyProgress, setLoyaltyProgress] = useState<LoyaltyProgramProgress[]>([])
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)


  // Update manifest dynamically for this business
  useEffect(() => {
    if (customer) {
      const cardUrl = `/card/${customer.id}`
      
      const manifestData = {
        name: `${customer.businesses.name} Loyalty Card`,
        short_name: customer.businesses.name,
        description: `${customer.full_name || 'Your'} loyalty card for ${customer.businesses.name}`,
        start_url: cardUrl,
        display: 'standalone',
        background_color: customer.businesses.brand_color || '#0ea5e9',
        theme_color: customer.businesses.brand_color || '#0ea5e9',
        orientation: 'portrait',
        scope: '/',
        icons: customer.businesses.logo_url ? [
          {
            src: customer.businesses.logo_url,
            sizes: 'any',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ] : [
          {
            src: '/vite.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }

      // Create a blob URL for the dynamic manifest
      const manifestBlob = new Blob([JSON.stringify(manifestData)], { type: 'application/json' })
      const manifestURL = URL.createObjectURL(manifestBlob)

      // Update manifest link
      let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement
      if (!manifestLink) {
        manifestLink = document.createElement('link')
        manifestLink.rel = 'manifest'
        document.head.appendChild(manifestLink)
      }
      manifestLink.href = manifestURL

      // Add apple-mobile-web-app-capable for iOS
      let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-capable"]') as HTMLMetaElement
      if (!appleMeta) {
        appleMeta = document.createElement('meta')
        appleMeta.name = 'apple-mobile-web-app-capable'
        appleMeta.content = 'yes'
        document.head.appendChild(appleMeta)
      }

      // Update theme color
      let themeColor = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement
      if (!themeColor) {
        themeColor = document.createElement('meta')
        themeColor.name = 'theme-color'
        document.head.appendChild(themeColor)
      }
      themeColor.content = customer.businesses.brand_color || '#0ea5e9'

      // Update page title
      document.title = `${customer.businesses.name} - ${customer.full_name || 'Loyalty Card'}`

      return () => {
        URL.revokeObjectURL(manifestURL)
      }
    }
  }, [customer])

  useEffect(() => {
    if (!customerId) {
      setError('No customer ID provided')
      setLoading(false)
      return
    }

    // Store customer ID in localStorage for PWA shortcut
    localStorage.setItem('loyaltyCardCustomerId', customerId)

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Add a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          if (loading) {
            setError('Loading timeout. Please try again or open in your default browser.')
            setLoading(false)
          }
        }, 10000) // 10 second timeout
        
        // DEMO MODE: Use mock data
        if (isDemoMode()) {
          const mockCustomer = mockCustomers.find(c => c.id === customerId)
          if (mockCustomer) {
            const customerData = {
              ...mockCustomer,
              businesses: {
                name: 'Coffee Paradise',
                logo_url: null,
                brand_color: '#8B4513',
              }
            }
            setCustomer(customerData as CustomerData)

            // Mock rewards
            const mockCustomerRewards = mockRewards.filter(r => r.customer_id === customerId)
            setRewards(mockCustomerRewards)

            // Mock loyalty program progress
            const businessPrograms = mockLoyaltyPrograms.filter(
              p => p.business_id === (mockCustomer as any).business_id && p.is_active
            )
            const progressData: LoyaltyProgramProgress[] = businessPrograms.map((program: any) => {
              let current = 0
              let required = 0
              
              if (program.type === 'visit_based') {
                current = mockCustomer.total_visits % (program.required_visits || 5)
                required = program.required_visits || 5
              } else if (program.type === 'stamp_card') {
                current = mockCustomer.total_visits % (program.required_stamps || 8)
                required = program.required_stamps || 8
              } else if (program.type === 'points_based') {
                current = mockCustomer.total_points % (program.points_for_reward || 100)
                required = program.points_for_reward || 100
              }
              
              return {
                program_name: program.name,
                program_type: program.type,
                current_progress: current,
                required_amount: required,
                reward_name: program.reward_name,
              }
            })
            setLoyaltyProgress(progressData)

            // Generate QR code
            if (mockCustomer.qr_code) {
              const qrUrl = await QRCode.toDataURL(mockCustomer.qr_code, {
                width: 200,
                margin: 2,
              })
              setQrDataUrl(qrUrl)
            }
          } else {
            setError('Customer not found in demo data')
          }
          setLoading(false)
          clearTimeout(timeoutId)
          return
        }

        // Real Supabase fetch
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select(`
            *,
            businesses (
              name,
              logo_url,
              brand_color
            )
          `)
          .eq('id', customerId)
          .single()

        if (customerError) throw customerError
        setCustomer(customerData as CustomerData)

        // Fetch available rewards
        const { data: rewardsData, error: rewardsError } = await supabase
          .from('rewards')
          .select('*')
          .eq('customer_id', customerId)
          .eq('is_redeemed', false)

        if (rewardsError) throw rewardsError
        setRewards(rewardsData as any[])

        // Fetch loyalty programs and calculate progress
        const { data: programsData, error: programsError } = await supabase
          .from('loyalty_programs')
          .select('*')
          .eq('business_id', (customerData as any).business_id)
          .eq('is_active', true)

        if (!programsError && programsData) {
          const progressPromises = (programsData as any[]).map(async (program: any) => {
            let current = 0
            let required = 0

            // Use customer's total_visits instead of customer_program_progress
            const progressRow = { 
              visit_count: (customerData as any).total_visits || 0, 
              total_points: (customerData as any).total_points || 0, 
              total_spent: (customerData as any).total_spent || 0 
            }

            if (program.type === 'visit_based') {
              current = ((progressRow as any)?.visit_count || 0) % (program.required_visits || 5)
              required = program.required_visits || 5
            } else if (program.type === 'stamp_card') {
              current = ((progressRow as any)?.visit_count || 0) % (program.required_stamps || 8)
              required = program.required_stamps || 8
            } else if (program.type === 'points_based') {
              current = ((progressRow as any)?.total_points || 0) % (program.points_for_reward || 100)
              required = program.points_for_reward || 100
            }

            return {
              program_name: program.name,
              program_type: program.type,
              current_progress: current,
              required_amount: required,
              reward_name: program.reward_name,
            }
          })
          const resolvedProgress = await Promise.all(progressPromises)
          setLoyaltyProgress(resolvedProgress)
        }

        // Generate QR code
        if ((customerData as any).qr_code) {
          const qrUrl = await QRCode.toDataURL((customerData as any).qr_code, {
            width: 200,
            margin: 2,
          })
          setQrDataUrl(qrUrl)
        }
        
        clearTimeout(timeoutId)
      } catch (error: any) {
        console.error('Error fetching customer data:', error)
        setError(error.message || 'Failed to load customer card')
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Refresh data every 30 seconds (only in real mode)
    if (!isDemoMode()) {
      const interval = setInterval(fetchData, 30000)
      return () => clearInterval(interval)
    }
  }, [customerId])

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#87CEEB] via-[#ADD8E6] to-[#B0E0E6] p-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Card</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all"
            >
              Retry
            </button>
            <button 
              onClick={() => {
                const url = window.location.href
                window.open(url, '_blank')
              }}
              className="px-6 py-3 bg-gray-600 text-white rounded-xl font-medium hover:bg-gray-700 transition-all"
            >
              Open in Browser
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#87CEEB] via-[#ADD8E6] to-[#B0E0E6] p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-700 text-center font-medium">Loading your card...</p>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#87CEEB] via-[#ADD8E6] to-[#B0E0E6] p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Card Not Found</h1>
          <p className="text-gray-600">This loyalty card does not exist or has been removed.</p>
          <p className="text-sm text-gray-500 mt-4">Customer ID: {customerId}</p>
        </div>
      </div>
    )
  }

  const brandColor = customer.businesses.brand_color || '#0ea5e9'
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return '#CD7F32'
      case 'silver': return '#C0C0C0'
      case 'gold': return '#FFD700'
      case 'vip': return '#9333EA'
      default: return '#6B7280'
    }
  }



  const handleAddToGoogleWallet = async () => {
    if (!customer) return

    try {
      setLoading(true)
      
      // Call our backend API to generate Google Wallet URL
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/wallet/google/${customer.id}`)
      
      if (!response.ok) {
        throw new Error('Failed to generate Google Wallet pass')
      }
      
      const data = await response.json()
      
      if (data.success && data.addToWalletUrl) {
        // Open Google Wallet URL
        window.open(data.addToWalletUrl, '_blank')
      } else {
        throw new Error(data.error || 'Unknown error')
      }
      
    } catch (error) {
      console.error('Google Wallet error:', error)
      alert('Failed to add to Google Wallet. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  // Render visual stamps (like Kyan example)
  const renderStamps = (current: number, total: number, type: string) => {
    const stamps = []
    for (let i = 0; i < total; i++) {
      const isFilled = i < current
      stamps.push(
        <div key={i} className="flex flex-col items-center">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isFilled
                ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            {type === 'stamp_card' || type === 'visit_based' ? (
              isFilled ? (
                <Coffee className="w-6 h-6 text-white" />
              ) : (
                <Coffee className="w-6 h-6 text-gray-400" />
              )
            ) : (
              isFilled ? (
                <Star className="w-6 h-6 text-white" fill="white" />
              ) : (
                <Star className="w-6 h-6 text-gray-400" />
              )
            )}
          </div>
        </div>
      )
    }
    return stamps
  }

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Animated Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 dark:bg-blue-600/20 blur-[100px] animate-blob" />
      <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] rounded-full bg-purple-400/20 dark:bg-purple-600/20 blur-[100px] animate-blob" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-[-10%] left-[20%] w-[35%] h-[35%] rounded-full bg-pink-400/20 dark:bg-pink-600/20 blur-[100px] animate-blob" style={{ animationDelay: '4s' }} />

      {/* Card Container with red/gradient header like Kyan */}
      <div className="relative z-10 max-w-2xl mx-auto py-8">
        {/* Header with gradient (matching Kyan style) */}
        <div
          className="h-32 relative rounded-t-3xl overflow-hidden shadow-lg mx-4 flex items-center justify-between px-6"
          style={{
            background: `linear-gradient(135deg, ${brandColor} 0%, #1a1a1a 100%)`,
          }}
        >
          <div></div>
          {/* Wallet icon removed for privacy - business should not see customer's other loyalty cards */}
        </div>

        {/* Main Card */}
        <div className="glass-panel dark:glass-panel-dark rounded-b-3xl -mt-4 relative mx-4 mb-8 border border-white/20 dark:border-slate-700/50">
          {/* Logo positioned at top */}
          {customer.businesses.logo_url && (
            <div className={`absolute -top-12 ${language === 'ar' ? 'right-6' : 'left-6'} transform hover:scale-105 transition-transform duration-300`}>
              <div className="w-24 h-24 bg-white rounded-2xl p-3 shadow-xl ring-4 ring-white/50 dark:ring-gray-800/50 flex items-center justify-center">
                <img
                  src={customer.businesses.logo_url}
                  alt={customer.businesses.name}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}

          {/* Card Content */}
          <div className="pt-8 px-6 pb-6">
            {/* Business name at top if no logo, or below logo */}
            {!customer.businesses.logo_url && (
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {customer.businesses.name}
              </h1>
            )}

            {/* Stamp Cards Grid - Clean White Style */}
            {loyaltyProgress.length > 0 && (
              <div className="mt-8 mb-8">
                {loyaltyProgress.map((progress, idx) => {
                  const stamps = Array.from({ length: progress.required_amount }, (_, i) => i < progress.current_progress)
                  const isCompleted = progress.current_progress >= progress.required_amount
                  
                    return (
                    <div key={idx} className="mb-8 bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-2xl">
                      {/* Business Header */}
                      <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                        {customer.businesses.logo_url && (
                          <img
                            src={customer.businesses.logo_url}
                            alt={customer.businesses.name}
                            className="w-16 h-16 object-contain"
                            style={{background: 'transparent'}}
                          />
                        )}
                        <div>
                          <h3 className="text-gray-900 dark:text-white font-bold text-lg">{customer.businesses.name}</h3>
                          <p className="text-gray-500 dark:text-gray-400 text-sm">{progress.program_name}</p>
                        </div>
                      </div>

                      {/* Stamps Grid - 4 columns */}
                      <div className="grid grid-cols-4 gap-4 mb-6">
                        {stamps.map((filled, i) => (
                          <div key={i} className="flex justify-center">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all ${
                              filled 
                                ? 'bg-gray-50 dark:bg-gray-800' 
                                : 'bg-white dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-700'
                            }`}>
                              {customer.businesses.logo_url && (
                                <img 
                                  src={customer.businesses.logo_url} 
                                  alt={filled ? "stamp" : "empty"} 
                                  className={`object-contain ${filled ? 'w-14 h-14' : 'w-10 h-10 opacity-30 grayscale'}`}
                                  style={{background: 'transparent'}}
                                />
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {/* Gift icon for completed reward */}
                        {isCompleted && (
                          <div className="flex justify-center">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-xl animate-pulse">
                              <Gift className="w-12 h-12 text-white" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Progress Info */}
                      <div className="mt-6 flex justify-between items-center">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider mb-1">
                            {t('card.remainingUntilGift')}
                          </p>
                          <p className="text-gray-900 dark:text-white text-3xl font-black">
                            {progress.required_amount - progress.current_progress}
                          </p>
                        </div>
                        <div className="text-end">
                          <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider mb-1">
                            {t('card.hello')}
                          </p>
                          <p className="text-gray-900 dark:text-white text-2xl font-bold">
                            {customer.full_name?.split(' ')[0] || t('card.friend')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* QR Code at bottom - Kyan Style */}
            {qrDataUrl && (
              <div className="text-center border-t-2 border-gray-200 dark:border-gray-700 pt-6">
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="mx-auto w-48 h-48 mb-4"
                />
                
                {/* Add to Wallet Buttons */}
                <div className="space-y-3">
                  {/* Apple Wallet Button (iOS - Ready for future) */}
                  {/iPhone|iPad|iPod/.test(navigator.userAgent) && (
                    <button
                      onClick={async () => {
                        // Future: handleAddToAppleWallet()
                        alert('Apple Wallet integration coming soon! 🍎\n\nWe\'ll add this feature when you get your iOS Developer Account ($99/year)')
                      }}
                      className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-black to-gray-800 hover:from-gray-900 hover:to-black text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 opacity-75"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                      </svg>
                      <span>Add to Apple Wallet (Soon)</span>
                    </button>
                  )}

                  {/* Google Wallet Button (Android) */}
                  {/Android/.test(navigator.userAgent) && (
                    <button
                      onClick={handleAddToGoogleWallet}
                      disabled={loading}
                      className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                    >
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                      </svg>
                      <span>Add to Google Wallet</span>
                    </button>
                  )}

                </div>
              </div>
            )}

            {/* Available Rewards Section */}
            {rewards.length > 0 && (
              <div className="mt-6 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-yellow-600" />
                  {t('card.availableRewards')} ({rewards.length})
                </h3>
                <div className="space-y-4">
                  {rewards.map((reward) => (
                    <div
                      key={reward.id}
                      className="group p-5 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 border-2 border-yellow-200/50 dark:border-yellow-700/50 rounded-2xl shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                          <Gift className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">{reward.reward_name}</p>
                          {reward.reward_description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {reward.reward_description}
                            </p>
                          )}
                          <div className="mt-3 inline-block px-3 py-1 bg-yellow-100 dark:bg-yellow-900/50 rounded-full">
                            <p className="text-xs text-yellow-800 dark:text-yellow-300 font-bold uppercase tracking-wider">
                              ✨ {t('card.readyToRedeem')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


    </div>
  )
}
