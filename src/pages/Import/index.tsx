import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, FileText, Check, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router'
import { parseStatement, type ParsedStatement } from '@/services/pdfParser'
import { autoDetectCategory } from '@/services/autoCategory'
import { calculateCashback } from '@/services/cashback'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { useCardStore } from '@/stores/useCardStore'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { formatAmount } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { ALL_BANKS } from '@/config/banks'

const BANK_NAMES: Record<string, string> = Object.fromEntries([
  ...ALL_BANKS.map((b) => [b.id, b.name]),
  ['unknown', 'Unknown'],
])

type ImportStep = 'upload' | 'preview' | 'done'

export default function ImportPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { addTransaction, transactions: existingTransactions } = useTransactionStore()
  const { cards, addCard } = useCardStore()
  const { getExpenseCategories } = useCategoryStore()
  const currency = useSettingsStore((s) => s.currency)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<ImportStep>('upload')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [statement, setStatement] = useState<ParsedStatement | null>(null)
  const [selectedTx, setSelectedTx] = useState<Set<number>>(new Set())
  const [cardId, setCardId] = useState('')
  const [importedCount, setImportedCount] = useState(0)
  const [duplicateIndices, setDuplicateIndices] = useState<Set<number>>(new Set())

  const expenseCategories = getExpenseCategories()
  const defaultCategoryId = expenseCategories[expenseCategories.length - 1]?.id || '' // "Other Expense"

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a PDF file')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const result = await parseStatement(file)

      if (result.transactions.length === 0) {
        setError('No transactions found in this PDF. The format may not be supported yet.')
        setIsLoading(false)
        return
      }

      setStatement(result)

      // Check for duplicates against existing transactions
      const dupes = new Set<number>()
      for (let i = 0; i < result.transactions.length; i++) {
        const tx = result.transactions[i]
        const txDate = new Date(tx.date).getTime()
        const isDuplicate = existingTransactions.some((existing) => {
          const sameAmount = Math.abs(existing.amount - tx.amount) < 0.01
          const sameDate = Math.abs(existing.date - txDate) < 86400000 // within 1 day
          const sameMerchant = existing.merchant && tx.description &&
            existing.merchant.toLowerCase().includes(tx.description.toLowerCase().substring(0, 10))
          return sameAmount && sameDate && sameMerchant
        })
        if (isDuplicate) dupes.add(i)
      }
      setDuplicateIndices(dupes)

      // Auto-select only non-duplicate transactions
      const nonDupes = new Set(result.transactions.map((_, i) => i).filter((i) => !dupes.has(i)))
      setSelectedTx(nonDupes)

      // Auto-match card by last 4 digits AND/OR bank name
      if (result.cardNumber || result.bank) {
        const last4 = result.cardNumber?.slice(-4)
        const bankName = BANK_NAMES[result.bank]?.toLowerCase()

        // Priority 1: match both card number and bank
        let matched = last4 && bankName
          ? cards.find((c) => c.lastFourDigits === last4 && c.bank.toLowerCase().includes(bankName))
          : undefined

        // Priority 2: match card number only
        if (!matched && last4) {
          matched = cards.find((c) => c.lastFourDigits === last4)
        }

        // Priority 3: match bank name only (if only one card from that bank)
        if (!matched && bankName) {
          const bankCards = cards.filter((c) => c.bank.toLowerCase().includes(bankName))
          if (bankCards.length === 1) matched = bankCards[0]
        }

        if (matched) {
          setCardId(matched.id)
        } else if (last4 || bankName) {
          // No matching card found — offer to create one
          const bankLabel = BANK_NAMES[result.bank] || result.bank
          // Extract due day from PDF due date (e.g. "2026-04-15" → 15)
          const pdfDueDay = result.dueDate ? parseInt(result.dueDate.split('-')[2]) || 20 : 20
          const pdfBillingDay = result.statementDate ? parseInt(result.statementDate.split('-')[2]) || 1 : 1

          const newCard = await addCard({
            name: `${bankLabel} Card`,
            bank: bankLabel,
            lastFourDigits: last4 || '',
            creditLimit: result.creditLimit || 0,
            currentBalance: result.totalAmount || 0,
            billingDay: pdfBillingDay,
            dueDay: pdfDueDay,
            interestRate: 18,
            currency,
            color: '#3b82f6',
            isActive: true,
            notes: 'Auto-created from PDF import',
          })
          setCardId(newCard.id)
        }
      }

      setStep('preview')
    } catch (err) {
      setError(`Failed to parse PDF: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }

    setIsLoading(false)
  }

  const toggleTx = (index: number) => {
    const next = new Set(selectedTx)
    if (next.has(index)) next.delete(index)
    else next.add(index)
    setSelectedTx(next)
  }

  const toggleAll = () => {
    if (statement) {
      if (selectedTx.size === statement.transactions.length) {
        setSelectedTx(new Set())
      } else {
        setSelectedTx(new Set(statement.transactions.map((_, i) => i)))
      }
    }
  }

  const handleImport = async () => {
    if (!statement) return
    setIsLoading(true)

    const allCategories = [...expenseCategories, ...useCategoryStore.getState().getIncomeCategories()]
    const matchedCard = cardId ? cards.find((c) => c.id === cardId) : undefined

    let count = 0
    for (const [i, tx] of statement.transactions.entries()) {
      if (!selectedTx.has(i)) continue

      // Auto-detect category from merchant/description
      const detectedCat = autoDetectCategory(tx.description, allCategories)
      const categoryId = detectedCat?.id || defaultCategoryId

      // Auto-calculate cashback if card has rules
      let cashbackAmount: number | undefined
      let cashbackRate: number | undefined
      if (tx.type === 'expense' && matchedCard?.cashbackRules?.length) {
        const result = calculateCashback(
          { type: 'expense', amount: tx.amount, categoryId, cardId } as Parameters<typeof calculateCashback>[0],
          matchedCard,
          new Map(),
          0,
        )
        if (result.amount > 0) {
          cashbackAmount = result.amount
          cashbackRate = result.rate
        }
      }

      await addTransaction({
        type: tx.type,
        amount: tx.amount,
        currency,
        categoryId,
        accountId: '',
        cardId: cardId || undefined,
        date: new Date(tx.date).getTime() || Date.now(),
        merchant: tx.description,
        notes: `Imported from ${BANK_NAMES[statement.bank]} PDF`,
        cashbackAmount,
        cashbackRate,
        isConfirmed: false,
        importSource: 'pdf',
      })
      count++
    }

    setImportedCount(count)
    setStep('done')
    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/settings')} className="rounded-full p-1 hover:bg-accent">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl md:text-2xl font-bold">{t('settings.importData')}</h2>
      </div>

      {/* Step: Upload */}
      {step === 'upload' && (
        <div className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card py-12 hover:border-primary/50 hover:bg-accent/30 transition-colors"
          >
            <Upload className="mb-3 h-10 w-10 text-primary/40" />
            <p className="text-sm font-medium">{t('import.selectPdf')}</p>
            <p className="mt-1.5 text-xs text-muted-foreground">{t('import.supportedBanks')}: {ALL_BANKS.length}+</p>
          </div>

          {/* Privacy Guarantee - compact */}
          <div className="flex items-center gap-3 rounded-xl border border-success/20 bg-success/5 px-4 py-3">
            <ShieldCheck className="h-5 w-5 text-success shrink-0" />
            <p className="text-xs text-muted-foreground">
              {t('import.privacyShort')}
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileSelect}
          />

          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm">{t('import.parsing')}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* Step: Preview */}
      {step === 'preview' && statement && (
        <div className="space-y-4">
          {/* Duplicate warning */}
          {duplicateIndices.size > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-warning shrink-0" />
              <p className="text-xs text-muted-foreground">
                {t('import.duplicateWarning', { count: duplicateIndices.size })}
              </p>
            </div>
          )}

          {/* Statement info */}
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">{BANK_NAMES[statement.bank]}</p>
                {statement.cardNumber && (
                  <p className="text-xs text-muted-foreground">Card: •••• {statement.cardNumber.slice(-4)}</p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {statement.statementDate && <span>Statement: {statement.statementDate}</span>}
              {statement.dueDate && <span>Due: {statement.dueDate}</span>}
              {statement.totalAmount && <span>Balance: {formatAmount(statement.totalAmount, currency)}</span>}
              {statement.creditLimit && <span>Limit: {formatAmount(statement.creditLimit, currency)}</span>}
              <span>{statement.transactions.length} transactions</span>
            </div>
          </div>

          {/* Card selection */}
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('import.assignCard')}</label>
            {cardId && (() => {
              const matched = cards.find((c) => c.id === cardId)
              return matched ? (
                <div className="mb-2 flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-2">
                  <Check className="h-4 w-4 text-success" />
                  <span className="text-xs text-success font-medium">
                    {t('import.autoMatched')}: {matched.name} ({matched.lastFourDigits})
                  </span>
                </div>
              ) : null
            })()}
            <select
              value={cardId}
              onChange={(e) => setCardId(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none"
            >
              <option value="">-- {t('common.all')} --</option>
              {cards.map((c) => (
                <option key={c.id} value={c.id}>{c.name} {c.lastFourDigits ? `(${c.lastFourDigits})` : ''}</option>
              ))}
            </select>
          </div>

          {/* Transaction list */}
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <button onClick={toggleAll} className="text-xs text-primary hover:underline">
                {selectedTx.size === statement.transactions.length ? t('import.deselectAll') : t('import.selectAll')}
              </button>
              <span className="text-xs text-muted-foreground">
                {selectedTx.size} / {statement.transactions.length} selected
                {duplicateIndices.size > 0 && (
                  <span className="text-warning"> · {duplicateIndices.size} {t('import.duplicates')}</span>
                )}
              </span>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y">
              {statement.transactions.map((tx, i) => (
                <label
                  key={i}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-accent/50 transition-colors',
                    !selectedTx.has(i) && 'opacity-40',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedTx.has(i)}
                    onChange={() => toggleTx(i)}
                    className="h-4 w-4 rounded border-input"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm truncate">{tx.description}</p>
                      {duplicateIndices.has(i) && (
                        <span className="shrink-0 rounded bg-warning/20 px-1.5 py-0.5 text-[10px] font-medium text-warning">{t('import.duplicate')}</span>
                      )}
                    </div>
                    {(() => {
                      const cat = autoDetectCategory(tx.description, [...expenseCategories, ...useCategoryStore.getState().getIncomeCategories()])
                      return cat ? (
                        <span className="text-xs text-primary">{cat.nameKey ? t(cat.nameKey) : cat.name}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">{t('category.other_expense')}</span>
                      )
                    })()}
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                  <span className={cn(
                    'text-sm font-semibold whitespace-nowrap',
                    tx.type === 'income' ? 'text-success' : '',
                  )}>
                    {tx.type === 'income' ? '+' : '-'}{formatAmount(tx.amount, currency)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => { setStep('upload'); setStatement(null); setError('') }}
              className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
            >
              {t('common.back')}
            </button>
            <button
              onClick={handleImport}
              disabled={selectedTx.size === 0 || isLoading}
              className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? t('import.importing') : `${t('import.importSelected')} (${selectedTx.size})`}
            </button>
          </div>
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-16 shadow-sm">
          <Check className="mb-4 h-12 w-12 text-success" />
          <p className="text-lg font-semibold">{t('import.success')}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {importedCount} {t('import.transactionsImported')}
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => { setStep('upload'); setStatement(null) }}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              {t('import.importAnother')}
            </button>
            <button
              onClick={() => navigate('/transactions')}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {t('import.viewTransactions')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
