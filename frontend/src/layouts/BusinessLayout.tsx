import { Outlet, NavLink } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useLanguageStore } from '../stores/languageStore'
import { useThemeStore } from '../stores/themeStore'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  Users,
  Gift,
  Award,
  UserCog,
  BarChart3,
  Settings,
  LogOut,
  Moon,
  Sun,
  Languages,
  Menu,
  X,
  Search,
  Kanban,
  QrCode,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'
import { clsx } from 'clsx'

export default function BusinessLayout() {
  const { profile, signOut } = useAuthStore()
  const { language, toggleLanguage } = useLanguageStore()
  const { theme, toggleTheme } = useThemeStore()
  const { t } = useTranslation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isAdmin = profile?.role === 'business_admin'
  const isStaff = profile?.role === 'staff'

  const adminNavigation = [
    { name: t('nav.dashboard'), href: '/business', icon: LayoutDashboard },
    { name: t('nav.customers'), href: '/business/customers', icon: Users },
    { name: t('nav.loyaltyPrograms'), href: '/business/loyalty-programs', icon: Gift },
    { name: t('nav.rewards'), href: '/business/rewards', icon: Award },
    { name: t('nav.staff'), href: '/business/staff', icon: UserCog },
    { name: 'Shop QR', href: '/business/qr-generator', icon: QrCode },
    { name: 'Wallet QR', href: '/business/wallet-qr', icon: Wallet },
    { name: t('nav.reports'), href: '/business/reports', icon: BarChart3 },
    { name: t('nav.settings'), href: '/business/settings', icon: Settings },
  ]

  const staffNavigation = [
    { name: t('nav.dashboard'), href: '/staff', icon: LayoutDashboard },
    { name: t('nav.customerLookup'), href: '/staff/customer-lookup', icon: Search },
  ]

  const navigation = isStaff ? staffNavigation : adminNavigation

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
              <h1 className="text-[15px] font-semibold text-gray-900 dark:text-white">Mahfazaty</h1>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 px-3 py-4">
            <nav className="space-y-0.5">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end
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
            {/* Theme & Language Toggle */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={toggleTheme}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 transition-all text-[13px] font-medium text-gray-700 dark:text-gray-300"
              >
                {theme === 'dark' ? (
                  <Sun className="w-3.5 h-3.5" />
                ) : (
                  <Moon className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={toggleLanguage}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 transition-all text-[13px] font-medium text-gray-700 dark:text-gray-300"
              >
                <Languages className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'EN' : 'AR'}</span>
              </button>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ff6b9d] to-[#ff8eb3] flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">
                  {profile?.full_name}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  {isAdmin ? t('common.admin') : t('staff.staff')}
                </p>
              </div>
              <button
                onClick={() => signOut()}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 transition-all"
                title="Logout"
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
              <h1 className="text-[15px] font-semibold text-gray-900 dark:text-white">Mahfazaty</h1>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 px-3 py-4 overflow-y-auto">
            <nav className="space-y-0.5">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end
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
            {/* Theme & Language Toggle */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={toggleTheme}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 transition-all text-[13px] font-medium text-gray-700 dark:text-gray-300"
              >
                {theme === 'dark' ? (
                  <Sun className="w-3.5 h-3.5" />
                ) : (
                  <Moon className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={toggleLanguage}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 transition-all text-[13px] font-medium text-gray-700 dark:text-gray-300"
              >
                <Languages className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'EN' : 'AR'}</span>
              </button>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ff6b9d] to-[#ff8eb3] flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">
                  {profile?.full_name}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  {isAdmin ? t('common.admin') : t('staff.staff')}
                </p>
              </div>
              <button
                onClick={() => signOut()}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 transition-all"
                title="Logout"
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
          <h1 className="text-sm font-semibold text-gray-900 dark:text-white">Mahfazaty</h1>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
