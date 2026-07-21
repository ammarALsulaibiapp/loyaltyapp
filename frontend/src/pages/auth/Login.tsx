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
        </div>
      </div>
    </div>
  )
}
