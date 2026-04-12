import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, CreditCard, Banknote, Building2, Smartphone, Wallet, X } from 'lucide-react'
import type { CreditCard as CreditCardType } from '@/models/card'
import type { Account } from '@/models/account'
import { cn } from '@/lib/utils'

const ACCOUNT_ICONS: Record<string, typeof Smartphone> = {
  cash: Banknote,
  ewallet: Smartphone,
  debit: Building2,
  credit: CreditCard,
  investment: Wallet,
  other: Wallet,
}

const EWALLET_COLORS: Record<string, string> = {
  "Touch 'n Go": '#005BAA',
  'GrabPay': '#00B14F',
  'Shopee Pay': '#EE4D2D',
  'Boost': '#ED1C24',
  'MAE': '#FFCC00',
  'BigPay': '#002D72',
  'ShopeePay': '#EE4D2D',
}

interface PaymentMethodPickerProps {
  cards: CreditCardType[]
  accounts: Account[]
  selectedCardId: string
  selectedAccountId: string
  onChange: (cardId: string, accountId: string) => void
}

export function PaymentMethodPicker({ cards, accounts, selectedCardId, selectedAccountId, onChange }: PaymentMethodPickerProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const selectedCard = selectedCardId ? cards.find((c) => c.id === selectedCardId) : null
  const selectedAccount = selectedAccountId ? accounts.find((a) => a.id === selectedAccountId) : null

  const handleSelect = (cardId: string, accountId: string) => {
    onChange(cardId, accountId)
    setOpen(false)
  }

  const getDisplayLabel = () => {
    if (selectedCard) return selectedCard.name + (selectedCard.lastFourDigits ? ` (${selectedCard.lastFourDigits})` : '')
    if (selectedAccount) return selectedAccount.name
    return t('transactions.selectPayment')
  }

  const getDisplayIcon = () => {
    if (selectedCard) return <CreditCard className="h-4 w-4" style={{ color: selectedCard.color || '#3b82f6' }} />
    if (selectedAccount) {
      const Icon = ACCOUNT_ICONS[selectedAccount.type] || Wallet
      const color = EWALLET_COLORS[selectedAccount.name] || selectedAccount.color || '#64748b'
      return <Icon className="h-4 w-4" style={{ color }} />
    }
    return <Wallet className="h-4 w-4 text-muted-foreground" />
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-1.5">{t('transactions.paymentMethod')}</label>

      {/* Selected display */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2.5 rounded-lg border bg-background px-3 py-2.5 text-sm outline-none hover:bg-accent/50 transition-colors"
      >
        {getDisplayIcon()}
        <span className="flex-1 text-left truncate">{getDisplayLabel()}</span>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-[55]" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-[56] mt-1 max-h-64 overflow-y-auto rounded-xl border bg-card shadow-lg">
            {/* None option */}
            <button
              type="button"
              onClick={() => handleSelect('', '')}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-accent transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">-- {t('transactions.selectPayment')} --</span>
            </button>

            {/* Credit Cards */}
            {cards.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                  {t('transactions.creditCards')}
                </div>
                {cards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => handleSelect(card.id, '')}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition-colors',
                      selectedCardId === card.id ? 'bg-primary/10' : 'hover:bg-accent',
                    )}
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: (card.color || '#3b82f6') + '20' }}>
                      <CreditCard className="h-3.5 w-3.5" style={{ color: card.color || '#3b82f6' }} />
                    </div>
                    <span className="flex-1 text-left truncate">{card.name}</span>
                    {card.lastFourDigits && <span className="text-xs text-muted-foreground font-mono">({card.lastFourDigits})</span>}
                  </button>
                ))}
              </>
            )}

            {/* E-Wallets & Other accounts */}
            {accounts.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                  {t('transactions.accounts')}
                </div>
                {accounts.map((acc) => {
                  const Icon = ACCOUNT_ICONS[acc.type] || Wallet
                  const color = EWALLET_COLORS[acc.name] || acc.color || '#64748b'
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleSelect('', acc.id)}
                      className={cn(
                        'flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition-colors',
                        selectedAccountId === acc.id ? 'bg-primary/10' : 'hover:bg-accent',
                      )}
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: color + '20' }}>
                        <Icon className="h-3.5 w-3.5" style={{ color }} />
                      </div>
                      <span className="flex-1 text-left truncate">{acc.name}</span>
                      <span className="text-xs text-muted-foreground">{t(`payment.${acc.type}`)}</span>
                    </button>
                  )
                })}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
