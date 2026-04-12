import type { Transaction } from '@/models/transaction'

export interface QuickTemplate {
  id: string
  name: string
  type: 'expense' | 'income'
  amount?: number
  categoryId: string
  cardId?: string
  accountId?: string
  merchant?: string
  useCount: number
  lastUsed: number
}

/**
 * Generate quick templates from transaction history.
 * Finds the most frequently used merchant+category+card combos.
 */
export function generateQuickTemplates(
  transactions: Transaction[],
  limit = 6,
): QuickTemplate[] {
  const combos = new Map<string, { tx: Transaction; count: number; lastUsed: number }>()

  for (const tx of transactions) {
    if (!tx.merchant) continue
    const key = `${tx.merchant}|${tx.categoryId}|${tx.cardId || tx.accountId || ''}`
    const existing = combos.get(key)
    if (existing) {
      existing.count++
      if (tx.date > existing.lastUsed) {
        existing.lastUsed = tx.date
        existing.tx = tx
      }
    } else {
      combos.set(key, { tx, count: 1, lastUsed: tx.date })
    }
  }

  return Array.from(combos.values())
    .filter((c) => c.count >= 2) // at least used twice
    .sort((a, b) => b.count - a.count || b.lastUsed - a.lastUsed)
    .slice(0, limit)
    .map((c) => ({
      id: crypto.randomUUID(),
      name: c.tx.merchant || '',
      type: c.tx.type as 'expense' | 'income',
      amount: c.tx.amount,
      categoryId: c.tx.categoryId,
      cardId: c.tx.cardId,
      accountId: c.tx.accountId,
      merchant: c.tx.merchant,
      useCount: c.count,
      lastUsed: c.lastUsed,
    }))
}

/**
 * Get the last transaction for "repeat last" functionality.
 */
export function getLastTransaction(transactions: Transaction[]): Transaction | undefined {
  return transactions[0] // already sorted by date desc
}

/**
 * Calculate streak: consecutive days with at least one transaction.
 */
export function getStreak(transactions: Transaction[]): { current: number; best: number } {
  if (transactions.length === 0) return { current: 0, best: 0 }

  const days = new Set<string>()
  for (const tx of transactions) {
    const d = new Date(tx.date)
    days.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`)
  }

  const sortedDays = Array.from(days).sort().reverse()
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`

  // Current streak: must include today or yesterday
  let current = 0
  if (sortedDays[0] === todayStr || sortedDays[0] === yesterdayStr) {
    current = 1
    for (let i = 1; i < sortedDays.length; i++) {
      const prev = new Date(sortedDays[i - 1].replace(/-/g, '/'))
      const curr = new Date(sortedDays[i].replace(/-/g, '/'))
      const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)
      if (Math.abs(diff - 1) < 0.5) {
        current++
      } else {
        break
      }
    }
  }

  // Best streak
  let best = 1
  let streak = 1
  const allSorted = Array.from(days).sort()
  for (let i = 1; i < allSorted.length; i++) {
    const prev = new Date(allSorted[i - 1].replace(/-/g, '/'))
    const curr = new Date(allSorted[i].replace(/-/g, '/'))
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    if (Math.abs(diff - 1) < 0.5) {
      streak++
      best = Math.max(best, streak)
    } else {
      streak = 1
    }
  }

  return { current, best: Math.max(best, current) }
}
