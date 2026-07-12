import { Outlet, NavLink } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useLanguageStore } from '../stores/languageStore'
import { useThemeStore } from '../stores/themeStore'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  Building2,
  FileText,
  Settings,
  LogOut,
  Moon,
  Sun,
  Languages,
  Menu,
  X,
  QrCode,
  Users,
  Gift,
  Award,
} from 'lucide-react'
import { useState } from 'react'
import { clsx } from 'clsx'

export default function SuperAdminLayout() {
  const { profile, signOut } = useAuthStore()
  const { language, toggleLanguage } = useLanguageStore()
  const { theme, toggleTheme } = useThemeStore()
  const { t } = useTranslation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = [
    { name: t('nav.dashboard'), href: '/super-admin', icon: LayoutDashboard },
    { name: t('nav.businesses'), href: '/super-admin/businesses', icon: Building2 },
    { name: t('nav.customers'), href: '/super-admin/customers', icon: Users },
    { name: t('nav.loyaltyPrograms'), href: '/super-admin/loyalty-programs', icon: Gift },
    { name: t('nav.rewards'), href: '/super-admin/rewards', icon: Award },
    { name: t('nav.qrGenerator'), href: '/super-admin/qr-generator', icon: QrCode },
    { name: t('nav.invoices'), href: '/super-admin/invoices', icon: FileText },
    { name: t('nav.settings'), href: '/super-admin/settings', icon: Settings },
  ]

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Animated Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 dark:bg-blue-600/20 blur-[100px] animate-blob" />
      <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] rounded-full bg-purple-400/20 dark:bg-purple-600/20 blur-[100px] animate-blob" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-[-10%] left-[20%] w-[35%] h-[35%] rounded-full bg-pink-400/20 dark:bg-pink-600/20 blur-[100px] animate-blob" style={{ animationDelay: '4s' }} />

      {/* Sidebar - Desktop */}
      <aside className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:w-[280px] lg:flex-col ${language === 'ar' ? 'lg:right-0' : 'lg:left-0'} z-30`}>
        <div className="flex flex-col flex-grow glass-panel dark:glass-panel-dark border-r border-white/20 dark:border-slate-700/50 overflow-y-auto">
          {/* Logo */}
          <div className="p-5 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-[#ff5757] to-[#ff7b7b] rounded-lg flex items-center justify-center text-white font-bold text-base shadow-sm">
                L
              </div>
              <h1 className="text-[15px] font-semibold text-gray-900 dark:text-white">{t('common.brand')}</h1>
              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-md text-[10px] font-bold">{t('common.adminBadge')}</span>
            </div>
          </div>
          {/* Navigation */}
          <div className="flex-1 px-3 py-4">
            <nav className="space-y-0.5">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.href === '/super-admin'}
                  className={({ isActive }) =>
                    clsx(
                      'group flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-lg transition-all',
                      isActive
                        ? 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    )
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
          
          {/* User Profile */}
          <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={toggleTheme}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 transition-all text-[13px] font-medium"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={toggleLanguage}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 transition-all text-[13px] font-medium"
              >
                <Languages className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'EN' : 'AR'}</span>
              </button>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'S'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">
                  {profile?.full_name}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{t('staff.superAdmin')}</p>
              </div>
              <button
                onClick={() => signOut()}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar backdrop */}
      <div
        className={clsx(
          'fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300',
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Mobile sidebar drawer */}
      <div
        className={clsx(
          'fixed inset-y-0 z-50 w-[280px] max-w-[85vw] lg:hidden transition-transform duration-300 ease-in-out',
          language === 'ar' ? 'right-0' : 'left-0',
          sidebarOpen
            ? 'translate-x-0'
            : language === 'ar'
              ? 'translate-x-full'
              : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full glass-panel dark:glass-panel-dark shadow-2xl">
          <div className={`absolute top-4 ${language === 'ar' ? 'left-4' : 'right-4'}`}>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Logo */}
          <div className="p-5 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-[#ff5757] to-[#ff7b7b] rounded-lg flex items-center justify-center text-white font-bold text-base shadow-sm">
                L
              </div>
              <h1 className="text-[15px] font-semibold text-gray-900 dark:text-white">{t('common.brand')}</h1>
              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-md text-[10px] font-bold">{t('common.adminBadge')}</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 px-3 py-4 overflow-y-auto">
            <nav className="space-y-0.5">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.href === '/super-admin'}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'group flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-lg transition-all',
                      isActive
                        ? 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    )
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* User Profile & Actions */}
          <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={toggleTheme}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 transition-all text-[13px] font-medium"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={toggleLanguage}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 transition-all text-[13px] font-medium"
              >
                <Languages className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'EN' : 'AR'}</span>
              </button>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'S'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">
                  {profile?.full_name}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{t('staff.superAdmin')}</p>
              </div>
              <button
                onClick={() => signOut()}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`relative z-10 flex flex-col flex-1 min-h-screen ${language === 'ar' ? 'lg:pr-[280px]' : 'lg:pl-[280px]'}`}>
        {/* Mobile header */}
        <div className="sticky top-0 z-10 lg:hidden glass-panel dark:glass-panel-dark border-b border-white/20 dark:border-slate-700/50 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-sm font-semibold">{t('common.brand')}</h1>
          <div className="w-9" />
        </div>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
