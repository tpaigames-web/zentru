import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, Check, Delete, CreditCard, Wallet, Calendar as CalIcon } from 'lucide-react'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { useCardStore } from '@/stores/useCardStore'
import { useAccountStore } from '@/stores/useAccountStore'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { cn } from '@/lib/utils'

interface SourceTarget {
  kind: 'account' | 'card'
  id: string
  name: string
  color: string
  subtitle?: string
}

export default function TransferPage() {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const { addTransaction } = useTransactionStore()
  const { cards } = useCardStore()
  const { accounts } = useAccountStore()
  const { categories } = useCategoryStore()
  const currency = useSettingsStore((s) => s.currency)
  const isZh = i18n.language.startsWith('zh')

  const [amount, setAmount] = useState('0')
  const [fromKey, setFromKey] = useState<string>('')    // 'account:id' | 'card:id'
  const [toKey, setToKey] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [showFromPicker, setShowFromPicker] = useState(false)
  const [showToPicker, setShowToPicker] = useState(false)

  // Build source/target list
  const sources = useMemo<SourceTarget[]>(() => {
    const list: SourceTarget[] = []
    // Active accounts first (savings, ewallet)
    accounts.filter((a) => a.isActive).forEach((a) => {
      list.push({
        kind: 'account',
        id: a.id,
        name: a.name,
        color: a.color || '#64748b',
        subtitle: a.type,
      })
    })
    // Active cards
    cards.filter((c) => c.isActive).forEach((c) => {
      list.push({
        kind: 'card',
        id: c.id,
        name: c.name,
        color: c.color || '#3b82f6',
        subtitle: c.bank + (c.lastFourDigits ? ` · ${c.lastFourDigits}` : ''),
      })
    })
    return list
  }, [accounts, cards])

  const fromItem = sources.find((s) => `${s.kind}:${s.id}` === fromKey)
  const toItem = sources.find((s) => `${s.kind}:${s.id}` === toKey)
  const toItems = sources.filter((s) => `${s.kind}:${s.id}` !== fromKey) // Exclude "from" from "to" options

  const amountNum = parseFloat(amount) || 0

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
    if (amount === '0') {
      setAmount(key)
    } else {
      if (amount.includes('.') && amount.split('.')[1].length >= 2) return
      setAmount(amount + key)
    }
  }

  const canSubmit = amountNum > 0 && fromItem && toItem

  const handleSubmit = async () => {
    if (!canSubmit || !fromItem || !toItem) return
    setSaving(true)

    // Determine transfer type
    let transferType: 'account_to_account' | 'account_to_card' | 'card_to_account' | 'card_to_card'
    if (fromItem.kind === 'account' && toItem.kind === 'account') transferType = 'account_to_account'
    else if (fromItem.kind === 'account' && toItem.kind === 'card') transferType = 'account_to_card'
    else if (fromItem.kind === 'card' && toItem.kind === 'account') transferType = 'card_to_account'
    else transferType = 'card_to_card'

    // Find or use a transfer category
    const transferCategory = categories.find((c) => c.nameKey === 'category.other_expense') || categories[0]

    // Build merchant string for clarity
    const merchantStr = `${fromItem.name} → ${toItem.name}`

    await addTransaction({
      type: 'transfer',
      amount: amountNum,
      currency,
      categoryId: transferCategory?.id || '',
      accountId: fromItem.kind === 'account' ? fromItem.id : '',
      cardId: fromItem.kind === 'card' ? fromItem.id : undefined,
      toAccountId: toItem.kind === 'account' ? toItem.id : undefined,
      toCardId: toItem.kind === 'card' ? toItem.id : undefined,
      transferType,
      date: Date.now(),
      merchant: merchantStr,
      notes: notes || undefined,
      isConfirmed: true,
      importSource: 'manual',
    })

    // If paying credit card debt, reduce its balance
    if (transferType === 'account_to_card' || transferType === 'card_to_card') {
      const { updateCard } = useCardStore.getState()
      const destCard = cards.find((c) => c.id === toItem.id)
      if (destCard) {
        const newBalance = Math.max(0, (destCard.currentBalance || 0) - amountNum)
        await updateCard(destCard.id, { currentBalance: newBalance })
      }
    }

    navigate('/transactions')
  }

  const keypadKeys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'del'],
  ]

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-slate-900 dark:to-indigo-950/20">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 backdrop-blur px-4 py-3">
        <button onClick={() => navigate(-1)} className="rounded-full p-1.5 hover:bg-accent">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-sm font-bold">{isZh ? '转账' : 'Transfer'}</h2>
        <div className="w-8" />
      </div>

      {/* From & To */}
      <div className="px-4 py-6 space-y-3">
        {/* From */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            {isZh ? '从' : 'From'}
          </label>
          <button
            onClick={() => setShowFromPicker(true)}
            className={cn(
              'w-full flex items-center gap-3 rounded-2xl border-2 px-4 py-3 transition-all',
              fromItem ? 'border-transparent' : 'border-dashed border-muted-foreground/30'
            )}
            style={fromItem ? { backgroundColor: fromItem.color + '20' } : undefined}
          >
            {fromItem ? (
              <>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: fromItem.color + '40' }}
                >
                  {fromItem.kind === 'card'
                    ? <CreditCard className="h-5 w-5" style={{ color: fromItem.color }} />
                    : <Wallet className="h-5 w-5" style={{ color: fromItem.color }} />
                  }
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold" style={{ color: fromItem.color }}>
                    {fromItem.name}
                  </p>
                  {fromItem.subtitle && (
                    <p className="text-xs text-muted-foreground">{fromItem.subtitle}</p>
                  )}
                </div>
              </>
            ) : (
              <span className="text-sm text-muted-foreground flex-1 text-left">
                {isZh ? '选择付款账户或卡片' : 'Select source'}
              </span>
            )}
          </button>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <ArrowRight className="h-4 w-4 text-primary rotate-90" />
          </div>
        </div>

        {/* To */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            {isZh ? '到' : 'To'}
          </label>
          <button
            onClick={() => setShowToPicker(true)}
            disabled={!fromItem}
            className={cn(
              'w-full flex items-center gap-3 rounded-2xl border-2 px-4 py-3 transition-all',
              toItem ? 'border-transparent' : 'border-dashed border-muted-foreground/30',
              !fromItem && 'opacity-50'
            )}
            style={toItem ? { backgroundColor: toItem.color + '20' } : undefined}
          >
            {toItem ? (
              <>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: toItem.color + '40' }}
                >
                  {toItem.kind === 'card'
                    ? <CreditCard className="h-5 w-5" style={{ color: toItem.color }} />
                    : <Wallet className="h-5 w-5" style={{ color: toItem.color }} />
                  }
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold" style={{ color: toItem.color }}>
                    {toItem.name}
                  </p>
                  {toItem.subtitle && (
                    <p className="text-xs text-muted-foreground">{toItem.subtitle}</p>
                  )}
                </div>
              </>
            ) : (
              <span className="text-sm text-muted-foreground flex-1 text-left">
                {isZh ? '选择收款账户或卡片' : 'Select destination'}
              </span>
            )}
          </button>
        </div>

        {/* Card payment hint */}
        {fromItem && toItem && toItem.kind === 'card' && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
            <p className="font-medium text-primary">
              💳 {isZh ? '信用卡还款' : 'Credit Card Payment'}
            </p>
            <p className="mt-0.5 text-muted-foreground">
              {isZh
                ? `会自动减少 ${toItem.name} 的应还余额`
                : `Will reduce ${toItem.name}'s balance due`}
            </p>
          </div>
        )}
      </div>

      {/* Bottom: amount + keypad */}
      <div className="sticky bottom-0 mt-auto border-t bg-background/95 backdrop-blur">
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{isZh ? '转账金额' : 'Transfer Amount'}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-muted-foreground">{currency}</span>
              <span className="text-2xl font-bold text-primary tabular-nums">{amount}</span>
            </div>
          </div>
        </div>

        <div className="px-4 pb-2">
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={isZh ? '备注（可选）' : 'Notes (optional)'}
            className="w-full rounded-full border bg-muted/30 px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="grid grid-cols-4 gap-1 p-2">
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
          <div className="flex flex-col gap-1">
            <div className="flex h-12 items-center justify-center gap-1 rounded-xl bg-muted/50 text-[11px] font-medium">
              <CalIcon className="h-3.5 w-3.5" />
              {isZh ? '今天' : 'Today'}
            </div>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || saving}
              className={cn(
                'flex-1 min-h-[6rem] rounded-xl flex items-center justify-center gap-1 text-sm font-bold text-white transition-all bg-primary',
                'disabled:opacity-40 active:scale-95 hover:opacity-90'
              )}
            >
              <Check className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* From picker modal */}
      {showFromPicker && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-4" onClick={() => setShowFromPicker(false)}>
          <div
            className="w-full max-w-md rounded-t-3xl md:rounded-3xl bg-card p-5 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 text-sm font-bold">{isZh ? '选择付款来源' : 'Select Source'}</h3>
            <div className="space-y-2">
              {sources.map((s) => (
                <button
                  key={`${s.kind}:${s.id}`}
                  onClick={() => { setFromKey(`${s.kind}:${s.id}`); setShowFromPicker(false) }}
                  className="w-full flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors"
                  style={{ backgroundColor: s.color + '15' }}
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: s.color + '30' }}
                  >
                    {s.kind === 'card'
                      ? <CreditCard className="h-5 w-5" style={{ color: s.color }} />
                      : <Wallet className="h-5 w-5" style={{ color: s.color }} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: s.color }}>{s.name}</p>
                    {s.subtitle && <p className="text-xs text-muted-foreground">{s.subtitle}</p>}
                  </div>
                  <span className="text-[10px] rounded-full bg-muted px-2 py-0.5">
                    {s.kind === 'card' ? (isZh ? '卡' : 'Card') : (isZh ? '账户' : 'Account')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* To picker modal */}
      {showToPicker && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-4" onClick={() => setShowToPicker(false)}>
          <div
            className="w-full max-w-md rounded-t-3xl md:rounded-3xl bg-card p-5 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 text-sm font-bold">{isZh ? '选择收款目标' : 'Select Destination'}</h3>
            <div className="space-y-2">
              {toItems.map((s) => (
                <button
                  key={`${s.kind}:${s.id}`}
                  onClick={() => { setToKey(`${s.kind}:${s.id}`); setShowToPicker(false) }}
                  className="w-full flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors"
                  style={{ backgroundColor: s.color + '15' }}
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: s.color + '30' }}
                  >
                    {s.kind === 'card'
                      ? <CreditCard className="h-5 w-5" style={{ color: s.color }} />
                      : <Wallet className="h-5 w-5" style={{ color: s.color }} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: s.color }}>{s.name}</p>
                    {s.subtitle && <p className="text-xs text-muted-foreground">{s.subtitle}</p>}
                  </div>
                  <span className="text-[10px] rounded-full bg-muted px-2 py-0.5">
                    {s.kind === 'card' ? (isZh ? '卡' : 'Card') : (isZh ? '账户' : 'Account')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
