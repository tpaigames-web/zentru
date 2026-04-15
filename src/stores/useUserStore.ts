import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  email: string
  displayName: string
  plan: 'free' | 'premium'
  planExpiresAt: string | null
}

interface UserState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  isPremium: boolean

  initialize: () => Promise<void>
  signUp: (email: string, password: string) => Promise<{ error?: string }>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signInWithGoogle: () => Promise<{ error?: string }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const useUserStore = create<UserState>()((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  isPremium: false,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      set({ user: session.user })
      await get().refreshProfile()
    }
    set({ loading: false })

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        set({ user: session.user })
        await get().refreshProfile()
      } else {
        set({ user: null, profile: null, isPremium: false })
      }
    })
  },

  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: error.message }
    return {}
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return {}
  },

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) return { error: error.message }
    return {}
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null, isPremium: false })
  },

  refreshProfile: async () => {
    const { user } = get()
    if (!user) return

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) {
      const now = new Date()
      const expiresAt = data.plan_expires_at ? new Date(data.plan_expires_at) : null
      const isPremium = data.plan === 'premium' && (!expiresAt || expiresAt > now)

      set({
        profile: {
          id: data.id,
          email: data.email,
          displayName: data.display_name,
          plan: data.plan,
          planExpiresAt: data.plan_expires_at,
        },
        isPremium,
      })
    }
  },
}))
