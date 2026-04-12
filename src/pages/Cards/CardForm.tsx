import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { X, Plus, Trash2 } from 'lucide-react'
import type { CreditCard, CashbackRule } from '@/models/card'
import type { ScannedCardData } from '@/services/cardScanner'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { ALL_BANKS } from '@/config/banks'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { CURRENCIES } from '@/lib/currency'
import { cn } from '@/lib/utils'

const CARD_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b']

const cardSchema = z.object({
  name: z.string().min(1),
  bank: z.string().min(1),
  lastFourDigits: z.string().max(4).optional(),
  creditLimit: z.number().positive(),
  currentBalance: z.number().min(0),
  billingDay: z.number().int().min(1).max(28),
  dueDay: z.number().int().min(1).max(28),
  interestRate: z.number().min(0).max(100),
  currency: z.string().min(1),
  color: z.string().optional(),
  totalMonthlyCashbackCap: z.number().min(0).optional(),
})

type CardFormData = z.infer<typeof cardSchema>

interface CardFormProps {
  card?: CreditCard
  scannedData?: ScannedCardData
  onSubmit: (data: CardFormData & { cashbackRules?: CashbackRule[]; totalMonthlyCashbackCap?: number }) => void
  onClose: () => void
}

export function CardForm({ card, scannedData, onSubmit, onClose }: CardFormProps) {
  const { t } = useTranslation()
  const currency = useSettingsStore((s) => s.currency)
  const { getExpenseCategories } = useCategoryStore()
  const expenseCategories = getExpenseCategories()

  const [cashbackRules, setCashbackRules] = useState<CashbackRule[]>(
    card?.cashbackRules || [],
  )

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CardFormData>({
    resolver: zodResolver(cardSchema),
    defaultValues: card
      ? {
          name: card.name,
          bank: card.bank,
          lastFourDigits: card.lastFourDigits || '',
          creditLimit: card.creditLimit,
          currentBalance: card.currentBalance,
          billingDay: card.billingDay,
          dueDay: card.dueDay,
          interestRate: card.interestRate,
          currency: card.currency || currency,
          color: card.color || CARD_COLORS[0],
          totalMonthlyCashbackCap: card.totalMonthlyCashbackCap || 0,
        }
      : {
          name: scannedData?.bank ? `${scannedData.bank} Card` : '',
          bank: scannedData?.bank || '',
          lastFourDigits: scannedData?.lastFourDigits || '',
          creditLimit: 0,
          currentBalance: 0,
          billingDay: 1,
          dueDay: 20,
          interestRate: 18,
          currency,
          color: CARD_COLORS[0],
          totalMonthlyCashbackCap: 0,
        },
  })

  const selectedColor = watch('color')

  const addRule = () => {
    setCashbackRules([...cashbackRules, { categoryId: '*', rate: 0.2 }])
  }

  const updateRule = (index: number, updates: Partial<CashbackRule>) => {
    setCashbackRules(cashbackRules.map((r, i) => (i === index ? { ...r, ...updates } : r)))
  }

  const removeRule = (index: number) => {
    setCashbackRules(cashbackRules.filter((_, i) => i !== index))
  }

  const handleFormSubmit = (data: CardFormData) => {
    onSubmit({
      ...data,
      cashbackRules: cashbackRules.length > 0 ? cashbackRules : undefined,
      totalMonthlyCashbackCap: data.totalMonthlyCashbackCap || undefined,
    })
  }

  const inputClass = 'w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50'
  const labelClass = 'block text-sm font-medium text-foreground mb-1.5'
  const errorClass = 'text-xs text-destructive mt-1'

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 md:items-center" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-2xl bg-card p-6 pb-20 shadow-xl md:rounded-2xl md:pb-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {card ? t('cards.editCard') : t('cards.addCard')}
          </h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelClass}>{t('cards.cardName')}</label>
              <input {...register('name')} className={inputClass} placeholder="e.g. Maybank Visa" />
              {errors.name && <p className={errorClass}>{t('common.required')}</p>}
            </div>

            <div>
              <label className={labelClass}>{t('cards.bank')}</label>
              <select {...register('bank')} className={inputClass}>
                <option value="">-- Select --</option>
                {ALL_BANKS.map((b) => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
                <option value="__other">Other</option>
              </select>
              {errors.bank && <p className={errorClass}>{t('common.required')}</p>}
            </div>

            <div>
              <label className={labelClass}>{t('cards.lastFour')}</label>
              <input {...register('lastFourDigits')} className={inputClass} maxLength={4} placeholder="1234" />
            </div>

            <div>
              <label className={labelClass}>{t('cards.creditLimit')} ({currency})</label>
              <input {...register('creditLimit', { valueAsNumber: true })} type="number" step="0.01" className={inputClass} />
              {errors.creditLimit && <p className={errorClass}>Must be positive</p>}
            </div>

            <div>
              <label className={labelClass}>{t('cards.currentBalance')} ({currency})</label>
              <input {...register('currentBalance', { valueAsNumber: true })} type="number" step="0.01" className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>{t('cards.billingDay')}</label>
              <input {...register('billingDay', { valueAsNumber: true })} type="number" min={1} max={28} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>{t('cards.dueDay')}</label>
              <input {...register('dueDay', { valueAsNumber: true })} type="number" min={1} max={28} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>{t('cards.interestRate')} (%)</label>
              <input {...register('interestRate', { valueAsNumber: true })} type="number" step="0.01" className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>{t('cards.currency')}</label>
              <select {...register('currency')} className={inputClass}>
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className={labelClass}>Color</label>
            <div className="flex gap-2">
              {CARD_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue('color', color)}
                  className={cn(
                    'h-8 w-8 rounded-full transition-transform',
                    selectedColor === color && 'scale-125 ring-2 ring-offset-2 ring-primary',
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Cashback Rules */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className={labelClass + ' mb-0'}>Cashback Rules</label>
              <button
                type="button"
                onClick={addRule}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Add Rule
              </button>
            </div>

            {cashbackRules.length === 0 ? (
              <p className="text-xs text-muted-foreground">No cashback rules configured.</p>
            ) : (
              <div className="space-y-2">
                {cashbackRules.map((rule, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2.5">
                    <select
                      value={rule.categoryId}
                      onChange={(e) => updateRule(i, { categoryId: e.target.value })}
                      className="flex-1 rounded border bg-background px-2 py-1.5 text-xs"
                    >
                      <option value="*">All Others (Default)</option>
                      {expenseCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nameKey ? t(cat.nameKey) : cat.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={rule.rate}
                        onChange={(e) => updateRule(i, { rate: parseFloat(e.target.value) || 0 })}
                        className="w-16 rounded border bg-background px-2 py-1.5 text-xs text-center"
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={rule.monthlyCap || ''}
                        onChange={(e) => updateRule(i, { monthlyCap: e.target.value ? parseFloat(e.target.value) : undefined })}
                        placeholder="No cap"
                        className="w-20 rounded border bg-background px-2 py-1.5 text-xs"
                      />
                      <span className="text-xs text-muted-foreground">cap</span>
                    </div>
                    <button type="button" onClick={() => removeRule(i)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {cashbackRules.length > 0 && (
              <div className="mt-3">
                <label className={labelClass}>Total Monthly Cap ({currency})</label>
                <input
                  {...register('totalMonthlyCashbackCap', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  className={inputClass}
                  placeholder="0 = no overall cap"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
