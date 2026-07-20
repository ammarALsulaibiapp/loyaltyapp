import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function Login() {
  const navigate = useNavigate()
  const { signIn } = useAuthStore()
  const { t, i18n } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showBanner, setShowBanner] = useState(true)

  // Detect if user is on mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(email, password)
      navigate('/super-admin')
    } catch (err) {
      setError((err as Error).message || t('auth.failedToSignIn'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#87CEEB] via-[#ADD8E6] to-[#B0E0E6] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated blobs */}
      <div className="absolute top-[-100px] left-[-100px] w-[600px] h-[600px] bg-white/30 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-150px] right-[-100px] w-[700px] h-[700px] bg-white/20 rounded-full blur-[120px]"></div>
      
      {/* Logo */}
      <div className="absolute top-8 left-8">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="SabaaaPass" className="w-9 h-9 rounded-xl" />
          <span className="text-black font-semibold text-lg">{t('auth.brandName', 'SabaaaPass')}</span>
        </div>
      </div>

      {/* Download Wallet Banner (Mobile Only) */}
      {isMobile && showBanner && (
        <div className="fixed top-4 left-4 right-4 z-50 animate-slide-down">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-4 shadow-2xl shadow-blue-200 border border-white/20 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-sm">
                    {i18n.language === 'ar' ? 'حمّل تطبيق المحفظة' : 'Download Wallet App'}
                  </p>
                  <p className="text-white/80 text-xs">
                    {i18n.language === 'ar' ? 'احصل على بطاقات الولاء في تطبيق واحد' : 'All your loyalty cards in one app'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/wallet')}
                  className="px-4 py-2 bg-white text-blue-600 font-semibold text-sm rounded-lg hover:bg-gray-100 transition-all shadow-md"
                >
                  {i18n.language === 'ar' ? 'فتح' : 'Open'}
                </button>
                <button
                  onClick={() => setShowBanner(false)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Card */}
      <div className="w-full max-w-[420px] relative z-10">
        <div className="bg-gradient-to-b from-white/80 to-white/60 backdrop-blur-xl rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.1)] p-8 border border-white/40">
          
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 bg-white/90 rounded-[18px] shadow-lg flex items-center justify-center">
              <Mail className="w-7 h-7 text-gray-600" strokeWidth={1.5} />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-[26px] font-semibold text-gray-900 mb-2 tracking-tight">{t('auth.signInWithEmail')}</h1>
            <p className="text-[13px] text-gray-500 leading-relaxed">
              {t('auth.loginDesc')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" strokeWidth={2} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                required
                className="w-full h-[48px] pl-12 pr-4 bg-white/60 border-0 rounded-[14px] text-[15px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300/50 transition-all"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" strokeWidth={2} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                required
                className="w-full h-[48px] pl-12 pr-12 bg-white/60 border-0 rounded-[14px] text-[15px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-[18px] h-[18px]" strokeWidth={2} /> : <Eye className="w-[18px] h-[18px]" strokeWidth={2} />}
              </button>
            </div>

            {/* Forgot */}
            <div className="text-right rtl:text-left">
              <button type="button" className="text-[13px] text-gray-500 hover:text-gray-700 transition-colors">
                {t('auth.forgotPassword')}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50/80 backdrop-blur-sm rounded-xl border border-red-100">
                <p className="text-[13px] text-red-600">{error}</p>
              </div>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[48px] bg-[#1a1a1a] text-white text-[15px] font-medium rounded-[14px] hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading ? t('auth.signingIn') : t('auth.getStarted')}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300/50"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white/60 text-[13px] text-gray-500">{t('auth.orSignInWith')}</span>
            </div>
          </div>

          {/* Social */}
          <div className="flex items-center justify-center gap-4">
            <button type="button" className="w-[48px] h-[48px] bg-white/70 hover:bg-white rounded-[14px] flex items-center justify-center transition-all shadow-sm">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </button>
            <button type="button" className="w-[48px] h-[48px] bg-white/70 hover:bg-white rounded-[14px] flex items-center justify-center transition-all shadow-sm">
              <svg className="w-6 h-6" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>
            <button type="button" className="w-[48px] h-[48px] bg-white/70 hover:bg-white rounded-[14px] flex items-center justify-center transition-all shadow-sm">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#000" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </button>
          </div>

          {/* Demo */}
          <div className="mt-6 pt-5 border-t border-gray-300/30">
            <p className="text-[12px] text-gray-500 text-center">{t('auth.demoCredentials')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
