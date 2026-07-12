// Backend API client

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
const API_KEY = import.meta.env.VITE_API_KEY || ''

interface CreateBusinessOwnerParams {
  email: string
  password: string
  full_name: string
  business_id: string
  requester_role: string
}

interface CreateStaffParams {
  email: string
  password: string
  full_name: string
  phone_number?: string
  business_id: string
  requester_role: string
}

interface ResetPasswordParams {
  user_id: string
  new_password: string
  requester_role: string
}

interface UpdateEmailParams {
  user_id: string
  new_email: string
  requester_role: string
}

class BackendAPI {
  private async fetch(endpoint: string, body: any) {
    try {
      const response = await fetch(`${BACKEND_URL}/api${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY
        },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Backend API error:', data)
        throw new Error(data.error || 'API request failed')
      }

      return data
    } catch (error: any) {
      console.error('API fetch error:', error)
      throw error
    }
  }

  async createBusinessOwner(params: CreateBusinessOwnerParams) {
    return this.fetch('/auth/create-business-owner', params)
  }

  async createStaff(params: CreateStaffParams) {
    return this.fetch('/auth/create-staff', params)
  }

  async resetPassword(params: ResetPasswordParams) {
    return this.fetch('/auth/reset-password', params)
  }

  async updateEmail(params: UpdateEmailParams) {
    return this.fetch('/auth/update-email', params)
  }

  async deleteUser(user_id: string, requester_role: string) {
    return this.fetch('/auth/delete-user', { user_id, requester_role })
  }
}

export const backendAPI = new BackendAPI()
