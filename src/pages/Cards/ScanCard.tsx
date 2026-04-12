import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, Upload, X, Loader2, CheckCircle2 } from 'lucide-react'
import { captureCardImage, scanCardImage, scanCardFromFile, type ScannedCardData } from '@/services/cardScanner'

interface ScanCardProps {
  onResult: (data: ScannedCardData) => void
  onClose: () => void
}

export function ScanCard({ onResult, onClose }: ScanCardProps) {
  const { t } = useTranslation()
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ScannedCardData | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCapture = async (source: 'camera' | 'gallery') => {
    setIsScanning(true)
    setError('')
    try {
      const imageData = await captureCardImage(source)
      const data = await scanCardImage(imageData)
      setResult(data)
    } catch (err) {
      // Fallback: if Capacitor camera not available (web), use file input
      if (source === 'camera') {
        setError(t('cards.scan.cameraNotAvailable'))
      } else {
        setError(err instanceof Error ? err.message : 'Scan failed')
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
      const data = await scanCardFromFile(file)
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed')
    }
    setIsScanning(false)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 md:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-2xl bg-card p-6 pb-20 shadow-xl md:rounded-2xl md:pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('cards.scan.title')}</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!result ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t('cards.scan.instruction')}</p>

            {/* Scan buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleCapture('camera')}
                disabled={isScanning}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 hover:border-primary/50 hover:bg-accent/30 transition-colors disabled:opacity-50"
              >
                <Camera className="h-8 w-8 text-primary" />
                <span className="text-sm font-medium">{t('cards.scan.camera')}</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 hover:border-primary/50 hover:bg-accent/30 transition-colors disabled:opacity-50"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium">{t('cards.scan.gallery')}</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileInput}
            />

            {isScanning && (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm">{t('cards.scan.scanning')}</span>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">{t('cards.scan.detected')}</span>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              {result.bank && (
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">{t('cards.bank')}</span>
                  <span className="text-sm font-medium">{result.bank}</span>
                </div>
              )}
              {result.lastFourDigits && (
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">{t('cards.lastFour')}</span>
                  <span className="text-sm font-mono">•••• {result.lastFourDigits}</span>
                </div>
              )}
              {result.cardholderName && (
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Name</span>
                  <span className="text-sm">{result.cardholderName}</span>
                </div>
              )}
              {result.expiryDate && (
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Expiry</span>
                  <span className="text-sm font-mono">{result.expiryDate}</span>
                </div>
              )}
              {!result.bank && !result.lastFourDigits && (
                <p className="text-xs text-muted-foreground text-center">{t('cards.scan.noData')}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setResult(null)}
                className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
              >
                {t('cards.scan.retry')}
              </button>
              <button
                onClick={() => onResult(result)}
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {t('cards.scan.useResult')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
