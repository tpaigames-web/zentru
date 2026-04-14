import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import type { CreditCard } from '@/models/card'
import { useCardStore } from '@/stores/useCardStore'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { formatAmount } from '@/lib/currency'
import { getMonthRange, getBillingPeriod, formatDate } from '@/lib/date'
import { detectNetworkFromName, CARD_NETWORKS, getBankColors } from '@/config/cardTypes'
import { cn } from '@/lib/utils'

function NetworkBadge({ network }: { network: string }) {
  const info = CARD_NETWORKS[network as keyof typeof CARD_NETWORKS]
  if (!info || network === 'unknown') return null
  return (
    <span className="rounded px-1 py-0.5 text-[8px] font-bold" style={{ backgroundColor: info.color, color: info.textColor }}>
      {info.label}
    </span>
  )
}

interface CashbackCardProps {
  card: CreditCard
  monthlyEarned: number
  onUpdateActual: (id: string, value: number) => void
}

function CashbackCard({ card, monthlyEarned, onUpdateActual }: CashbackCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const currency = useSettingsStore((s) => s.currency)
  const { categories } = useCategoryStore()
  const categoryMap = new Map(categories.map((c) => [c.id, c]))

  const [editingActual, setEditingActual] = useState(false)
  const [actualValue, setActualValue] = useState(card.actualCashbackReceived?.toFixed(2) || '')

  const bankColors = getBankColors(card.bank)
  const network = detectNetworkFromName(card.name)
  const totalCap = card.totalMonthlyCashbackCap || 0
  const pct = totalCap > 0 ? Math.min((monthlyEarned / totalCap) * 100, 100) : 0

  const billing = getBillingPeriod(card.billingDay)

  const handleSaveActual = () => {
    const val = parseFloat(actualValue) || 0
    onUpdateActual(card.id, val)
    setEditingActual(false)
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Bank header */}
      <div className="flex items-center justify-between px-3 py-1.5" style={{ backgroundColor: bankColors.bg }}>
        <span className="text-[11px] font-bold tracking-wide" style={{ color: bankColors.text }}>{card.bank.toUpperCase()}</span>
      </div>

      {/* Card identity */}
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <NetworkBadge network={network} />
        <span className="flex-1 text-xs font-semibold truncate">{card.name}</span>
        <span className="font-mono text-xs text-muted-foreground">{card.lastFourDigits || '****'}</span>
      </div>

      <div className="px-3 py-3 space-y-3">
        {/* Est. Cashback vs Target */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xl font-bold text-success">{formatAmount(monthlyEarned, currency)}</p>
            <p className="text-[10px] text-muted-foreground">Est. Cashback</p>
          </div>
          {totalCap > 0 && (
            <div className="text-right">
              <p className="text-xl font-bold">{formatAmount(totalCap, currency)}</p>
              <p className="text-[10px] text-muted-foreground">Target</p>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {totalCap > 0 && (
          <div className="h-2 rounded-full bg-muted">
            <div className={cn('h-full rounded-full', pct >= 90 ? 'bg-warning' : 'bg-success')} style={{ width: `${pct}%` }} />
          </div>
        )}

        {/* Cashback Period */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{formatDate(billing.start, 'dd MMM', 'en')} - {formatDate(billing.end, 'dd MMM yyyy', 'en')}</span>
          <span>Cashback Period</span>
        </div>

        {/* Cashback Rules */}
        <div className="space-y-1 border-t pt-2">
          <p className="text-[10px] font-semibold text-muted-foreground">Rules</p>
          {card.cashbackRules?.map((rule, i) => {
            const cat = rule.categoryId !== '*' ? categoryMap.get(rule.categoryId) : null
            return (
              <div key={i} className="flex items-center justify-between text-xs">
                <span>{cat ? (cat.nameKey ? t(cat.nameKey) : cat.name) : 'Default'}</span>
                <span className="font-medium">
                  {rule.rate}%{rule.monthlyCap ? ` (cap ${formatAmount(rule.monthlyCap, currency)})` : ''}
                </span>
              </div>
            )
          })}
        </div>

        {/* Actual Received — manual input */}
        <div className="border-t pt-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Actual Received</span>
            {!editingActual ? (
              <button onClick={() => setEditingActual(true)} className="text-xs font-bold text-primary">
                {card.actualCashbackReceived ? formatAmount(card.actualCashbackReceived, currency) : '-- tap to enter --'}
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.01"
                  value={actualValue}
                  onChange={(e) => setActualValue(e.target.value)}
                  className="w-24 rounded border bg-background px-2 py-1 text-xs text-right outline-none"
                  autoFocus
                />
                <button onClick={handleSaveActual} className="rounded bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground">OK</button>
              </div>
            )}
          </div>
        </div>

        {/* Add Transaction */}
        <button
          onClick={() => navigate(`/transactions/new?card=${card.id}`)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium hover:bg-accent transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Transaction
        </button>
      </div>
    </div>
  )
}

export function CashbackView() {
  const { cards, updateCard } = useCardStore()
  const { transactions } = useTransactionStore()
  const { start, end } = getMonthRange()
  const navigate = useNavigate()

  const cashbackCards = cards.filter((c) => c.cashbackRules && c.cashbackRules.length > 0)

  const getMonthlyEarned = (cardId: string) => {
    return transactions
      .filter((tx) => tx.cardId === cardId && tx.date >= start && tx.date <= end)
      .reduce((s, tx) => s + (tx.cashbackAmount || 0), 0)
  }

  const handleUpdateActual = async (cardId: string, value: number) => {
    await updateCard(cardId, { actualCashbackReceived: value })
  }

  if (cashbackCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">No cards with cashback rules</p>
        <p className="text-xs mt-1">Edit a card to add cashback rules</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {cashbackCards.map((card) => (
        <CashbackCard
          key={card.id}
          card={card}
          monthlyEarned={getMonthlyEarned(card.id)}
          onUpdateActual={handleUpdateActual}
        />
      ))}

      <button
        onClick={() => navigate('/cards')}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
      >
        <Plus className="h-4 w-4" /> Add New Credit Card
      </button>
    </div>
  )
}
