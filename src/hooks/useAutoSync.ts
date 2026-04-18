import { useEffect, useRef } from 'react'
import { useUserStore } from '@/stores/useUserStore'
import { useCardStore } from '@/stores/useCardStore'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useBudgetStore } from '@/stores/useBudgetStore'
import { useAccountStore } from '@/stores/useAccountStore'
import { uploadAllData } from '@/services/syncService'
import { isSupabaseConfigured } from '@/lib/supabase'

const LOCAL_SYNC_KEY = 'zentru-last-local-change'
const CLOUD_SYNC_KEY = 'zentru-last-cloud-sync'

/**
 * Record that local data was changed. Used to prevent auto-download
 * from overwriting unsaved local changes.
 */
export function markLocalChange() {
  localStorage.setItem(LOCAL_SYNC_KEY, String(Date.now()))
}

/**
 * Record that cloud sync was successful.
 */
export function markCloudSynced() {
  localStorage.setItem(CLOUD_SYNC_KEY, String(Date.now()))
}

/**
 * Check if local has unsaved changes newer than cloud sync.
 */
export function hasUnsyncedLocalChanges(): boolean {
  const localTime = parseInt(localStorage.getItem(LOCAL_SYNC_KEY) || '0')
  const cloudTime = parseInt(localStorage.getItem(CLOUD_SYNC_KEY) || '0')
  return localTime > cloudTime
}

/**
 * Auto-sync: upload data to cloud after local changes.
 *
 * Strategy:
 * - Debounced 3s (not 30s) to reduce data-loss window
 * - Flushes immediately on page hide/beforeunload
 * - Marks local changes so auto-download knows not to overwrite
 */
export function useAutoSync() {
  const user = useUserStore((s) => s.user)
  const cards = useCardStore((s) => s.cards)
  const transactions = useTransactionStore((s) => s.transactions)
  const categories = useCategoryStore((s) => s.categories)
  const budgets = useBudgetStore((s) => s.budgets)
  const accounts = useAccountStore((s) => s.accounts)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)
  const userIdRef = useRef<string | null>(null)

  // Keep userId in ref for beforeunload callback
  useEffect(() => {
    userIdRef.current = user?.id || null
  }, [user])

  // Watch for data changes → debounced upload
  useEffect(() => {
    // Skip first render (initial load from Dexie)
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (!user || !isSupabaseConfigured) return

    // Mark that local data has changed (prevents auto-download overwrite)
    markLocalChange()

    // Clear previous timer
    if (timerRef.current) clearTimeout(timerRef.current)

    // Debounce 3 seconds (was 30s — too long, caused data loss on refresh)
    timerRef.current = setTimeout(async () => {
      try {
        console.log('Auto-syncing to cloud...')
        const result = await uploadAllData(user.id)
        if (result.success) {
          markCloudSynced()
          console.log('Auto-sync complete')
        } else {
          console.warn('Auto-sync failed:', result.error)
        }
      } catch (e) {
        console.warn('Auto-sync error:', e)
      }
    }, 3000) // 3 seconds debounce

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [user, cards, transactions, categories, budgets, accounts])

  // Flush unsaved changes on page hide / beforeunload
  useEffect(() => {
    if (!isSupabaseConfigured) return

    const flush = async () => {
      const uid = userIdRef.current
      if (!uid) return
      if (!hasUnsyncedLocalChanges()) return

      // Cancel the debounce timer — we're syncing now
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }

      try {
        console.log('Flushing sync before unload...')
        const result = await uploadAllData(uid)
        if (result.success) markCloudSynced()
      } catch (e) {
        console.warn('Flush sync failed:', e)
      }
    }

    // visibilitychange: page going to background (mobile browsers)
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush()
    }

    // pagehide: works on mobile Safari where beforeunload doesn't fire
    const onPageHide = () => flush()

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onPageHide)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onPageHide)
    }
  }, [])
}
