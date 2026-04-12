import type { CreditCard } from '@/models/card'
import type { Transaction } from '@/models/transaction'
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'

export interface CardRecommendation {
  cardId: string
  cardName: string
  cardColor: string
  rate: number
  monthlyCap?: number
  usedThisMonth: number
  remainingCap: number | null  // null = no cap
  isCapReached: boolean
}

export interface SmartRecommendation {
  categoryId: string
  recommendations: CardRecommendation[]
  bestCard: CardRecommendation | null
}

/**
 * For a given expense category, rank all cards by effective cashback rate,
 * taking into account whether monthly caps have been reached.
 */
export function getSmartRecommendations(
  categoryId: string,
  cards: CreditCard[],
  transactions: Transaction[],
  baseDate = new Date(),
): SmartRecommendation {
  const monthStart = startOfMonth(baseDate)
  const monthEnd = endOfMonth(baseDate)

  const monthlyTx = transactions.filter(
    (tx) => tx.type === 'expense' && isWithinInterval(tx.date, { start: monthStart, end: monthEnd }),
  )

  const recommendations: CardRecommendation[] = []

  for (const card of cards) {
    if (!card.isActive || !card.cashbackRules?.length) continue

    // Find rule for this category
    const rule =
      card.cashbackRules.find((r) => r.categoryId === categoryId) ||
      card.cashbackRules.find((r) => r.categoryId === '*')

    if (!rule || rule.rate <= 0) continue

    // Calculate how much cashback has been used this month for this rule
    const ruleCardTx = monthlyTx.filter((tx) => tx.cardId === card.id)
    let usedThisMonth = 0

    for (const tx of ruleCardTx) {
      // Only count transactions matching this rule's category scope
      if (rule.categoryId === '*' || tx.categoryId === rule.categoryId) {
        usedThisMonth += tx.cashbackAmount || 0
      }
    }

    // Also check overall card cap
    const totalCardCashback = ruleCardTx.reduce((s, tx) => s + (tx.cashbackAmount || 0), 0)

    let remainingCap: number | null = null
    let isCapReached = false

    if (rule.monthlyCap !== undefined) {
      remainingCap = Math.max(0, rule.monthlyCap - usedThisMonth)
      if (remainingCap <= 0) isCapReached = true
    }

    if (card.totalMonthlyCashbackCap !== undefined) {
      const overallRemaining = Math.max(0, card.totalMonthlyCashbackCap - totalCardCashback)
      if (remainingCap === null) {
        remainingCap = overallRemaining
      } else {
        remainingCap = Math.min(remainingCap, overallRemaining)
      }
      if (overallRemaining <= 0) isCapReached = true
    }

    recommendations.push({
      cardId: card.id,
      cardName: card.name,
      cardColor: card.color || '#3b82f6',
      rate: rule.rate,
      monthlyCap: rule.monthlyCap,
      usedThisMonth,
      remainingCap,
      isCapReached,
    })
  }

  // Sort: non-capped cards first (by rate desc), then capped cards
  recommendations.sort((a, b) => {
    if (a.isCapReached !== b.isCapReached) return a.isCapReached ? 1 : -1
    return b.rate - a.rate
  })

  return {
    categoryId,
    recommendations,
    bestCard: recommendations.find((r) => !r.isCapReached) || null,
  }
}

/**
 * Get recommendations for all expense categories the user commonly spends on.
 */
export function getAllRecommendations(
  cards: CreditCard[],
  transactions: Transaction[],
  categoryIds: string[],
  baseDate = new Date(),
): SmartRecommendation[] {
  return categoryIds
    .map((catId) => getSmartRecommendations(catId, cards, transactions, baseDate))
    .filter((r) => r.recommendations.length > 0)
}

/**
 * Get cards that have reached their cashback cap this month.
 */
export function getCapAlerts(
  cards: CreditCard[],
  transactions: Transaction[],
  baseDate = new Date(),
): { card: CreditCard; rule: string; used: number; cap: number }[] {
  const monthStart = startOfMonth(baseDate)
  const monthEnd = endOfMonth(baseDate)

  const monthlyTx = transactions.filter(
    (tx) => tx.type === 'expense' && isWithinInterval(tx.date, { start: monthStart, end: monthEnd }),
  )

  const alerts: { card: CreditCard; rule: string; used: number; cap: number }[] = []

  for (const card of cards) {
    if (!card.cashbackRules?.length) continue

    const cardTx = monthlyTx.filter((tx) => tx.cardId === card.id)
    const totalCashback = cardTx.reduce((s, tx) => s + (tx.cashbackAmount || 0), 0)

    // Check overall cap
    if (card.totalMonthlyCashbackCap && totalCashback >= card.totalMonthlyCashbackCap * 0.9) {
      alerts.push({
        card,
        rule: 'Overall',
        used: totalCashback,
        cap: card.totalMonthlyCashbackCap,
      })
    }

    // Check per-rule caps
    for (const rule of card.cashbackRules) {
      if (!rule.monthlyCap) continue

      const ruleTx = rule.categoryId === '*'
        ? cardTx
        : cardTx.filter((tx) => tx.categoryId === rule.categoryId)

      const ruleUsed = ruleTx.reduce((s, tx) => s + (tx.cashbackAmount || 0), 0)

      if (ruleUsed >= rule.monthlyCap * 0.9) {
        alerts.push({
          card,
          rule: rule.categoryId === '*' ? 'Default' : rule.categoryId,
          used: ruleUsed,
          cap: rule.monthlyCap,
        })
      }
    }
  }

  return alerts
}
