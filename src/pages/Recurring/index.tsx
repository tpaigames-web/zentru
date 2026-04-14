import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, RefreshCw, ArrowLeft } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router'
import { useData } from '@/data/DataProvider'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useCardStore } from '@/stores/useCardStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import type { RecurringTransaction } from '@/models/recurring'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { formatAmount } from '@/lib/currency'
import { cn } from '@/lib/utils'

export default function RecurringPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const repos = useData()
  const { categories } = useCategoryStore()
  const { cards } = useCardStore()
  const currency = useSettingsStore((s) => s.currency)

  const [searchParams, setSearchParams] = useSearchParams()

  const [recurring, setRecurring] = useState<RecurringTransaction[]>([])

  // Pre-fill from URL params (from Dashboard detected recurring)
  const prefillMerchant = searchParams.get('merchant') || ''
  const prefillAmount = searchParams.get('amount') || ''
  const prefillCat = searchParams.get('cat') || ''
  const prefillCard = searchParams.get('card') || ''
  const hasPrefill = !!prefillMerchant

  const [showForm, setShowForm] = useState(hasPrefill)

  // Form state
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [amount, setAmount] = useState(prefillAmount)
  const [categoryId, setCategoryId] = useState(prefillCat)
  const [cardId, setCardId] = useState(prefillCard)
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly')
  const [dayOfMonth, setDayOfMonth] = useState('1')
  const [merchant, setMerchant] = useState(prefillMerchant)

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const expenseCategories = categories.filter((c) => c.group === 'expense' && c.isActive)
  const incomeCategories = categories.filter((c) => c.group === 'income' && c.isActive)

  useEffect(() => {
    repos.recurring.getAll().then(setRecurring)
  }, [repos])

  const handleAdd = async () => {
    if (!amount || !categoryId) return

    await repos.recurring.create({
      templateTransaction: {
        type,
        amount: parseFloat(amount),
        currency,
        categoryId,
        accountId: '',
        cardId: cardId || undefined,
        merchant: merchant || undefined,
        isConfirmed: true,
        importSource: 'manual',
      },
      frequency,
      dayOfMonth: frequency === 'monthly' ? parseInt(dayOfMonth) : undefined,
      startDate: Date.now(),
      isActive: true,
    })

    const updated = await repos.recurring.getAll()
    setRecurring(updated)
    setShowForm(false)
    setAmount('')
    setCategoryId('')
    setMerchant('')
    setCardId('')
    if (hasPrefill) setSearchParams({}, { replace: true })
  }

  const handleDelete = async (id: string) => {
    await repos.recurring.delete(id)
    setRecurring(recurring.filter((r) => r.id !== id))
  }

  const frequencyLabels: Record<string, string> = {
    daily: 'Daily', weekly: 'Weekly', biweekly: 'Biweekly', monthly: 'Monthly', yearly: 'Yearly',
  }

  const inputClass = 'w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/settings')} className="rounded-full p-1 hover:bg-accent">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl md:text-2xl font-bold">{t('nav.recurring')}</h2>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
          <div className="flex gap-2">
            {(['expense', 'income'] as const).map((tt) => (
              <button
                key={tt}
                onClick={() => { setType(tt); setCategoryId('') }}
                className={cn('flex-1 rounded-md px-3 py-2 text-sm font-medium', type === tt ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}
              >
                {t(`transactions.${tt}`)}
              </button>
            ))}
          </div>
          <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} placeholder={`${t('transactions.amount')} (${currency})`} />
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
            <option value="">{t('transactions.category')}</option>
            {(type === 'expense' ? expenseCategories : incomeCategories).map((c) => (
              <option key={c.id} value={c.id}>{c.nameKey ? t(c.nameKey) : c.name}</option>
            ))}
          </select>
          {type === 'expense' && cards.length > 0 && (
            <select value={cardId} onChange={(e) => setCardId(e.target.value)} className={inputClass}>
              <option value="">{t('transactions.card')}</option>
              {cards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <div className="grid grid-cols-2 gap-2">
            <select value={frequency} onChange={(e) => setFrequency(e.target.value as typeof frequency)} className={inputClass}>
              {['daily', 'weekly', 'monthly', 'yearly'].map((f) => (
                <option key={f} value={f}>{frequencyLabels[f]}</option>
              ))}
            </select>
            {frequency === 'monthly' && (
              <input type="number" min="1" max="28" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} className={inputClass} placeholder="Day of month" />
            )}
          </div>
          <input value={merchant} onChange={(e) => setMerchant(e.target.value)} className={inputClass} placeholder={t('transactions.merchant')} />
          <button onClick={handleAdd} disabled={!amount || !categoryId} className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {t('common.save')}
          </button>
        </div>
      )}

      {/* Recurring list */}
      {recurring.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-16 shadow-sm">
          <RefreshCw className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {recurring.map((r) => {
            const cat = categoryMap.get(r.templateTransaction.categoryId)
            return (
              <div key={r.id} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm">
                {cat && (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: cat.color + '20' }}>
                    <CategoryIcon name={cat.icon} className="h-5 w-5" style={{ color: cat.color }} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{cat?.nameKey ? t(cat.nameKey) : cat?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {frequencyLabels[r.frequency]}
                    {r.dayOfMonth ? ` · Day ${r.dayOfMonth}` : ''}
                    {r.templateTransaction.merchant ? ` · ${r.templateTransaction.merchant}` : ''}
                  </p>
                </div>
                <span className={cn('text-sm font-semibold', r.templateTransaction.type === 'income' ? 'text-success' : '')}>
                  {r.templateTransaction.type === 'income' ? '+' : '-'}{formatAmount(r.templateTransaction.amount, currency)}
                </span>
                <button onClick={() => handleDelete(r.id)} className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
