import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface SettingsState {
  theme: Theme
  language: string
  currency: string
  persistentNotification: boolean
  setTheme: (theme: Theme) => void
  setLanguage: (lang: string) => void
  setCurrency: (currency: string) => void
  setPersistentNotification: (enabled: boolean) => void
  getEffectiveTheme: () => 'light' | 'dark'
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      language: 'zh',
      currency: 'MYR',
      persistentNotification: true,

      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },

      setLanguage: (language) => {
        set({ language })
      },

      setCurrency: (currency) => {
        set({ currency })
      },

      setPersistentNotification: (enabled) => {
        set({ persistentNotification: enabled })
      },

      getEffectiveTheme: () => {
        const { theme } = get()
        if (theme === 'system') {
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        }
        return theme
      },
    }),
    {
      name: 'zentru-settings',
    },
  ),
)

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', isDark)
  } else {
    root.classList.toggle('dark', theme === 'dark')
  }
}

// Apply theme on load
const savedTheme = useSettingsStore.getState().theme
applyTheme(savedTheme)

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (useSettingsStore.getState().theme === 'system') {
    applyTheme('system')
  }
})
