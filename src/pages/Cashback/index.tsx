import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from 'recharts'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { useCardStore } from '@/stores/useCardStore'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import {
  getCardCashbackRanking,
  getCategoryCashbackBreakdown,
  getMonthlyCashbackTrend,
} from '@/services/cashback'
import { formatAmount } from '@/lib/currency'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { getMonthRange } from '@/lib/date'
import { cn } from '@/lib/utils'

export default function CashbackPage() {
  const { t } = useTranslation()
  const { transactions } = useTransactionStore()
  const { cards } = useCardStore()
  const { categories } = useCategoryStore()
  const currency = useSettingsStore((s) => s.currency)

  const { start, end } = getMonthRange()

  const monthlyTx = useMemo(
    () => transactions.filter((tx) => tx.date >= start && tx.date <= end),
    [transactions, start, end],
  )

  const totalCashbackThisMonth = monthlyTx.reduce((s, tx) => s + (tx.cashbackAmount || 0), 0)
  const totalCashbackAllTime = transactions.reduce((s, tx) => s + (tx.cashbackAmount || 0), 0)

  const cardRanking = useMemo(
    () => getCardCashbackRanking(transactions, cards),
    [transactions, cards],
  )

  const categoryBreakdown = useMemo(
    () => getCategoryCashbackBreakdown(monthlyTx, categories),
    [monthlyTx, categories],
  )

  const monthlyTrend = useMemo(
    () => getMonthlyCashbackTrend(transactions),
    [transactions],
  )

  return (
    <div className="space-y-6">
      <h2 className="text-xl md:text-2xl font-bold">Cashback</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">This Month</p>
          <p className="mt-1 text-xl font-bold text-success">{formatAmount(totalCashbackThisMonth, currency)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">All Time</p>
          <p className="mt-1 text-xl font-bold text-primary">{formatAmount(totalCashbackAllTime, currency)}</p>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold">Cashback Trend</h3>
        {monthlyTrend.every((d) => d.cashback === 0) ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t('common.noData')}</p>
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Bar dataKey="cashback" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} barSize={24} name="Cashback" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Card Ranking */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold">Card Ranking</h3>
        {cardRanking.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">{t('common.noData')}</p>
        ) : (
          <div className="space-y-3">
            {cardRanking.map((card, i) => (
              <div key={card.cardId} className="flex items-center gap-3">
                <span className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white',
                  i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-muted-foreground',
                )}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{card.cardName}</span>
                    <span className="text-sm font-bold text-success">{formatAmount(card.totalCashback, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Spend: {formatAmount(card.totalSpend, currency)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Rate: {card.effectiveRate.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold">Cashback by Category (This Month)</h3>
        {categoryBreakdown.length === 0 || categoryBreakdown.every((c) => c.totalCashback === 0) ? (
          <p className="py-4 text-center text-sm text-muted-foreground">{t('common.noData')}</p>
        ) : (
          <div className="space-y-2">
            {categoryBreakdown
              .filter((c) => c.totalCashback > 0)
              .map((item) => (
                <div key={item.categoryId} className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: item.color + '20' }}
                  >
                    <CategoryIcon name={item.icon} className="h-4 w-4" style={{ color: item.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">
                        {item.nameKey ? t(item.nameKey) : item.name}
                      </span>
                      <span className="text-sm font-semibold text-success">
                        {formatAmount(item.totalCashback, currency)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {item.effectiveRate.toFixed(2)}% of {formatAmount(item.totalSpend, currency)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
