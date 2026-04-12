import type { Transaction } from '@/models/transaction'
import type { Category } from '@/models/category'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from 'date-fns'

export interface PeriodSummary {
  period: 'week' | 'month'
  totalExpense: number
  totalIncome: number
  net: number
  transactionCount: number
  cashbackEarned: number
  topCategory: { name: string; nameKey?: string; total: number } | null
  topMerchant: { name: string; total: number; count: number } | null
  vsLastPeriod: { expenseChange: number; incomeChange: number } | null
  dailyAverage: number
}

export function getWeeklySummary(
  transactions: Transaction[],
  categories: Category[],
  baseDate = new Date(),
): PeriodSummary {
  return getPeriodSummary(transactions, categories, 'week', baseDate)
}

export function getMonthlySummary(
  transactions: Transaction[],
  categories: Category[],
  baseDate = new Date(),
): PeriodSummary {
  return getPeriodSummary(transactions, categories, 'month', baseDate)
}

function getPeriodSummary(
  transactions: Transaction[],
  categories: Category[],
  period: 'week' | 'month',
  baseDate: Date,
): PeriodSummary {
  const catMap = new Map(categories.map((c) => [c.id, c]))

  const thisStart = period === 'week'
    ? startOfWeek(baseDate, { weekStartsOn: 1 }).getTime()
    : startOfMonth(baseDate).getTime()
  const thisEnd = period === 'week'
    ? endOfWeek(baseDate, { weekStartsOn: 1 }).getTime()
    : endOfMonth(baseDate).getTime()

  const lastStart = period === 'week'
    ? startOfWeek(subWeeks(baseDate, 1), { weekStartsOn: 1 }).getTime()
    : startOfMonth(subMonths(baseDate, 1)).getTime()
  const lastEnd = period === 'week'
    ? endOfWeek(subWeeks(baseDate, 1), { weekStartsOn: 1 }).getTime()
    : endOfMonth(subMonths(baseDate, 1)).getTime()

  const thisTx = transactions.filter((tx) => tx.date >= thisStart && tx.date <= thisEnd)
  const lastTx = transactions.filter((tx) => tx.date >= lastStart && tx.date <= lastEnd)

  const totalExpense = thisTx.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0)
  const totalIncome = thisTx.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0)
  const cashbackEarned = thisTx.reduce((s, tx) => s + (tx.cashbackAmount || 0), 0)

  const lastExpense = lastTx.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0)
  const lastIncome = lastTx.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0)

  // Top category
  const catTotals = new Map<string, number>()
  for (const tx of thisTx) {
    if (tx.type !== 'expense') continue
    catTotals.set(tx.categoryId, (catTotals.get(tx.categoryId) || 0) + tx.amount)
  }
  let topCategory: PeriodSummary['topCategory'] = null
  if (catTotals.size > 0) {
    const top = Array.from(catTotals.entries()).sort((a, b) => b[1] - a[1])[0]
    const cat = catMap.get(top[0])
    if (cat) topCategory = { name: cat.name, nameKey: cat.nameKey, total: top[1] }
  }

  // Top merchant
  const merchantTotals = new Map<string, { total: number; count: number }>()
  for (const tx of thisTx) {
    if (tx.type !== 'expense' || !tx.merchant) continue
    const m = merchantTotals.get(tx.merchant) || { total: 0, count: 0 }
    m.total += tx.amount
    m.count++
    merchantTotals.set(tx.merchant, m)
  }
  let topMerchant: PeriodSummary['topMerchant'] = null
  if (merchantTotals.size > 0) {
    const top = Array.from(merchantTotals.entries()).sort((a, b) => b[1].total - a[1].total)[0]
    topMerchant = { name: top[0], ...top[1] }
  }

  const days = period === 'week' ? 7 : new Date(thisEnd).getDate()

  return {
    period,
    totalExpense,
    totalIncome,
    net: totalIncome - totalExpense,
    transactionCount: thisTx.length,
    cashbackEarned,
    topCategory,
    topMerchant,
    vsLastPeriod: lastTx.length > 0 ? {
      expenseChange: lastExpense > 0 ? ((totalExpense - lastExpense) / lastExpense) * 100 : 0,
      incomeChange: lastIncome > 0 ? ((totalIncome - lastIncome) / lastIncome) * 100 : 0,
    } : null,
    dailyAverage: days > 0 ? totalExpense / days : 0,
  }
}
