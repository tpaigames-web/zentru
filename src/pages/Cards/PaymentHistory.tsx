import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2, X, Banknote } from 'lucide-react'
import { usePaymentStore } from '@/stores/usePaymentStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { formatAmount } from '@/lib/currency'
import { formatDate } from '@/lib/date'
import type { CreditCard } from '@/models/card'

interface PaymentHistoryProps {
  card: CreditCard
  onClose: () => void
}

export function PaymentHistory({ card, onClose }: PaymentHistoryProps) {
  const { t, i18n } = useTranslation()
  const { payments, loadByCard, deletePayment } = usePaymentStore()
  const currency = useSettingsStore((s) => s.currency)

  useEffect(() => {
    loadByCard(card.id)
  }, [card.id, loadByCard])

  const handleDelete = async (id: string) => {
    await deletePayment(id)
  }

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 md:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-2xl bg-card p-6 pb-20 shadow-xl md:rounded-2xl md:pb-6 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('cards.paymentHistory')}</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 rounded-lg bg-muted/50 p-3">
          <p className="text-sm font-medium">{card.name}</p>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t('cards.totalPaid')}</span>
            <span className="text-sm font-bold text-success">{formatAmount(totalPaid, currency)}</span>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Banknote className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{t('cards.noPayments')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                <div>
                  <p className="text-sm font-semibold text-success">
                    -{formatAmount(payment.amount, currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(payment.date, 'PPP', i18n.language)}
                    {payment.notes ? ` · ${payment.notes}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(payment.id)}
                  className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  title={t('common.delete')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
        >
          {t('common.back')}
        </button>
      </div>
    </div>
  )
}
