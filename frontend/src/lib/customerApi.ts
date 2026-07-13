// Customer Authentication API Client
// Completely separate from staff/business auth (which uses Supabase Auth)

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

interface RegisterParams {
  phone_number: string
  full_name: string
  password: string
}

interface LoginParams {
  phone_number: string
  password: string
  remember_me?: boolean
}

interface CustomerProfile {
  id: string
  phone_number: string
  full_name: string
}

interface CustomerCard {
  id: string
  phone_number: string
  full_name: string | null
  total_visits: number
  total_points: number
  total_spent: number
  membership_tier: string
  qr_code: string
  businesses: {
    id: string
    name: string
    logo_url: string | null
    brand_color: string
    description: string | null
  }
  next_reward?: string
  visits_to_reward?: number
}

interface AuthResponse {
  success: boolean
  token: string
  customer: CustomerProfile
}

interface MeResponse {
  success: boolean
  customer: CustomerProfile
  cards: CustomerCard[]
}

class CustomerAuthAPI {
  private getToken(): string | null {
    return localStorage.getItem('customerToken')
  }

  async register(params: RegisterParams): Promise<AuthResponse> {
    const response = await fetch(`${BACKEND_URL}/api/customer-auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed')
    }

    return data
  }

  async login(params: LoginParams): Promise<AuthResponse> {
    const response = await fetch(`${BACKEND_URL}/api/customer-auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Login failed')
    }

    return data
  }

  async getMe(): Promise<MeResponse> {
    const token = this.getToken()
    if (!token) {
      throw new Error('No token')
    }

    const response = await fetch(`${BACKEND_URL}/api/customer-auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch profile')
    }

    return data
  }
}

export const customerAuthAPI = new CustomerAuthAPI()
export type { CustomerProfile, CustomerCard, AuthResponse, MeResponse }
