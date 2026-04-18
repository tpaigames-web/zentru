import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export interface Module {
  key: string
  name_zh: string
  name_en: string
  category: string
  icon?: string
  description_zh?: string
  description_en?: string
  enabled: boolean
  min_plan: 'free' | 'premium'
  min_app_version?: string
  default_visible: boolean
  sort_order: number
}

export interface UserModulePref {
  module_key: string
  visible: boolean
  dashboard_widget: boolean
  nav_position?: number
}

export interface UIPreset {
  key: string
  name_zh: string
  name_en: string
  description_zh?: string
  description_en?: string
  icon?: string
  modules: string[]
  sort_order: number
}

interface ModulesState {
  modules: Module[]
  userPrefs: UserModulePref[]
  presets: UIPreset[]
  loading: boolean
  lastFetched: number

  loadModules: () => Promise<void>
  loadUserPrefs: (userId: string) => Promise<void>
  updatePref: (userId: string, moduleKey: string, pref: Partial<UserModulePref>) => Promise<void>
  applyPreset: (userId: string, presetKey: string) => Promise<void>
  reset: () => void
}

// Default modules (fallback when Supabase not configured or offline)
const DEFAULT_MODULES: Module[] = [
  { key: 'dashboard', name_zh: '首页', name_en: 'Dashboard', category: 'core', enabled: true, min_plan: 'free', default_visible: true, sort_order: 10 },
  { key: 'transactions', name_zh: '交易记录', name_en: 'Transactions', category: 'core', enabled: true, min_plan: 'free', default_visible: true, sort_order: 20 },
  { key: 'cards', name_zh: '信用卡', name_en: 'Cards', category: 'cards', enabled: true, min_plan: 'free', default_visible: true, sort_order: 30 },
  { key: 'analytics_overview', name_zh: '分析', name_en: 'Analytics', category: 'analytics', enabled: true, min_plan: 'free', default_visible: true, sort_order: 41 },
  { key: 'cashback_tracking', name_zh: '返现', name_en: 'Cashback', category: 'cards', enabled: true, min_plan: 'free', default_visible: true, sort_order: 50 },
  { key: 'recurring', name_zh: '定期交易', name_en: 'Recurring', category: 'advanced', enabled: true, min_plan: 'free', default_visible: true, sort_order: 55 },
  { key: 'import_pdf', name_zh: 'PDF导入', name_en: 'PDF Import', category: 'import', enabled: true, min_plan: 'free', default_visible: true, sort_order: 70 },
  { key: 'cloud_sync', name_zh: '云同步', name_en: 'Cloud Sync', category: 'sync', enabled: true, min_plan: 'free', default_visible: true, sort_order: 80 },
  // High-risk defaults OFF
  { key: 'budget', name_zh: '预算', name_en: 'Budget', category: 'advanced', enabled: false, min_plan: 'premium', default_visible: false, sort_order: 60 },
  { key: 'predictions', name_zh: '预测', name_en: 'Predictions', category: 'advanced', enabled: false, min_plan: 'premium', default_visible: false, sort_order: 61 },
  { key: 'smart_card', name_zh: '智能推荐', name_en: 'Smart Card', category: 'advanced', enabled: false, min_plan: 'premium', default_visible: false, sort_order: 62 },
]

const CACHE_DURATION = 1000 * 60 * 5 // 5 minutes

