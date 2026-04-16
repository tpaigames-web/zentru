import { useEffect, useRef } from 'react'
import { useUserStore } from '@/stores/useUserStore'
import { useCardStore } from '@/stores/useCardStore'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useBudgetStore } from '@/stores/useBudgetStore'
import { useAccountStore } from '@/stores/useAccountStore'
import { uploadAllData } from '@/services/syncService'
import { isSupabaseConfigured } from '@/lib/supabase'

/**
 * Auto-sync: upload data to cloud after local changes.
 * Uses debounce (30s) to avoid excessive uploads.
 * Only runs when user is logged in and Supabase is configured.
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

  useEffect(() => {
    // Skip first render (initial load from Dexie)
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (!user || !isSupabaseConfigured) return

    // Debounce: wait 30s after last change before uploading
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      try {
        console.log('Auto-syncing to cloud...')
        const result = await uploadAllData(user.id)
        if (result.success) {
          console.log('Auto-sync complete')
        } else {
          console.warn('Auto-sync failed:', result.error)
        }
      } catch (e) {
        console.warn('Auto-sync error:', e)
      }
    }, 30000) // 30 seconds debounce

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [user, cards, transactions, categories, budgets, accounts])
}
