import type { Transaction } from '@/models/transaction'
import type { Category } from '@/models/category'
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachWeekOfInterval,
  eachMonthOfInterval,
  eachDayOfInterval,
  format,
  isWithinInterval,
} from 'date-fns'

export interface CategoryTotal {
  categoryId: string
  name: string
  nameKey?: string
  icon: string
  color: string
  total: number
  count: number
  percentage: number
}

export interface TrendPoint {
  label: string
  expense: number
  income: number
}

export interface CashFlowPoint {
  label: string
  income: number
  expense: number
  net: number
}

export interface MerchantTotal {
  merchant: string
  total: number
  count: number
  percentage: number
  avgAmount: number
}

export type PeriodType = 'week' | 'month' | 'year'

export function getDateRange(period: PeriodType, baseDate = new Date()) {
  switch (period) {
    case 'week':
      return { start: startOfWeek(baseDate, { weekStartsOn: 1 }), end: endOfWeek(baseDate, { weekStartsOn: 1 }) }
    case 'month':
      return { start: startOfMonth(baseDate), end: endOfMonth(baseDate) }
    case 'year':
      return { start: startOfYear(baseDate), end: endOfYear(baseDate) }
  }
}

export function getCategoryTotals(
  transactions: Transaction[],
  categories: Category[],
  type: 'expense' | 'income' = 'expense',
): CategoryTotal[] {
  const filtered = transactions.filter((tx) => tx.type === type)
  const catMap = new Map(categories.map((c) => [c.id, c]))
  const totals = new Map<string, { total: number; count: number }>()

  for (const tx of filtered) {
    const existing = totals.get(tx.categoryId) || { total: 0, count: 0 }
    existing.total += tx.amount
    existing.count += 1
    totals.set(tx.categoryId, existing)
  }

  const grandTotal = Array.from(totals.values()).reduce((s, t) => s + t.total, 0)

  return Array.from(totals.entries())
    .map(([categoryId, { total, count }]) => {
      const cat = catMap.get(categoryId)
      return {
        categoryId,
        name: cat?.name || 'Unknown',
        nameKey: cat?.nameKey,
        icon: cat?.icon || 'CircleDot',
        color: cat?.color || '#64748b',
        total,
        count,
        percentage: grandTotal > 0 ? (total / grandTotal) * 100 : 0,
      }
    })
    .sort((a, b) => b.total - a.total)
}

export function getSpendingTrend(
  transactions: Transaction[],
  period: PeriodType,
  baseDate = new Date(),
): TrendPoint[] {
  const { start, end } = getDateRange(period, baseDate)

  if (period === 'week') {
    const days = eachDayOfInterval({ start, end })
    return days.map((day) => {
      const dayStart = new Date(day)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(day)
      dayEnd.setHours(23, 59, 59, 999)

      const dayTx = transactions.filter((tx) =>
        isWithinInterval(tx.date, { start: dayStart, end: dayEnd }),
      )

      return {
        label: format(day, 'EEE'),
        expense: dayTx.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0),
        income: dayTx.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0),
      }
    })
  }

  if (period === 'month') {
    const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 })
    return weeks.map((weekStart, i) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
      const weekTx = transactions.filter((tx) =>
        isWithinInterval(tx.date, { start: weekStart, end: weekEnd }),
      )

      return {
        label: `W${i + 1}`,
        expense: weekTx.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0),
        income: weekTx.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0),
      }
    })
  }

  // year
  const months = eachMonthOfInterval({ start, end })
  return months.map((monthStart) => {
    const monthEnd = endOfMonth(monthStart)
    const monthTx = transactions.filter((tx) =>
      isWithinInterval(tx.date, { start: monthStart, end: monthEnd }),
    )

    return {
      label: format(monthStart, 'MMM'),
      expense: monthTx.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0),
      income: monthTx.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0),
    }
  })
}

export function getCashFlow(
  transactions: Transaction[],
  baseDate = new Date(),
): CashFlowPoint[] {
  const start = startOfYear(baseDate)
  const end = endOfYear(baseDate)
  const months = eachMonthOfInterval({ start, end })

  return months.map((monthStart) => {
    const monthEnd = endOfMonth(monthStart)
    const monthTx = transactions.filter((tx) =>
      isWithinInterval(tx.date, { start: monthStart, end: monthEnd }),
    )

    const income = monthTx.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0)
    const expense = monthTx.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0)

    return {
      label: format(monthStart, 'MMM'),
      income,
      expense,
      net: income - expense,
    }
  })
}

export function getMerchantTotals(
  transactions: Transaction[],
  type: 'expense' | 'income' = 'expense',
): MerchantTotal[] {
  const filtered = transactions.filter((tx) => tx.type === type && tx.merchant)
  const totals = new Map<string, { total: number; count: number }>()

  for (const tx of filtered) {
    const merchant = tx.merchant!
    const existing = totals.get(merchant) || { total: 0, count: 0 }
    existing.total += tx.amount
    existing.count += 1
    totals.set(merchant, existing)
  }

  const grandTotal = Array.from(totals.values()).reduce((s, t) => s + t.total, 0)

  return Array.from(totals.entries())
    .map(([merchant, { total, count }]) => ({
      merchant,
      total,
      count,
      percentage: grandTotal > 0 ? (total / grandTotal) * 100 : 0,
      avgAmount: count > 0 ? total / count : 0,
    }))
    .sort((a, b) => b.total - a.total)
}