export const useModulesStore = create<ModulesState>()(
  persist(
    (set, get) => ({
      modules: DEFAULT_MODULES,
      userPrefs: [],
      presets: [],
      loading: false,
      lastFetched: 0,

      loadModules: async () => {
        if (!isSupabaseConfigured) return

        // Use cache if fresh
        const now = Date.now()
        if (now - get().lastFetched < CACHE_DURATION && get().modules.length > 0) return

        set({ loading: true })
        try {
          const [modulesRes, presetsRes] = await Promise.all([
            supabase.from('modules').select('*').order('sort_order'),
            supabase.from('ui_presets').select('*').order('sort_order'),
          ])

          if (modulesRes.data && modulesRes.data.length > 0) {
            set({ modules: modulesRes.data as Module[], lastFetched: now })
          }
          if (presetsRes.data) {
            set({ presets: presetsRes.data as UIPreset[] })
          }
        } catch (e) {
          console.warn('Failed to load modules from Supabase:', e)
        }
        set({ loading: false })
      },

      loadUserPrefs: async (userId) => {
        if (!isSupabaseConfigured) return
        try {
          const { data } = await supabase
            .from('user_module_prefs')
            .select('*')
            .eq('user_id', userId)
          if (data) set({ userPrefs: data as UserModulePref[] })
        } catch (e) {
          console.warn('Failed to load user prefs:', e)
        }
      },

      updatePref: async (userId, moduleKey, pref) => {
        if (!isSupabaseConfigured) return

        // Update local state immediately
        const existing = get().userPrefs.find((p) => p.module_key === moduleKey)
        const newPref: UserModulePref = {
          module_key: moduleKey,
          visible: pref.visible ?? existing?.visible ?? true,
          dashboard_widget: pref.dashboard_widget ?? existing?.dashboard_widget ?? true,
          nav_position: pref.nav_position ?? existing?.nav_position,
        }
        set({
          userPrefs: existing
            ? get().userPrefs.map((p) => (p.module_key === moduleKey ? newPref : p))
            : [...get().userPrefs, newPref],
        })

        // Upsert to Supabase
        try {
          await supabase.from('user_module_prefs').upsert({
            user_id: userId,
            module_key: moduleKey,
            visible: newPref.visible,
            dashboard_widget: newPref.dashboard_widget,
            nav_position: newPref.nav_position,
          }, { onConflict: 'user_id,module_key' })
        } catch (e) {
          console.warn('Failed to update pref:', e)
        }
      },

      applyPreset: async (userId, presetKey) => {
        const preset = get().presets.find((p) => p.key === presetKey)
        if (!preset) return

        const allModules = get().modules
        const enabledModules = allModules.filter((m) => m.enabled)
        const activeKeys = preset.modules.length > 0 ? preset.modules : enabledModules.map((m) => m.key)

        // Update each module pref based on preset
        const updates = enabledModules.map((m) => ({
          user_id: userId,
          module_key: m.key,
          visible: activeKeys.includes(m.key),
          dashboard_widget: activeKeys.includes(m.key),
        }))

        // Update local state
        set({
          userPrefs: updates.map((u) => ({
            module_key: u.module_key,
            visible: u.visible,
            dashboard_widget: u.dashboard_widget,
          })),
        })

        // Batch upsert to Supabase
        if (isSupabaseConfigured && updates.length > 0) {
          try {
            await supabase.from('user_module_prefs').upsert(updates, { onConflict: 'user_id,module_key' })
          } catch (e) {
            console.warn('Failed to apply preset:', e)
          }
        }
      },

      reset: () => set({ modules: DEFAULT_MODULES, userPrefs: [], presets: [], lastFetched: 0 }),
    }),
    {
      name: 'zentru-modules-cache',
      partialize: (state) => ({
        modules: state.modules,
        presets: state.presets,
        userPrefs: state.userPrefs,
        lastFetched: state.lastFetched,
      }),
    }
  )
)

/**
 * Check if a module is visible for the current user.
 * Takes into account: global enable, premium requirement, user preference.
 */
export function isModuleVisible(
  moduleKey: string,
  modules: Module[],
  userPrefs: UserModulePref[],
  isPremium: boolean
): boolean {
  const mod = modules.find((m) => m.key === moduleKey)
  if (!mod) return false
  if (!mod.enabled) return false
  if (mod.min_plan === 'premium' && !isPremium) return false

  const pref = userPrefs.find((p) => p.module_key === moduleKey)
  return pref?.visible ?? mod.default_visible
}
