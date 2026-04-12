import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  isLocked: boolean
  pinEnabled: boolean
  pinHash: string | null // SHA-256 hash, never store plaintext
  biometricEnabled: boolean
  setPin: (pin: string) => Promise<void>
  removePin: () => void
  verifyPin: (pin: string) => Promise<boolean>
  setBiometric: (enabled: boolean) => void
  lock: () => void
  unlock: () => void
}

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin + 'zentru-salt-2026')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isLocked: false,
      pinEnabled: false,
      pinHash: null,
      biometricEnabled: false,

      setPin: async (pin) => {
        const hash = await hashPin(pin)
        set({ pinEnabled: true, pinHash: hash })
      },

      removePin: () => {
        set({ pinEnabled: false, pinHash: null, biometricEnabled: false, isLocked: false })
      },

      verifyPin: async (pin) => {
        const hash = await hashPin(pin)
        return hash === get().pinHash
      },

      setBiometric: (enabled) => set({ biometricEnabled: enabled }),

      lock: () => {
        if (get().pinEnabled) set({ isLocked: true })
      },

      unlock: () => set({ isLocked: false }),
    }),
    { name: 'zentru-auth' },
  ),
)

// Auto-lock when app goes to background
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      const { pinEnabled } = useAuthStore.getState()
      if (pinEnabled) useAuthStore.getState().lock()
    }
  })
}
