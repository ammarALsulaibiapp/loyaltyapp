import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuthStore } from './stores/authStore'
import { useThemeStore } from './stores/themeStore'
import DemoBanner from './components/DemoBanner'
import './i18n' // Initialize i18n

// Layouts
import SuperAdminLayout from './layouts/SuperAdminLayout'
import BusinessLayout from './layouts/BusinessLayout'
import AuthLayout from './layouts/AuthLayout'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Super Admin Pages
import SuperAdminDashboard from './pages/super-admin/Dashboard'
import BusinessesPage from './pages/super-admin/Businesses'
import InvoicesPage from './pages/super-admin/Invoices'
import PlatformSettingsPage from './pages/super-admin/PlatformSettings'
import SuperAdminQRGenerator from './pages/super-admin/QRGenerator'

// Business Admin Pages
import BusinessDashboard from './pages/business/Dashboard'
import CustomersPage from './pages/business/Customers'
import LoyaltyProgramsPage from './pages/business/LoyaltyPrograms'
import RewardsPage from './pages/business/Rewards'
import StaffPage from './pages/business/Staff'
import ReportsPage from './pages/business/Reports'
import SettingsPage from './pages/business/Settings'
import QRGenerator from './pages/business/QRGenerator'
import WalletQRGenerator from './pages/business/WalletQRGenerator'

// Staff Pages
import StaffDashboard from './pages/staff/Dashboard'
import CustomerLookup from './pages/staff/CustomerLookup'

// Public Pages
import CustomerCard from './pages/CustomerCard'
import PublicSignup from './pages/PublicSignup'
import CustomerWallet from './pages/CustomerWallet'
import RootRedirect from './pages/RootRedirect'

// Protected Route
import ProtectedRoute from './components/ProtectedRoute'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  const { initializeAuth } = useAuthStore()
  const { theme } = useThemeStore()

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <DemoBanner />
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Super Admin Routes */}
          <Route
            path="/super-admin"
            element={
              <ProtectedRoute requiredRole="super_admin">
                <SuperAdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<SuperAdminDashboard />} />
            <Route path="businesses" element={<BusinessesPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="loyalty-programs" element={<LoyaltyProgramsPage />} />
            <Route path="rewards" element={<RewardsPage />} />
            <Route path="qr-generator" element={<SuperAdminQRGenerator />} />
            <Route path="wallet-qr" element={<WalletQRGenerator />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="settings" element={<PlatformSettingsPage />} />
          </Route>

          {/* Business Admin Routes */}
          <Route
            path="/business"
            element={
              <ProtectedRoute requiredRole="business_admin">
                <BusinessLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<BusinessDashboard />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="loyalty-programs" element={<LoyaltyProgramsPage />} />
            <Route path="rewards" element={<RewardsPage />} />
            <Route path="staff" element={<StaffPage />} />
            <Route path="qr-generator" element={<QRGenerator />} />
            <Route path="wallet-qr" element={<WalletQRGenerator />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Staff Routes */}
          <Route
            path="/staff"
            element={
              <ProtectedRoute requiredRole="staff">
                <BusinessLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StaffDashboard />} />
            <Route path="customer-lookup" element={<CustomerLookup />} />
          </Route>

          {/* Public Routes - NO LOGIN REQUIRED */}
          <Route path="/card/:customerId" element={<CustomerCard />} />
          <Route path="/wallet" element={<CustomerWallet />} />
          <Route path="/wallet/register" element={<CustomerWallet />} />
          <Route path="/signup" element={<PublicSignup />} />

          {/* Default redirect */}
          <Route path="/" element={<RootRedirect />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App
