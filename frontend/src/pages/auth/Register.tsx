import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useTranslation } from 'react-i18next'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'

export default function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { signUp } = useAuthStore()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signUp(email, password, fullName)
      navigate('/login')
    } catch (err: any) {
      setError(err.message || 'Failed to sign up')
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
      <div className="absolute top-8 start-8">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Mahfazaty" className="w-9 h-9 rounded-xl" />
          <span className="text-black font-semibold text-lg">Mahfazaty</span>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-[420px] relative z-10">
        <div className="bg-gradient-to-b from-white/80 to-white/60 backdrop-blur-xl rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.1)] p-8 border border-white/40">
          
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 bg-white/90 rounded-[18px] shadow-lg flex items-center justify-center">
              <User className="w-7 h-7 text-gray-600" strokeWidth={1.5} />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-[26px] font-semibold text-gray-900 mb-2 tracking-tight">{t('auth.register', 'Create Account')}</h1>
            <p className="text-[13px] text-gray-500 leading-relaxed">
              {t('auth.registerSubtitle', 'Join LoyaltyPass to get started')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name */}
            <div className="relative">
              <User className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" strokeWidth={2} />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('auth.fullName', 'Full Name')}
                required
                className="w-full h-[48px] ps-12 pe-4 bg-white/60 border-0 rounded-[14px] text-[15px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300/50 transition-all"
              />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" strokeWidth={2} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.email', 'Email')}
                required
                className="w-full h-[48px] ps-12 pe-4 bg-white/60 border-0 rounded-[14px] text-[15px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300/50 transition-all"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" strokeWidth={2} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.password', 'Password')}
                required
                className="w-full h-[48px] ps-12 pe-12 bg-white/60 border-0 rounded-[14px] text-[15px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-[18px] h-[18px]" strokeWidth={2} /> : <Eye className="w-[18px] h-[18px]" strokeWidth={2} />}
              </button>
            </div>

            <p className="text-[12px] text-gray-500">{t('auth.passwordHint', 'Minimum 8 characters')}</p>

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
              {loading ? t('auth.creatingAccount', 'Creating account...') : t('auth.register', 'Create Account')}
            </button>
          </form>

          {/* Sign in link */}
          <div className="mt-6 pt-5 border-t border-gray-300/30">
            <p className="text-[13px] text-gray-500 text-center">
              {t('auth.alreadyHaveAccount', 'Already have an account?')}{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-gray-900 font-medium hover:underline"
              >
                {t('auth.signIn', 'Sign In')}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
