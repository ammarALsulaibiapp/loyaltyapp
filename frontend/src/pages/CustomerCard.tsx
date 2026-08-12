import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLanguageStore } from '../stores/languageStore'
import { useTranslation } from 'react-i18next'
import {
  Gift,
  Award,
  Coffee,
  Star,
  ArrowLeft,
  ArrowRight,
  QrCode as QrCodeIcon,
  Sparkles,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Share2,
} from 'lucide-react'
import QRCode from 'qrcode'
import { isDemoMode, mockCustomers, mockRewards, mockLoyaltyPrograms } from '../lib/mockData'

interface CustomerData {
  id: string
  business_id: string
  full_name: string | null
  phone_number: string
  total_visits: number
  total_points: number
  membership_tier: string
  qr_code: string
  created_at?: string
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
  const navigate = useNavigate()
  const { language, toggleLanguage } = useLanguageStore()
  const { t, i18n } = useTranslation()
  const isArabic = language === 'ar'

  const [customer, setCustomer] = useState<CustomerData | null>(null)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loyaltyProgress, setLoyaltyProgress] = useState<LoyaltyProgramProgress[]>([])
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    i18n.changeLanguage(language)
  }, [language, i18n])

  // Dynamic PWA Manifest & Theme Color
  useEffect(() => {
    if (customer) {
      const cardUrl = `/card/${customer.id}`
      
      const manifestData = {
        name: `${customer.businesses.name} Loyalty Card`,
        short_name: customer.businesses.name,
        description: `${customer.full_name || 'Customer'} loyalty pass for ${customer.businesses.name}`,
        start_url: cardUrl,
        display: 'standalone',
        background_color: customer.businesses.brand_color || '#3b82f6',
        theme_color: customer.businesses.brand_color || '#3b82f6',
        orientation: 'portrait',
        scope: '/',
        icons: customer.businesses.logo_url ? [
          {
            src: customer.businesses.logo_url,
            sizes: 'any',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ] : []
      }

      const manifestBlob = new Blob([JSON.stringify(manifestData)], { type: 'application/json' })
      const manifestURL = URL.createObjectURL(manifestBlob)

      let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement
      if (!manifestLink) {
        manifestLink = document.createElement('link')
        manifestLink.rel = 'manifest'
        document.head.appendChild(manifestLink)
      }
      manifestLink.href = manifestURL

      let themeColor = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement
      if (!themeColor) {
        themeColor = document.createElement('meta')
        themeColor.name = 'theme-color'
        document.head.appendChild(themeColor)
      }
      themeColor.content = customer.businesses.brand_color || '#3b82f6'

      document.title = `${customer.businesses.name} - ${customer.full_name || t('card.loyaltyCard', 'Loyalty Card')}`

      return () => {
        URL.revokeObjectURL(manifestURL)
      }
    }
  }, [customer, t])

  useEffect(() => {
    if (!customerId) {
      setError(isArabic ? 'لم يتم العثور على المعرف' : 'No customer ID provided')
      setLoading(false)
      return
    }

    localStorage.setItem('loyaltyCardCustomerId', customerId)

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        if (isDemoMode()) {
          const mockCustomer = mockCustomers.find(c => c.id === customerId)
          if (mockCustomer) {
            const customerData = {
              ...mockCustomer,
              businesses: {
                name: 'Coffee Paradise',
                logo_url: null,
                brand_color: '#3b82f6',
              }
            }
            setCustomer(customerData as CustomerData)

            const mockCustomerRewards = mockRewards.filter(r => r.customer_id === customerId)
            setRewards(mockCustomerRewards)

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

            if (mockCustomer.qr_code) {
              const qrUrl = await QRCode.toDataURL(mockCustomer.qr_code, {
                width: 240,
                margin: 2,
                color: {
                  dark: '#0f172a',
                  light: '#ffffff',
                }
              })
              setQrDataUrl(qrUrl)
            }
          } else {
            setError(isArabic ? 'العميل غير موجود' : 'Customer not found')
          }
          setLoading(false)
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

        if (!rewardsError && rewardsData) {
          setRewards(rewardsData as any[])
        }

        // Fetch active loyalty programs
        const { data: programsData, error: programsError } = await supabase
          .from('loyalty_programs')
          .select('*')
          .eq('business_id', (customerData as any).business_id)
          .eq('is_active', true)

        if (!programsError && programsData) {
          const progressRows = (programsData as any[]).map((program: any) => {
            let current = 0
            let required = 5

            if (program.type === 'visit_based') {
              required = program.required_visits || 5
              current = ((customerData as any)?.total_visits || 0) % required
            } else if (program.type === 'stamp_card') {
              required = program.required_stamps || 8
              current = ((customerData as any)?.total_visits || 0) % required
            } else if (program.type === 'points_based') {
              required = program.points_for_reward || 100
              current = ((customerData as any)?.total_points || 0) % required
            }

            return {
              program_name: program.name,
              program_type: program.type,
              current_progress: current,
              required_amount: required,
              reward_name: program.reward_name,
            }
          })
          setLoyaltyProgress(progressRows)
        }

        // Generate QR code
        if ((customerData as any).qr_code) {
          const qrUrl = await QRCode.toDataURL((customerData as any).qr_code, {
            width: 240,
            margin: 2,
            color: {
              dark: '#0f172a',
              light: '#ffffff',
            }
          })
          setQrDataUrl(qrUrl)
        }
      } catch (err: any) {
        console.error('Error loading customer card:', err)
        setError(err.message || (isArabic ? 'فشل تحميل بيانات البطاقة' : 'Failed to load loyalty card'))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [customerId, isArabic])

  const handleAddToGoogleWallet = async () => {
    if (!customer) return
    try {
      setLoading(true)
      const token = localStorage.getItem('token') || ''
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
      const response = await fetch(`${backendUrl}/api/wallet/google-pass/${customer.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to generate Google Wallet pass')
      const data = await response.json()
      if (data.success && data.addToWalletUrl) {
        window.open(data.addToWalletUrl, '_blank')
      } else {
        throw new Error(data.error || 'Unknown error')
      }
    } catch (error: any) {
      alert(isArabic ? 'فشل الحفظ في Google Wallet' : 'Failed to add to Google Wallet')
    } finally {
      setLoading(false)
    }
  }

  // Get Tier Styling
  const getTierBadge = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'vip':
        return { label: isArabic ? 'عضوية VIP' : 'VIP Pass', bg: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white', icon: Sparkles }
      case 'gold':
        return { label: isArabic ? 'عضوية ذهبية' : 'Gold Pass', bg: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white', icon: Star }
      case 'silver':
        return { label: isArabic ? 'عضوية فضية' : 'Silver Pass', bg: 'bg-gradient-to-r from-slate-400 to-slate-600 text-white', icon: ShieldCheck }
      default:
        return { label: isArabic ? 'عضوية برونزية' : 'Bronze Pass', bg: 'bg-gradient-to-r from-amber-700 to-amber-900 text-white', icon: Award }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
        <p className="text-slate-400 text-sm">{isArabic ? 'جاري تحميل بطاقة الولاء...' : 'Loading loyalty pass...'}</p>
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4" dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm text-center">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{isArabic ? 'تعذر العثور على البطاقة' : 'Pass Not Found'}</h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate('/wallet')}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all"
          >
            {isArabic ? 'العودة إلى المحفظة' : 'Return to Wallet'}
          </button>
        </div>
      </div>
    )
  }

  const brandColor = customer.businesses.brand_color || '#2563eb'
  const tierInfo = getTierBadge(customer.membership_tier)
  const TierIcon = tierInfo.icon

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16 selection:bg-blue-500 selection:text-white" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Background Glow Effect */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-96 blur-[120px] opacity-30 pointer-events-none"
        style={{ background: brandColor }}
      />

      {/* Floating Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/wallet')}
            className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 transition-all"
          >
            {isArabic ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{isArabic ? 'المحفظة' : 'Wallet'}</span>
          </button>

          <div className="text-center truncate px-2">
            <h2 className="text-xs font-bold text-white truncate">{customer.businesses.name}</h2>
            <p className="text-[10px] text-slate-400 truncate">{customer.full_name || customer.phone_number}</p>
          </div>

          <button
            onClick={() => toggleLanguage()}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-all"
          >
            {language === 'en' ? 'عربي' : 'EN'}
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-6 space-y-6 relative z-10">
        {/* Apple Wallet Style Hero Pass Card */}
        <div
          className="relative rounded-3xl p-6 overflow-hidden shadow-2xl border border-white/20 transition-all duration-300 transform hover:scale-[1.01]"
          style={{
            background: `linear-gradient(145deg, ${brandColor}dd 0%, #090d16 100%)`,
          }}
        >
          {/* Decorative Pass Header Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top Business Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white p-1.5 shadow-xl flex items-center justify-center overflow-hidden shrink-0">
                {customer.businesses.logo_url ? (
                  <img
                    src={customer.businesses.logo_url}
                    alt={customer.businesses.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {customer.businesses.name?.charAt(0)?.toUpperCase() || 'S'}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-extrabold text-white truncate drop-shadow-md">
                  {customer.businesses.name}
                </h1>
                <p className="text-xs text-white/80 font-medium">
                  {isArabic ? 'بطاقة الولاء الرقمية' : 'Digital Membership Pass'}
                </p>
              </div>
            </div>

            {/* Tier Badge */}
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md ${tierInfo.bg}`}>
              <TierIcon className="w-3 h-3" />
              {tierInfo.label}
            </span>
          </div>

          {/* Customer Profile Info */}
          <div className="bg-slate-950/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] text-white/60 uppercase font-bold tracking-wider">
                {isArabic ? 'حامل البطاقة' : 'Pass Holder'}
              </p>
              <p className="text-sm font-bold text-white mt-0.5 truncate">
                {customer.full_name || (isArabic ? 'عميلنا العزيز' : 'Valued Customer')}
              </p>
              <p className="text-xs text-white/70">{customer.phone_number}</p>
            </div>

            <div className="text-right">
              <p className="text-[10px] text-white/60 uppercase font-bold tracking-wider">
                {isArabic ? 'النقاط' : 'Points'}
              </p>
              <p className="text-lg font-black text-amber-400 mt-0.5">
                {(customer.total_points || 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Pass Footer Metrics */}
          <div className="flex items-center justify-between text-xs text-white/80 pt-2 border-t border-white/10">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              {isArabic ? 'بطاقة نشطة وجاهزة' : 'Active Pass'}
            </span>
            <span className="font-bold">
              {isArabic ? 'إجمالي الزيارات:' : 'Total Visits:'} {(customer.total_visits || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Loyalty Programs & Stamp Progress Cards */}
        {loyaltyProgress.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider px-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              {isArabic ? 'تقدم المكافآت والأختام' : 'Stamp Progress & Rewards'}
            </h3>

            {loyaltyProgress.map((program, idx) => {
              const remaining = Math.max(0, program.required_amount - program.current_progress)
              const isCompleted = program.current_progress >= program.required_amount

              return (
                <div
                  key={idx}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden space-y-4"
                >
                  {/* Program Title & Reward Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-white text-sm">{program.program_name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <Gift className="w-3.5 h-3.5 text-pink-400" />
                        <span>{isArabic ? 'الجائزة:' : 'Reward:'}</span>
                        <strong className="text-slate-200">{program.reward_name}</strong>
                      </p>
                    </div>

                    <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {program.current_progress} / {program.required_amount}
                    </span>
                  </div>

                  {/* Stamp Tokens Grid */}
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 py-2">
                    {Array.from({ length: program.required_amount }).map((_, stampIdx) => {
                      const isStamped = stampIdx < program.current_progress
                      const isNext = stampIdx === program.current_progress

                      return (
                        <div
                          key={stampIdx}
                          className={`aspect-square rounded-2xl flex items-center justify-center transition-all ${
                            isStamped
                              ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 scale-105'
                              : isNext
                              ? 'bg-slate-800 border-2 border-dashed border-amber-400 text-amber-400 animate-pulse'
                              : 'bg-slate-950/80 border border-slate-800 text-slate-600'
                          }`}
                        >
                          {isStamped ? (
                            customer.businesses.logo_url ? (
                              <img 
                                src={customer.businesses.logo_url}
                                alt="stamp"
                                className="w-6 h-6 object-contain"
                              />
                            ) : (
                              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                            )
                          ) : (
                            customer.businesses.logo_url ? (
                              <img 
                                src={customer.businesses.logo_url}
                                alt="stamp"
                                className="w-5 h-5 object-contain opacity-30 grayscale"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-dashed border-slate-600" />
                            )
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Remaining Counter */}
                  <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">
                      {isCompleted
                        ? (isArabic ? '🎉 مبروك! حققت الجائزة' : '🎉 Congratulations! Reward Earned')
                        : (isArabic ? 'متبقي للحصول على الهدية:' : 'Remaining until reward:')}
                    </span>
                    <span className="font-extrabold text-amber-400 text-sm">
                      {isCompleted ? (isArabic ? 'جاهز للاستلام' : 'Ready') : `${remaining} ${isArabic ? 'زيارات/أختام' : 'stamps'}`}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Claimable Available Rewards Section */}
        {rewards.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider px-1 flex items-center gap-2">
              <Gift className="w-4 h-4 text-pink-500" />
              {isArabic ? 'المكافآت المتاحة للاسترداد' : 'Available Rewards'} ({rewards.length})
            </h3>

            {rewards.map((r) => (
              <div
                key={r.id}
                className="bg-gradient-to-r from-amber-500/10 via-pink-500/10 to-purple-500/10 border border-amber-500/30 rounded-3xl p-5 flex items-center justify-between gap-4 shadow-lg"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-pink-500 flex items-center justify-center text-slate-950 shadow-md shrink-0">
                    <Gift className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-white text-sm truncate">{r.reward_name}</h4>
                    {r.reward_description && (
                      <p className="text-xs text-slate-400 truncate">{r.reward_description}</p>
                    )}
                    <span className="inline-block mt-1 text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">
                      ✨ {isArabic ? 'جاهزة للاستبدال الكاشير' : 'Ready to Redeem'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cashier Scan QR Pass Section */}
        {qrDataUrl && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center shadow-xl space-y-4">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-300">
              <QrCodeIcon className="w-4 h-4 text-blue-400" />
              <span>{isArabic ? 'رمز QR الخاص بالعميل للمسح' : 'Customer Cashier QR Pass'}</span>
            </div>

            <div className="p-4 bg-white rounded-2xl inline-block shadow-inner">
              <img src={qrDataUrl} alt="Customer QR Code" className="w-48 h-48 mx-auto" />
            </div>

            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              {isArabic
                ? 'اعرض هذا الرمز للكاشير عند عملية الشراء لتسجيل زيارتك أو كسب النقاط واستبدال الجوائز'
                : 'Present this QR code to the cashier at checkout to log visits or redeem rewards'}
            </p>

            {/* Google Wallet Button */}
            <button
              onClick={handleAddToGoogleWallet}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 text-xs"
            >
              <Smartphone className="w-4 h-4" />
              <span>{isArabic ? 'إضافة البطاقة إلى Google Wallet' : 'Add Pass to Google Wallet'}</span>
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
