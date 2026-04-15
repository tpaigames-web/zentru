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
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      // "Database error saving new user" means the trigger failed
      // but the user might still have been created in auth.users
      if (error.message.includes('Database error')) {
        return { error: '数据库错误，请联系管理员或稍后再试 / Database error, please try again later' }
      }
      return { error: error.message }
    }
    // If signup succeeded but profile wasn't created by trigger, create it manually
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          email: data.user.email,
          display_name: data.user.email?.split('@')[0] || 'User',
        }, { onConflict: 'id' })
      if (profileError) {
        console.warn('Profile creation fallback failed:', profileError.message)
      }
    }
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
