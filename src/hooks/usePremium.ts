import { useUserStore } from '@/stores/useUserStore'
import { useCardStore } from '@/stores/useCardStore'
import { useTransactionStore } from '@/stores/useTransactionStore'

const FREE_LIMITS = {
  maxCards: 2,
  maxTransactionsPerMonth: 75,
  maxPdfImportsPerMonth: 2,
}

export function usePremium() {
  const { isPremium, user } = useUserStore()
  const { cards } = useCardStore()
  const { transactions } = useTransactionStore()

  // If not logged in (local mode), no limits
  const skipAuth = localStorage.getItem('zentru-skip-auth') === '1'
  if (!user && skipAuth) {
    return {
      isPremium: true, // local mode = no limits
      canAddCard: true,
      canAddTransaction: true,
      canImportPdf: true,
      canAccessAnalytics: true,
      canAccessSmartCard: true,
      canExportData: true,
      canSync: false,
      limits: FREE_LIMITS,
      usage: { cards: cards.length, monthlyTx: 0, monthlyPdfImports: 0 },
    }
  }

  // Count this month's transactions
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const monthlyTx = transactions.filter((tx) => tx.date >= monthStart).length

  // PDF imports count (stored in localStorage for simplicity)
  const pdfKey = `zentru-pdf-imports-${now.getFullYear()}-${now.getMonth() + 1}`
  const monthlyPdfImports = parseInt(localStorage.getItem(pdfKey) || '0')

  return {
    isPremium,
    canAddCard: isPremium || cards.length < FREE_LIMITS.maxCards,
    canAddTransaction: isPremium || monthlyTx < FREE_LIMITS.maxTransactionsPerMonth,
    canImportPdf: isPremium || monthlyPdfImports < FREE_LIMITS.maxPdfImportsPerMonth,
    canAccessAnalytics: isPremium, // only Overview + Expense for free
    canAccessSmartCard: isPremium,
    canExportData: isPremium,
    canSync: isPremium,
    limits: FREE_LIMITS,
    usage: { cards: cards.length, monthlyTx, monthlyPdfImports },
  }
}

/** Call after a successful PDF import */
export function incrementPdfImportCount() {
  const now = new Date()
  const key = `zentru-pdf-imports-${now.getFullYear()}-${now.getMonth() + 1}`
  const count = parseInt(localStorage.getItem(key) || '0')
  localStorage.setItem(key, String(count + 1))
}
