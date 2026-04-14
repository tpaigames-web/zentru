import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, Wallet, ChevronLeft, ChevronRight } from 'lucide-react'
import { useBudgetStore } from '@/stores/useBudgetStore'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { formatAmount } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { BudgetForm } from './BudgetForm'
import type { Budget } from '@/models/budget'
import { startOfMonth, endOfMonth, subMonths, addMonths, format } from 'date-fns'

export default function BudgetPage() {
  const { t } = useTranslation()
  const { budgets, addBudget, deleteBudget } = useBudgetStore()
  const { transactions } = useTransactionStore()
  const { categories } = useCategoryStore()
  const currency = useSettingsStore((s) => s.currency)
  const [showForm, setShowForm] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  )

  const start = startOfMonth(selectedMonth).getTime()
  const end = endOfMonth(selectedMonth).getTime()
  const monthLabel = format(selectedMonth, 'MMMM yyyy')

  const monthlyExpenseByCategory = useMemo(() => {
    const map = new Map<string, number>()
    let total = 0
    for (const tx of transactions) {
      if (tx.type !== 'expense' || tx.date < start || tx.date > end) continue
      map.set(tx.categoryId, (map.get(tx.categoryId) || 0) + tx.amount)
      total += tx.amount
    }
    map.set('__total__', total)
    return map
  }, [transactions, start, end])

  // Total budget overview
  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0)
  const totalUsed = monthlyExpenseByCategory.get('__total__') || 0
  const totalBalance = totalBudget - totalUsed
  const totalPct = totalBudget > 0 ? (totalUsed / totalBudget) * 100 : 0

  const handleAdd = async (data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => {
    await addBudget(data)
    setShowForm(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold">{t('nav.budget')}</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('categories.addCategory')}
        </button>
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))} className="rounded-full p-1.5 hover:bg-accent">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold">{monthLabel}</span>
        <button onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))} className="rounded-full p-1.5 hover:bg-accent">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {budgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-16 shadow-sm">
          <Wallet className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
        </div>
      ) : (
        <>
          {/* Total budget overview */}
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Current Balance</span>
              <span className={cn('text-xs', totalPct >= 100 ? 'text-destructive' : totalPct >= 80 ? 'text-warning' : 'text-success')}>
                {(100 - Math.min(totalPct, 100)).toFixed(0)}% unused
              </span>
            </div>
            <p className={cn('text-2xl font-bold mb-2', totalBalance < 0 ? 'text-destructive' : '')}>
              {formatAmount(Math.max(totalBalance, 0), currency)}
            </p>
            <div className="h-2.5 rounded-full bg-muted mb-1.5">
              <div
                className={cn('h-full rounded-full', totalPct >= 100 ? 'bg-destructive' : totalPct >= 80 ? 'bg-warning' : 'bg-success')}
                style={{ width: `${Math.min(totalPct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Total {formatAmount(totalBudget, currency)}</span>
              <span>Used {formatAmount(totalUsed, currency)}</span>
            </div>
          </div>

          {/* Per-category budgets */}
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="px-4 pt-3 pb-2">
              <h3 className="text-xs font-semibold">My Monthly Budgets</h3>
            </div>
            <div className="divide-y">
              {budgets.map((budget) => {
                const cat = budget.categoryId ? categoryMap.get(budget.categoryId) : null
                const spent = budget.categoryId
                  ? (monthlyExpenseByCategory.get(budget.categoryId) || 0)
                  : (monthlyExpenseByCategory.get('__total__') || 0)
                const balance = budget.amount - spent
                const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
                const isOver = percentage >= 100
                const isWarning = percentage >= budget.alertThreshold

                return (
                  <div key={budget.id} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">
                        {cat ? (cat.nameKey ? t(cat.nameKey) : cat.name) : t('common.all')}
                      </p>
                      <button
                        onClick={() => deleteBudget(budget.id)}
                        className="rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Three columns: Budget / Balance / Used */}
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div>
                        <p className="text-xs font-bold">{formatAmount(budget.amount, currency)}</p>
                        <p className="text-[10px] text-muted-foreground">Budget</p>
                      </div>
                      <div>
                        <p className={cn('text-xs font-bold', balance < 0 ? 'text-destructive' : 'text-success')}>
                          {formatAmount(Math.max(balance, 0), currency)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Balance</p>
                      </div>
                      <div className="text-right">
                        <p className={cn('text-xs font-bold', isOver ? 'text-destructive' : isWarning ? 'text-warning' : '')}>
                          {formatAmount(spent, currency)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Used</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 rounded-full bg-muted">
                      <div
                        className={cn('h-full rounded-full', isOver ? 'bg-destructive' : isWarning ? 'bg-warning' : 'bg-primary')}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {showForm && (
        <BudgetForm
          categories={categories.filter((c) => c.group === 'expense' && c.isActive)}
          onSubmit={handleAdd}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
