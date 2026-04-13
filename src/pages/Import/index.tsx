import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, FileText, Check, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router'
import { parseStatement, type ParsedStatement, type ParsedTransaction } from '@/services/pdfParser'
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

interface MergedTransaction extends ParsedTransaction {
  sourceFile: string
  sourceBank: string
  matchedCardId: string
}

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
  const [loadingProgress, setLoadingProgress] = useState('')
  const [error, setError] = useState('')
  const [statements, setStatements] = useState<ParsedStatement[]>([])
  const [mergedTx, setMergedTx] = useState<MergedTransaction[]>([])
  const [selectedTx, setSelectedTx] = useState<Set<number>>(new Set())
  const [importedCount, setImportedCount] = useState(0)
  const [duplicateIndices, setDuplicateIndices] = useState<Set<number>>(new Set())

  const expenseCategories = getExpenseCategories()
  const defaultCategoryId = expenseCategories[expenseCategories.length - 1]?.id || ''

  // Match or create a card for a parsed statement
  const matchOrCreateCard = async (result: ParsedStatement): Promise<string> => {
    const last4 = result.cardNumber?.slice(-4)
    const bankName = BANK_NAMES[result.bank]?.toLowerCase()

    let matched = last4 && bankName
      ? cards.find((c) => c.lastFourDigits === last4 && c.bank.toLowerCase().includes(bankName))
      : undefined

    if (!matched && last4) {
      matched = cards.find((c) => c.lastFourDigits === last4)
    }

    if (!matched && bankName) {
      const bankCards = cards.filter((c) => c.bank.toLowerCase().includes(bankName))
      if (bankCards.length === 1) matched = bankCards[0]
    }

    if (matched) return matched.id

    if (last4 || bankName) {
      const bankLabel = BANK_NAMES[result.bank] || result.bank
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
      return newCard.id
    }

    return ''
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const pdfFiles = Array.from(files).filter((f) => f.name.toLowerCase().endsWith('.pdf'))
    if (pdfFiles.length === 0) {
      setError('Please select PDF files')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const allStatements: ParsedStatement[] = []
      const allMerged: MergedTransaction[] = []

      for (let fi = 0; fi < pdfFiles.length; fi++) {
        const file = pdfFiles[fi]
        setLoadingProgress(`${fi + 1} / ${pdfFiles.length}: ${file.name}`)

        const result = await parseStatement(file)
        if (result.transactions.length === 0) continue

        allStatements.push(result)
        const cardId = await matchOrCreateCard(result)

        for (const tx of result.transactions) {
          allMerged.push({
            ...tx,
            sourceFile: file.name,
            sourceBank: BANK_NAMES[result.bank] || result.bank,
            matchedCardId: cardId,
          })
        }
      }

      if (allMerged.length === 0) {
        setError('No transactions found in the selected PDF(s).')
        setIsLoading(false)
        return
      }

      setStatements(allStatements)
      setMergedTx(allMerged)

      // Duplicate check
      const dupes = new Set<number>()
      for (let i = 0; i < allMerged.length; i++) {
        const tx = allMerged[i]
        const txDate = new Date(tx.date).getTime()
        const isDuplicate = existingTransactions.some((existing) => {
          const sameAmount = Math.abs(existing.amount - tx.amount) < 0.01
          const sameDate = Math.abs(existing.date - txDate) < 86400000
          const sameMerchant = existing.merchant && tx.description &&
            existing.merchant.toLowerCase().includes(tx.description.toLowerCase().substring(0, 10))
          return sameAmount && sameDate && sameMerchant
        })
        if (isDuplicate) dupes.add(i)
      }
      setDuplicateIndices(dupes)

      const nonDupes = new Set(allMerged.map((_, i) => i).filter((i) => !dupes.has(i)))
      setSelectedTx(nonDupes)

      setStep('preview')
    } catch (err) {
      setError(`Failed to parse PDF: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }

    setIsLoading(false)
    setLoadingProgress('')
  }

  const toggleTx = (index: number) => {
    const next = new Set(selectedTx)
    if (next.has(index)) next.delete(index)
    else next.add(index)
    setSelectedTx(next)
  }

  const toggleAll = () => {
    if (selectedTx.size === mergedTx.length) {
      setSelectedTx(new Set())
    } else {
      setSelectedTx(new Set(mergedTx.map((_, i) => i)))
    }
  }

  const handleImport = async () => {
    if (mergedTx.length === 0) return
    setIsLoading(true)

    const allCategories = [...expenseCategories, ...useCategoryStore.getState().getIncomeCategories()]

    let count = 0
    for (const [i, tx] of mergedTx.entries()) {
      if (!selectedTx.has(i)) continue

      const detectedCat = autoDetectCategory(tx.description, allCategories)
      const categoryId = detectedCat?.id || defaultCategoryId
      const matchedCard = tx.matchedCardId ? cards.find((c) => c.id === tx.matchedCardId) : undefined

      let cashbackAmount: number | undefined
      let cashbackRate: number | undefined
      if (tx.type === 'expense' && matchedCard?.cashbackRules?.length) {
        const result = calculateCashback(
          { type: 'expense', amount: tx.amount, categoryId, cardId: tx.matchedCardId } as Parameters<typeof calculateCashback>[0],
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
        cardId: tx.matchedCardId || undefined,
        date: new Date(tx.date).getTime() || Date.now(),
        merchant: tx.description,
        notes: `Imported from ${tx.sourceBank} PDF`,
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

  const fileCount = statements.length

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
            <p className="mt-1 text-xs text-muted-foreground">{t('import.batchSupport')}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{t('import.supportedBanks')}: {ALL_BANKS.length}+</p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-success/20 bg-success/5 px-4 py-3">
            <ShieldCheck className="h-5 w-5 text-success shrink-0" />
            <p className="text-xs text-muted-foreground">{t('import.privacyShort')}</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />

          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-2 py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm">{loadingProgress || t('import.parsing')}</span>
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
      {step === 'preview' && mergedTx.length > 0 && (
        <div className="space-y-4">
          {duplicateIndices.size > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-warning shrink-0" />
              <p className="text-xs text-muted-foreground">
                {t('import.duplicateWarning', { count: duplicateIndices.size })}
              </p>
            </div>
          )}

          {/* Files summary */}
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5 text-primary" />
              <p className="text-sm font-semibold">{fileCount} {fileCount === 1 ? 'file' : 'files'} · {mergedTx.length} transactions</p>
            </div>
            <div className="space-y-1.5">
              {statements.map((stmt, i) => {
                const stmtTxCount = mergedTx.filter((tx) => tx.sourceBank === (BANK_NAMES[stmt.bank] || stmt.bank)).length
                return (
                  <div key={i} className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{BANK_NAMES[stmt.bank]} {stmt.cardNumber ? `(${stmt.cardNumber.slice(-4)})` : ''}</span>
                    <span>{stmtTxCount} tx · {stmt.statementDate || ''}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Transaction list */}
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <button onClick={toggleAll} className="text-xs text-primary hover:underline">
                {selectedTx.size === mergedTx.length ? t('import.deselectAll') : t('import.selectAll')}
              </button>
              <span className="text-xs text-muted-foreground">
                {selectedTx.size} / {mergedTx.length}
                {duplicateIndices.size > 0 && (
                  <span className="text-warning"> · {duplicateIndices.size} {t('import.duplicates')}</span>
                )}
              </span>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y">
              {mergedTx.map((tx, i) => (
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
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{tx.date}</span>
                      {fileCount > 1 && <span className="text-primary/60">· {tx.sourceBank}</span>}
                    </div>
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

          <div className="flex gap-3">
            <button
              onClick={() => { setStep('upload'); setStatements([]); setMergedTx([]); setError('') }}
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
            {fileCount > 1 && ` (${fileCount} files)`}
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => { setStep('upload'); setStatements([]); setMergedTx([]) }}
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
