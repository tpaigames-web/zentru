import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { downloadAllData, hasRemoteData } from '@/services/syncService'
import type { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  email: string
  displayName: string
  plan: 'free' | 'premium'
  planExpiresAt: string | null
  trialEndsAt: string | null
  trialStartedAt: string | null
  role: 'user' | 'support' | 'admin' | 'super_admin'
}

interface UserState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  isPremium: boolean
  isInTrial: boolean
  trialDaysLeft: number

  initialize: () => Promise<void>
  signUp: (email: string, password: string) => Promise<{ error?: string; alreadyExists?: boolean }>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signInWithGoogle: () => Promise<{ error?: string }>
  resetPassword: (email: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const useUserStore = create<UserState>()((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  isPremium: false,
  isInTrial: false,
  trialDaysLeft: 0,

  initialize: async () => {
    if (!isSupabaseConfigured) {
      set({ loading: false })
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        set({ user: session.user })
        await get().refreshProfile()
      }
    } catch (e) {
      console.warn('Auth session check failed:', e)
    }
    set({ loading: false })

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        set({ user: session.user })
        await get().refreshProfile()

        // Auto-download data on sign-in (new device sync)
        if (event === 'SIGNED_IN') {
          try {
            const hasData = await hasRemoteData(session.user.id)
            if (hasData) {
              console.log('Auto-syncing data from cloud...')
              const result = await downloadAllData(session.user.id)
              if (result.success) {
                console.log('Cloud data synced successfully')
              }
            }
          } catch (e) {
            console.warn('Auto-sync failed (non-critical):', e)
          }
        }
      } else {
        set({ user: null, profile: null, isPremium: false, isInTrial: false, trialDaysLeft: 0 })
        // Clear modules cache on signout
        try {
          const { useModulesStore } = await import('@/stores/useModulesStore')
          useModulesStore.getState().reset()
        } catch {}
      }
    })
  },

  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      if (error.message.includes('Database error')) {
        return { error: '数据库错误，请联系管理员或稍后再试 / Database error, please try again later' }
      }
      return { error: error.message }
    }
    // Supabase returns a user with identities=[] if the email already exists
    // (when "Confirm email" is enabled and user hasn't confirmed yet, or already confirmed)
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return { error: 'already_registered', alreadyExists: true }
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

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}`,
    })
    if (error) return { error: error.message }
    return {}
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null, isPremium: false, isInTrial: false, trialDaysLeft: 0 })

    // Clear cached data from other stores to prevent data leak between accounts
    const { useModulesStore } = await import('@/stores/useModulesStore')
    useModulesStore.getState().reset()
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
      const trialEndsAt = data.trial_ends_at ? new Date(data.trial_ends_at) : null
      const isPaidPremium = data.plan === 'premium' && (!expiresAt || expiresAt > now)
      const isInTrial = !!(trialEndsAt && trialEndsAt > now)
      const isPremium = isPaidPremium || isInTrial

      const trialDaysLeft = trialEndsAt
        ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0

      set({
        profile: {
          id: data.id,
          email: data.email,
          displayName: data.display_name,
          plan: data.plan,
          planExpiresAt: data.plan_expires_at,
          trialEndsAt: data.trial_ends_at,
          trialStartedAt: data.trial_started_at,
          role: data.role || 'user',
        },
        isPremium,
        isInTrial,
        trialDaysLeft,
      })
    }
  },
}))
