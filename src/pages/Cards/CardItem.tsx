import { useTranslation } from 'react-i18next'
import { Pencil, Trash2, Banknote, History, BadgePercent } from 'lucide-react'
import type { CreditCard } from '@/models/card'
import { formatAmount } from '@/lib/currency'
import { getDaysUntilDue } from '@/lib/date'
import { cn } from '@/lib/utils'

interface CardCashbackInfo {
  earned: number
  totalCap: number | null  // null = no cap
  capReached: boolean
  rulesCount: number
}

interface CardItemProps {
  card: CreditCard
  cashbackInfo?: CardCashbackInfo
  onClick: (card: CreditCard) => void
  onEdit: (card: CreditCard) => void
  onDelete: (id: string) => void
  onPayment: (card: CreditCard) => void
  onPaymentHistory: (card: CreditCard) => void
}

export function CardItem({ card, cashbackInfo, onClick, onEdit, onDelete, onPayment, onPaymentHistory }: CardItemProps) {
  const { t } = useTranslation()
  const utilization = card.creditLimit > 0 ? (card.currentBalance / card.creditLimit) * 100 : 0
  const daysUntilDue = getDaysUntilDue(card.dueDay)

  const utilizationColor =
    utilization >= 80 ? 'bg-destructive' :
    utilization >= 50 ? 'bg-warning' :
    'bg-success'

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Card header with color — clickable */}
      <div className="relative h-24 p-4 cursor-pointer" style={{ backgroundColor: card.color || '#3b82f6' }} onClick={() => onClick(card)}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-white/80">{card.bank}</p>
            <p className="text-lg font-bold text-white">{card.name}</p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(card) }}
              className="rounded-full bg-white/20 p-1.5 hover:bg-white/30 transition-colors"
              title={t('common.edit')}
            >
              <Pencil className="h-3.5 w-3.5 text-white" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(card.id) }}
              className="rounded-full bg-white/20 p-1.5 hover:bg-white/30 transition-colors"
              title={t('common.delete')}
            >
              <Trash2 className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
        </div>
        {card.lastFourDigits && (
          <p className="absolute bottom-3 left-4 font-mono text-sm text-white/70">
            •••• {card.lastFourDigits}
          </p>
        )}
      </div>

      {/* Card body */}
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{t('cards.currentBalance')}</span>
          <span className="text-base font-semibold">
            {formatAmount(card.currentBalance, card.currency)}
          </span>
        </div>

        {/* Utilization bar */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t('cards.utilization')}</span>
            <span className="text-xs font-medium">{utilization.toFixed(0)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${utilizationColor}`}
              style={{ width: `${Math.min(utilization, 100)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('cards.creditLimit')}: {formatAmount(card.creditLimit, card.currency)}
          </p>
        </div>

        {/* Cashback status */}
        {cashbackInfo && cashbackInfo.rulesCount > 0 && (
          <div className={cn(
            'flex items-center justify-between rounded-lg px-3 py-2',
            cashbackInfo.capReached ? 'bg-warning/10' : 'bg-success/10',
          )}>
            <div className="flex items-center gap-2">
              <BadgePercent className={cn('h-4 w-4', cashbackInfo.capReached ? 'text-warning' : 'text-success')} />
              <div>
                <span className={cn('text-xs font-medium', cashbackInfo.capReached ? 'text-warning' : 'text-success')}>
                  {formatAmount(cashbackInfo.earned, card.currency)}
                </span>
                {cashbackInfo.totalCap && (
                  <span className="text-xs text-muted-foreground"> / {formatAmount(cashbackInfo.totalCap, card.currency)}</span>
                )}
              </div>
            </div>
            {cashbackInfo.capReached ? (
              <span className="text-[10px] font-medium text-warning bg-warning/20 rounded px-1.5 py-0.5">CAP</span>
            ) : (
              <span className="text-[10px] text-muted-foreground">cashback</span>
            )}
          </div>
        )}

        {/* Due date */}
        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
          <span className="text-xs text-muted-foreground">{t('cards.daysUntilDue')}</span>
          <span className={cn('text-sm font-semibold', daysUntilDue <= 3 ? 'text-destructive' : daysUntilDue <= 7 ? 'text-warning' : '')}>
            {daysUntilDue} {t('cards.days')}
          </span>
        </div>

        {/* Payment buttons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onPayment(card)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-success px-3 py-2 text-xs font-medium text-success-foreground hover:bg-success/90 transition-colors"
          >
            <Banknote className="h-3.5 w-3.5" />
            {t('cards.makePayment')}
          </button>
          <button
            onClick={() => onPaymentHistory(card)}
            className="flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium hover:bg-accent transition-colors"
          >
            <History className="h-3.5 w-3.5" />
            {t('cards.paymentHistory')}
          </button>
        </div>
      </div>
    </div>
  )
}
