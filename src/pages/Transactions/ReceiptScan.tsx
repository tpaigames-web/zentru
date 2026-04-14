import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, Upload, X, Loader2, CheckCircle2, Receipt, FileText } from 'lucide-react'
import { captureReceiptImage, scanReceiptImage, scanReceiptFromFile, scanReceiptFromPdf, type ScannedReceiptData } from '@/services/receiptScanner'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { formatAmount } from '@/lib/currency'

interface ReceiptScanProps {
  onResult: (data: ScannedReceiptData) => void
  onClose: () => void
}

export function ReceiptScan({ onResult, onClose }: ReceiptScanProps) {
  const { t } = useTranslation()
  const currency = useSettingsStore((s) => s.currency)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ScannedReceiptData | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editMerchant, setEditMerchant] = useState('')
  const [editDate, setEditDate] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)

  const handleCapture = async (source: 'camera' | 'gallery') => {
    setIsScanning(true)
    setError('')
    try {
      const imageData = await captureReceiptImage(source)
      const data = await scanReceiptImage(imageData)
      setResult(data)
      setEditAmount(data.totalAmount?.toFixed(2) || '')
      setEditMerchant(data.merchant || '')
      setEditDate(data.date || new Date().toISOString().split('T')[0])
    } catch {
      if (source === 'camera') {
        setError(t('receipt.cameraFallback'))
        fileInputRef.current?.click()
      } else {
        setError(t('receipt.scanFailed'))
      }
    }
    setIsScanning(false)
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsScanning(true)
    setError('')
    try {
      const data = await scanReceiptFromFile(file)
      setResult(data)
      setEditAmount(data.totalAmount?.toFixed(2) || '')
      setEditMerchant(data.merchant || '')
      setEditDate(data.date || new Date().toISOString().split('T')[0])
    } catch {
      setError(t('receipt.scanFailed'))
    }
    setIsScanning(false)
  }

  const handlePdfInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsScanning(true)
    setError('')
    try {
      const data = await scanReceiptFromPdf(file)
      setResult(data)
      setEditAmount(data.totalAmount?.toFixed(2) || '')
      setEditMerchant(data.merchant || '')
      setEditDate(data.date || new Date().toISOString().split('T')[0])
    } catch {
      setError(t('receipt.scanFailed'))
    }
    setIsScanning(false)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 md:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-2xl bg-card p-6 pb-20 shadow-xl md:rounded-2xl md:pb-6 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('receipt.title')}</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!result ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t('receipt.instruction')}</p>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleCapture('camera')}
                disabled={isScanning}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-4 hover:border-primary/50 hover:bg-accent/30 transition-colors disabled:opacity-50"
              >
                <Camera className="h-7 w-7 text-primary" />
                <span className="text-xs font-medium">{t('receipt.camera')}</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-4 hover:border-primary/50 hover:bg-accent/30 transition-colors disabled:opacity-50"
              >
                <Upload className="h-7 w-7 text-muted-foreground" />
                <span className="text-xs font-medium">{t('receipt.gallery')}</span>
              </button>
              <button
                onClick={() => pdfInputRef.current?.click()}
                disabled={isScanning}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-4 hover:border-primary/50 hover:bg-accent/30 transition-colors disabled:opacity-50"
              >
                <FileText className="h-7 w-7 text-destructive/70" />
                <span className="text-xs font-medium">PDF</span>
              </button>
            </div>

            <p className="text-[10px] text-muted-foreground text-center">{t('receipt.pdfHint')}</p>

            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileInput} />
            <input ref={pdfInputRef} type="file" accept=".pdf" className="hidden" onChange={handlePdfInput} />

            {isScanning && (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm">{t('receipt.scanning')}</span>
              </div>
            )}
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">{t('receipt.detected')}</span>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              {/* Editable amount */}
              <div>
                <label className="text-xs text-muted-foreground block mb-1">{t('transactions.amount')} ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  value={editAmount === '0.00' || editAmount === '0' ? '' : editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-lg font-bold outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder={t('receipt.enterAmount')}
                  autoFocus={!editAmount || editAmount === '0.00'}
                />
                {(!editAmount || editAmount === '0.00' || editAmount === '0') && (
                  <p className="mt-1 text-xs text-warning">{t('receipt.amountNotDetected')}</p>
                )}
              </div>

              {/* Editable merchant */}
              <div>
                <label className="text-xs text-muted-foreground block mb-1">{t('transactions.merchant')}</label>
                <input
                  value={editMerchant}
                  onChange={(e) => setEditMerchant(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Editable date */}
              <div>
                <label className="text-xs text-muted-foreground block mb-1">{t('transactions.date')}</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Items (read-only preview) */}
              {result.items && result.items.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Items</span>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {result.items.slice(0, 8).map((item, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="truncate flex-1">{item.name}</span>
                        <span className="ml-2 font-medium">{formatAmount(item.amount, currency)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* E-invoice info (read-only) */}
              {(result.invoiceNo || result.taxAmount) && (
                <div className="space-y-1.5 border-t pt-2">
                  <span className="text-[10px] text-muted-foreground font-medium">e-Invoice</span>
                  {result.invoiceNo && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Invoice No</span>
                      <span className="font-mono">{result.invoiceNo}</span>
                    </div>
                  )}
                  {result.tin && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">TIN</span>
                      <span className="font-mono">{result.tin}</span>
                    </div>
                  )}
                  {result.taxAmount && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">SST/Tax</span>
                      <span className="font-medium">{formatAmount(result.taxAmount, currency)}</span>
                    </div>
                  )}
                </div>
              )}

              {!editAmount && !editMerchant && (
                <div className="flex items-center gap-2 text-muted-foreground py-2">
                  <Receipt className="h-4 w-4" />
                  <p className="text-xs">{t('receipt.noData')}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setResult(null); setEditAmount(''); setEditMerchant(''); setEditDate('') }} className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors">
                {t('receipt.retry')}
              </button>
              <button onClick={() => onResult({
                ...result,
                totalAmount: editAmount ? parseFloat(editAmount) : result.totalAmount,
                merchant: editMerchant || result.merchant,
                date: editDate || result.date,
              })} className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                {t('receipt.useResult')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
