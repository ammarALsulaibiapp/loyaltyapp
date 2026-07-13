import { create } from 'zustand'
import { customerAuthAPI } from '../lib/customerApi'
import type { CustomerProfile, CustomerCard } from '../lib/customerApi'

interface CustomerAuthState {
  customer: CustomerProfile | null
  cards: CustomerCard[]
  token: string | null
  loading: boolean
  initialized: boolean

  login: (phone_number: string, password: string, remember_me?: boolean) => Promise<void>
  register: (phone_number: string, full_name: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  refreshCards: () => Promise<void>
  addCard: (businessSlug: string) => Promise<void>
}

export const useCustomerAuthStore = create<CustomerAuthState>((set, get) => ({
  customer: null,
  cards: [],
  token: localStorage.getItem('customerToken'),
  loading: true,
  initialized: false,

  login: async (phone_number: string, password: string, remember_me: boolean = false) => {
    const response = await customerAuthAPI.login({ phone_number, password, remember_me })

    localStorage.setItem('customerToken', response.token)

    set({
      customer: response.customer,
      token: response.token
    })

    // Fetch cards after login
    await get().refreshCards()
  },

  register: async (phone_number: string, full_name: string, password: string) => {
    const response = await customerAuthAPI.register({ phone_number, full_name, password })

    localStorage.setItem('customerToken', response.token)

    set({
      customer: response.customer,
      token: response.token,
      cards: [] // New account, no cards yet
    })
  },

  logout: () => {
    localStorage.removeItem('customerToken')
    // Also clean up old wallet data
    localStorage.removeItem('walletPhoneNumber')
    localStorage.removeItem('walletAccess')

    set({
      customer: null,
      cards: [],
      token: null
    })
  },

  checkAuth: async () => {
    const token = localStorage.getItem('customerToken')

    if (!token) {
      set({ loading: false, initialized: true })
      return
    }

    try {
      const response = await customerAuthAPI.getMe()
      set({
        customer: response.customer,
        cards: response.cards,
        token,
        loading: false,
        initialized: true
      })
    } catch {
      // Token invalid or expired — clear it
      localStorage.removeItem('customerToken')
      set({
        customer: null,
        cards: [],
        token: null,
        loading: false,
        initialized: true
      })
    }
  },

  refreshCards: async () => {
    try {
      const response = await customerAuthAPI.getMe()
      set({
        customer: response.customer,
        cards: response.cards
      })
    } catch {
      // Silently fail — cards just won't update
      console.error('Failed to refresh cards')
    }
  },

  addCard: async (businessSlug: string) => {
    await customerAuthAPI.addCard(businessSlug)
    await get().refreshCards()
  }
}))
