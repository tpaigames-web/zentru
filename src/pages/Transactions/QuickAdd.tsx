import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Check, Delete, Calendar as CalIcon, FileText } from 'lucide-react'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { useCardStore } from '@/stores/useCardStore'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import type { Category } from '@/models/category'
import type { TransactionType } from '@/models/transaction'
import { calculateCashback } from '@/services/cashback'
import { formatAmount } from '@/lib/currency'
import { cn } from '@/lib/utils'

type Mode = 'expense' | 'income'

export default function QuickAddPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { addTransaction } = useTransactionStore()
  const { cards } = useCardStore()
  const { getExpenseCategories, getIncomeCategories } = useCategoryStore()
  const currency = useSettingsStore((s) => s.currency)
  const isZh = i18n.language.startsWith('zh')

  const [mode, setMode] = useState<Mode>('expense')
  const [amount, setAmount] = useState('0')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [notes, setNotes] = useState('')
  const [cardId, setCardId] = useState('')
  const [date] = useState(new Date())
  const [saving, setSaving] = useState(false)

  const categories = useMemo(() => {
    return mode === 'income' ? getIncomeCategories() : getExpenseCategories()
  }, [mode, getExpenseCategories, getIncomeCategories])

  // Active cards for payment
  const activeCards = useMemo(() => cards.filter((c) => c.isActive), [cards])

  const amountNum = parseFloat(amount) || 0

  // Cashback preview
  const cashback = useMemo(() => {
    if (mode !== 'expense' || !cardId || amountNum <= 0 || !selectedCategory) return null
    const card = cards.find((c) => c.id === cardId)
    if (!card?.cashbackRules?.length) return null
    const result = calculateCashback(
      { type: 'expense', amount: amountNum, categoryId: selectedCategory.id, cardId } as Parameters<typeof calculateCashback>[0],
      card,
      new Map(),
      0,
    )
    return result.amount > 0 ? result : null
  }, [mode, cardId, amountNum, selectedCategory, cards])

  // Keypad handler
  const handleKeypad = (key: string) => {
    if (key === 'del') {
      if (amount.length <= 1) {
        setAmount('0')
      } else {
        setAmount(amount.slice(0, -1))
      }
      return
    }
    if (key === '.') {
      if (amount.includes('.')) return
      setAmount(amount + '.')
      return
    }
    // Digit
    if (amount === '0') {
      setAmount(key)
    } else {
      // Limit to 2 decimal places
      if (amount.includes('.') && amount.split('.')[1].length >= 2) return
      setAmount(amount + key)
    }
  }

  const canSubmit = amountNum > 0 && selectedCategory

  const handleSubmit = async () => {
    if (!canSubmit || !selectedCategory) return
    setSaving(true)

    let cashbackAmount: number | undefined
    let cashbackRate: number | undefined
    if (mode === 'expense' && cardId) {
      const card = cards.find((c) => c.id === cardId)
      if (card?.cashbackRules?.length) {
        const result = calculateCashback(
          { type: 'expense', amount: amountNum, categoryId: selectedCategory.id, cardId } as Parameters<typeof calculateCashback>[0],
          card,
          new Map(),
          0,
        )
        cashbackAmount = result.amount > 0 ? result.amount : undefined
        cashbackRate = result.rate > 0 ? result.rate : undefined
      }
    }

    await addTransaction({
      type: mode as TransactionType,
      amount: amountNum,
      currency,
      categoryId: selectedCategory.id,
      accountId: '',
      cardId: cardId || undefined,
      date: date.getTime(),
      merchant: undefined,
      notes: notes || undefined,
      cashbackAmount,
      cashbackRate,
      isConfirmed: true,
      importSource: 'manual',
    })

    navigate('/transactions')
  }

  const keypadKeys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'del'],
  ]

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-orange-50/50 to-amber-50/50 dark:from-slate-900 dark:to-amber-950/30">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 backdrop-blur px-4 py-3">
        <button onClick={() => navigate(-1)} className="rounded-full p-1.5 hover:bg-accent">
          <ArrowLeft className="h-5 w-5" />
        </button>
        {/* Mode switcher */}
        <div className="flex rounded-full bg-muted p-1">
          <button
            onClick={() => { setMode('expense'); setSelectedCategory(null) }}
            className={cn(
              'rounded-full px-4 py-1.5 text-xs font-medium transition-colors',
              mode === 'expense' ? 'bg-red-500 text-white' : 'text-muted-foreground'
            )}
          >
            {isZh ? '支出' : 'Expense'}
          </button>
          <button
            onClick={() => { setMode('income'); setSelectedCategory(null) }}
            className={cn(
              'rounded-full px-4 py-1.5 text-xs font-medium transition-colors',
              mode === 'income' ? 'bg-green-500 text-white' : 'text-muted-foreground'
            )}
          >
            {isZh ? '收入' : 'Income'}
          </button>
        </div>
        <button
          onClick={() => navigate('/transactions/new/detailed')}
          className="rounded-full p-1.5 hover:bg-accent text-muted-foreground"
          title={isZh ? '详细记账' : 'Detailed'}
        >
          <FileText className="h-5 w-5" />
        </button>
      </div>

      {/* Category grid — scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="grid grid-cols-3 gap-2.5 md:grid-cols-5">
          {categories.filter((c) => c.isActive).map((cat) => {
            const selected = selectedCategory?.id === cat.id
            const color = cat.color || '#94a3b8'
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 transition-all',
                  'active:scale-95'
                )}
                style={{
                  backgroundColor: selected ? color + '40' : color + '18',
                  ...(selected ? { boxShadow: `0 0 0 2px ${color}, 0 0 0 4px hsl(var(--background))` } : {}),
                }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: color + '30' }}
                >
                  <CategoryIcon
                    name={cat.icon || 'MoreHorizontal'}
                    className="h-5 w-5"
                    style={{ color }}
                  />
                </div>
                <span
                  className="text-[11px] font-medium text-center leading-tight line-clamp-2"
                  style={{ color }}
                >
                  {cat.nameKey ? t(cat.nameKey, { defaultValue: cat.name }) : cat.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Bottom: amount + keypad */}
      <div className="sticky bottom-0 border-t bg-background/95 backdrop-blur">
        {/* Amount display */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between gap-3">
            {/* Selected category chip */}
            {selectedCategory ? (
              <div
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
                style={{ backgroundColor: (selectedCategory.color || '#94a3b8') + '20' }}
              >
                <CategoryIcon
                  name={selectedCategory.icon || 'MoreHorizontal'}
                  className="h-3.5 w-3.5"
                  style={{ color: selectedCategory.color }}
                />
                <span className="text-xs font-medium" style={{ color: selectedCategory.color }}>
                  {selectedCategory.nameKey ? t(selectedCategory.nameKey, { defaultValue: selectedCategory.name }) : selectedCategory.name}
                </span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">{isZh ? '选择类别' : 'Pick a category'}</span>
            )}
            {/* Amount */}
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-muted-foreground">{currency}</span>
              <span className={cn(
                'text-2xl font-bold tabular-nums',
                mode === 'income' ? 'text-green-500' : 'text-red-500'
              )}>
                {mode === 'income' ? '+' : '-'}{amount}
              </span>
            </div>
          </div>

          {/* Cashback preview */}
          {cashback && (
            <p className="mt-1 text-right text-[10px] text-success font-medium">
              +{formatAmount(cashback.amount, currency)} cashback
            </p>
          )}
        </div>

        {/* Notes input */}
        <div className="px-4 pb-2">
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={isZh ? '备注（可选）' : 'Notes (optional)'}
            className="w-full rounded-full border bg-muted/30 px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-1 p-2">
          {/* Left: numbers */}
          <div className="col-span-3 grid grid-cols-3 gap-1">
            {keypadKeys.map((row, ri) => row.map((key) => (
              <button
                key={`${ri}-${key}`}
                onClick={() => handleKeypad(key)}
                className="h-12 rounded-xl bg-muted/50 text-lg font-medium hover:bg-muted transition-colors flex items-center justify-center active:scale-95"
              >
                {key === 'del' ? <Delete className="h-5 w-5" /> : key}
              </button>
            )))}
          </div>
          {/* Right: actions */}
          <div className="flex flex-col gap-1">
            {/* Card picker (small) */}
            {mode === 'expense' && activeCards.length > 0 && (
              <select
                value={cardId}
                onChange={(e) => setCardId(e.target.value)}
                className="h-12 rounded-xl border bg-card px-2 text-[11px] outline-none"
              >
                <option value="">{isZh ? '💳 卡' : '💳 Card'}</option>
                {activeCards.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
            {/* Date chip */}
            <div className="flex h-12 items-center justify-center gap-1 rounded-xl bg-muted/50 text-[11px] font-medium">
              <CalIcon className="h-3.5 w-3.5" />
              {isZh ? '今天' : 'Today'}
            </div>
            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || saving}
              className={cn(
                'flex-1 min-h-12 rounded-xl flex items-center justify-center gap-1 text-sm font-bold text-white transition-all',
                mode === 'income' ? 'bg-green-500' : 'bg-red-500',
                'disabled:opacity-40 active:scale-95 hover:opacity-90'
              )}
            >
              <Check className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
