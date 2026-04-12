import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, Wallet } from 'lucide-react'
import { useBudgetStore } from '@/stores/useBudgetStore'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { formatAmount } from '@/lib/currency'
import { getMonthRange } from '@/lib/date'
import { cn } from '@/lib/utils'
import { BudgetForm } from './BudgetForm'
import type { Budget } from '@/models/budget'

export default function BudgetPage() {
  const { t } = useTranslation()
  const { budgets, addBudget, deleteBudget } = useBudgetStore()
  const { transactions } = useTransactionStore()
  const { categories } = useCategoryStore()
  const currency = useSettingsStore((s) => s.currency)
  const [showForm, setShowForm] = useState(false)

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  )

  const { start, end } = getMonthRange()

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

  const handleAdd = async (data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => {
    await addBudget(data)
    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold">{t('nav.budget')}</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t('common.save')}
        </button>
      </div>

      {budgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-16 shadow-sm">
          <Wallet className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {budgets.map((budget) => {
            const cat = budget.categoryId ? categoryMap.get(budget.categoryId) : null
            const spent = budget.categoryId
              ? (monthlyExpenseByCategory.get(budget.categoryId) || 0)
              : (monthlyExpenseByCategory.get('__total__') || 0)
            const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
            const isOver = percentage >= 100
            const isWarning = percentage >= budget.alertThreshold

            return (
              <div key={budget.id} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold">{budget.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {cat ? (cat.nameKey ? t(cat.nameKey) : cat.name) : t('common.all')}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteBudget(budget.id)}
                    className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-end justify-between mb-1.5">
                  <span className={cn('text-lg font-bold', isOver ? 'text-destructive' : isWarning ? 'text-warning' : '')}>
                    {formatAmount(spent, currency)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {formatAmount(budget.amount, currency)}
                  </span>
                </div>

                <div className="h-2.5 w-full rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      isOver ? 'bg-destructive' : isWarning ? 'bg-warning' : 'bg-primary',
                    )}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>

                <p className="mt-1 text-xs text-muted-foreground text-right">
                  {percentage.toFixed(0)}%
                  {budget.amount > spent && (
                    <> · {formatAmount(budget.amount - spent, currency)} left</>
                  )}
                </p>
              </div>
            )
          })}
        </div>
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
