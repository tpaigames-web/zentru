import type { Transaction } from '@/models/transaction'
import type { Budget } from '@/models/budget'
import { startOfMonth, endOfMonth, subMonths, format, addMonths } from 'date-fns'

export interface MonthlyForecast {
  label: string
  predictedExpense: number
  predictedIncome: number
  isActual: boolean
}

export interface BudgetRecommendation {
  categoryId: string
  currentBudget?: number
  recommendedBudget: number
  averageSpend: number
  medianSpend: number
  reason: string
}

export interface CashFlowForecast {
  label: string
  income: number
  expense: number
  net: number
  cumulativeNet: number
  isPredicted: boolean
}

/**
 * Weighted moving average: recent months weighted more heavily.
 * Weights: [0.4, 0.3, 0.2, 0.1] for last 4 months.
 */
function weightedAverage(values: number[], weights = [0.4, 0.3, 0.2, 0.1]): number {
  const n = Math.min(values.length, weights.length)
  if (n === 0) return 0

  let sum = 0
  let weightSum = 0
  for (let i = 0; i < n; i++) {
    sum += values[i] * weights[i]
    weightSum += weights[i]
  }
  return sum / weightSum
}

function getMonthlyTotals(transactions: Transaction[], months: number, baseDate = new Date()) {
  const result: { expense: number; income: number }[] = []

  for (let i = 1; i <= months; i++) {
    const monthDate = subMonths(baseDate, i)
    const start = startOfMonth(monthDate).getTime()
    const end = endOfMonth(monthDate).getTime()

    const monthTx = transactions.filter((tx) => tx.date >= start && tx.date <= end)

    result.push({
      expense: monthTx.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0),
      income: monthTx.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0),
    })
  }

  return result
}

/**
 * Predict monthly spending for the next N months using weighted moving average.
 */
export function getMonthlyForecast(
  transactions: Transaction[],
  forecastMonths = 3,
  historyMonths = 6,
  baseDate = new Date(),
): MonthlyForecast[] {
  const history = getMonthlyTotals(transactions, historyMonths, baseDate)
  const result: MonthlyForecast[] = []

  // Add historical months
  for (let i = historyMonths; i >= 1; i--) {
    const monthDate = subMonths(baseDate, i)
    result.push({
      label: format(monthDate, 'MMM'),
      predictedExpense: history[i - 1].expense,
      predictedIncome: history[i - 1].income,
      isActual: true,
    })
  }

  // Current month (partial actual)
  const currentStart = startOfMonth(baseDate).getTime()
  const currentEnd = endOfMonth(baseDate).getTime()
  const currentTx = transactions.filter((tx) => tx.date >= currentStart && tx.date <= currentEnd)
  result.push({
    label: format(baseDate, 'MMM'),
    predictedExpense: currentTx.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0),
    predictedIncome: currentTx.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0),
    isActual: true,
  })

  // Forecast future months
  const expenseHistory = history.map((h) => h.expense)
  const incomeHistory = history.map((h) => h.income)

  const predictedExpense = weightedAverage(expenseHistory)
  const predictedIncome = weightedAverage(incomeHistory)

  for (let i = 1; i <= forecastMonths; i++) {
    const monthDate = addMonths(baseDate, i)
    result.push({
      label: format(monthDate, 'MMM'),
      predictedExpense: Math.round(predictedExpense),
      predictedIncome: Math.round(predictedIncome),
      isActual: false,
    })
  }

  return result
}

/**
 * Cash flow forecast with cumulative running total.
 */
export function getCashFlowForecast(
  transactions: Transaction[],
  forecastMonths = 3,
  baseDate = new Date(),
): CashFlowForecast[] {
  const forecast = getMonthlyForecast(transactions, forecastMonths, 6, baseDate)
  let cumulative = 0

  return forecast.map((f) => {
    const net = f.predictedIncome - f.predictedExpense
    cumulative += net
    return {
      label: f.label,
      income: f.predictedIncome,
      expense: f.predictedExpense,
      net,
      cumulativeNet: cumulative,
      isPredicted: !f.isActual,
    }
  })
}

/**
 * Generate budget recommendations based on historical spending patterns.
 */
