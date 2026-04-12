import type { CreditCard, CashbackRule } from '@/models/card'
import type { Transaction } from '@/models/transaction'
import type { Category } from '@/models/category'
import { endOfMonth, isWithinInterval, eachMonthOfInterval, format } from 'date-fns'

export interface CashbackResult {
  amount: number
  rate: number
  rule: CashbackRule | null
  capped: boolean
}

/**
 * Calculate cashback for a single transaction based on card rules.
 * Takes into account per-category caps and overall monthly cap.
 */
export function calculateCashback(
  transaction: Transaction,
  card: CreditCard,
  monthlyUsedByCategory: Map<string, number>,
  monthlyUsedTotal: number,
): CashbackResult {
  if (!card.cashbackRules?.length || transaction.type !== 'expense') {
    return { amount: 0, rate: 0, rule: null, capped: false }
  }

  // Find matching rule: specific category first, then wildcard '*'
  const rule =
    card.cashbackRules.find((r) => r.categoryId === transaction.categoryId) ||
    card.cashbackRules.find((r) => r.categoryId === '*')

  if (!rule) {
    return { amount: 0, rate: 0, rule: null, capped: false }
  }

  let cashback = transaction.amount * (rule.rate / 100)
  let capped = false

  // Apply per-category monthly cap
  if (rule.monthlyCap !== undefined) {
    const used = monthlyUsedByCategory.get(rule.categoryId) || 0
    const remaining = Math.max(0, rule.monthlyCap - used)
    if (cashback > remaining) {
      cashback = remaining
      capped = true
    }
  }

  // Apply overall monthly cap
  if (card.totalMonthlyCashbackCap !== undefined) {
    const remaining = Math.max(0, card.totalMonthlyCashbackCap - monthlyUsedTotal)
    if (cashback > remaining) {
      cashback = remaining
      capped = true
    }
  }

  return {
    amount: Math.round(cashback * 100) / 100,
    rate: rule.rate,
    rule,
    capped,
  }
}

/**
 * Recalculate cashback for all transactions of a card in a given month.
 * Returns updated transactions with cashbackAmount and cashbackRate.
 */
export function recalculateMonthCashback(
  transactions: Transaction[],
  card: CreditCard,
): Transaction[] {
  if (!card.cashbackRules?.length) return transactions

  const monthlyUsedByCategory = new Map<string, number>()
  let monthlyUsedTotal = 0

  return transactions.map((tx) => {
    if (tx.type !== 'expense' || tx.cardId !== card.id) return tx

    const result = calculateCashback(tx, card, monthlyUsedByCategory, monthlyUsedTotal)

    // Track usage
    if (result.rule) {
      const catKey = result.rule.categoryId
      monthlyUsedByCategory.set(catKey, (monthlyUsedByCategory.get(catKey) || 0) + result.amount)
    }
    monthlyUsedTotal += result.amount

    return {
      ...tx,
      cashbackAmount: result.amount,
      cashbackRate: result.rate,
    }
  })
}

// ---- Analytics ----

export interface CardCashbackSummary {
  cardId: string
  cardName: string
  cardColor: string
  totalCashback: number
  totalSpend: number
  effectiveRate: number
  transactionCount: number
}

export interface CategoryCashbackSummary {
  categoryId: string
  name: string
  nameKey?: string
  icon: string
  color: string
  totalCashback: number
  totalSpend: number
  effectiveRate: number
}

export interface MonthlyCashbackPoint {
  label: string
  cashback: number
  spend: number
}

export function getCardCashbackRanking(
  transactions: Transaction[],
  cards: CreditCard[],
): CardCashbackSummary[] {
  const cardMap = new Map(cards.map((c) => [c.id, c]))
  const summaries = new Map<string, CardCashbackSummary>()

  for (const tx of transactions) {
    if (tx.type !== 'expense' || !tx.cardId) continue
    const card = cardMap.get(tx.cardId)
    if (!card) continue

    const existing = summaries.get(tx.cardId) || {
      cardId: tx.cardId,
      cardName: card.name,
      cardColor: card.color || '#3b82f6',
      totalCashback: 0,
      totalSpend: 0,
      effectiveRate: 0,
      transactionCount: 0,
    }

    existing.totalCashback += tx.cashbackAmount || 0
    existing.totalSpend += tx.amount
    existing.transactionCount += 1
    summaries.set(tx.cardId, existing)
  }

  return Array.from(summaries.values())
    .map((s) => ({
      ...s,
      effectiveRate: s.totalSpend > 0 ? (s.totalCashback / s.totalSpend) * 100 : 0,
    }))
    .sort((a, b) => b.totalCashback - a.totalCashback)
}

export function getCategoryCashbackBreakdown(
  transactions: Transaction[],
  categories: Category[],
): CategoryCashbackSummary[] {
  const catMap = new Map(categories.map((c) => [c.id, c]))
  const summaries = new Map<string, CategoryCashbackSummary>()

  for (const tx of transactions) {
    if (tx.type !== 'expense') continue
    const cat = catMap.get(tx.categoryId)

    const existing = summaries.get(tx.categoryId) || {
      categoryId: tx.categoryId,
      name: cat?.name || 'Unknown',
      nameKey: cat?.nameKey,
      icon: cat?.icon || 'CircleDot',
      color: cat?.color || '#64748b',
      totalCashback: 0,
      totalSpend: 0,
      effectiveRate: 0,
    }

    existing.totalCashback += tx.cashbackAmount || 0
    existing.totalSpend += tx.amount
    summaries.set(tx.categoryId, existing)
  }

  return Array.from(summaries.values())
    .map((s) => ({
      ...s,
      effectiveRate: s.totalSpend > 0 ? (s.totalCashback / s.totalSpend) * 100 : 0,
    }))
    .sort((a, b) => b.totalCashback - a.totalCashback)
}

export function getMonthlyCashbackTrend(
  transactions: Transaction[],
  year = new Date().getFullYear(),
): MonthlyCashbackPoint[] {
  const start = new Date(year, 0, 1)
  const end = new Date(year, 11, 31)
  const months = eachMonthOfInterval({ start, end })

  return months.map((monthStart) => {
    const monthEnd = endOfMonth(monthStart)
    const monthTx = transactions.filter(
      (tx) => tx.type === 'expense' && isWithinInterval(tx.date, { start: monthStart, end: monthEnd }),
    )

    return {
      label: format(monthStart, 'MMM'),
      cashback: monthTx.reduce((s, tx) => s + (tx.cashbackAmount || 0), 0),
      spend: monthTx.reduce((s, tx) => s + tx.amount, 0),
    }
  })
}
