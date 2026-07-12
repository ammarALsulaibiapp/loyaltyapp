import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { isDemoMode, mockBusinesses } from '../lib/mockData'
import { useLanguageStore } from '../stores/languageStore'
import { useTranslation } from 'react-i18next'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Check, Loader } from 'lucide-react'

interface Business {
  id: string
  name: string
  logo_url: string | null
  brand_color: string
  slug: string
}

export default function PublicSignup() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  // Get business slug and trim whitespace, handle case variations
  const businessSlug = searchParams.get('business')?.trim() || searchParams.get('Business')?.trim()
  const { language } = useLanguageStore()
  const { t } = useTranslation()

  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    phone_number: '',
    full_name: '',
    birthday: '',
    gender: '',
  })

  // Load business details
  useEffect(() => {
    const loadBusiness = async () => {
      if (!businessSlug) {
        setError('No business specified in URL. Please scan the QR code again.')
        setLoading(false)
        return
      }

      try {
        console.log('=== SIGNUP DEBUG ===')
        console.log('Full URL:', window.location.href)
        console.log('Search params:', window.location.search)
        console.log('Business slug extracted:', businessSlug)
        console.log('Demo mode:', isDemoMode())
        console.log('===================')
        
        // DEMO MODE: Use mock data
        if (isDemoMode()) {
          const mockBiz = mockBusinesses.find(b => b.slug === businessSlug)
          if (mockBiz) {
            setBusiness(mockBiz as Business)
          } else {
            setError(`Business not found. Looking for slug: ${businessSlug}. Please check the QR code.`)
          }
          setLoading(false)
          return
        }

        // Real mode: Fetch from Supabase
        console.log('Fetching from Supabase...')
        
        // Test Supabase connection first
        try {
          const { error: testError } = await supabase.from('businesses').select('count', { count: 'exact', head: true })
          console.log('Supabase connection test:', testError ? 'FAILED' : 'SUCCESS')
          if (testError) console.error('Connection test error:', testError)
        } catch (e) {
          console.error('Cannot reach Supabase:', e)
          setError('Cannot connect to database. Please check your internet connection.')
          setLoading(false)
          return
        }
        
        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('slug', businessSlug) // Exact match
          .eq('is_active', true)
          .maybeSingle()

        console.log('Supabase response:', { data, error })

        if (error) {
          console.error('Supabase query error:', error)
          setError(`Database error: ${error.message}. Code: ${error.code}`)
        } else if (!data) {
          // Try without is_active filter as fallback
          console.log('Trying without is_active filter...')
          const { data: data2, error: error2 } = await supabase
            .from('businesses')
            .select('*')
            .eq('slug', businessSlug)
            .maybeSingle()
          
          console.log('Second attempt:', { data2, error2 })
          
          if (data2) {
            if (!(data2 as any).is_active) {
              setError(`Business "${(data2 as any).name}" is inactive. Please contact support.`)
            } else {
              setBusiness(data2)
            }
          } else {
            setError(`No business found with slug: ${businessSlug}. Please contact support.`)
          }
        } else {
          console.log('Business loaded successfully:', data)
          setBusiness(data)
        }
      } catch (err) {
        console.error('Load business error:', err)
        setError(`Failed to load business. Error: ${(err as any).message}`)
      } finally {
        setLoading(false)
      }
    }

    loadBusiness()
  }, [businessSlug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      if (!business) throw new Error('Business not found')

      // Validate phone number
      if (!formData.phone_number) {
        throw new Error('Phone number is required')
      }

      // DEMO MODE: Show success and redirect
      if (isDemoMode()) {
        setSuccess(true)
        setTimeout(() => {
          // In demo, redirect to first demo customer card
          navigate('/card/demo-customer-1')
        }, 2000)
        return
      }

      // Check if customer already exists
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('business_id', business.id)
        .eq('phone_number', formData.phone_number)
        .single()

      if (existing) {
        throw new Error('Phone number already registered. Please contact staff.')
      }

      // Generate QR code
      const qrCode = `${business.id}-${formData.phone_number}-${Date.now()}`

      // Create customer
      const { data: customer, error: createError } = await supabase
        .from('customers')
        .insert({
          business_id: business.id,
          phone_number: formData.phone_number,
          full_name: formData.full_name || null,
          birthday: formData.birthday || null,
          gender: formData.gender || null,
          qr_code: qrCode,
          total_visits: 0,
          total_points: 0,
          total_spent: 0,
          membership_tier: 'bronze',
          is_active: true,
        } as any)
        .select()
        .single()

      if (createError) throw createError

      setSuccess(true)

      // Redirect to card page
      setTimeout(() => {
        navigate(`/card/${(customer as any).id}`)
      }, 2000)

    } catch (err: any) {
      setError(err.message || 'Failed to create account')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="text-center max-w-md w-full bg-white p-6 rounded-2xl shadow-xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Business Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'This business does not exist or is inactive.'}</p>
          
          <div className="bg-gray-100 p-4 rounded-lg mb-4 text-left text-xs">
            <p className="font-bold text-gray-700 mb-2">Debug Info:</p>
            <p className="text-gray-700 break-all"><strong>Full URL:</strong> {window.location.href}</p>
            <p className="text-gray-700 break-all"><strong>Search:</strong> {window.location.search}</p>
            <p className="text-gray-700"><strong>Slug Extracted:</strong> {businessSlug || 'none'}</p>
            <p className="text-gray-700"><strong>Demo Mode:</strong> {isDemoMode() ? 'Yes' : 'No'}</p>
            <p className="text-gray-700 break-all"><strong>Error:</strong> {error}</p>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all"
            >
              Retry
            </button>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                alert('Link copied! Open in your browser.')
              }}
              className="px-6 py-3 bg-gray-600 text-white rounded-xl font-medium hover:bg-gray-700 transition-all"
            >
              Copy Link & Open in Browser
            </button>
          </div>
        </div>
      </div>
    )
  }

  const brandColor = business.brand_color || '#0ea5e9'

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('signup.successTitle')}</h2>
          <p className="text-gray-600 mb-4">
            {t('signup.successMessage')}
          </p>
          <p className="text-sm text-gray-500">
            {t('signup.redirecting')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4 overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Animated Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 dark:bg-blue-600/20 blur-[100px] animate-blob" />
      <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] rounded-full bg-purple-400/20 dark:bg-purple-600/20 blur-[100px] animate-blob" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-[-10%] left-[20%] w-[35%] h-[35%] rounded-full bg-pink-400/20 dark:bg-pink-600/20 blur-[100px] animate-blob" style={{ animationDelay: '4s' }} />

      <div className="relative z-10 max-w-md mx-auto">
        {/* Business Header */}
        <div 
          className="glass-panel dark:glass-panel-dark p-6 mb-6 border border-white/20 dark:border-slate-700/50"
          style={{ borderTop: `4px solid ${brandColor}` }}
        >
          <div className="text-center">
            {business.logo_url && (
              <img
                src={business.logo_url}
                alt={business.name}
                className="w-20 h-20 rounded-full mx-auto mb-4 object-cover ring-2 ring-white/50"
              />
            )}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {business.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{t('signup.joinOurProgram')}</p>
          </div>
        </div>

        {/* Signup Form */}
        <div className="glass-panel dark:glass-panel-dark p-6 border border-white/20 dark:border-slate-700/50">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('signup.phoneNumber')}
              type="tel"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              placeholder="+968 9123 4567"
              required
              helperText={t('signup.phoneHelper')}
            />

            <Input
              label={t('signup.fullName')}
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder={language === 'ar' ? 'أحمد السعيدي' : 'Ahmed Al-Said'}
              required
            />

            <Input
              label={t('signup.birthday')}
              type="date"
              value={formData.birthday}
              onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
              helperText={t('signup.birthdayHelper')}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('signup.gender')}
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer select-none">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === 'male'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="me-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('signup.male')}</span>
                </label>
                <label className="flex items-center cursor-pointer select-none">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === 'female'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="me-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('signup.female')}</span>
                </label>
                <label className="flex items-center cursor-pointer select-none">
                  <input
                    type="radio"
                    name="gender"
                    value="other"
                    checked={formData.gender === 'other'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="me-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('signup.other')}</span>
                </label>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              loading={submitting}
              className="w-full text-white font-bold"
              style={{ backgroundColor: brandColor }}
            >
              {t('signup.joinNow')}
            </Button>

            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
              {t('signup.disclaimer')}
            </p>
          </form>
        </div>

        {/* Benefits */}
        <div className="mt-6 glass-panel dark:glass-panel-dark p-6 border border-white/20 dark:border-slate-700/50">
          <h3 className="font-bold text-gray-900 dark:text-white mb-3">{t('signup.memberBenefits')}</h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <span>{t('signup.benefit1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <span>{t('signup.benefit2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <span>{t('signup.benefit3')}</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <span>{t('signup.benefit4')}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
