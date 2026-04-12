import type { Transaction } from '@/models/transaction'
import type { Category } from '@/models/category'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

export interface Insight {
  type: 'warning' | 'tip' | 'achievement' | 'info'
  icon: string
  titleKey: string
  titleParams?: Record<string, string | number>
  descKey: string
  descParams?: Record<string, string | number>
}

/**
 * Generate smart insights based on transaction patterns.
 */
export function generateInsights(
  transactions: Transaction[],
  categories: Category[],
  baseDate = new Date(),
): Insight[] {
  const insights: Insight[] = []
  const now = baseDate

  const thisMonthStart = startOfMonth(now).getTime()
  const thisMonthEnd = endOfMonth(now).getTime()
  const lastMonthStart = startOfMonth(subMonths(now, 1)).getTime()
  const lastMonthEnd = endOfMonth(subMonths(now, 1)).getTime()

  const thisMonthTx = transactions.filter((tx) => tx.date >= thisMonthStart && tx.date <= thisMonthEnd)
  const lastMonthTx = transactions.filter((tx) => tx.date >= lastMonthStart && tx.date <= lastMonthEnd)

  const thisMonthExpense = thisMonthTx.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0)
  const lastMonthExpense = lastMonthTx.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0)

  // 1. Month-over-month spending comparison
  if (lastMonthExpense > 0) {
    const change = ((thisMonthExpense - lastMonthExpense) / lastMonthExpense) * 100
    if (change > 20) {
      insights.push({
        type: 'warning',
        icon: 'TrendingUp',
        titleKey: 'insights.spendingUp',
        descKey: 'insights.spendingUpDesc',
        descParams: { percent: Math.round(change) },
      })
    } else if (change < -10) {
      insights.push({
        type: 'achievement',
        icon: 'TrendingDown',
        titleKey: 'insights.spendingDown',
        descKey: 'insights.spendingDownDesc',
        descParams: { percent: Math.round(Math.abs(change)) },
      })
    }
  }

  // 2. Top spending category this month
  const catTotals = new Map<string, number>()
  for (const tx of thisMonthTx) {
    if (tx.type !== 'expense') continue
    catTotals.set(tx.categoryId, (catTotals.get(tx.categoryId) || 0) + tx.amount)
  }
  if (catTotals.size > 0) {
    const topCatId = Array.from(catTotals.entries()).sort((a, b) => b[1] - a[1])[0]
    const topCat = categories.find((c) => c.id === topCatId[0])
    if (topCat && thisMonthExpense > 0) {
      const pct = Math.round((topCatId[1] / thisMonthExpense) * 100)
      insights.push({
        type: 'info',
        icon: topCat.icon,
        titleKey: 'insights.topCategory',
        titleParams: { category: topCat.nameKey || topCat.name },
        descKey: 'insights.topCategoryDesc',
        descParams: { percent: pct },
      })
    }
  }

  // 3. Frequent merchant alert
  const merchantCounts = new Map<string, { count: number; total: number }>()
  for (const tx of thisMonthTx) {
    if (!tx.merchant || tx.type !== 'expense') continue
    const m = merchantCounts.get(tx.merchant) || { count: 0, total: 0 }
    m.count++
    m.total += tx.amount
    merchantCounts.set(tx.merchant, m)
  }
  const topMerchant = Array.from(merchantCounts.entries())
    .sort((a, b) => b[1].count - a[1].count)[0]
  if (topMerchant && topMerchant[1].count >= 5) {
    insights.push({
      type: 'tip',
      icon: 'Store',
      titleKey: 'insights.frequentMerchant',
      titleParams: { merchant: topMerchant[0] },
      descKey: 'insights.frequentMerchantDesc',
      descParams: { count: topMerchant[1].count },
    })
  }

  // 4. No income recorded this month
  const thisMonthIncome = thisMonthTx.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0)
  if (thisMonthIncome === 0 && thisMonthExpense > 0) {
    insights.push({
      type: 'tip',
      icon: 'Banknote',
      titleKey: 'insights.noIncome',
      descKey: 'insights.noIncomeDesc',
    })
  }

  // 5. Cashback earned
  const cashbackTotal = thisMonthTx.reduce((s, tx) => s + (tx.cashbackAmount || 0), 0)
  if (cashbackTotal > 0) {
    insights.push({
      type: 'achievement',
      icon: 'BadgePercent',
      titleKey: 'insights.cashbackEarned',
      descKey: 'insights.cashbackEarnedDesc',
      descParams: { amount: cashbackTotal.toFixed(2) },
    })
  }

  // 6. Weekend spending pattern
  const weekendSpend = thisMonthTx
    .filter((tx) => tx.type === 'expense' && [0, 6].includes(new Date(tx.date).getDay()))
    .reduce((s, tx) => s + tx.amount, 0)
  if (thisMonthExpense > 0 && weekendSpend / thisMonthExpense > 0.5) {
    insights.push({
      type: 'info',
      icon: 'Calendar',
      titleKey: 'insights.weekendSpender',
      descKey: 'insights.weekendSpenderDesc',
      descParams: { percent: Math.round((weekendSpend / thisMonthExpense) * 100) },
    })
  }

  return insights.slice(0, 5)
}
