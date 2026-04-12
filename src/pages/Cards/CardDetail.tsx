import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Pencil, Banknote, History } from 'lucide-react'
import { useCardStore } from '@/stores/useCardStore'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { formatAmount } from '@/lib/currency'
import { formatDate, getDaysUntilDue, getMonthRange } from '@/lib/date'
import { cn } from '@/lib/utils'

export default function CardDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { cards } = useCardStore()
  const { transactions } = useTransactionStore()
  const { categories } = useCategoryStore()
  const currency = useSettingsStore((s) => s.currency)

  const card = cards.find((c) => c.id === id)
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const { start, end } = getMonthRange()
  const cardTransactions = useMemo(() => transactions.filter((tx) => tx.cardId === id), [transactions, id])
  const monthlyTx = useMemo(() => cardTransactions.filter((tx) => tx.date >= start && tx.date <= end), [cardTransactions, start, end])

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>()
    for (const tx of monthlyTx) {
      if (tx.type !== 'expense') continue
      map.set(tx.categoryId, (map.get(tx.categoryId) || 0) + tx.amount)
    }
    return Array.from(map.entries())
      .map(([catId, total]) => {
        const cat = categoryMap.get(catId)
        return { catId, name: cat?.nameKey ? t(cat.nameKey) : cat?.name || '', icon: cat?.icon || 'CircleDot', color: cat?.color || '#64748b', total }
      })
      .sort((a, b) => b.total - a.total)
  }, [monthlyTx, categoryMap, t])

  if (!card) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('/cards')} className="rounded-full p-1 hover:bg-accent">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <p className="text-center text-muted-foreground">{t('common.noData')}</p>
      </div>
    )
  }

  const utilization = card.creditLimit > 0 ? (card.currentBalance / card.creditLimit) * 100 : 0
  const daysUntilDue = getDaysUntilDue(card.dueDay)
  const monthlySpend = monthlyTx.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0)
  const monthlyCashback = monthlyTx.reduce((s, tx) => s + (tx.cashbackAmount || 0), 0)
  const totalCashbackAllTime = cardTransactions.reduce((s, tx) => s + (tx.cashbackAmount || 0), 0)
  const utilizationColor = utilization >= 80 ? 'bg-destructive' : utilization >= 50 ? 'bg-warning' : 'bg-success'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/cards')} className="rounded-full p-1 hover:bg-accent">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl md:text-2xl font-bold">{card.name}</h2>
        </div>
        <button onClick={() => navigate(`/cards?edit=${card.id}`)} className="rounded-full p-2 hover:bg-accent">
          <Pencil className="h-4 w-4" />
        </button>
      </div>

      {/* Card visual */}
      <div className="rounded-2xl p-5 text-white" style={{ backgroundColor: card.color || '#3b82f6' }}>
        <p className="text-sm opacity-80">{card.bank}</p>
        <p className="mt-1 text-lg font-bold">{card.name}</p>
        {card.lastFourDigits && (
          <p className="mt-3 font-mono text-sm opacity-70">•••• •••• •••• {card.lastFourDigits}</p>
        )}
        <div className="mt-4 flex justify-between">
          <div>
            <p className="text-xs opacity-60">{t('cards.currentBalance')}</p>
            <p className="text-xl font-bold">{formatAmount(card.currentBalance, currency)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-60">{t('cards.creditLimit')}</p>
            <p className="text-lg font-semibold">{formatAmount(card.creditLimit, currency)}</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border bg-card p-3 shadow-sm text-center">
          <p className="text-xs text-muted-foreground">{t('cards.utilization')}</p>
          <p className="mt-1 text-lg font-bold">{utilization.toFixed(0)}%</p>
          <div className="mt-1.5 h-1.5 rounded-full bg-muted">
            <div className={`h-full rounded-full ${utilizationColor}`} style={{ width: `${Math.min(utilization, 100)}%` }} />
          </div>
        </div>
        <div className="rounded-xl border bg-card p-3 shadow-sm text-center">
          <p className="text-xs text-muted-foreground">{t('cards.daysUntilDue')}</p>
          <p className={cn('mt-1 text-lg font-bold', daysUntilDue <= 3 ? 'text-destructive' : daysUntilDue <= 7 ? 'text-warning' : '')}>
            {daysUntilDue}
          </p>
          <p className="text-xs text-muted-foreground">{t('cards.days')}</p>
        </div>
        <div className="rounded-xl border bg-card p-3 shadow-sm text-center">
          <p className="text-xs text-muted-foreground">Cashback</p>
          <p className="mt-1 text-lg font-bold text-success">{formatAmount(monthlyCashback, currency)}</p>
          <p className="text-xs text-muted-foreground">{t('dateRange.thisMonth')}</p>
        </div>
      </div>

      {/* Monthly summary */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold mb-3">{t('dateRange.thisMonth')}</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">{t('transactions.expense')}</p>
            <p className="text-base font-bold">{formatAmount(monthlySpend, currency)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Cashback</p>
            <p className="text-base font-bold text-success">{formatAmount(totalCashbackAllTime, currency)}</p>
          </div>
        </div>
      </div>

      {/* Cashback rules */}
      {card.cashbackRules && card.cashbackRules.length > 0 && (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <h3 className="text-sm font-semibold mb-2">Cashback Rules</h3>
          <div className="space-y-1.5">
            {card.cashbackRules.map((rule, i) => {
              const cat = rule.categoryId !== '*' ? categoryMap.get(rule.categoryId) : null
              return (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {cat ? (cat.nameKey ? t(cat.nameKey) : cat.name) : 'Default'}
                  </span>
                  <span className="font-medium">
                    {rule.rate}%
                    {rule.monthlyCap ? ` (cap RM${rule.monthlyCap})` : ''}
                  </span>
                </div>
              )
            })}
            {card.totalMonthlyCashbackCap && (
              <div className="flex items-center justify-between text-sm border-t pt-1.5">
                <span className="text-muted-foreground">Overall Cap</span>
                <span className="font-medium">{formatAmount(card.totalMonthlyCashbackCap, currency)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <h3 className="text-sm font-semibold mb-3">{t('analytics.expenseByCategory')}</h3>
          <div className="space-y-2">
            {categoryBreakdown.slice(0, 6).map((item) => (
              <div key={item.catId} className="flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: item.color + '20' }}>
                  <CategoryIcon name={item.icon} className="h-3.5 w-3.5" style={{ color: item.color }} />
                </div>
                <span className="flex-1 text-sm truncate">{item.name}</span>
                <span className="text-sm font-semibold">{formatAmount(item.total, currency)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => navigate(`/cards?pay=${card.id}`)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-success px-3 py-2.5 text-sm font-medium text-success-foreground hover:bg-success/90 transition-colors"
        >
          <Banknote className="h-4 w-4" />
          {t('cards.makePayment')}
        </button>
        <button
          onClick={() => navigate(`/cards?history=${card.id}`)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
        >
          <History className="h-4 w-4" />
          {t('cards.paymentHistory')}
        </button>
      </div>

      {/* Recent transactions */}
      <div className="rounded-xl border bg-card shadow-sm">
        <h3 className="px-4 pt-4 pb-2 text-sm font-semibold">
          {t('dashboard.recentTransactions')} ({cardTransactions.length})
        </h3>
        {cardTransactions.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-muted-foreground">{t('transactions.noTransactions')}</p>
        ) : (
          <div className="divide-y">
            {cardTransactions.slice(0, 20).map((tx) => {
              const cat = categoryMap.get(tx.categoryId)
              return (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-2.5">
                  {cat && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: cat.color + '20' }}>
                      <CategoryIcon name={cat.icon} className="h-4 w-4" style={{ color: cat.color }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{cat?.nameKey ? t(cat.nameKey) : cat?.name || ''}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {formatDate(tx.date, 'MM/dd', i18n.language)}
                      {tx.merchant ? ` · ${tx.merchant}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={cn('text-sm font-semibold', tx.type === 'income' ? 'text-success' : '')}>
                      {tx.type === 'income' ? '+' : '-'}{formatAmount(tx.amount, tx.currency)}
                    </span>
                    {tx.cashbackAmount ? (
                      <p className="text-xs text-success">+{formatAmount(tx.cashbackAmount, tx.currency)} cb</p>
                    ) : null}
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
