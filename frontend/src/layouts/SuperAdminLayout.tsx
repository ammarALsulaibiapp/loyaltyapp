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
  Wallet,
  Sparkles,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react'
import { useState } from 'react'
import { clsx } from 'clsx'

export default function SuperAdminLayout() {
  const { profile, signOut } = useAuthStore()
  const { language, toggleLanguage } = useLanguageStore()
  const { theme, toggleTheme } = useThemeStore()
  const { t, i18n } = useTranslation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isArabic = i18n.language === 'ar'

  const navigationGroups = [
    {
      title: isArabic ? 'اللوحة الرئيسية' : 'PLATFORM OVERVIEW',
      items: [
        { name: t('nav.dashboard'), href: '/super-admin', icon: LayoutDashboard },
        { name: t('nav.businesses'), href: '/super-admin/businesses', icon: Building2 },
        { name: t('nav.customers'), href: '/super-admin/customers', icon: Users },
      ]
    },
    {
      title: isArabic ? 'برامج الولاء والعروض' : 'PROGRAMS & QR',
      items: [
        { name: t('nav.loyaltyPrograms'), href: '/super-admin/loyalty-programs', icon: Gift },
        { name: t('nav.rewards'), href: '/super-admin/rewards', icon: Award },
        { name: 'Shop QR Generator', href: '/super-admin/qr-generator', icon: QrCode },
        { name: 'Wallet QR Generator', href: '/super-admin/wallet-qr', icon: Wallet },
      ]
    },
    {
      title: isArabic ? 'المالية والنظام' : 'FINANCE & SYSTEM',
      items: [
        { name: t('nav.invoices'), href: '/super-admin/invoices', icon: FileText, badge: 'AUTO', badgeColor: 'bg-gradient-to-r from-blue-500 to-indigo-500' },
        { name: t('nav.settings'), href: '/super-admin/settings', icon: Settings },
      ]
    }
  ]

  const renderNavContent = () => (
    <div className="flex flex-col h-full bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-2xl text-slate-100 border-r border-slate-800/80 shadow-2xl relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-purple-600/15 via-indigo-600/5 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-blue-600/10 via-pink-600/5 to-transparent pointer-events-none" />

      {/* Brand Header */}
      <div className="p-3.5 border-b border-slate-800/80 relative z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 via-pink-500 to-red-500 p-0.5 shadow-md shadow-purple-500/25 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-slate-900 rounded-[6px] flex items-center justify-center overflow-hidden p-0.5">
                <img src="/logo.png" alt="SabaaaPass Logo" className="w-full h-full object-contain" />
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-purple-500 border-2 border-slate-900 rounded-full animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs font-bold text-white tracking-wide truncate">
                SabaaaPass
              </h1>
              <span className="px-1 py-0.2 rounded text-[8px] font-extrabold bg-purple-500/25 text-purple-300 border border-purple-500/40 uppercase tracking-wider">
                SUPER ADMIN
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              Global Platform Control
            </p>
          </div>
        </div>
      </div>

      {/* Categorized Navigation */}
      <div className="flex-1 px-2.5 py-2.5 space-y-3 overflow-y-auto no-scrollbar relative z-10">
        {navigationGroups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            <h3 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase px-2 mb-0.5 flex items-center gap-2">
              <span>{group.title}</span>
              <span className="flex-1 h-[1px] bg-slate-800/60" />
            </h3>

            {group.items.map((item: any) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/super-admin'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  clsx(
                    'group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-300',
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white shadow-md shadow-purple-500/25 font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={clsx(
                        'w-6 h-6 rounded-md flex items-center justify-center transition-all duration-300',
                        isActive
                          ? 'bg-white/20 text-white shadow-inner backdrop-blur-md'
                          : 'bg-slate-800/50 text-slate-400 group-hover:bg-slate-700/80 group-hover:text-purple-400'
                      )}>
                        <item.icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.badge && (
                        <span className={clsx(
                          'px-1.5 py-0.2 text-[8px] font-bold text-white rounded-full shadow-sm',
                          item.badgeColor
                        )}>
                          {item.badge}
                        </span>
                      )}
                      {isActive && (
                        <ChevronRight className={clsx('w-3 h-3 text-white/80', isArabic && 'rotate-180')} />
                      )}
                    </div>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {/* User Controls & Profile Footer */}
      <div className="p-2.5 border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-md relative z-10 space-y-2 shrink-0">
        {/* Quick Toggles */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-lg border border-slate-800">
          <button
            onClick={toggleTheme}
            className="flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-[11px] font-medium"
            title="Toggle Mode"
          >
            {theme === 'dark' ? <Sun className="w-3 h-3 text-amber-400" /> : <Moon className="w-3 h-3 text-blue-400" />}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
          <div className="w-[1px] h-3.5 bg-slate-800" />
          <button
            onClick={toggleLanguage}
            className="flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-[11px] font-medium"
            title="Toggle Language"
          >
            <Languages className="w-3 h-3 text-purple-400" />
            <span>{language === 'ar' ? 'English' : 'العربية'}</span>
          </button>
        </div>

        {/* User Info Card */}
        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-0.5 shadow-md">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-[11px]">
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'S'}
              </div>
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border-2 border-slate-900 rounded-full" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {profile?.full_name || 'Super Admin'}
            </p>
            <p className="text-[10px] text-purple-400 font-medium truncate">
              {t('staff.superAdmin')}
            </p>
          </div>

          <button
            onClick={() => signOut()}
            className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Animated Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-400/20 dark:bg-purple-600/20 blur-[100px] animate-blob pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] rounded-full bg-blue-400/20 dark:bg-blue-600/20 blur-[100px] animate-blob pointer-events-none" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-[-10%] left-[20%] w-[35%] h-[35%] rounded-full bg-pink-400/20 dark:bg-pink-600/20 blur-[100px] animate-blob pointer-events-none" style={{ animationDelay: '4s' }} />

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:w-[280px] lg:flex-col ${language === 'ar' ? 'lg:right-0' : 'lg:left-0'} z-30`}>
        {renderNavContent()}
      </aside>

      {/* Mobile Backdrop */}
      <div
        className={clsx(
          'fixed inset-0 bg-slate-950/70 backdrop-blur-md z-40 lg:hidden transition-opacity duration-300',
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Mobile Sidebar Drawer */}
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
        <div className="relative h-full">
          <button
            onClick={() => setSidebarOpen(false)}
            className={`absolute top-4 ${language === 'ar' ? 'left-4' : 'right-4'} z-20 p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-all`}
          >
            <X className="w-5 h-5" />
          </button>
          {renderNavContent()}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`relative z-10 flex flex-col flex-1 min-h-screen ${language === 'ar' ? 'lg:pr-[280px]' : 'lg:pl-[280px]'}`}>
        {/* Mobile Header Bar */}
        <div className="sticky top-0 z-20 lg:hidden bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-200 hover:bg-slate-700 transition-all"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white tracking-wide">SabaaaPass</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/25 text-purple-300 border border-purple-500/40 uppercase">SUPER ADMIN</span>
          </div>
          <div className="w-9" />
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
