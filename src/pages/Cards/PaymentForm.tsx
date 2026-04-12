import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import type { CreditCard } from '@/models/card'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { formatAmount } from '@/lib/currency'

interface PaymentFormProps {
  card: CreditCard
  onSubmit: (data: { cardId: string; amount: number; date: number; notes?: string }) => void
  onClose: () => void
}

export function PaymentForm({ card, onSubmit, onClose }: PaymentFormProps) {
  const { t } = useTranslation()
  const currency = useSettingsStore((s) => s.currency)
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount) return
    onSubmit({
      cardId: card.id,
      amount: parseFloat(amount),
      date: new Date(date).getTime(),
      notes: notes || undefined,
    })
  }

  const inputClass = 'w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50'

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 md:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-2xl bg-card p-6 pb-20 shadow-xl md:rounded-2xl md:pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('cards.makePayment')}</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 rounded-lg bg-muted/50 p-3">
          <p className="text-sm font-medium">{card.name}</p>
          <p className="text-xs text-muted-foreground">
            {t('cards.currentBalance')}: {formatAmount(card.currentBalance, currency)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('transactions.amount')} ({currency})</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputClass + ' text-lg font-bold'}
              placeholder="0.00"
              autoFocus
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setAmount(card.currentBalance.toFixed(2))}
                className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
              >
                {t('cards.payFull')}
              </button>
              <button
                type="button"
                onClick={() => setAmount((card.currentBalance * 0.1).toFixed(2))}
                className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                {t('cards.payMinimum')} (10%)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">{t('transactions.date')}</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">{t('transactions.notes')}</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} placeholder="e.g. Online banking" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors">
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={!amount || parseFloat(amount) <= 0}
              className="flex-1 rounded-lg bg-success px-4 py-2.5 text-sm font-medium text-success-foreground hover:bg-success/90 transition-colors disabled:opacity-50"
            >
              {t('cards.makePayment')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
