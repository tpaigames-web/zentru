import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, FileText, Check, AlertCircle, ArrowLeft, ShieldCheck, Mail, CheckCircle2, AlertTriangle, FileSpreadsheet, Image as ImageIcon, Camera, X } from 'lucide-react'
import { useNavigate } from 'react-router'
import { parseStatement, extractPdfText, sanitizeForSample, type ParsedStatement, type ParsedTransaction } from '@/services/pdfParser'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { parseCSV } from '@/services/csvParser'
import { autoDetectCategory } from '@/services/autoCategory'
import { matchCardProduct } from '@/config/cardCatalog'
import { calculateCashback } from '@/services/cashback'
import { scanReceiptFromFile, type ScannedReceiptData } from '@/services/receiptScanner'
import { scanReceiptWithAI, AIQuotaExceededError } from '@/services/aiReceiptScanner'
import { useAiScanQuota } from '@/hooks/useAiScanQuota'
import { usePremium } from '@/hooks/usePremium'
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
type ImportMode = 'pdf' | 'csv' | 'image'

interface PendingReceipt {
  file: File
  preview: string
  scan?: ScannedReceiptData
  amount: string
  merchant: string
  date: string
  categoryId: string
  cardId: string
  notes: string
  status: 'scanning' | 'ready' | 'error'
  error?: string
}

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
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<ImportMode>('pdf')
  const [receipts, setReceipts] = useState<PendingReceipt[]>([])
  /** OCR engine for receipt tab: 'local' (Tesseract, free) | 'ai' (Gemini, quota) */
  const [ocrEngine, setOcrEngine] = useState<'local' | 'ai'>('local')
  const aiQuota = useAiScanQuota()
  const { isPremium } = usePremium()
  /** Full-size lightbox viewer for clicked receipt thumbnails */
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)
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

  const pendingFilesRef = useRef<File[]>([])

  const processPdfFiles = async (fileList: File[], password?: string) => {
    const pdfFiles = fileList.filter((f) => f.name.toLowerCase().endsWith('.pdf'))
    if (pdfFiles.length === 0) {
      setError('Please select PDF files')
      return
    }
    // Store files for potential password retry
    pendingFilesRef.current = pdfFiles

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
        const rawTextForSample = await extractPdfText(file, password)

        const result = await parseStatement(file, password)

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
      const msg = err instanceof Error ? err.message : String(err)
      if (/password|PasswordException|No password given|Incorrect Password/i.test(msg)) {
        setIsLoading(false)
        setLoadingProgress('')
        // PDF is password-protected — prompt user
        const zh = i18n.language.startsWith('zh')
        const pwd = prompt(zh
          ? 'PDF 需要密码（通常是手机号或身份证号）：'
          : 'PDF is password-protected. Enter password (usually phone number or IC):')
        if (pwd) {
          return processPdfFiles(pendingFilesRef.current, pwd)
        }
        setError(zh ? 'PDF 需要密码才能打开' : 'PDF requires a password to open')
        return
      } else {
        setError(`Failed to parse PDF: ${msg}`)
      }
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

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    // Snapshot files immediately — input reset later would lose them
    const fileList = Array.from(files)
    e.target.value = '' // reset so same file can be re-selected

    const allCategories = [...expenseCategories, ...useCategoryStore.getState().getIncomeCategories()]
    const fallbackCatId = defaultCategoryId

    // Add placeholders for each file
    const newReceipts: PendingReceipt[] = []
    for (const file of fileList) {
      const preview = URL.createObjectURL(file)
      newReceipts.push({
        file,
        preview,
        amount: '',
        merchant: '',
        date: new Date().toISOString().slice(0, 10),
        categoryId: fallbackCatId,
        cardId: '',
        notes: '',
        status: 'scanning',
      })
    }
    setReceipts((prev) => [...prev, ...newReceipts])

    // Track whether we've fallen back to local for this batch
    // (avoid re-trying AI once the user's quota is exhausted mid-batch)
    let aiExhausted = ocrEngine !== 'ai'

    // Scan each one (sequential to keep memory OK and quota accurate)
    for (let i = 0; i < newReceipts.length; i++) {
      const rec = newReceipts[i]
      try {
        let scan: ScannedReceiptData
        let usedEngine: 'local' | 'ai' = 'local'

        if (ocrEngine === 'ai' && !aiExhausted) {
          try {
            const aiResult = await scanReceiptWithAI(rec.file)
            scan = aiResult
            usedEngine = 'ai'
            // refresh the displayed quota counter
            aiQuota.refresh()
          } catch (aiErr) {
            if (aiErr instanceof AIQuotaExceededError) {
              // Fall back silently to Tesseract for remaining receipts
              aiExhausted = true
              console.warn('AI quota exceeded, falling back to local OCR')
              scan = await scanReceiptFromFile(rec.file)
            } else {
              // Any other AI error: try local once, else surface error
              console.warn('AI scan failed, falling back to local:', aiErr)
              scan = await scanReceiptFromFile(rec.file)
            }
          }
        } else {
          scan = await scanReceiptFromFile(rec.file)
        }

        // Resolve amount: prefer totalAmount; if missing, sum line items
        let resolvedAmount = scan.totalAmount
        let amountFromItems = false
        if (!resolvedAmount && Array.isArray(scan.items) && scan.items.length > 0) {
          const sum = scan.items.reduce((s, it) => s + (Number(it.amount) || 0), 0)
          if (sum > 0) {
            resolvedAmount = Math.round(sum * 100) / 100
            amountFromItems = true
          }
        }

        const detected = scan.merchant ? autoDetectCategory(scan.merchant, allCategories) : null
        setReceipts((prev) =>
          prev.map((r) =>
            r.file === rec.file
              ? {
                  ...r,
                  scan,
                  amount: resolvedAmount ? resolvedAmount.toFixed(2) : '',
                  merchant: scan.merchant || '',
                  date: scan.date || r.date,
                  categoryId: detected?.id || fallbackCatId,
                  notes: [
                    scan.invoiceNo ? `Invoice: ${scan.invoiceNo}` : '',
                    usedEngine === 'ai' ? '🤖 AI' : '',
                    amountFromItems ? (i18n.language.startsWith('zh') ? '金额=明细合计' : 'Σ items') : '',
                  ].filter(Boolean).join(' · '),
                  status: 'ready',
                }
              : r
          )
        )
      } catch (err) {
        setReceipts((prev) =>
          prev.map((r) =>
            r.file === rec.file
              ? { ...r, status: 'error', error: err instanceof Error ? err.message : 'OCR failed' }
              : r
          )
        )
      }
    }

    // If user intended AI but quota ran out during the batch, let them know once
    if (ocrEngine === 'ai' && aiExhausted && !isPremium) {
      // Non-blocking toast-style alert (simple for now)
      setTimeout(() => {
        alert(
          i18n.language.startsWith('zh')
            ? 'AI 识别额度已用尽，剩余收据已用本地识别。升级 Premium 可获每月 100 次。'
            : 'AI scan quota exhausted. Remaining receipts used local OCR. Upgrade to Premium for 100/month.',
        )
      }, 100)
    }
  }

  const updateReceipt = (idx: number, patch: Partial<PendingReceipt>) => {
    setReceipts((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  const removeReceipt = (idx: number) => {
    setReceipts((prev) => {
      const target = prev[idx]
      if (target) URL.revokeObjectURL(target.preview)
      return prev.filter((_, i) => i !== idx)
    })
  }

  const handleImageImport = async () => {
    const ready = receipts.filter((r) => r.status === 'ready' && parseFloat(r.amount) > 0)
    if (ready.length === 0) {
      setError(i18n.language.startsWith('zh') ? '没有可导入的收据' : 'No receipts ready to import')
      return
    }
    setIsLoading(true)
    let count = 0
    for (const rec of ready) {
      const amt = parseFloat(rec.amount)
      if (!amt || amt <= 0) continue
      const card = rec.cardId ? cards.find((c) => c.id === rec.cardId) : undefined
      let cashbackAmount: number | undefined
      let cashbackRate: number | undefined
      if (card?.cashbackRules?.length) {
        const cb = calculateCashback(
          { type: 'expense', amount: amt, categoryId: rec.categoryId, cardId: card.id } as Parameters<typeof calculateCashback>[0],
          card,
          new Map(),
          0,
        )
        if (cb.amount > 0) {
          cashbackAmount = cb.amount
          cashbackRate = cb.rate
        }
      }
      await addTransaction({
        type: 'expense',
        amount: amt,
        currency,
        categoryId: rec.categoryId,
        accountId: '',
        cardId: rec.cardId || undefined,
        date: new Date(rec.date).getTime(),
        merchant: rec.merchant || undefined,
        notes: rec.notes || `Scanned receipt: ${rec.file.name}`,
        cashbackAmount,
        cashbackRate,
        isConfirmed: true,
        importSource: 'manual',
      })
      count++
    }
    // Cleanup preview URLs
    receipts.forEach((r) => URL.revokeObjectURL(r.preview))
    setReceipts([])
    setImportedCount(count)
    setStep('done')
    setIsLoading(false)
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
      const { useUserStore } = await import('@/stores/useUserStore')
      const userId = useUserStore.getState().user?.id
      let totalDaysEarned = 0

      try {
        for (const sample of sampleData) {
          const sanitized = sanitizeForSample(sample.rawText)

          // Compute content hash for dedup (first 500 chars are enough)
          const encoder = new TextEncoder()
          const hashBuffer = await crypto.subtle.digest(
            'SHA-256',
            encoder.encode(sanitized.substring(0, 500))
          )
          const hashHex = Array.from(new Uint8Array(hashBuffer))
            .map((b) => b.toString(16).padStart(2, '0')).join('').substring(0, 16)

          const { data: inserted } = await supabase.from('statement_samples').insert({
            user_id: userId || null,
            bank: sample.bank,
            card_product: sample.cardProduct || null,
            transaction_count: sample.txCount,
            parse_success: sample.txCount > 0,
            sample_text: sanitized,
            content_hash: hashHex,
            reward_days: sample.txCount > 0 ? 7 : 30, // Parse failure = likely new bank = +30 days
          }).select('reward_days').single()

          if (inserted) totalDaysEarned += inserted.reward_days || 0
        }

        // Show reward message if user earned something
        if (userId && totalDaysEarned > 0) {
          // Refresh profile to pull new trial_ends_at
          await useUserStore.getState().refreshProfile()
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
          <button
            onClick={() => { setMode('image'); setError('') }}
            className={cn('flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors', mode === 'image' ? 'bg-background shadow-sm' : 'text-muted-foreground')}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            {i18n.language.startsWith('zh') ? '收据图片' : 'Receipt'}
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

      {/* Step: Upload — Image/Receipt OCR */}
      {step === 'upload' && mode === 'image' && (
        <div className="space-y-4">
          {/* OCR engine toggle */}
          <div className="rounded-xl border bg-card p-3 shadow-sm">
            <p className="text-[11px] font-semibold uppercase text-muted-foreground mb-2">
              {i18n.language.startsWith('zh') ? '识别引擎' : 'Recognition Engine'}
            </p>
            <div className="flex rounded-lg bg-muted p-0.5">
              <button
                onClick={() => setOcrEngine('local')}
                className={cn(
                  'flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors',
                  ocrEngine === 'local' ? 'bg-background shadow-sm' : 'text-muted-foreground'
                )}
              >
                📱 {i18n.language.startsWith('zh') ? '本地识别 · 免费' : 'Local · Free'}
              </button>
              <button
                onClick={() => setOcrEngine('ai')}
                disabled={!aiQuota.canUse && !isPremium}
                className={cn(
                  'flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
                  ocrEngine === 'ai' ? 'bg-background shadow-sm' : 'text-muted-foreground'
                )}
              >
                🤖 {i18n.language.startsWith('zh') ? 'AI 精准' : 'AI Precise'}
                {!aiQuota.loading && (
                  <span className="ml-1 text-[10px] opacity-70">
                    {isPremium && aiQuota.limit >= 99999
                      ? '∞'
                      : `${aiQuota.remaining}/${aiQuota.limit || '—'}`}
                  </span>
                )}
              </button>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              {ocrEngine === 'local'
                ? (i18n.language.startsWith('zh')
                    ? '设备本地 OCR · 图片不上传 · 速度较慢'
                    : 'On-device OCR · image stays local · slower')
                : (i18n.language.startsWith('zh')
                    ? `云端 AI 识别 · 准确度更高 · ${isPremium ? 'Premium 每月 100 次' : `本月剩余 ${aiQuota.remaining}/${aiQuota.limit}`}`
                    : `Cloud AI · more accurate · ${isPremium ? 'Premium 100/mo' : `${aiQuota.remaining}/${aiQuota.limit} left this month`}`)}
            </p>
            {!isPremium && aiQuota.limit > 0 && aiQuota.remaining === 0 && (
              <p className="mt-1.5 text-[10px] text-warning">
                {i18n.language.startsWith('zh')
                  ? '⚡ AI 额度已用尽 · 升级 Premium 获每月 100 次'
                  : '⚡ AI quota exhausted · Upgrade to Premium for 100/month'}
              </p>
            )}
          </div>

          <div
            onClick={() => imageInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card py-10 hover:border-primary/50 hover:bg-accent/30 transition-colors"
          >
            <Camera className="mb-3 h-10 w-10 text-primary/40" />
            <p className="text-sm font-medium">
              {i18n.language.startsWith('zh') ? '上传收据照片' : 'Upload receipt photo'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground text-center px-4">
              {i18n.language.startsWith('zh')
                ? '支持多张 · 自动识别金额/商家/日期（需手动确认）'
                : 'Multiple allowed · Auto-detect amount/merchant/date (confirm manually)'}
            </p>
          </div>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageSelect}
          />

          {receipts.length > 0 && (
            <div className="space-y-3">
              {receipts.map((rec, idx) => (
                <div key={idx} className="rounded-xl border bg-card p-3 shadow-sm">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setZoomedImage(rec.preview)}
                      title={i18n.language.startsWith('zh') ? '点击放大查看' : 'Click to zoom'}
                      className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border group active:scale-95 transition-transform"
                    >
                      <img
                        src={rec.preview}
                        alt="receipt"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
                        <span className="text-white text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          🔍 {i18n.language.startsWith('zh') ? '放大' : 'Zoom'}
                        </span>
                      </div>
                    </button>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-medium truncate">{rec.file.name}</p>
                        <button
                          onClick={() => removeReceipt(idx)}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {rec.status === 'scanning' && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          <span>{i18n.language.startsWith('zh') ? '正在识别...' : 'Scanning...'}</span>
                        </div>
                      )}
                      {rec.status === 'error' && (
                        <p className="text-xs text-destructive">{rec.error}</p>
                      )}
                      {rec.status === 'ready' && (
                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <label className="text-[10px] text-muted-foreground">
                              {i18n.language.startsWith('zh') ? '金额' : 'Amount'}
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={rec.amount}
                              onChange={(e) => updateReceipt(idx, { amount: e.target.value })}
                              className="w-full rounded-md border bg-background px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-primary/50"
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">
                              {i18n.language.startsWith('zh') ? '日期' : 'Date'}
                            </label>
                            <input
                              type="date"
                              value={rec.date}
                              onChange={(e) => updateReceipt(idx, { date: e.target.value })}
                              className="w-full rounded-md border bg-background px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-primary/50"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-[10px] text-muted-foreground">
                              {i18n.language.startsWith('zh') ? '商家' : 'Merchant'}
                            </label>
                            <input
                              type="text"
                              value={rec.merchant}
                              onChange={(e) => updateReceipt(idx, { merchant: e.target.value })}
                              className="w-full rounded-md border bg-background px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-primary/50"
                              placeholder={i18n.language.startsWith('zh') ? '商家名称' : 'Merchant name'}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">
                              {i18n.language.startsWith('zh') ? '类别' : 'Category'}
                            </label>
                            <select
                              value={rec.categoryId}
                              onChange={(e) => updateReceipt(idx, { categoryId: e.target.value })}
                              className="w-full rounded-md border bg-background px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-primary/50"
                            >
                              {expenseCategories.filter((c) => c.isActive).map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.nameKey ? t(c.nameKey, { defaultValue: c.name }) : c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">
                              {i18n.language.startsWith('zh') ? '卡（可选）' : 'Card (optional)'}
                            </label>
                            <select
                              value={rec.cardId}
                              onChange={(e) => updateReceipt(idx, { cardId: e.target.value })}
                              className="w-full rounded-md border bg-background px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-primary/50"
                            >
                              <option value="">
                                {i18n.language.startsWith('zh') ? '无' : 'None'}
                              </option>
                              {cards.filter((c) => c.isActive).map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={handleImageImport}
                disabled={
                  isLoading ||
                  !receipts.some((r) => r.status === 'ready' && parseFloat(r.amount) > 0)
                }
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50 active:scale-95 transition-transform"
              >
                {isLoading
                  ? (i18n.language.startsWith('zh') ? '导入中...' : 'Importing...')
                  : (i18n.language.startsWith('zh')
                      ? `导入 ${receipts.filter((r) => r.status === 'ready' && parseFloat(r.amount) > 0).length} 条`
                      : `Import ${receipts.filter((r) => r.status === 'ready' && parseFloat(r.amount) > 0).length}`)}
              </button>
            </div>
          )}

          <div className="flex items-center gap-3 rounded-xl border border-success/20 bg-success/5 px-4 py-3">
            <ShieldCheck className="h-5 w-5 text-success shrink-0" />
            <p className="text-xs text-muted-foreground">
              {i18n.language.startsWith('zh')
                ? 'OCR 识别在设备本地运行，图片不会上传到服务器'
                : 'OCR runs entirely on-device. Images never leave your phone.'}
            </p>
          </div>

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
                  {i18n.language.startsWith('zh')
                    ? '🎁 帮助改善解析 · 延长免费试用（可选）'
                    : '🎁 Help improve parsing · Extend trial (optional)'}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {i18n.language.startsWith('zh')
                    ? '匿名提交已脱敏的账单格式样本，每份延长免费试用 +7 天（解析失败的新银行格式 +30 天）'
                    : 'Submit anonymized statement format. +7 days trial extension per sample (+30 days for new banks)'}
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

      {/* Receipt image lightbox (zoom viewer) */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4 cursor-zoom-out animate-in fade-in"
          onClick={() => setZoomedImage(null)}
        >
          <img
            src={zoomedImage}
            alt="receipt full"
            className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setZoomedImage(null)}
            className="absolute top-4 right-4 rounded-full bg-white/10 backdrop-blur-sm p-2 text-white hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <p className="absolute bottom-4 left-0 right-0 text-center text-xs text-white/60">
            {i18n.language.startsWith('zh') ? '点击空白处关闭' : 'Click anywhere to close'}
          </p>
        </div>
      )}
    </div>
  )
}
