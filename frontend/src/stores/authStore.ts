import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import { isDemoMode, mockProfile, mockProfileSuperAdmin, mockProfileBusinessAdmin, mockProfileStaff } from '../lib/mockData'

interface Profile {
  id: string
  email: string
  full_name: string
  role: 'super_admin' | 'business_admin' | 'staff'
  business_id: string | null
  phone_number: string | null
  avatar_url: string | null
  is_active: boolean
}

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  initialized: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  initializeAuth: () => Promise<void>
  fetchProfile: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  signIn: async (email: string, password: string) => {
    // DEMO MODE: Skip real authentication
    if (isDemoMode()) {
      // Select profile based on email
      let selectedProfile: Profile = mockProfileBusinessAdmin as Profile
      
      const emailLower = email.toLowerCase()
      if (emailLower.includes('admin') || emailLower.includes('super')) {
        selectedProfile = mockProfileSuperAdmin as Profile
      } else if (emailLower.includes('staff')) {
        selectedProfile = mockProfileStaff as Profile
      } else if (emailLower.includes('business') || emailLower.includes('shop') || emailLower.includes('coffee')) {
        selectedProfile = mockProfileBusinessAdmin as Profile
      }
      
      const demoUser = {
        id: selectedProfile.id,
        email: email,
      } as User
      set({ user: demoUser, profile: selectedProfile })
      return
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Login error:', error)
      throw new Error(`Login failed: ${error.message}`)
    }

    set({ user: data.user })
    await get().fetchProfile()
  },

  signUp: async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) throw error

    // Create profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email,
          full_name: fullName,
          role: 'staff', // Default role
        } as any)

      if (profileError) throw profileError

      set({ user: data.user })
      await get().fetchProfile()
    }
  },

  signOut: async () => {
    // Clear local state first
    set({ user: null, profile: null })
    
    // Try to sign out from Supabase (ignore errors - session might be expired)
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch (error) {
      // Ignore - already logged out locally
      console.log('Logout completed locally')
    }
  },

  initializeAuth: async () => {
    try {
      // DEMO MODE: Auto-login as business admin
      if (isDemoMode()) {
        const demoUser = {
          id: mockProfileBusinessAdmin.id,
          email: mockProfileBusinessAdmin.email,
        } as User
        set({ user: demoUser, profile: mockProfileBusinessAdmin, loading: false, initialized: true })
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        set({ user: session.user })
        await get().fetchProfile()
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (_event, session) => {
        set({ user: session?.user ?? null })
        if (session?.user) {
          await get().fetchProfile()
        } else {
          set({ profile: null })
        }
      })
    } catch (error) {
      console.error('Error initializing auth:', error)
    } finally {
      set({ loading: false, initialized: true })
    }
  },

  fetchProfile: async () => {
    const { user } = get()
    if (!user) return

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return
    }

    set({ profile: data })
  },
}))
