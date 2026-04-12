import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { CreditCard, TrendingDown, TrendingUp, Clock, Plus, AlertTriangle } from 'lucide-react'
import { formatAmount } from '@/lib/currency'
import { formatDate, getMonthRange } from '@/lib/date'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useCardStore } from '@/stores/useCardStore'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { useAccountStore } from '@/stores/useAccountStore'
import { getPaymentAlerts } from '@/services/notification'
import { generateQuickTemplates, getStreak } from '@/services/quickEntry'
import { generateInsights } from '@/services/insights'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const currency = useSettingsStore((s) => s.currency)
  const { cards } = useCardStore()
  const { transactions } = useTransactionStore()
  const { categories } = useCategoryStore()

  const { accounts } = useAccountStore()

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  )
  const cardMap = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards])
  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts])
  const paymentAlerts = useMemo(() => getPaymentAlerts(cards), [cards])

  const { start, end } = getMonthRange()

  const monthlyTx = useMemo(
    () => transactions.filter((tx) => tx.date >= start && tx.date <= end),
    [transactions, start, end],
  )

  const totalBalance = cards.reduce((sum, c) => sum + c.currentBalance, 0)
  const monthlyExpense = monthlyTx.filter((tx) => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0)
  const monthlyIncome = monthlyTx.filter((tx) => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0)

  const upcomingCards = cards.filter((c) => {
    const now = new Date()
    const dueDate = new Date(now.getFullYear(), now.getMonth(), c.dueDay)
    if (dueDate < now) dueDate.setMonth(dueDate.getMonth() + 1)
    const diff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff <= 7 && c.currentBalance > 0
  })
  const upcomingTotal = upcomingCards.reduce((sum, c) => sum + c.currentBalance, 0)

  const recentTx = transactions.slice(0, 8)
  const streak = useMemo(() => getStreak(transactions), [transactions])
  const quickTemplates = useMemo(() => generateQuickTemplates(transactions), [transactions])
  const insights = useMemo(() => generateInsights(transactions, categories), [transactions, categories])

  const stats = [
    { labelKey: 'dashboard.totalBalance', value: formatAmount(totalBalance, currency), icon: CreditCard, color: 'text-primary' },
    { labelKey: 'dashboard.monthlyExpense', value: formatAmount(monthlyExpense, currency), icon: TrendingDown, color: 'text-destructive' },
    { labelKey: 'dashboard.monthlyIncome', value: formatAmount(monthlyIncome, currency), icon: TrendingUp, color: 'text-success' },
    { labelKey: 'dashboard.upcomingPayments', value: formatAmount(upcomingTotal, currency), icon: Clock, color: 'text-warning' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold">{t('dashboard.title')}</h2>
        <button
          onClick={() => navigate('/transactions/new')}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t('dashboard.quickAdd')}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 md:gap-3 md:grid-cols-4">
        {stats.map(({ labelKey, value, icon: Icon, color }) => (
          <div
            key={labelKey}
            className="rounded-xl border bg-card p-3 md:p-4 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${color}`} />
              <span className="text-xs text-muted-foreground">{t(labelKey)}</span>
            </div>
            <p className="mt-2 text-lg font-semibold">{value}</p>
          </div>
        ))}
      </div>

      {/* Streak + Quick Entry */}
      {(streak.current > 0 || quickTemplates.length > 0) && (
        <div className="flex gap-3">
          {/* Streak */}
          {streak.current > 0 && (
            <div className="flex items-center gap-2 rounded-xl border bg-card px-4 py-3 shadow-sm">
              <span className="text-2xl">🔥</span>
              <div>
                <p className="text-lg font-bold">{streak.current}</p>
                <p className="text-xs text-muted-foreground">{t('dashboard.streakDays')}</p>
              </div>
            </div>
          )}

          {/* Quick templates */}
          {quickTemplates.length > 0 && (
            <div className="flex-1 overflow-hidden rounded-xl border bg-card shadow-sm">
              <div className="px-3 pt-2.5 pb-1">
                <p className="text-xs font-semibold text-muted-foreground">{t('dashboard.quickAdd')}</p>
              </div>
              <div className="flex gap-1.5 overflow-x-auto px-3 pb-2.5">
                {quickTemplates.map((tpl) => {
                  const cat = categoryMap.get(tpl.categoryId)
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => navigate(`/transactions/new?tpl=${encodeURIComponent(tpl.merchant || '')}&cat=${tpl.categoryId}&card=${tpl.cardId || ''}&acc=${tpl.accountId || ''}&amt=${tpl.amount || ''}`)}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg bg-muted/50 px-2.5 py-1.5 text-xs hover:bg-accent transition-colors"
                    >
                      {cat && <CategoryIcon name={cat.icon} className="h-3.5 w-3.5" style={{ color: cat.color }} />}
                      <span className="truncate max-w-20">{tpl.merchant}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="space-y-2">
          {insights.map((insight, i) => (
            <div
              key={i}
              className={cn(
                'flex items-start gap-3 rounded-xl border px-4 py-3',
                insight.type === 'warning' ? 'border-destructive/20 bg-destructive/5' :
                insight.type === 'achievement' ? 'border-success/20 bg-success/5' :
                insight.type === 'tip' ? 'border-primary/20 bg-primary/5' :
                'border-border bg-card',
              )}
            >
              <CategoryIcon
                name={insight.icon}
                className={cn('h-4 w-4 mt-0.5 shrink-0',
                  insight.type === 'warning' ? 'text-destructive' :
                  insight.type === 'achievement' ? 'text-success' :
                  'text-primary',
                )}
              />
              <div>
                <p className="text-sm font-medium">
                  {t(insight.titleKey, insight.titleParams)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t(insight.descKey, insight.descParams)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Due Alerts */}
      {paymentAlerts.length > 0 && (
        <div className="space-y-2">
          {paymentAlerts.map(({ card, daysUntilDue }) => (
            <div
              key={card.id}
              className={cn(
                'flex items-center gap-3 rounded-xl border px-4 py-3',
                daysUntilDue <= 1 ? 'border-destructive/30 bg-destructive/5' : daysUntilDue <= 3 ? 'border-warning/30 bg-warning/5' : 'border-primary/20 bg-primary/5',
              )}
            >
              <AlertTriangle className={cn('h-4 w-4 shrink-0', daysUntilDue <= 1 ? 'text-destructive' : daysUntilDue <= 3 ? 'text-warning' : 'text-primary')} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{card.name}</p>
                <p className="text-xs text-muted-foreground">
                  {daysUntilDue === 0 ? t('dashboard.dueToday') : `${daysUntilDue} ${t('cards.days')} ${t('dashboard.untilDue')}`}
                </p>
              </div>
              <span className="text-sm font-bold">{formatAmount(card.currentBalance, currency)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recent Transactions */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex items-center justify-between p-4 pb-2">
          <h3 className="text-base font-semibold">{t('dashboard.recentTransactions')}</h3>
          {transactions.length > 0 && (
            <button
              onClick={() => navigate('/transactions')}
              className="text-xs text-primary hover:underline"
            >
              {t('common.all')} →
            </button>
          )}
        </div>

        {recentTx.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <p className="text-sm">{t('dashboard.noTransactions')}</p>
          </div>
        ) : (
          <div className="divide-y">
            {recentTx.map((tx) => {
              const cat = categoryMap.get(tx.categoryId)
              const card = tx.cardId ? cardMap.get(tx.cardId) : null
              const account = tx.accountId ? accountMap.get(tx.accountId) : null
              const paymentName = card?.name || account?.name
              return (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                  {cat && (
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: cat.color + '20' }}
                    >
                      <CategoryIcon name={cat.icon} className="h-4 w-4" style={{ color: cat.color }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {cat ? (cat.nameKey ? t(cat.nameKey) : cat.name) : ''}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {formatDate(tx.date, 'MM/dd', i18n.language)}
                      {tx.merchant ? ` · ${tx.merchant}` : ''}
                      {paymentName ? ` · ${paymentName}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={cn(
                      'text-sm font-semibold whitespace-nowrap',
                      tx.type === 'income' ? 'text-success' : '',
                    )}>
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
