import { useUserStore } from '@/stores/useUserStore'
import { useCardStore } from '@/stores/useCardStore'
import { useTransactionStore } from '@/stores/useTransactionStore'

const FREE_LIMITS = {
  maxCards: 2,
  maxTransactionsPerMonth: 75,
  maxImportsPerMonth: 2, // Any import (PDF/Image/CSV) counts
}

export function usePremium() {
  const { isPremium, isInTrial, trialDaysLeft, user, profile } = useUserStore()
  const { cards } = useCardStore()
  const { transactions } = useTransactionStore()

  // If not logged in (local mode), no limits
  const skipAuth = localStorage.getItem('zentru-skip-auth') === '1'
  if (!user && skipAuth) {
    return {
      isPremium: true, // local mode = no limits
      isInTrial: false,
      trialDaysLeft: 0,
      canAddCard: true,
      canAddTransaction: true,
      canImportPdf: true,
      canAccessAnalytics: true,
      canAccessSmartCard: true,
      canExportData: true,
      canSync: false,
      limits: FREE_LIMITS,
      usage: { cards: cards.length, monthlyTx: 0, monthlyImports: 0 },
    }
  }

  // Premium access = paid OR in trial
  const hasPremiumAccess = isPremium // isPremium already includes trial

  // Count this month's transactions
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const monthlyTx = transactions.filter((tx) => tx.date >= monthStart).length

  // Import counts (stored in localStorage)
  const importKey = `zentru-imports-${now.getFullYear()}-${now.getMonth() + 1}`
  const monthlyImports = parseInt(localStorage.getItem(importKey) || '0')

  return {
    isPremium: hasPremiumAccess,
    isInTrial,
    trialDaysLeft,
    role: profile?.role || 'user',
    canAddCard: hasPremiumAccess || cards.length < FREE_LIMITS.maxCards,
    canAddTransaction: hasPremiumAccess || monthlyTx < FREE_LIMITS.maxTransactionsPerMonth,
    canImportPdf: hasPremiumAccess || monthlyImports < FREE_LIMITS.maxImportsPerMonth,
    canImport: hasPremiumAccess || monthlyImports < FREE_LIMITS.maxImportsPerMonth,
    canAccessAnalytics: hasPremiumAccess, // only Overview + Expense + Income for free
    canAccessSmartCard: hasPremiumAccess,
    canExportData: hasPremiumAccess,
    canSync: !!user, // All logged-in users get sync (per plan)
    limits: FREE_LIMITS,
    usage: { cards: cards.length, monthlyTx, monthlyImports },
  }
}

/** Call after a successful import of any type (PDF/Image/CSV) */
export function incrementImportCount() {
  const now = new Date()
  const key = `zentru-imports-${now.getFullYear()}-${now.getMonth() + 1}`
  const count = parseInt(localStorage.getItem(key) || '0')
  localStorage.setItem(key, String(count + 1))
}

/** Backward-compat alias */
export const incrementPdfImportCount = incrementImportCount
