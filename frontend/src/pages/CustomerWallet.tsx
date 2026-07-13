import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLanguageStore } from '../stores/languageStore'
import { useTranslation } from 'react-i18next'
import { Plus, Star, Coffee, ShoppingBag, Scissors, Car, Search } from 'lucide-react'
import { isDemoMode, mockCustomers } from '../lib/mockData'
import { 
  generateSecureWalletURL, 
  isSecureWalletAccess, 
  storeWalletAccess, 
  getStoredWalletAccess 
} from '../lib/walletSecurity'

interface CustomerCard {
  id: string
  phone_number: string
  full_name: string | null
  total_visits: number
  total_points: number
  membership_tier: string
  businesses: {
    id: string
    name: string
    logo_url: string | null
    brand_color: string
    description: string | null
  }
  next_reward?: string
  visits_to_reward?: number
}

export default function CustomerWallet() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { language } = useLanguageStore()
  const { t } = useTranslation()
  const [cards, setCards] = useState<CustomerCard[]>([])
  const [loading, setLoading] = useState(true)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [showAddCard, setShowAddCard] = useState(false)
  const [securityError, setSecurityError] = useState('')
  const phoneInputRef = useRef<HTMLInputElement>(null)
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  // Declare loadCustomerCards first
  const loadCustomerCards = async (phone: string) => {
    // Don't load if phone is too short (prevents accidental loading while typing)
    if (!phone || phone.length < 8) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setSecurityError('')

      if (isDemoMode()) {
        const demoCards = mockCustomers.map((c: any) => ({
          ...c,
          businesses: {
            id: 'demo-business-1',
            name: 'Coffee Paradise',
            logo_url: null,
            brand_color: '#8B4513',
            description: 'Your favorite coffee shop'
          },
          next_reward: 'Free Coffee',
          visits_to_reward: 3
        }))
        setCards(demoCards)
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          businesses (
            id,
            name,
            logo_url,
            brand_color,
            description
          )
        `)
        .eq('phone_number', phone)
        .eq('is_active', true)

      if (error) throw error

      setCards((data as any) || [])
    } catch (error: any) {
      console.error('Load cards error:', error)
      setSecurityError('Failed to load your cards. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Realtime subscription for visits - auto refresh wallet
  useEffect(() => {
    if (!phoneNumber || isDemoMode()) return

    const channel = supabase
      .channel('wallet-visits')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'visits'
        }, 
        () => {
          // Trigger refetch
          setRefetchTrigger(prev => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [phoneNumber])

  // Refetch when trigger changes
  useEffect(() => {
    if (phoneNumber && refetchTrigger > 0) {
      loadCustomerCards(phoneNumber)
    }
  }, [refetchTrigger, phoneNumber])

  // Get phone number and security token from URL or localStorage
  useEffect(() => {
    const urlPhone = searchParams.get('phone')
    const urlToken = searchParams.get('token')
    
    // First check URL parameters
    if (urlPhone && urlToken) {
      if (isSecureWalletAccess(urlPhone, urlToken)) {
        setPhoneNumber(urlPhone)
        storeWalletAccess(urlPhone) // Store for future visits
        loadCustomerCards(urlPhone)
        return
      } else {
        setSecurityError('Invalid or expired wallet link. Please enter your phone number.')
        setLoading(false)
        return
      }
    }
    
    // Check stored wallet access
    const stored = getStoredWalletAccess()
    if (stored && stored.phone.length >= 8) {
      setPhoneNumber(stored.phone)
      loadCustomerCards(stored.phone)
      return
    }
    
    // No valid access, show phone input
    setLoading(false)
  }, [searchParams])

  const handlePhoneSubmit = () => {
    const inputValue = phoneInputRef.current?.value?.trim() || ''
    
    // Require minimum length (at least 8 digits for Oman numbers)
    if (inputValue.length < 8) {
      alert('Please enter a complete phone number (at least 8 digits)')
      return
    }
    
    if (inputValue) {
      // Store secure wallet access
      storeWalletAccess(inputValue)
      loadCustomerCards(inputValue)
    }
  }

  const handleInputKeyPress = (e: React.KeyboardEvent) => {
    // Prevent Enter key from submitting form accidentally
    if (e.key === 'Enter') {
      e.preventDefault()
      const inputValue = phoneInputRef.current?.value?.trim() || ''
      if (inputValue.length >= 8) {
        handlePhoneSubmit()
      }
    }
  }

  const getBusinessIcon = (businessName: string) => {
    const name = businessName.toLowerCase()
    if (name.includes('coffee') || name.includes('cafe')) return Coffee
    if (name.includes('pizza') || name.includes('restaurant')) return ShoppingBag
    if (name.includes('salon') || name.includes('beauty')) return Scissors
    if (name.includes('car') || name.includes('wash')) return Car
    return Star
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'from-amber-600 to-amber-700'
      case 'silver': return 'from-slate-400 to-slate-500'
      case 'gold': return 'from-yellow-500 to-yellow-600'
      case 'vip': return 'from-purple-600 to-purple-700'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  // Phone input form
  if (!phoneNumber && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('wallet.myCards')}</h1>
            <p className="text-gray-600">{t('wallet.enterPhone')}</p>
            
            {securityError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{securityError}</p>
              </div>
            )}
          </div>

          {/* SIMPLE TEST INPUT - NO REACT STATE */}
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 mb-2">TEST INPUT (no React state):</p>
            <input
              type="text"
              placeholder="Type anything here..."
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>

          <div>
            <div className="mb-6">
              <input
                ref={phoneInputRef}
                type="tel"
                placeholder="+968 9123 4567"
                onKeyPress={handleInputKeyPress}
                className="w-full p-4 border border-gray-300 rounded-xl text-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                minLength={8}
                maxLength={15}
                autoComplete="off"
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Enter your complete phone number (minimum 8 digits)
              </p>
            </div>
            
            <button
              type="button"
              onClick={handlePhoneSubmit}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-4 px-6 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105"
            >
              {t('wallet.viewMyCards')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-700">{t('wallet.loadingCards')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('wallet.myCards')}</h1>
              <p className="text-sm text-gray-600">{phoneNumber}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  try {
                    const secureURL = generateSecureWalletURL(phoneNumber)
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(secureURL).then(() => {
                        alert('Secure wallet link copied! You can open this on any device.')
                      }).catch(() => {
                        // Fallback for clipboard failure
                        prompt('Copy this secure wallet link:', secureURL)
                      })
                    } else {
                      // Fallback for browsers without clipboard API
                      prompt('Copy this secure wallet link:', secureURL)
                    }
                  } catch (error) {
                    console.error('Share wallet error:', error)
                    // Simple fallback - just copy the current URL
                    const fallbackURL = `${window.location.origin}/wallet?phone=${encodeURIComponent(phoneNumber)}`
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(fallbackURL)
                      alert('Wallet link copied!')
                    } else {
                      prompt('Copy this wallet link:', fallbackURL)
                    }
                  }
                }}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-all"
              >
                Share Wallet
              </button>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="max-w-md mx-auto p-4 pb-20">
        {cards.length === 0 ? (
          // No cards state
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('wallet.noCards')}</h3>
            <p className="text-gray-600 mb-6">{t('wallet.scanQR')}</p>
            
            <button
              onClick={() => setShowAddCard(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all"
            >
              <Plus className="w-5 h-5" />
              {t('wallet.addCard')}
            </button>
          </div>
        ) : (
          // Cards list
          <div className="space-y-4">
            {cards
              .filter(card => card.businesses && card.businesses.name) // Only show cards with valid business data
              .map((card) => {
              const IconComponent = getBusinessIcon(card.businesses.name)
              const tierGradient = getTierColor(card.membership_tier)
              
              return (
                <div
                  key={card.id}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  style={{ borderLeft: `6px solid ${card.businesses.brand_color}` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {card.businesses.logo_url ? (
                        <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center overflow-hidden">
                          <img
                            src={card.businesses.logo_url}
                            alt={card.businesses.name}
                            className="w-8 h-8 object-contain"
                          />
                        </div>
                      ) : (
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: card.businesses.brand_color }}
                        >
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                      )}
                      
                      <div>
                        <h3 className="font-bold text-gray-900">{card.businesses.name}</h3>
                        <div className={`inline-block px-2 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${tierGradient}`}>
                          {card.membership_tier.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{card.total_visits}</p>
                      <p className="text-xs text-gray-500">{t('wallet.visits')}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600">{t('wallet.points')}: {card.total_points}</p>
                      {card.next_reward && (
                        <p className="text-xs text-green-600 font-semibold">
                          {card.visits_to_reward} more for {card.next_reward}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/card/${card.id}`)
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {t('wallet.tapToOpen')}
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {/* Apple Wallet Button (iOS - Future) */}
                    {/iPhone|iPad|iPod/.test(navigator.userAgent) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          alert('Apple Wallet integration coming soon! 🍎\n\nWe\'ll add this when you get iOS Developer Account ($99/year)')
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-black text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-all opacity-75"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                        </svg>
                        Apple (Soon)
                      </button>
                    )}

                    {/* Google Wallet Button (Android only) */}
                    {/Android/.test(navigator.userAgent) && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          try {
                            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/wallet/google/${card.id}`)
                            
                            if (!response.ok) throw new Error('Failed to generate wallet pass')
                            
                            const data = await response.json()
                            
                            if (data.success && data.addToWalletUrl) {
                              window.open(data.addToWalletUrl, '_blank')
                            }
                          } catch (error) {
                            console.error('Google Wallet error:', error)
                            alert('Failed to add to Google Wallet. Please try again later.')
                          }
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition-all"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                        </svg>
                        Google Wallet
                      </button>
                    )}
                    
                    {/* View Full Card Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/card/${card.id}`)
                      }}
                      className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-all"
                    >
                      View Card
                    </button>
                  </div>
                </div>
              )
            })}

            {/* Add New Card Button */}
            <button
              onClick={() => setShowAddCard(true)}
              className="w-full bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 rounded-2xl p-6 hover:from-blue-50 hover:to-purple-50 hover:border-blue-300 transition-all"
            >
              <div className="flex flex-col items-center gap-2">
                <Plus className="w-8 h-8 text-gray-400" />
                <span className="text-gray-600 font-medium">{t('wallet.addNewCard')}</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Add New Card Instructions Modal */}
      {showAddCard && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowAddCard(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">
              Add New Loyalty Card
            </h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400 font-bold">
                  1
                </div>
                <div>
                  <p className="text-gray-900 dark:text-white font-medium">Visit a participating business</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Look for QR codes at restaurants, cafes, shops, etc.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400 font-bold">
                  2
                </div>
                <div>
                  <p className="text-gray-900 dark:text-white font-medium">Scan the QR code</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Use your camera to scan the loyalty program QR</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400 font-bold">
                  3
                </div>
                <div>
                  <p className="text-gray-900 dark:text-white font-medium">Use the SAME phone number</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Enter <strong>{phoneNumber}</strong> when signing up</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl mb-4">
              <p className="text-sm text-green-800 dark:text-green-300 text-center font-medium">
                ✨ New cards will automatically appear in this wallet!
              </p>
            </div>

            <button
              onClick={() => setShowAddCard(false)}
              className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  )
}