import type { RecurringTransaction } from '@/models/recurring'
import type { Transaction } from '@/models/transaction'
import { addDays, addWeeks, addMonths, addYears, setDate, isBefore, startOfDay } from 'date-fns'

/**
 * Calculate the next occurrence date for a recurring transaction.
 */
function getNextOccurrence(
  recurring: RecurringTransaction,
  after: Date,
): Date | null {
  const { frequency, dayOfMonth, dayOfWeek, endDate } = recurring

  let next: Date

  switch (frequency) {
    case 'daily':
      next = addDays(after, 1)
      break
    case 'weekly':
      next = addWeeks(after, 1)
      if (dayOfWeek !== undefined) {
        const diff = dayOfWeek - next.getDay()
        next = addDays(next, diff >= 0 ? diff : diff + 7)
      }
      break
    case 'biweekly':
      next = addWeeks(after, 2)
      break
    case 'monthly':
      next = addMonths(after, 1)
      if (dayOfMonth) next = setDate(next, Math.min(dayOfMonth, 28))
      break
    case 'yearly':
      next = addYears(after, 1)
      break
    default:
      return null
  }

  if (endDate && next.getTime() > endDate) return null
  return startOfDay(next)
}

/**
 * Generate pending transactions from recurring templates.
 * Called on app startup to catch up on any missed occurrences.
 */
export function generatePendingTransactions(
  recurringList: RecurringTransaction[],
  now = new Date(),
): { recurringId: string; transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[] }[] {
  const results: { recurringId: string; transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[] }[] = []

  for (const recurring of recurringList) {
    if (!recurring.isActive) continue

    const lastDate = recurring.lastGeneratedDate
      ? new Date(recurring.lastGeneratedDate)
      : new Date(recurring.startDate - 1) // start from day before startDate

    const pendingTx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[] = []
    let currentDate = lastDate
    let safety = 0

    while (safety < 365) {
      safety++
      const next = getNextOccurrence(recurring, currentDate)
      if (!next || isBefore(now, next)) break

      pendingTx.push({
        ...recurring.templateTransaction,
        date: next.getTime(),
        recurringId: recurring.id,
      })

      currentDate = next
    }

    if (pendingTx.length > 0) {
      results.push({ recurringId: recurring.id, transactions: pendingTx })
    }
  }

  return results
}
