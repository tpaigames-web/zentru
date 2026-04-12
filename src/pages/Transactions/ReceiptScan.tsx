import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, Upload, X, Loader2, CheckCircle2, Receipt } from 'lucide-react'
import { captureReceiptImage, scanReceiptImage, scanReceiptFromFile, type ScannedReceiptData } from '@/services/receiptScanner'
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCapture = async (source: 'camera' | 'gallery') => {
    setIsScanning(true)
    setError('')
    try {
      const imageData = await captureReceiptImage(source)
      const data = await scanReceiptImage(imageData)
      setResult(data)
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

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleCapture('camera')}
                disabled={isScanning}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 hover:border-primary/50 hover:bg-accent/30 transition-colors disabled:opacity-50"
              >
                <Camera className="h-8 w-8 text-primary" />
                <span className="text-sm font-medium">{t('receipt.camera')}</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 hover:border-primary/50 hover:bg-accent/30 transition-colors disabled:opacity-50"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium">{t('receipt.gallery')}</span>
              </button>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileInput} />

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
              {result.totalAmount !== undefined && (
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">{t('transactions.amount')}</span>
                  <span className="text-lg font-bold">{formatAmount(result.totalAmount, currency)}</span>
                </div>
              )}
              {result.merchant && (
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">{t('transactions.merchant')}</span>
                  <span className="text-sm font-medium">{result.merchant}</span>
                </div>
              )}
              {result.date && (
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">{t('transactions.date')}</span>
                  <span className="text-sm">{result.date}</span>
                </div>
              )}
              {result.items && result.items.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Items</span>
                  <div className="space-y-1">
                    {result.items.slice(0, 8).map((item, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="truncate flex-1">{item.name}</span>
                        <span className="ml-2 font-medium">{formatAmount(item.amount, currency)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!result.totalAmount && !result.merchant && (
                <div className="flex items-center gap-2 text-muted-foreground py-2">
                  <Receipt className="h-4 w-4" />
                  <p className="text-xs">{t('receipt.noData')}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setResult(null)} className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors">
                {t('receipt.retry')}
              </button>
              <button onClick={() => onResult(result)} className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                {t('receipt.useResult')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
