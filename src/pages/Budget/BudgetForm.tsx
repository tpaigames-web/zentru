import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import type { Category } from '@/models/category'
import type { Budget } from '@/models/budget'
import { useSettingsStore } from '@/stores/useSettingsStore'

interface BudgetFormProps {
  categories: Category[]
  onSubmit: (data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => void
  onClose: () => void
}

export function BudgetForm({ categories, onSubmit, onClose }: BudgetFormProps) {
  const { t } = useTranslation()
  const currency = useSettingsStore((s) => s.currency)

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [alertThreshold, setAlertThreshold] = useState('80')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !amount) return

    onSubmit({
      name,
      amount: parseFloat(amount),
      categoryId: categoryId || undefined,
      period: 'monthly',
      startDate: Date.now(),
      alertThreshold: parseInt(alertThreshold) || 80,
      isActive: true,
    })
  }

  const inputClass = 'w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50'

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 md:items-center" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-2xl bg-card p-6 pb-20 shadow-xl md:rounded-2xl md:pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('nav.budget')}</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('cards.cardName')}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g. Monthly Food Budget" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">{t('transactions.amount')} ({currency})</label>
            <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">{t('transactions.category')}</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
              <option value="">{t('common.all')} ({t('transactions.expense')})</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.nameKey ? t(cat.nameKey) : cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Alert at (%)</label>
            <input type="number" min={50} max={100} value={alertThreshold} onChange={(e) => setAlertThreshold(e.target.value)} className={inputClass} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={!name || !amount} className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
