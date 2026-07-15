import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguageStore } from '../stores/languageStore'
import { useTranslation } from 'react-i18next'
import { useCustomerAuthStore } from '../stores/customerAuthStore'
import type { CustomerCard } from '../lib/customerApi'
import {
  Plus, Star, Coffee, ShoppingBag, Scissors, Car,
  Eye, EyeOff, LogOut, X, Smartphone, ScanLine, Loader2,
  User, Phone, Lock, UserPlus, LogIn, QrCode as QrCodeIcon
} from 'lucide-react'
import QRCode from 'qrcode'

// =====================================================
// Auth Forms (Login / Register)
// =====================================================

function WalletAuthForm() {
  const { login, register } = useCustomerAuthStore()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Login fields
  const [loginPhone, setLoginPhone] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [showLoginPassword, setShowLoginPassword] = useState(false)

  // Register fields
  const [regPhone, setRegPhone] = useState('')
  const [regName, setRegName] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const cleanPhone = loginPhone.replace(/\s/g, '')
      if (cleanPhone.length < 8) {
        throw new Error('Please enter a valid phone number (at least 8 digits)')
      }
      await login(cleanPhone, loginPassword, rememberMe)
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate
    const cleanPhone = regPhone.replace(/\s/g, '')
    if (cleanPhone.length < 8) {
      setError('Please enter a valid phone number (at least 8 digits)')
      return
    }
    if (regName.trim().length < 2) {
      setError('Please enter your full name')
      return
    }
    if (regPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await register(cleanPhone, regName.trim(), regPassword)
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-purple-200">
            <ShoppingBag className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Wallet</h1>
          <p className="text-gray-500 mt-1">All your loyalty cards in one place</p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-gray-100 rounded-2xl p-1 flex mb-6">
          <button
            onClick={() => { setActiveTab('login'); setError('') }}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'login'
                ? 'bg-white shadow-md text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LogIn className="w-4 h-4" /> Login
          </button>
          <button
            onClick={() => { setActiveTab('register'); setError('') }}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'register'
                ? 'bg-white shadow-md text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <UserPlus className="w-4 h-4" /> Register
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-sm text-red-600 text-center font-medium">{error}</p>
          </div>
        )}

        {/* Card Container */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-200/50 border border-white/60 p-6">

          {/* LOGIN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Phone */}
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                <input
                  type="tel"
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  placeholder="Phone number (e.g. +968 9123 4567)"
                  required
                  className="w-full h-[48px] pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-[15px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full h-[48px] pl-12 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-[15px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showLoginPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>

              {/* Remember Me */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
                    rememberMe
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-white border-gray-300'
                  }`}>
                    {rememberMe && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-600">Remember me for 30 days</span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[48px] bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Login
                  </>
                )}
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Phone */}
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="Phone number (e.g. +968 9123 4567)"
                  required
                  className="w-full h-[48px] pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-[15px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                />
              </div>

              {/* Full Name */}
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Full name"
                  required
                  className="w-full h-[48px] pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-[15px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Password (min 8 characters)"
                  required
                  minLength={8}
                  className="w-full h-[48px] pl-12 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-[15px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showRegPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  required
                  minLength={8}
                  className="w-full h-[48px] pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-[15px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                />
              </div>

              {/* Password strength hint */}
              {regPassword.length > 0 && regPassword.length < 8 && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <span>⚠️</span> {8 - regPassword.length} more characters needed
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[48px] bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Create Account
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Your loyalty cards from all shops, in one secure place
        </p>
      </div>
    </div>
  )
}


// =====================================================
// QR Scanner Modal
// =====================================================

function QRScannerModal({ onClose, onScan }: { onClose: () => void, onScan: (slug: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(true)
  const scannerRef = useRef<any>(null)

  useEffect(() => {
    let isMounted = true

    const startScanner = async () => {
      try {
        // Dynamically import QrScanner to avoid SSR issues
        const QrScannerModule = await import('qr-scanner')
        const QrScanner = QrScannerModule.default

        if (!videoRef.current || !isMounted) return

        const scanner = new QrScanner(
          videoRef.current,
          (result: any) => {
            if (!isMounted) return
            const text = result.data || result

            // Extract business slug from scanned URL
            // Expected format: https://domain.com/signup?business=SLUG
            try {
              const url = new URL(text, window.location.origin)
              const slug = url.searchParams.get('business') || url.searchParams.get('Business')
              if (slug) {
                scanner.stop()
                setScanning(false)
                onScan(slug)
                return
              }
            } catch {
              // Not a valid URL — maybe it's just a slug
            }

            // Try if the scanned text is just a slug directly
            if (text && !text.includes(' ') && text.length > 2 && text.length < 50) {
              scanner.stop()
              setScanning(false)
              onScan(text)
            }
          },
          {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        )

        scannerRef.current = scanner
        await scanner.start()
      } catch (err: any) {
        console.error('QR Scanner error:', err)
        if (isMounted) {
          setError(err?.message || 'Could not access camera. Please allow camera permission and try again.')
        }
      }
    }

    startScanner()

    return () => {
      isMounted = false
      if (scannerRef.current) {
        scannerRef.current.stop()
        scannerRef.current.destroy()
      }
    }
  }, [onScan])

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-blue-600" />
            Scan Shop QR Code
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {error ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📷</span>
            </div>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-300 transition-all"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-square mb-4">
              <video ref={videoRef} className="w-full h-full object-cover" />
              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-blue-400 rounded-2xl animate-pulse" />
                </div>
              )}
            </div>
            <p className="text-center text-sm text-gray-500">
              Point your camera at a shop's loyalty QR code
            </p>
          </>
        )}
      </div>
    </div>
  )
}


// =====================================================
// Main Wallet (Authenticated View)
// =====================================================

export default function CustomerWallet() {
  const navigate = useNavigate()
  const { language } = useLanguageStore()
  const { t } = useTranslation()
  const { customer, cards, loading, initialized, checkAuth, logout, refreshCards, addCard } = useCustomerAuthStore()
  const [showScanner, setShowScanner] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showIOSInstruct, setShowIOSInstruct] = useState(false)
  const [showWalletQR, setShowWalletQR] = useState(false)
  const [walletQRUrl, setWalletQRUrl] = useState('')
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('')
  
  // Filtered cards based on search
  const filteredCards = cards.filter((card: CustomerCard) => 
    card.businesses?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Initialize auth on mount
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Capture the PWA install prompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Auto-refresh cards every 30 seconds when logged in
  useEffect(() => {
    if (!customer) return
    const interval = setInterval(() => {
      refreshCards()
    }, 30000)
    return () => clearInterval(interval)
  }, [customer, refreshCards])

  // Generate Wallet QR Code when customer profile is loaded
  useEffect(() => {
    if (!customer) return
    const generateQR = async () => {
      try {
        const url = `${window.location.origin}/wallet?phone=${encodeURIComponent(customer.phone_number)}`
        const qrData = await QRCode.toDataURL(url, {
          width: 250,
          margin: 2,
          color: {
            dark: '#1e3a8a',
            light: '#ffffff'
          }
        })
        setWalletQRUrl(qrData)
      } catch (err) {
        console.error('Failed to generate wallet QR code', err)
      }
    }
    generateQR()
  }, [customer])

  const handleQRScan = useCallback(async (slug: string) => {
    setShowScanner(false)
    try {
      await addCard(slug)
      alert('Success! This loyalty card has been instantly added to your wallet.')
    } catch (err: any) {
      alert(err.message || 'Failed to add card. Please try again.')
    }
  }, [addCard])

  const handleAddToHomeScreen = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log(`Install prompt result: ${outcome}`)
      setDeferredPrompt(null)
      return
    }

    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
    if (isIOS) {
      setShowIOSInstruct(true)
      return
    }

    const isAndroid = /Android/.test(navigator.userAgent)
    if (isAndroid) {
      alert('To add this wallet to your home screen:\n\n1. Tap menu (⋮) in browser\n2. Tap "Add to Home screen"\n3. Tap "Add"')
    } else {
      alert('Bookmark this page for quick access to your wallet!')
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

  // Still loading auth state
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading wallet...</p>
        </div>
      </div>
    )
  }

  // Not logged in → show auth form
  if (!customer) {
    return <WalletAuthForm />
  }

  // Logged in → show wallet
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl shadow-lg sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">My Wallet</h1>
              <p className="text-sm text-gray-500">{customer.full_name} · {customer.phone_number}</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Show Wallet QR */}
              <button
                onClick={() => setShowWalletQR(true)}
                className="p-2 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition-all"
                title="My Wallet QR Code"
              >
                <QrCodeIcon className="w-5 h-5" />
              </button>
              {/* Add to Home Screen */}
              <button
                onClick={handleAddToHomeScreen}
                className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                title="Add to Home Screen"
              >
                <Smartphone className="w-5 h-5" />
              </button>
              {/* Logout */}
              <button
                onClick={logout}
                className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-md mx-auto px-4 pt-4 pb-4">
        <div className="relative">
          <input
            type="text"
            placeholder={t('wallet.searchPlaceholder', 'Search shops...')}
            className="w-full h-14 pl-12 pr-4 bg-white rounded-2xl shadow-sm border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="max-w-md mx-auto px-4 pb-24">
        {filteredCards.length === 0 ? (
          // No cards state
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No loyalty cards yet</h3>
            <p className="text-gray-500 mb-8 max-w-xs mx-auto">
              Scan a shop's QR code to add your first loyalty card
            </p>
            <button
              onClick={() => setShowScanner(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-8 rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-200"
            >
              <ScanLine className="w-5 h-5" />
              Scan QR Code
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredCards
              .filter((card: CustomerCard) => card.businesses && card.businesses.name)
              .map((card: CustomerCard) => {
                const IconComponent = getBusinessIcon(card.businesses.name)
                const tierGradient = getTierColor(card.membership_tier)

                return (
                  <div
                    key={card.id}
                    onClick={() => navigate(`/card/${card.id}`)}
                    className="bg-white rounded-2xl p-4 shadow-md hover:shadow-xl transition-all transform hover:scale-[1.02] cursor-pointer border border-gray-100"
                  >
                    {/* Business Logo */}
                    <div className="w-full aspect-square bg-gray-50 rounded-2xl mb-3 flex items-center justify-center overflow-hidden p-4">
                      {card.businesses.logo_url ? (
                        <img
                          src={card.businesses.logo_url}
                          alt={card.businesses.name}
                          className="w-full h-full object-contain"
                          style={{background: 'transparent'}}
                        />
                      ) : (
                        <IconComponent className="w-12 h-12 text-gray-400" />
                      )}
                    </div>

                    {/* Business Name */}
                    <h3 className="font-bold text-gray-900 text-sm mb-1 truncate">{card.businesses.name}</h3>
                    
                    {/* Offer/Stats */}
                    <p className="text-xs font-semibold text-blue-600 mb-1">
                      {card.next_reward || t('wallet.buyOneGetOne', 'Buy 1 Get 1 Free')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {card.visits_to_reward ? `${card.visits_to_reward} ${t('wallet.stampsToGo', 'stamps to go')}` : `${card.total_visits} ${t('wallet.visits', 'visits')}`}
                    </p>
                  </div>
                )
              })}

            {/* Add Card via QR */}
            <button
              onClick={() => setShowScanner(true)}
              className="w-full bg-white/60 border-2 border-dashed border-gray-300 rounded-2xl p-5 hover:bg-blue-50/60 hover:border-blue-300 transition-all group"
            >
              <div className="flex flex-col items-center gap-2">
                <ScanLine className="w-7 h-7 text-gray-400 group-hover:text-blue-500 transition-colors" />
                <span className="text-gray-500 group-hover:text-blue-600 font-medium text-sm transition-colors">Scan QR to add new card</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowScanner(true)}
          className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl shadow-blue-300 hover:shadow-2xl hover:shadow-blue-400 transition-all transform hover:scale-110"
        >
          <Plus className="w-7 h-7 text-white" />
        </button>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScannerModal
          onClose={() => setShowScanner(false)}
          onScan={handleQRScan}
        />
      )}

      {/* iOS Install Instructions */}
      {showIOSInstruct && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center p-4"
          onClick={() => setShowIOSInstruct(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
              Add to Home Screen
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 font-bold">
                  1
                </div>
                <div>
                  <p className="text-gray-900 font-medium">Tap the Share button</p>
                  <p className="text-sm text-gray-600">Look for <span className="inline-block px-2 py-1 bg-blue-100 rounded text-blue-600 font-mono">⬆️</span> at the bottom of Safari</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 font-bold">
                  2
                </div>
                <div>
                  <p className="text-gray-900 font-medium">Scroll down and tap "Add to Home Screen"</p>
                  <p className="text-sm text-gray-600">It has a plus icon <span className="text-lg">➕</span></p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 font-bold">
                  3
                </div>
                <div>
                  <p className="text-gray-900 font-medium">Tap "Add"</p>
                  <p className="text-sm text-gray-600">Your wallet will appear as an app!</p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-50 rounded-xl">
              <p className="text-sm text-green-800 text-center font-medium">
                ✨ Quick access to all your loyalty cards!
              </p>
            </div>

            <button
              onClick={() => setShowIOSInstruct(false)}
              className="w-full mt-4 px-6 py-3 bg-gray-200 text-gray-900 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Wallet QR Code Modal */}
      {showWalletQR && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowWalletQR(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <QrCodeIcon className="w-5 h-5 text-purple-600" />
                My Wallet QR Code
              </h3>
              <button
                onClick={() => setShowWalletQR(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {walletQRUrl ? (
              <div className="bg-gray-50 p-4 rounded-2xl inline-block mb-4 border border-gray-100">
                <img
                  src={walletQRUrl}
                  alt="Wallet QR Code"
                  className="w-48 h-48 mx-auto"
                />
              </div>
            ) : (
              <div className="w-48 h-48 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            )}

            <p className="font-bold text-gray-900">{customer.full_name}</p>
            <p className="text-sm text-gray-500 mb-6">{customer.phone_number}</p>

            <div className="bg-purple-50 text-purple-800 p-4 rounded-xl text-xs text-left mb-6 font-medium leading-relaxed">
              💡 Show this QR code to shop owners or staff. They can scan it to search for your profile or check your loyalty status!
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const url = `${window.location.origin}/wallet?phone=${encodeURIComponent(customer.phone_number)}`
                  navigator.clipboard.writeText(url)
                  alert('Wallet link copied to clipboard!')
                }}
                className="flex-1 py-3 px-4 bg-purple-100 text-purple-700 font-semibold rounded-xl hover:bg-purple-200 transition-all text-sm"
              >
                Copy Link
              </button>
              <button
                onClick={() => setShowWalletQR(false)}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}