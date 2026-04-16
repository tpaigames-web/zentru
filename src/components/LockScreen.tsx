import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Lock, Fingerprint, Delete } from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import { cn } from '@/lib/utils'

export function LockScreen() {
  const { t } = useTranslation()
  const { verifyPin, unlock, biometricEnabled } = useAuthStore()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [shaking, setShaking] = useState(false)

  const handleDigit = (digit: string) => {
    if (pin.length >= 6) return
    const next = pin + digit
    setPin(next)
    setError(false)

    // Try to verify at every length >= 4 (PIN can be 4, 5, or 6 digits)
    if (next.length >= 4) {
      setTimeout(async () => {
        const valid = await verifyPin(next)
        if (valid) {
          unlock()
        } else if (next.length >= 6) {
          // Max length reached and still wrong — show error and reset
          setError(true)
          setShaking(true)
          setTimeout(() => { setShaking(false); setPin('') }, 500)
        }
      }, 100)
    }
  }

  const handleDelete = () => {
    setPin(pin.slice(0, -1))
    setError(false)
  }

  const dots = [0, 1, 2, 3, 4, 5]
  const numpad = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'bio', '0', 'del']

  return (
    <div className="flex h-full flex-col items-center justify-center bg-background p-8">
      <Lock className="mb-4 h-10 w-10 text-primary" />
      <h2 className="text-lg font-bold">Zentru</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t('lock.enterPin')}</p>

      {/* PIN dots */}
      <div className={cn('mt-8 flex gap-3', shaking && 'animate-shake')}>
        {dots.map((i) => (
          <div
            key={i}
            className={cn(
              'h-3.5 w-3.5 rounded-full transition-all',
              i < pin.length ? (error ? 'bg-destructive' : 'bg-primary') : 'border-2 border-muted-foreground/30',
            )}
          />
        ))}
      </div>

      {error && <p className="mt-3 text-xs text-destructive">{t('lock.wrongPin')}</p>}

      {/* Number pad */}
      <div className="mt-10 grid grid-cols-3 gap-4">
        {numpad.map((key) => {
          if (key === 'bio') {
            return biometricEnabled ? (
              <button key={key} className="flex h-16 w-16 items-center justify-center rounded-full hover:bg-accent transition-colors">
                <Fingerprint className="h-6 w-6 text-primary" />
              </button>
            ) : <div key={key} className="h-16 w-16" />
          }
          if (key === 'del') {
            return (
              <button key={key} onClick={handleDelete} className="flex h-16 w-16 items-center justify-center rounded-full hover:bg-accent transition-colors">
                <Delete className="h-5 w-5 text-muted-foreground" />
              </button>
            )
          }
          return (
            <button
              key={key}
              onClick={() => handleDigit(key)}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 text-xl font-medium hover:bg-accent transition-colors"
            >
              {key}
            </button>
          )
        })}
      </div>
    </div>
  )
}
