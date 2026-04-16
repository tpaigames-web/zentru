import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ScanLine } from 'lucide-react'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { useCardStore } from '@/stores/useCardStore'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useAccountStore } from '@/stores/useAccountStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { PaymentMethodPicker } from '@/components/shared/PaymentMethodPicker'
import type { TransactionType } from '@/models/transaction'
import { calculateCashback } from '@/services/cashback'
import { getSmartRecommendations } from '@/services/cardRecommender'
import { formatAmount } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { ReceiptScan } from './ReceiptScan'
import type { ScannedReceiptData } from '@/services/receiptScanner'
import { autoDetectCategory, suggestFromHistory } from '@/services/autoCategory'
import { autoDetectTaxCategory, TAX_CATEGORIES } from '@/services/taxDeduction'

const TRANSACTION_TYPES: TransactionType[] = ['expense', 'income', 'transfer']

export default function NewTransactionPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { addTransaction, transactions } = useTransactionStore()
  const { cards } = useCardStore()
  const { getExpenseCategories, getIncomeCategories } = useCategoryStore()
  const { getActiveAccounts } = useAccountStore()
  const currency = useSettingsStore((s) => s.currency)
  const activeAccounts = getActiveAccounts()

  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [cardId, setCardId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [merchant, setMerchant] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [isTaxDeductible, setIsTaxDeductible] = useState(false)
  const [taxCategory, setTaxCategory] = useState('')
  const [showReceiptScan, setShowReceiptScan] = useState(false)

  const categories = type === 'income' ? getIncomeCategories() : getExpenseCategories()

  // Live cashback preview
  const cashbackPreview = (() => {
    if (type !== 'expense' || !cardId || !amount || !categoryId) return null
    const card = cards.find((c) => c.id === cardId)
    if (!card?.cashbackRules?.length) return null
    const result = calculateCashback(
      { type: 'expense', amount: parseFloat(amount) || 0, categoryId, cardId } as Parameters<typeof calculateCashback>[0],
      card,
      new Map(),
      0,
    )
    return result.amount > 0 ? result : null
  })()

  // Smart card recommendation for current category
  const smartRec = (() => {
    if (type !== 'expense' || !categoryId) return null
    const rec = getSmartRecommendations(categoryId, cards, transactions)
    return rec.bestCard
  })()

  const handleReceiptResult = (data: ScannedReceiptData) => {
    if (data.totalAmount) setAmount(data.totalAmount.toFixed(2))
    if (data.merchant) setMerchant(data.merchant)
    if (data.date) setDate(data.date)
    if (data.items?.length) {
      setNotes(data.items.map((i) => `${i.name}: ${i.amount.toFixed(2)}`).join('\n'))
    }
    setShowReceiptScan(false)

    // Auto-detect category from merchant
    if (data.merchant) {
      const allCats = type === 'income' ? getIncomeCategories() : getExpenseCategories()
      const historyMatch = suggestFromHistory(data.merchant, transactions)
      if (historyMatch) {
        setCategoryId(historyMatch)
      } else {
        const detected = autoDetectCategory(data.merchant, allCats)
        if (detected) setCategoryId(detected.id)
      }

      // Auto-detect tax
      const taxCat = autoDetectTaxCategory(data.merchant)
      if (taxCat) { setIsTaxDeductible(true); setTaxCategory(taxCat) }
    }

    // Auto-recommend best card after category is set
    setTimeout(() => {
      // Use the detected category to recommend a card
      const catId = categoryId || getExpenseCategories()[getExpenseCategories().length - 1]?.id
      if (catId && cards.length > 0) {
        const rec = getSmartRecommendations(catId, cards, transactions)
        if (rec.bestCard && !rec.bestCard.isCapReached) {
          setCardId(rec.bestCard.cardId)
          setAccountId('')
        }
      }
    }, 100)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !categoryId) return

    const txAmount = parseFloat(amount)
    let cashbackAmount: number | undefined
    let cashbackRate: number | undefined

    // Auto-calculate cashback if card has rules
    if (type === 'expense' && cardId) {
      const card = cards.find((c) => c.id === cardId)
      if (card?.cashbackRules?.length) {
        const result = calculateCashback(
          { type: 'expense', amount: txAmount, categoryId, cardId } as Parameters<typeof calculateCashback>[0],
          card,
          new Map(),
          0,
        )
        cashbackAmount = result.amount > 0 ? result.amount : undefined
        cashbackRate = result.rate > 0 ? result.rate : undefined
      }
    }

    await addTransaction({
      type,
      amount: txAmount,
      currency,
      categoryId,
      accountId: accountId || '',
      cardId: cardId || undefined,
      date: new Date(date).getTime(),
      merchant: merchant || undefined,
      notes: notes || undefined,
      cashbackAmount,
      cashbackRate,
      isTaxDeductible: isTaxDeductible || undefined,
      taxCategory: isTaxDeductible ? taxCategory : undefined,
      isConfirmed: true,
      importSource: 'manual',
    })

    navigate('/transactions')
  }

  const inputClass = 'w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="rounded-full p-1 hover:bg-accent">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl md:text-2xl font-bold">{t('transactions.addTransaction')}</h2>
        </div>
        {type === 'expense' && (
          <button
            onClick={() => setShowReceiptScan(true)}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            <ScanLine className="h-4 w-4" />
            {t('receipt.scanReceipt')}
          </button>
        )}
      </div>

      {/* Type Tabs */}
      <div className="flex rounded-lg bg-muted p-1">
        {TRANSACTION_TYPES.map((tt) => (
          <button
            key={tt}
            onClick={() => { setType(tt); setCategoryId('') }}
            className={cn(
              'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              type === tt
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t(`transactions.${tt}`)}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Amount */}
        <div>
          <label className="block text-sm font-medium mb-1.5">{t('transactions.amount')} ({currency})</label>
          <input
            type="text"
            inputMode="decimal"
            pattern="[0-9]*\.?[0-9]*"
            value={amount}
            onChange={(e) => {
              const v = e.target.value
              if (v === '' || /^\d*\.?\d{0,2}$/.test(v)) setAmount(v)
            }}
            onFocus={(e) => {
              // Scroll input into view when keyboard opens
              setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)
            }}
            className={cn(inputClass, 'text-xl md:text-2xl font-bold h-14')}
            placeholder="0.00"
            autoFocus
          />
        </div>

        {/* Category Grid */}
        <div>
          <label className="block text-sm font-medium mb-2">{t('transactions.category')}</label>
          <div className="grid grid-cols-4 gap-2 md:grid-cols-7">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl p-2.5 text-xs transition-all',
                  categoryId === cat.id
                    ? 'bg-primary/10 ring-2 ring-primary'
                    : 'hover:bg-accent',
                )}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: cat.color + '20' }}
                >
                  <CategoryIcon name={cat.icon} className="h-5 w-5" style={{ color: cat.color }} />
                </div>
                <span className="line-clamp-1">{cat.nameKey ? t(cat.nameKey) : cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Payment method */}
        <PaymentMethodPicker
          cards={cards}
          accounts={activeAccounts}
          selectedCardId={cardId}
          selectedAccountId={accountId}
          onChange={(cId, aId) => { setCardId(cId); setAccountId(aId) }}
        />

        {/* Smart card recommendation */}
        {type === 'expense' && categoryId && smartRec && smartRec.cardId !== cardId && !smartRec.isCapReached && (
          <button
            type="button"
            onClick={() => { setCardId(smartRec.cardId); setAccountId('') }}
            className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-left transition-colors hover:bg-primary/10"
          >
            <span className="text-lg">💡</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-primary">{t('transactions.recommendCard')}</p>
              <p className="text-[11px] text-muted-foreground">
                {smartRec.cardName} — {smartRec.rate}% cashback
                {smartRec.remainingCap !== null && ` (${formatAmount(smartRec.remainingCap, currency)} left)`}
              </p>
            </div>
          </button>
        )}

        {/* Cashback preview */}
        {cashbackPreview && (
          <>
            <div className="flex items-center justify-between rounded-lg border border-success/30 bg-success/5 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎉</span>
                <div>
                  <p className="text-xs font-medium text-success">{t('transactions.cashbackEarned')}</p>
                  <p className="text-[11px] text-muted-foreground">{cashbackPreview.rate}% cashback</p>
                </div>
              </div>
              <span className="text-base font-bold text-success">+{formatAmount(cashbackPreview.amount, currency)}</span>
            </div>
            <p className="text-[10px] text-muted-foreground/60 -mt-2">{t('transactions.cashbackDisclaimer')}</p>
          </>
        )}

        {/* Date */}
        <div>
          <label className="block text-sm font-medium mb-1.5">{t('transactions.date')}</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Merchant */}
        <div>
          <label className="block text-sm font-medium mb-1.5">{t('transactions.merchant')}</label>
          <input
            value={merchant}
            onChange={(e) => {
              const val = e.target.value
              setMerchant(val)
              // Auto-detect category if not already selected
              if (!categoryId && val.length >= 3) {
                const allCats = type === 'income' ? getIncomeCategories() : getExpenseCategories()
                // First try history
                const historyMatch = suggestFromHistory(val, transactions)
                if (historyMatch) { setCategoryId(historyMatch); return }
                // Then try keyword matching
                const detected = autoDetectCategory(val, allCats)
                if (detected) setCategoryId(detected.id)
              }
              // Auto-detect tax deductible
              if (val.length >= 3) {
                const taxCat = autoDetectTaxCategory(val)
                if (taxCat) { setIsTaxDeductible(true); setTaxCategory(taxCat) }
              }
            }}
            className={inputClass}
            placeholder="e.g. Grab, Shopee, Uniqlo"
          />
        </div>

        {/* Tax Deductible */}
        {type === 'expense' && (
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <p className="text-sm font-medium">{t('transactions.taxDeductible')}</p>
              {isTaxDeductible && taxCategory && (
                <p className="text-xs text-primary">
                  {TAX_CATEGORIES.find((c) => c.key === taxCategory)?.label}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isTaxDeductible && (
                <select
                  value={taxCategory}
                  onChange={(e) => setTaxCategory(e.target.value)}
                  className="rounded border bg-background px-2 py-1 text-xs"
                >
                  {TAX_CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              )}
              <button
                type="button"
                onClick={() => { setIsTaxDeductible(!isTaxDeductible); if (!taxCategory) setTaxCategory('other_tax') }}
                className={cn(
                  'relative h-6 w-11 rounded-full transition-colors',
                  isTaxDeductible ? 'bg-primary' : 'bg-muted',
                )}
              >
                <span className={cn(
                  'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                  isTaxDeductible && 'translate-x-5',
                )} />
              </button>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1.5">{t('transactions.notes')}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={cn(inputClass, 'h-20 resize-none')}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!amount || !categoryId}
          className={cn(
            'w-full rounded-lg py-3 text-sm font-semibold transition-colors',
            amount && categoryId
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted text-muted-foreground cursor-not-allowed',
          )}
        >
          {t('common.save')}
        </button>
      </form>

      {showReceiptScan && (
        <ReceiptScan
          onResult={handleReceiptResult}
          onClose={() => setShowReceiptScan(false)}
        />
      )}
    </div>
  )
}
