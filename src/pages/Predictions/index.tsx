import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Line, ComposedChart, ReferenceLine,
} from 'recharts'
import { TrendingUp, Lightbulb } from 'lucide-react'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { useBudgetStore } from '@/stores/useBudgetStore'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { getMonthlyForecast, getCashFlowForecast, getBudgetRecommendations, getFinancialHealth } from '@/services/prediction'
import { formatAmount } from '@/lib/currency'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { cn } from '@/lib/utils'

export default function PredictionsPage() {
  const { t } = useTranslation()
  const { transactions } = useTransactionStore()
  const { budgets } = useBudgetStore()
  const { categories } = useCategoryStore()
  const currency = useSettingsStore((s) => s.currency)

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  )

  const forecast = useMemo(
    () => getMonthlyForecast(transactions),
    [transactions],
  )

  const cashFlowForecast = useMemo(
    () => getCashFlowForecast(transactions),
    [transactions],
  )

  const recommendations = useMemo(
    () => getBudgetRecommendations(transactions, budgets),
    [transactions, budgets],
  )

  const health = useMemo(
    () => getFinancialHealth(transactions),
    [transactions],
  )

  const predictedMonths = forecast.filter((f) => !f.isActual)
  const nextMonthExpense = predictedMonths[0]?.predictedExpense || 0
  const nextMonthIncome = predictedMonths[0]?.predictedIncome || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-6 w-6 text-primary" />
        <h2 className="text-xl md:text-2xl font-bold">{t('nav.predictions')}</h2>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">{t('predictions.nextExpense')}</p>
          <p className="mt-1 text-xl font-bold">{formatAmount(nextMonthExpense, currency)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">{t('predictions.nextIncome')}</p>
          <p className="mt-1 text-xl font-bold text-success">{formatAmount(nextMonthIncome, currency)}</p>
        </div>
      </div>

      {/* Spending Forecast Chart */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold">{t('predictions.spendingForecast')}</h3>
        {forecast.length === 0 || forecast.every((f) => f.predictedExpense === 0) ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t('common.noData')}</p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={forecast} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Bar dataKey="predictedExpense" radius={[4, 4, 0, 0]} barSize={20} fill="hsl(var(--destructive))" fillOpacity={0.8} />
                <Bar dataKey="predictedIncome" radius={[4, 4, 0, 0]} barSize={20} fill="hsl(var(--success))" fillOpacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <p className="mt-2 text-xs text-muted-foreground text-center">{t('predictions.dashed')}</p>
      </div>

      {/* Cash Flow Forecast */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold">{t('predictions.cashFlowForecast')}</h3>
        {cashFlowForecast.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t('common.noData')}</p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={cashFlowForecast} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <ReferenceLine y={0} stroke="hsl(var(--border))" />
                <Bar dataKey="net" radius={[4, 4, 0, 0]} barSize={18}>
                  {cashFlowForecast.map((entry, i) => (
                    <rect key={i} fill={entry.net >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} />
                  ))}
                </Bar>
                <Line type="monotone" dataKey="cumulativeNet" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Financial Health */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold">{t('predictions.financialHealth')}</h3>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <p className="text-lg font-bold">{formatAmount(health.affordability, currency)}</p>
            <p className="text-[10px] text-muted-foreground">{t('predictions.affordability')}</p>
          </div>
          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <p className="text-lg font-bold">{health.sustainabilityMonths}</p>
            <p className="text-[10px] text-muted-foreground">{t('predictions.sustainability')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
            <div>
              <p className="text-sm font-bold text-success">{formatAmount(health.incomeTotal, currency)}</p>
              <p className="text-[10px] text-muted-foreground">{t('predictions.income')}</p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
            <div>
              <p className="text-sm font-bold">{formatAmount(health.cashOnHand, currency)}</p>
              <p className="text-[10px] text-muted-foreground">{t('predictions.cashOnHand')}</p>
            </div>
          </div>
        </div>

        <div className={cn(
          'rounded-lg px-3 py-2.5 text-center text-xs font-medium',
          health.cashflowStrength === 'HEALTHY' ? 'bg-success/10 text-success' :
          health.cashflowStrength === 'WARNING' ? 'bg-warning/10 text-warning' :
          'bg-destructive/10 text-destructive',
        )}>
          {t('predictions.cashflowStrength')} <span className="font-bold">{health.cashflowStrength}</span>
          {health.savingsRate > 0 && ` · ${t('predictions.savingsRate')} ${health.savingsRate}%`}
        </div>

        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <span className="text-xs text-muted-foreground">{t('predictions.monthlySavings')}</span>
          <span className={cn('text-sm font-bold', health.monthlySavings >= 0 ? 'text-success' : 'text-destructive')}>
            {formatAmount(health.monthlySavings, currency)}
          </span>
        </div>
      </div>

      {/* Budget Recommendations */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-warning" />
          {t('predictions.budgetRec')}
        </h3>
        {recommendations.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">{t('predictions.budgetRecEmpty')}</p>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec) => {
              const cat = categoryMap.get(rec.categoryId)
              return (
                <div key={rec.categoryId} className="flex items-start gap-3 rounded-lg border p-3">
                  {cat && (
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full mt-0.5"
                      style={{ backgroundColor: cat.color + '20' }}
                    >
                      <CategoryIcon name={cat.icon} className="h-4 w-4" style={{ color: cat.color }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {cat?.nameKey ? t(cat.nameKey) : cat?.name || rec.categoryId}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{rec.reason}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      {rec.currentBudget !== undefined && (
                        <span className="text-muted-foreground">
                          {t('predictions.current')}: {formatAmount(rec.currentBudget, currency)}
                        </span>
                      )}
                      <span className="font-medium text-primary">
                        {t('predictions.suggested')}: {formatAmount(rec.recommendedBudget, currency)}
                      </span>
                      <span className="text-muted-foreground">
                        {t('predictions.avg')}: {formatAmount(rec.averageSpend, currency)}{t('predictions.perMonth')}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
