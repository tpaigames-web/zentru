import { useTranslation } from 'react-i18next'
import { Banknote, History, Pencil, Trash2 } from 'lucide-react'
import type { CreditCard } from '@/models/card'
import { formatAmount } from '@/lib/currency'
import { getDaysUntilDue } from '@/lib/date'
import { detectNetworkFromName, getBankColors } from '@/config/cardTypes'
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

/**
 * Visa/Mastercard CSS logos — no images needed.
 */
function NetworkBadge({ network }: { network: string }) {
  if (network === 'visa') {
    return (
      <div className="flex items-center gap-0.5 rounded bg-white px-1.5 py-0.5">
        <span className="text-[10px] font-black italic text-[#1A1F71] tracking-tight">VISA</span>
      </div>
    )
  }
  if (network === 'mastercard') {
    return (
      <div className="flex items-center gap-0.5 rounded bg-white/90 px-1 py-0.5">
        <div className="relative flex items-center">
          <div className="h-3 w-3 rounded-full bg-[#EB001B]" />
          <div className="h-3 w-3 rounded-full bg-[#F79E1B] -ml-1.5" />
        </div>
        <span className="text-[7px] font-bold text-[#1a1a2e] ml-0.5">mastercard</span>
      </div>
    )
  }
  if (network === 'amex') {
    return (
      <div className="flex items-center rounded bg-[#006FCF] px-1.5 py-0.5">
        <span className="text-[8px] font-bold text-white">AMEX</span>
      </div>
    )
  }
  return null
}

export function CardItem({ card, cashbackInfo, onClick, onEdit, onDelete, onPayment, onPaymentHistory }: CardItemProps) {
  const { t } = useTranslation()
  const daysUntilDue = getDaysUntilDue(card.dueDay)
  const bankColors = getBankColors(card.bank)
  const network = detectNetworkFromName(card.name)

  const cashbackPct = cashbackInfo?.totalCap
    ? Math.min((cashbackInfo.earned / cashbackInfo.totalCap) * 100, 100)
    : 0

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Card visual — Finory style: bank bar + network + name + last4 */}
      <div className="cursor-pointer" onClick={() => onClick(card)}>
        {/* Bank color bar with name + edit/delete */}
        <div className="flex items-center justify-between px-3 py-1.5" style={{ backgroundColor: bankColors.bg }}>
          <span className="text-[11px] font-bold tracking-wide" style={{ color: bankColors.text }}>{card.bank.toUpperCase()}</span>
          <div className="flex items-center gap-2">
            {card.productName && (
              <span className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-medium" style={{ color: bankColors.text }}>
                {card.productName}
              </span>
            )}
          <div className="flex gap-1">
            <button onClick={(e) => { e.stopPropagation(); onEdit(card) }} className="rounded-full bg-white/15 p-1 hover:bg-white/30">
              <Pencil className="h-2.5 w-2.5" style={{ color: bankColors.text }} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(card.id) }} className="rounded-full bg-white/15 p-1 hover:bg-white/30">
              <Trash2 className="h-2.5 w-2.5" style={{ color: bankColors.text }} />
            </button>
          </div>
          </div>
        </div>

        {/* Card identity row: network + card name + last4 */}
        <div className="flex items-center gap-2 px-3 py-2 border-b">
          <NetworkBadge network={network} />
          <span className="flex-1 text-xs font-semibold truncate">{card.name}</span>
          <span className="font-mono text-xs font-bold text-muted-foreground">{card.lastFourDigits || '****'}</span>
        </div>
      </div>

      {/* Info section */}
      <div className="px-3 py-2.5 space-y-2.5">
        {/* Cashback row — like Finory */}
        {cashbackInfo && cashbackInfo.rulesCount > 0 ? (
          <div className="flex items-center justify-between">
            <div>
              <p className={cn('text-xl font-bold', cashbackInfo.capReached ? 'text-warning' : 'text-success')}>
                {formatAmount(cashbackInfo.earned, card.currency)}
              </p>
              <p className="text-[10px] text-muted-foreground">Est. Cashback</p>
            </div>
            {cashbackInfo.totalCap && (
              <div className="text-right">
                <p className="text-xl font-bold">{formatAmount(cashbackInfo.totalCap, card.currency)}</p>
                <p className="text-[10px] text-muted-foreground">Target</p>
              </div>
            )}
          </div>
        ) : (
          /* No cashback — show balance prominently */
          <div>
            <p className="text-xl font-bold">{formatAmount(card.currentBalance, card.currency)}</p>
            <p className="text-[10px] text-muted-foreground">Due Amount</p>
          </div>
        )}

        {/* Cashback progress */}
        {cashbackInfo && cashbackInfo.totalCap && cashbackInfo.rulesCount > 0 && (
          <div className="h-1.5 rounded-full bg-muted">
            <div className={cn('h-full rounded-full', cashbackInfo.capReached ? 'bg-warning' : 'bg-success')} style={{ width: `${cashbackPct}%` }} />
          </div>
        )}

        {/* Three column info — Finory style */}
        <div className="grid grid-cols-3 gap-1 border-t pt-2">
          {cashbackInfo && cashbackInfo.rulesCount > 0 ? (
            <div>
              <p className="text-xs font-bold">{formatAmount(card.currentBalance, card.currency)}</p>
              <p className="text-[10px] text-muted-foreground">Due Amount</p>
            </div>
          ) : (
            <div>
              <p className="text-xs font-bold">{formatAmount(card.creditLimit, card.currency)}</p>
              <p className="text-[10px] text-muted-foreground">{t('cards.creditLimit')}</p>
            </div>
          )}
          <div className="text-center">
            <p className={cn('text-xs font-bold', daysUntilDue <= 3 ? 'text-destructive' : daysUntilDue <= 7 ? 'text-warning' : '')}>
              {daysUntilDue} Day(s)
            </p>
            <p className="text-[10px] text-muted-foreground">Due In</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold">{formatAmount(0, card.currency)}</p>
            <p className="text-[10px] text-muted-foreground">Total Paid</p>
          </div>
        </div>

        {/* Min Due row */}
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Min Due: {formatAmount(card.currentBalance > 0 ? Math.max(50, card.currentBalance * 0.05) : 0, card.currency)}</span>
          <span>Total Paid: {formatAmount(0, card.currency)}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
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
