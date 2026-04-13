import { useTranslation } from 'react-i18next'
import { Pencil, Trash2, Banknote, History } from 'lucide-react'
import type { CreditCard } from '@/models/card'
import { formatAmount } from '@/lib/currency'
import { getDaysUntilDue } from '@/lib/date'
import { detectNetworkFromName, CARD_NETWORKS, getBankColors } from '@/config/cardTypes'
import { cn } from '@/lib/utils'

interface CardCashbackInfo {
  earned: number
  totalCap: number | null
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
  const daysUntilDue = getDaysUntilDue(card.dueDay)
  const bankColors = getBankColors(card.bank)
  const network = detectNetworkFromName(card.name)
  const networkInfo = CARD_NETWORKS[network]

  const cashbackPct = cashbackInfo?.totalCap
    ? Math.min((cashbackInfo.earned / cashbackInfo.totalCap) * 100, 100)
    : 0

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Bank header bar */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer"
        style={{ backgroundColor: bankColors.bg }}
        onClick={() => onClick(card)}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-10 items-center justify-center rounded bg-white/20">
            <span className="text-[9px] font-bold" style={{ color: bankColors.text }}>{card.bank.substring(0, 3).toUpperCase()}</span>
          </div>
          <span className="text-xs font-bold" style={{ color: bankColors.text }}>{card.bank}</span>
        </div>
        <div className="flex gap-1">
          <button onClick={(e) => { e.stopPropagation(); onEdit(card) }} className="rounded-full bg-white/15 p-1 hover:bg-white/30">
            <Pencil className="h-3 w-3" style={{ color: bankColors.text }} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(card.id) }} className="rounded-full bg-white/15 p-1 hover:bg-white/30">
            <Trash2 className="h-3 w-3" style={{ color: bankColors.text }} />
          </button>
        </div>
      </div>

      {/* Card identity: network + name + last4 */}
      <div className="flex items-center gap-2 border-b px-3 py-2 cursor-pointer" onClick={() => onClick(card)}>
        {network !== 'unknown' && (
          <span className="rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider" style={{ backgroundColor: networkInfo.color, color: networkInfo.textColor }}>
            {networkInfo.label}
          </span>
        )}
        <span className="flex-1 text-xs font-medium truncate">{card.name}</span>
        <span className="font-mono text-xs text-muted-foreground">{card.lastFourDigits || '****'}</span>
      </div>

      <div className="px-3 py-2.5 space-y-2">
        {/* Cashback */}
        {cashbackInfo && cashbackInfo.rulesCount > 0 && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn('text-lg font-bold', cashbackInfo.capReached ? 'text-warning' : 'text-success')}>
                  {formatAmount(cashbackInfo.earned, card.currency)}
                </p>
                <p className="text-[10px] text-muted-foreground">Est. Cashback</p>
              </div>
              {cashbackInfo.totalCap && (
                <div className="text-right">
                  <p className="text-lg font-bold">{formatAmount(cashbackInfo.totalCap, card.currency)}</p>
                  <p className="text-[10px] text-muted-foreground">Target</p>
                </div>
              )}
            </div>
            {cashbackInfo.totalCap && (
              <div className="h-1.5 rounded-full bg-muted">
                <div className={cn('h-full rounded-full', cashbackInfo.capReached ? 'bg-warning' : 'bg-success')} style={{ width: `${cashbackPct}%` }} />
              </div>
            )}
          </>
        )}

        {/* Due Amount / Due In / Limit */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div>
            <p className="text-sm font-bold">{formatAmount(card.currentBalance, card.currency)}</p>
            <p className="text-[10px] text-muted-foreground">Due Amount</p>
          </div>
          <div className="text-center">
            <p className={cn('text-sm font-bold', daysUntilDue <= 3 ? 'text-destructive' : daysUntilDue <= 7 ? 'text-warning' : '')}>
              {daysUntilDue} {t('cards.days')}
            </p>
            <p className="text-[10px] text-muted-foreground">Due In</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold">{formatAmount(card.creditLimit, card.currency)}</p>
            <p className="text-[10px] text-muted-foreground">{t('cards.creditLimit')}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button onClick={() => onPayment(card)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-success px-3 py-2 text-xs font-medium text-success-foreground hover:bg-success/90 transition-colors">
            <Banknote className="h-3.5 w-3.5" />
            {t('cards.makePayment')}
          </button>
          <button onClick={() => onPaymentHistory(card)} className="flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium hover:bg-accent transition-colors">
            <History className="h-3.5 w-3.5" />
            {t('cards.paymentHistory')}
          </button>
        </div>
      </div>
    </div>
  )
}
