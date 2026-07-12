import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function RootRedirect() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()

  useEffect(() => {
    console.log('=== ROOT REDIRECT DEBUG ===')
    
    // Check if there's a stored customer ID (from PWA shortcut)
    const storedCustomerId = localStorage.getItem('loyaltyCardCustomerId')
    console.log('Stored customer ID:', storedCustomerId)
    
    if (storedCustomerId) {
      console.log('Redirecting to card:', `/card/${storedCustomerId}`)
      navigate(`/card/${storedCustomerId}`, { replace: true })
      return
    }

    console.log('User:', user)
    console.log('Profile:', profile)

    if (user && profile) {
      // Redirect based on role
      if (profile.role === 'super_admin') {
        navigate('/super-admin', { replace: true })
      } else if (profile.role === 'business_admin') {
        navigate('/business', { replace: true })
      } else if (profile.role === 'staff') {
        navigate('/staff', { replace: true })
      }
    } else {
      console.log('No user/profile, going to login')
      navigate('/login', { replace: true })
    }
  }, [user, profile, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>
  )
}
