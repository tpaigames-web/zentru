import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, FileText, Check, AlertCircle, ArrowLeft, ShieldCheck, Mail, CheckCircle2, AlertTriangle, FileSpreadsheet } from 'lucide-react'
import { useNavigate } from 'react-router'
import { parseStatement, extractPdfText, sanitizeForSample, type ParsedStatement, type ParsedTransaction } from '@/services/pdfParser'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { parseCSV } from '@/services/csvParser'
import { autoDetectCategory } from '@/services/autoCategory'
import { matchCardProduct } from '@/config/cardCatalog'
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

const verifiedBanks = ALL_BANKS.filter((b) => b.supportLevel === 'verified')
const partialBanks = ALL_BANKS.filter((b) => b.supportLevel === 'partial')

type ImportStep = 'upload' | 'preview' | 'done'
type ImportMode = 'pdf' | 'csv'

interface MergedTransaction extends ParsedTransaction {
  sourceFile: string
  sourceBank: string
  matchedCardId: string
}

export default function ImportPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { addTransaction, transactions: existingTransactions } = useTransactionStore()
  const { cards, addCard } = useCardStore()
  const { getExpenseCategories } = useCategoryStore()
  const currency = useSettingsStore((s) => s.currency)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const csvInputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<ImportMode>('pdf')
  const [step, setStep] = useState<ImportStep>('upload')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState('')
  const [error, setError] = useState('')
  const [statements, setStatements] = useState<ParsedStatement[]>([])
  const [mergedTx, setMergedTx] = useState<MergedTransaction[]>([])
  const [selectedTx, setSelectedTx] = useState<Set<number>>(new Set())
  const [importedCount, setImportedCount] = useState(0)
  const [duplicateIndices, setDuplicateIndices] = useState<Set<number>>(new Set())
  const [shareSample, setShareSample] = useState(false)
  const [sampleData, setSampleData] = useState<{ bank: string; cardProduct?: string; rawText: string; txCount: number }[]>([])
  const [isDragging, setIsDragging] = useState(false)

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

      const catalogMatch = result.cardProductName
        ? matchCardProduct(bankLabel, result.cardProductName)
        : undefined

      const cardName = catalogMatch?.fullName || (result.cardProductName ? `${bankLabel} ${result.cardProductName}` : `${bankLabel} Card`)
      const cardColor = catalogMatch?.cardColor || '#3b82f6'

      let cashbackRules: { categoryId: string; rate: number; monthlyCap?: number }[] | undefined
      let totalMonthlyCashbackCap: number | undefined
      if (catalogMatch?.defaultRules) {
        const allCats = useCategoryStore.getState().categories
        cashbackRules = catalogMatch.defaultRules.map((r) => {
          let catId = r.categoryKey
          if (catId !== '*') {
            const match = allCats.find((c) => c.nameKey === catId)
            catId = match?.id || '*'
          }
          return { categoryId: catId, rate: r.rate, monthlyCap: r.monthlyCap }
        })
        totalMonthlyCashbackCap = catalogMatch.defaultTotalCap
      }

      const newCard = await addCard({
        name: cardName,
        bank: bankLabel,
        lastFourDigits: last4 || '',
        creditLimit: result.creditLimit || 0,
        currentBalance: result.totalAmount || 0,
        billingDay: pdfBillingDay,
        dueDay: pdfDueDay,
        interestRate: 18,
        currency,
        color: cardColor,
        isActive: true,
        productName: result.cardProductName || undefined,
        cashbackRules,
        totalMonthlyCashbackCap,
        notes: 'Auto-created from PDF import',
      })
      return newCard.id
    }

    return ''
  }

  const processPdfFiles = async (fileList: File[]) => {
    const pdfFiles = fileList.filter((f) => f.name.toLowerCase().endsWith('.pdf'))
    if (pdfFiles.length === 0) {
      setError('Please select PDF files')
      return
    }

    setIsLoading(true)
    setError('')
    setIsDragging(false)

    try {
      const allStatements: ParsedStatement[] = []
      const allMerged: MergedTransaction[] = []
      const allSamples: { bank: string; cardProduct?: string; rawText: string; txCount: number }[] = []

      for (let fi = 0; fi < pdfFiles.length; fi++) {
        const file = pdfFiles[fi]
        setLoadingProgress(`${fi + 1} / ${pdfFiles.length}: ${file.name}`)

        // Extract raw text for optional sample submission
        const rawTextForSample = await extractPdfText(file)

        const result = await parseStatement(file)

        // Collect sample data (sanitized later if user opts in)
        allSamples.push({
          bank: result.bank,
          cardProduct: result.cardProductName,
          rawText: rawTextForSample,
          txCount: result.transactions.length,
        })

        if (result.transactions.length === 0) continue

        allStatements.push(result)
        const bankLabel = BANK_NAMES[result.bank] || result.bank

        if (result.cardSections && result.cardSections.length > 1) {
          // Multi-card PDF: match each card section independently
          for (const section of result.cardSections) {
            const sectionResult: ParsedStatement = {
              ...result,
              cardNumber: section.cardNumber,
              cardProductName: section.cardProductName,
              transactions: section.transactions,
            }
            const cardId = await matchOrCreateCard(sectionResult)

            for (const tx of section.transactions) {
              allMerged.push({
                ...tx,
                sourceFile: file.name,
                sourceBank: bankLabel,
                matchedCardId: cardId,
              })
            }
          }
        } else {
          // Single-card PDF: existing behavior
          const cardId = await matchOrCreateCard(result)

          for (const tx of result.transactions) {
            allMerged.push({
              ...tx,
              sourceFile: file.name,
              sourceBank: bankLabel,
              matchedCardId: cardId,
            })
          }
        }
      }

      setSampleData(allSamples)

      if (allMerged.length === 0) {
        setError('No transactions found in the selected PDF(s).')
        setIsLoading(false)
        return
      }

      finishParsing(allStatements, allMerged)
    } catch (err) {
      setError(`Failed to parse PDF: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }

    setIsLoading(false)
    setLoadingProgress('')
  }

  const handlePdfSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    await processPdfFiles(Array.from(files))
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      if (mode === 'pdf') {
        await processPdfFiles(files)
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleCsvSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsLoading(true)
    setError('')

    try {
      const allMerged: MergedTransaction[] = []

      for (const file of Array.from(files)) {
        const text = await file.text()
        const txs = parseCSV(text)
        for (const tx of txs) {
          allMerged.push({
            ...tx,
            sourceFile: file.name,
            sourceBank: 'CSV',
            matchedCardId: '',
          })
        }
      }

      if (allMerged.length === 0) {
        setError('No transactions found. CSV must have columns: date, description, amount.')
        setIsLoading(false)
        return
      }

      finishParsing([], allMerged)
    } catch (err) {
      setError(`Failed to parse CSV: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }

    setIsLoading(false)
  }

  const finishParsing = (stmts: ParsedStatement[], allMerged: MergedTransaction[]) => {
    setStatements(stmts)
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

      const importSource = mode === 'csv' ? 'csv' as const : 'pdf' as const

      await addTransaction({
        type: tx.type,
        amount: tx.amount,
        currency,
        categoryId,
        accountId: '',
        cardId: tx.matchedCardId || undefined,
        date: new Date(tx.date).getTime() || Date.now(),
        merchant: tx.description,
        notes: mode === 'csv' ? `Imported from CSV` : `Imported from ${tx.sourceBank} PDF`,
        cashbackAmount,
        cashbackRate,
        isConfirmed: false,
        importSource,
      })
      count++
    }

    // Submit anonymized samples if user opted in
    if (shareSample && isSupabaseConfigured && sampleData.length > 0) {
      try {
        for (const sample of sampleData) {
          const sanitized = sanitizeForSample(sample.rawText)
          await supabase.from('statement_samples').insert({
            bank: sample.bank,
            card_product: sample.cardProduct || null,
            transaction_count: sample.txCount,
            parse_success: sample.txCount > 0,
            sample_text: sanitized,
          })
        }
      } catch (e) {
        console.warn('Sample submission failed (non-critical):', e)
      }
      // Clear raw text from memory
      setSampleData([])
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

      {/* Tab switcher */}
      {step === 'upload' && (
        <div className="flex rounded-lg bg-muted p-1">
          <button
            onClick={() => { setMode('pdf'); setError('') }}
            className={cn('flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors', mode === 'pdf' ? 'bg-background shadow-sm' : 'text-muted-foreground')}
          >
            <FileText className="h-3.5 w-3.5" />
            {t('import.tabPdf')}
          </button>
          <button
            onClick={() => { setMode('csv'); setError('') }}
            className={cn('flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors', mode === 'csv' ? 'bg-background shadow-sm' : 'text-muted-foreground')}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            {t('import.tabCsv')}
          </button>
        </div>
      )}

      {/* Step: Upload — PDF */}
      {step === 'upload' && mode === 'pdf' && (
        <div className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card py-12 transition-colors',
              isDragging
                ? 'border-primary bg-primary/10 scale-[1.02]'
                : 'hover:border-primary/50 hover:bg-accent/30'
            )}
          >
            <Upload className={cn('mb-3 h-10 w-10 transition-colors', isDragging ? 'text-primary' : 'text-primary/40')} />
            <p className="text-sm font-medium">
              {isDragging
                ? (i18n.language.startsWith('zh') ? '松开以导入' : 'Drop to import')
                : t('import.selectPdf')
              }
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isDragging
                ? ''
                : (i18n.language.startsWith('zh') ? '点击选择或拖拽 PDF 文件到这里' : 'Click to select or drag PDF files here')
              }
            </p>
          </div>

          {/* Bank support levels */}
          <div className="rounded-xl border bg-card p-4 shadow-sm space-y-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
              <span className="text-xs">
                <span className="font-medium text-success">{t('import.bankVerified')}:</span>{' '}
                <span className="text-muted-foreground">{verifiedBanks.map((b) => b.name).join(', ')}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />
              <span className="text-xs">
                <span className="font-medium text-warning">{t('import.bankPartial')}:</span>{' '}
                <span className="text-muted-foreground">{partialBanks.map((b) => b.name).join(', ')}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">{t('import.bankOther')}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-success/20 bg-success/5 px-4 py-3">
            <ShieldCheck className="h-5 w-5 text-success shrink-0" />
            <p className="text-xs text-muted-foreground">{t('import.privacyShort')}</p>
          </div>

          <input ref={fileInputRef} type="file" accept=".pdf" multiple className="hidden" onChange={handlePdfSelect} />

          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-2 py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm">{loadingProgress || t('import.parsing')}</span>
            </div>
          )}

          {error && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
              {/* Feedback entry on parse failure */}
              <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
                <div>
                  <p className="text-xs font-medium">{t('import.feedbackTitle')}</p>
                </div>
                <a
                  href={`mailto:tpaigames@gmail.com?subject=${encodeURIComponent('Zentru PDF Import Feedback')}&body=${encodeURIComponent('Bank name: \nPDF parsed 0 transactions.\n\n(No transaction data is included in this feedback)')}`}
                  className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
                >
                  <Mail className="h-3 w-3" />
                  {t('import.feedbackButton')}
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step: Upload — CSV */}
      {step === 'upload' && mode === 'csv' && (
        <div className="space-y-4">
          <div
            onClick={() => csvInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card py-12 hover:border-primary/50 hover:bg-accent/30 transition-colors"
          >
            <FileSpreadsheet className="mb-3 h-10 w-10 text-primary/40" />
            <p className="text-sm font-medium">{t('import.selectCsv')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('import.csvHint')}</p>
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium mb-2">CSV Format</p>
            <div className="rounded-lg bg-muted/50 px-3 py-2 font-mono text-[10px] text-muted-foreground">
              <p>Date, Description, Amount</p>
              <p>01/03/2026, GRAB FOOD, 25.90</p>
              <p>02/03/2026, SHOPEE PAY, 150.00</p>
              <p>05/03/2026, SALARY, -5000.00</p>
            </div>
          </div>

          <input ref={csvInputRef} type="file" accept=".csv,.tsv,.txt" multiple className="hidden" onChange={handleCsvSelect} />

          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-2 py-4">
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
              <p className="text-sm font-semibold">
                {mode === 'csv' ? 'CSV' : `${fileCount} ${fileCount === 1 ? 'file' : 'files'}`} · {mergedTx.length} transactions
              </p>
            </div>
            {statements.length > 0 && (
              <div className="space-y-1.5">
                {statements.map((stmt, si) => {
                  if (stmt.cardSections && stmt.cardSections.length > 1) {
                    // Multi-card PDF: show each card separately
                    return stmt.cardSections.map((section, ci) => (
                      <div key={`${si}-${ci}`} className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {BANK_NAMES[stmt.bank]} {section.cardNumber ? `(${section.cardNumber.slice(-4)})` : ''}
                          {section.cardProductName && <span className="ml-1 text-primary/60">{section.cardProductName}</span>}
                        </span>
                        <span>{section.transactions.length} tx</span>
                      </div>
                    ))
                  }
                  // Single-card PDF
                  const stmtTxCount = mergedTx.filter((tx) => tx.sourceBank === (BANK_NAMES[stmt.bank] || stmt.bank)).length
                  return (
                    <div key={si} className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{BANK_NAMES[stmt.bank]} {stmt.cardNumber ? `(${stmt.cardNumber.slice(-4)})` : ''}</span>
                      <span>{stmtTxCount} tx · {stmt.statementDate || ''}</span>
                    </div>
                  )
                })}
              </div>
            )}
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
                      {tx.sourceBank !== 'CSV' && <span className="text-primary/60">· {tx.sourceBank}</span>}
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

          {/* Sample sharing opt-in */}
          {mode === 'pdf' && isSupabaseConfigured && sampleData.length > 0 && (
            <label className="flex items-start gap-3 rounded-xl border bg-card px-4 py-3 cursor-pointer hover:bg-accent/30 transition-colors">
              <input
                type="checkbox"
                checked={shareSample}
                onChange={(e) => setShareSample(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-input"
              />
              <div className="flex-1">
                <p className="text-xs font-medium">
                  {t('import.shareSampleTitle', { defaultValue: '帮助改善解析准确率（可选）' })}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {t('import.shareSampleDesc', { defaultValue: '匿名提交账单格式样本。所有金额、卡号、姓名等个人信息已自动脱敏，仅用于优化 PDF 解析。' })}
                </p>
              </div>
            </label>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setStep('upload'); setStatements([]); setMergedTx([]); setError(''); setSampleData([]) }}
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
