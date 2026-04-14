import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import type { Transaction } from '@/models/transaction'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { cn } from '@/lib/utils'

interface EditTransactionProps {
  transaction: Transaction
  onClose: () => void
}

export function EditTransaction({ transaction, onClose }: EditTransactionProps) {
  const { t } = useTranslation()
  const { categories } = useCategoryStore()
  const { updateTransaction } = useTransactionStore()

  const [categoryId, setCategoryId] = useState(transaction.categoryId)
  const [merchant, setMerchant] = useState(transaction.merchant || '')
  const [notes, setNotes] = useState(transaction.notes || '')
  const [amount, setAmount] = useState(transaction.amount.toFixed(2))

  const expenseCats = categories.filter((c) => c.group === 'expense' && c.isActive)
  const incomeCats = categories.filter((c) => c.group === 'income' && c.isActive)
  const cats = transaction.type === 'income' ? incomeCats : expenseCats

  const handleSave = async () => {
    await updateTransaction(transaction.id, {
      categoryId,
      merchant: merchant || undefined,
      notes: notes || undefined,
      amount: parseFloat(amount) || transaction.amount,
    })
    onClose()
  }

  const inputClass = 'w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50'

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 md:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-2xl bg-card p-5 pb-20 shadow-xl md:rounded-2xl md:pb-5 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('transactions.editTransaction')}</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('transactions.amount')}</label>
            <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={cn(inputClass, 'text-lg font-bold')} />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-2">{t('transactions.category')}</label>
            <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
              {cats.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl p-2 text-[10px] transition-all',
                    categoryId === cat.id ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-accent',
                  )}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: cat.color + '20' }}>
                    <CategoryIcon name={cat.icon} className="h-4 w-4" style={{ color: cat.color }} />
                  </div>
                  <span className="line-clamp-1">{cat.nameKey ? t(cat.nameKey) : cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Merchant */}
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('transactions.merchant')}</label>
            <input value={merchant} onChange={(e) => setMerchant(e.target.value)} className={inputClass} />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('transactions.notes')}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={cn(inputClass, 'h-16 resize-none')} />
          </div>

          {/* Save */}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors">
              {t('common.cancel')}
            </button>
            <button onClick={handleSave} className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              {t('common.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
