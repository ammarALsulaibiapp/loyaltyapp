import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'super_admin' | 'business_admin' | 'staff'
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, profile, loading, initialized } = useAuthStore()

  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && profile.role !== requiredRole) {
    // Redirect based on actual role
    if (profile.role === 'super_admin') {
      return <Navigate to="/super-admin" replace />
    } else if (profile.role === 'business_admin') {
      return <Navigate to="/business" replace />
    } else {
      return <Navigate to="/staff" replace />
    }
  }

  return <>{children}</>
}
