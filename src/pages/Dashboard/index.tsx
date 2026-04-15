import { useMemo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Plus, CreditCard, Smartphone, CheckCircle2, Circle, FileText, X } from 'lucide-react'
import { formatAmount } from '@/lib/currency'
import { formatDate, getMonthRange, getDaysUntilDue } from '@/lib/date'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useCardStore } from '@/stores/useCardStore'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useAccountStore } from '@/stores/useAccountStore'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { getTaxSummary } from '@/services/taxDeduction'
import { generateQuickTemplates, getStreak, detectRecurringPatterns } from '@/services/quickEntry'
import { generateInsights } from '@/services/insights'
import { useData } from '@/data/DataProvider'
import type { RecurringTransaction } from '@/models/recurring'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const currency = useSettingsStore((s) => s.currency)
  const { cards } = useCardStore()
  const { transactions } = useTransactionStore()
  const { categories } = useCategoryStore()
  const { accounts } = useAccountStore()
  const repos = useData()

  const [recurringList, setRecurringList] = useState<RecurringTransaction[]>([])
  useEffect(() => { repos.recurring.getActive().then(setRecurringList) }, [repos])

  const [guideDismissed, setGuideDismissed] = useState(false)

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const { start, end } = getMonthRange()
  const monthlyTx = useMemo(() => transactions.filter((tx) => tx.date >= start && tx.date <= end), [transactions, start, end])

  const monthlyExpense = monthlyTx.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0)
  const monthlyIncome = monthlyTx.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0)

  // Cards due in next 10 days
  const upcoming10 = useMemo(() => {
    return cards
      .filter((c) => c.isActive && c.currentBalance > 0)
      .map((c) => ({ card: c, days: getDaysUntilDue(c.dueDay) }))
      .filter(({ days }) => days >= 0 && days <= 10)
      .sort((a, b) => a.days - b.days)
  }, [cards])

  // eWallets
  const ewallets = accounts.filter((a) => a.type === 'ewallet' && a.isActive)

  // Tax summary
  const taxSummaries = useMemo(() => getTaxSummary(transactions, new Date().getFullYear()), [transactions])

  // Recent transactions
  const recentTx = transactions.slice(0, 5)

  // Insights + streak
  const streak = useMemo(() => getStreak(transactions), [transactions])
  const insights = useMemo(() => generateInsights(transactions, categories), [transactions, categories])
  const detectedRecurring = useMemo(() => detectRecurringPatterns(transactions), [transactions])
  const quickTemplates = useMemo(() => generateQuickTemplates(transactions), [transactions])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{t('dashboard.title')}</h2>
        <button
          onClick={() => navigate('/transactions/new')}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('dashboard.quickAdd')}
        </button>
      </div>

      {/* Getting Started Guide */}
      {!guideDismissed && cards.length === 0 && transactions.length === 0 && (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold">{t('guide.welcome')}</h3>
            <button
              onClick={() => setGuideDismissed(true)}
              className="rounded-full p-1 text-muted-foreground hover:bg-accent"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="space-y-2.5 mb-4">
            {[
              { done: cards.length > 0, key: 'guide.step1' },
              { done: transactions.length > 0, key: 'guide.step2' },
              { done: transactions.length >= 3, key: 'guide.step3' },
            ].map(({ done, key }) => (
              <div key={key} className="flex items-center gap-2.5">
                {done
                  ? <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-success" />
                  : <Circle className="h-4.5 w-4.5 shrink-0 text-muted-foreground/40" />
                }
                <span className={cn('text-xs', done ? 'text-muted-foreground line-through' : 'font-medium')}>{t(key)}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            {cards.length === 0 && (
              <button
                onClick={() => navigate('/cards')}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
              >
                <CreditCard className="h-3.5 w-3.5" />
                {t('guide.addCard')}
              </button>
            )}
            {cards.length === 0 && (
              <button
                onClick={() => navigate('/import')}
                className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium hover:bg-accent"
              >
                <FileText className="h-3.5 w-3.5" />
                {t('guide.importPdf')}
              </button>
            )}
            {cards.length > 0 && transactions.length === 0 && (
              <button
                onClick={() => navigate('/transactions/new')}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                {t('guide.step2')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Credit Cards — horizontal scroll like Finory */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <CreditCard className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold">{t('nav.cards')}</span>
          </div>
          <button onClick={() => navigate('/cards')} className="text-[10px] text-primary">{t('common.all')} →</button>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => navigate(`/cards/${card.id}`)}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border bg-card px-3 py-2 shadow-sm hover:bg-accent/50 transition-colors"
            >
              <CreditCard className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-medium whitespace-nowrap">{card.name}</span>
              {card.lastFourDigits && <span className="text-[10px] text-muted-foreground font-mono">({card.lastFourDigits})</span>}
            </button>
          ))}
          <button onClick={() => navigate('/cards')} className="flex shrink-0 items-center gap-1 rounded-lg border-2 border-dashed px-3 py-2 text-xs text-muted-foreground hover:text-primary">
            <Plus className="h-3.5 w-3.5" /> ADD
          </button>
        </div>
      </div>

      {/* eWallet — horizontal scroll */}
      {ewallets.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Smartphone className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold">eWallet</span>
            </div>
            <button onClick={() => navigate('/payment-methods')} className="text-[10px] text-primary">{t('common.all')} →</button>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {ewallets.map((acc) => (
              <div key={acc.id} className="flex shrink-0 items-center gap-2 rounded-lg border bg-card px-2.5 py-2 shadow-sm">
                <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: (acc.color || '#64748b') + '20' }}>
                  <Smartphone className="h-3.5 w-3.5" style={{ color: acc.color || '#64748b' }} />
                </div>
                <span className="text-[10px] font-medium">{acc.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly summary — compact */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <p className="text-[10px] text-muted-foreground">{t('dashboard.monthlyExpense')}</p>
          <p className="text-lg font-bold text-destructive">{formatAmount(monthlyExpense, currency)}</p>
        </div>
        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <p className="text-[10px] text-muted-foreground">{t('dashboard.monthlyIncome')}</p>
          <p className="text-lg font-bold text-success">{formatAmount(monthlyIncome, currency)}</p>
        </div>
      </div>

      {/* Next 10 Day's Payables — like Finory */}
      {upcoming10.length > 0 && (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between px-3 pt-3 pb-1">
            <h3 className="text-xs font-semibold">{t('dashboard.next10Days')}</h3>
          </div>
          <div className="divide-y">
            {upcoming10.map(({ card, days }) => (
              <div key={card.id} className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer" onClick={() => navigate(`/cards/${card.id}`)}>
                <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="flex-1 text-xs truncate">{card.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{card.lastFourDigits}</span>
                <span className={cn('text-xs font-bold', days <= 3 ? 'text-destructive' : '')}>
                  {formatAmount(card.currentBalance, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recurring Expenses */}
      {recurringList.length > 0 && (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between px-3 pt-3 pb-1">
            <h3 className="text-xs font-semibold">{t('dashboard.recurringExpenses')}</h3>
            <button onClick={() => navigate('/recurring')} className="text-[10px] text-primary">{t('common.all')} →</button>
          </div>
          <div className="divide-y">
            {recurringList.slice(0, 4).map((r) => {
              const cat = categoryMap.get(r.templateTransaction.categoryId)
              return (
                <div key={r.id} className="flex items-center gap-2.5 px-3 py-2.5">
                  {cat && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: cat.color + '20' }}>
                      <CategoryIcon name={cat.icon} className="h-3.5 w-3.5" style={{ color: cat.color }} />
                    </div>
                  )}
                  <span className="flex-1 text-xs truncate">{r.templateTransaction.merchant || (cat?.nameKey ? t(cat.nameKey) : cat?.name)}</span>
                  <span className="text-xs font-bold">{formatAmount(r.templateTransaction.amount, currency)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tax Relief Helper */}
      {taxSummaries.length > 0 && (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between px-3 pt-3 pb-1">
            <h3 className="text-xs font-semibold">{t('dashboard.taxRelief')}</h3>
            <button onClick={() => navigate('/analytics')} className="text-[10px] text-primary">Learn More →</button>
          </div>
          <div className="divide-y">
            {taxSummaries.slice(0, 3).map((s) => (
              <div key={s.taxCategory} className="flex items-center justify-between px-3 py-2.5">
                <span className="text-xs">{s.label}</span>
                <span className="text-xs font-bold text-primary">{formatAmount(s.totalClaimed, currency)} →</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick insights — horizontal scroll */}
      {(streak.current > 0 || insights.length > 0 || quickTemplates.length > 0) && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {streak.current > 0 && (
            <div className="flex shrink-0 items-center gap-2 rounded-xl border bg-card px-3 py-2 shadow-sm">
              <span className="text-lg">🔥</span>
              <div>
                <p className="text-sm font-bold">{streak.current}</p>
                <p className="text-[10px] text-muted-foreground">{t('dashboard.streakDays')}</p>
              </div>
            </div>
          )}
          {insights.slice(0, 3).map((insight, i) => (
            <div key={i} className={cn('flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2',
              insight.type === 'warning' ? 'border-destructive/20 bg-destructive/5' :
              insight.type === 'achievement' ? 'border-success/20 bg-success/5' : 'border-primary/20 bg-primary/5',
            )}>
              <CategoryIcon name={insight.icon} className={cn('h-3.5 w-3.5', insight.type === 'warning' ? 'text-destructive' : insight.type === 'achievement' ? 'text-success' : 'text-primary')} />
              <p className="text-xs font-medium whitespace-nowrap">{t(insight.titleKey, {
                ...insight.titleParams,
                ...(insight.titleParams?.category ? { category: t(String(insight.titleParams.category)) } : {}),
              })}</p>
            </div>
          ))}
          {quickTemplates.map((tpl) => {
            const cat = categoryMap.get(tpl.categoryId)
            return (
              <button key={tpl.id} onClick={() => navigate(`/transactions/new?tpl=${encodeURIComponent(tpl.merchant || '')}&cat=${tpl.categoryId}&card=${tpl.cardId || ''}&acc=${tpl.accountId || ''}&amt=${tpl.amount || ''}`)}
                className="flex shrink-0 items-center gap-1.5 rounded-xl border bg-card px-3 py-2 text-xs shadow-sm hover:bg-accent">
                {cat && <CategoryIcon name={cat.icon} className="h-3.5 w-3.5" style={{ color: cat.color }} />}
                <span className="whitespace-nowrap">{tpl.merchant}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Detected Recurring — suggest adding */}
      {detectedRecurring.length > 0 && recurringList.length === 0 && (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between px-3 pt-3 pb-1">
            <h3 className="text-xs font-semibold">🔄 {t('dashboard.detectedRecurring')}</h3>
          </div>
          <div className="divide-y">
            {detectedRecurring.slice(0, 5).map((item, i) => {
              const cat = categoryMap.get(item.categoryId)
              return (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2.5">
                  {cat && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: cat.color + '20' }}>
                      <CategoryIcon name={cat.icon} className="h-3.5 w-3.5" style={{ color: cat.color }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{item.merchant}</p>
                    <p className="text-[10px] text-muted-foreground">{item.monthsAppeared}/{item.totalMonths} months · {item.confidence}%</p>
                  </div>
                  <span className="text-xs font-bold">{formatAmount(item.avgAmount, currency)}</span>
                  <button
                    onClick={() => navigate(`/recurring?merchant=${encodeURIComponent(item.merchant)}&amount=${item.avgAmount}&cat=${item.categoryId}&card=${item.cardId || ''}&acc=${item.accountId || ''}`)}
                    className="rounded bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary"
                  >
                    + Add
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex items-center justify-between px-3 pt-3 pb-1">
          <h3 className="text-xs font-semibold">{t('dashboard.recentTransactions')}</h3>
          {transactions.length > 0 && (
            <button onClick={() => navigate('/transactions')} className="text-[10px] text-primary">{t('common.all')} →</button>
          )}
        </div>
        {recentTx.length === 0 ? (
          <div className="py-6 flex flex-col items-center gap-2">
            <p className="text-xs text-muted-foreground">{t('dashboard.noTransactions')}</p>
            <button
              onClick={() => navigate('/transactions/new')}
              className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
            >
              <Plus className="h-3 w-3" />
              {t('dashboard.addFirst')}
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {recentTx.map((tx) => {
              const cat = categoryMap.get(tx.categoryId)
              return (
                <div key={tx.id} className="flex items-center gap-2.5 px-3 py-2">
                  {cat && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: cat.color + '20' }}>
                      <CategoryIcon name={cat.icon} className="h-3.5 w-3.5" style={{ color: cat.color }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{cat?.nameKey ? t(cat.nameKey) : cat?.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{formatDate(tx.date, 'MM/dd', i18n.language)}{tx.merchant ? ` · ${tx.merchant}` : ''}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={cn('text-xs font-bold', tx.type === 'income' ? 'text-success' : '')}>
                      {tx.type === 'income' ? '+' : '-'}{formatAmount(tx.amount, tx.currency)}
                    </span>
                    {tx.cashbackAmount ? <p className="text-[10px] text-success">+{formatAmount(tx.cashbackAmount, tx.currency)}</p> : null}
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