export function getBudgetRecommendations(
  transactions: Transaction[],
  existingBudgets: Budget[],
  months = 4,
  baseDate = new Date(),
): BudgetRecommendation[] {
  // Group spending by category over the last N months
  const categoryMonthly = new Map<string, number[]>()

  for (let i = 1; i <= months; i++) {
    const monthDate = subMonths(baseDate, i)
    const start = startOfMonth(monthDate).getTime()
    const end = endOfMonth(monthDate).getTime()

    const monthTx = transactions.filter(
      (tx) => tx.type === 'expense' && tx.date >= start && tx.date <= end,
    )

    // Initialize all known categories
    const monthTotals = new Map<string, number>()
    for (const tx of monthTx) {
      monthTotals.set(tx.categoryId, (monthTotals.get(tx.categoryId) || 0) + tx.amount)
    }

    for (const [catId, total] of monthTotals) {
      const existing = categoryMonthly.get(catId) || []
      existing.push(total)
      categoryMonthly.set(catId, existing)
    }
  }

  const budgetMap = new Map(existingBudgets.map((b) => [b.categoryId || '__total__', b]))
  const recommendations: BudgetRecommendation[] = []

  for (const [categoryId, monthlySums] of categoryMonthly) {
    if (monthlySums.length < 2) continue

    const sorted = [...monthlySums].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    const average = monthlySums.reduce((a, b) => a + b, 0) / monthlySums.length

    // Recommend: median + 10% buffer
    const recommended = Math.ceil(median * 1.1)

    const existing = budgetMap.get(categoryId)
    let reason = ''

    if (!existing) {
      reason = 'No budget set. Based on your spending pattern.'
    } else if (existing.amount < average * 0.8) {
      reason = 'Current budget seems too low vs actual spending.'
    } else if (existing.amount > average * 1.5) {
      reason = 'Current budget seems higher than needed.'
    } else {
      continue // Budget is reasonable, skip
    }

    recommendations.push({
      categoryId,
      currentBudget: existing?.amount,
      recommendedBudget: recommended,
      averageSpend: Math.round(average),
      medianSpend: Math.round(median),
      reason,
    })
  }

  return recommendations.sort((a, b) => b.averageSpend - a.averageSpend)
}

// ---- Financial Health ----

export type CashflowStrength = 'HEALTHY' | 'WARNING' | 'CRITICAL'

export interface FinancialHealth {
  affordability: number
  sustainabilityMonths: number
  cashflowStrength: CashflowStrength
  incomeTotal: number
  expenseTotal: number
  savingsRate: number
  monthlySavings: number
  cashOnHand: number
}

export function getFinancialHealth(
  transactions: Transaction[],
  months = 3,
  baseDate = new Date(),
): FinancialHealth {
  const history = getMonthlyTotals(transactions, months, baseDate)

  const avgIncome = history.length > 0 ? history.reduce((s, h) => s + h.income, 0) / history.length : 0
  const avgExpense = history.length > 0 ? history.reduce((s, h) => s + h.expense, 0) / history.length : 0

  // Current month
  const currentStart = startOfMonth(baseDate).getTime()
  const currentEnd = endOfMonth(baseDate).getTime()
  const currentTx = transactions.filter((tx) => tx.date >= currentStart && tx.date <= currentEnd)
  const currentIncome = currentTx.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0)
  const currentExpense = currentTx.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0)

  const affordability = avgIncome - avgExpense
  const monthlySavings = currentIncome - currentExpense
  const savingsRate = avgIncome > 0 ? ((avgIncome - avgExpense) / avgIncome) * 100 : 0

  // Sustainability: how many months can you sustain if income stops
  const sustainabilityMonths = avgExpense > 0 && affordability > 0
    ? Math.floor(affordability * months / avgExpense)
    : 0

  // Cash on hand: cumulative net from all time
  const totalIncome = transactions.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0)
  const totalExpense = transactions.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0)
  const cashOnHand = totalIncome - totalExpense

  // Strength
  let cashflowStrength: CashflowStrength = 'HEALTHY'
  if (avgIncome > 0) {
    const ratio = avgExpense / avgIncome
    if (ratio >= 0.9) cashflowStrength = 'CRITICAL'
    else if (ratio >= 0.6) cashflowStrength = 'WARNING'
  } else if (avgExpense > 0) {
    cashflowStrength = 'CRITICAL'
  }

  return {
    affordability: Math.round(affordability * 100) / 100,
    sustainabilityMonths,
    cashflowStrength,
    incomeTotal: currentIncome,
    expenseTotal: currentExpense,
    savingsRate: Math.round(savingsRate * 10) / 10,
    monthlySavings: Math.round(monthlySavings * 100) / 100,
    cashOnHand: Math.round(cashOnHand * 100) / 100,
  }
}
