import { useRef } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Moon, Sun, Globe, ChevronRight, DollarSign, Bell, Lock } from 'lucide-react'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { CURRENCIES, type CurrencyCode } from '@/lib/currency'
import { exportFullBackup, importFullBackup, exportTransactionsCSV, downloadFile, type BackupData } from '@/services/backup'
import { showPersistentNotification, hidePersistentNotification, requestNotificationPermission } from '@/services/notification'
import { useAuthStore } from '@/stores/useAuthStore'

export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { theme, setTheme, setLanguage, currency, setCurrency, persistentNotification, setPersistentNotification } = useSettingsStore()
  const { transactions } = useTransactionStore()
  const restoreInputRef = useRef<HTMLInputElement>(null)

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark')

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('zh') ? 'en' : 'zh'
    i18n.changeLanguage(newLang)
    setLanguage(newLang)
  }

  const cycleCurrency = () => {
    const codes = CURRENCIES.map((c) => c.code)
    const idx = codes.indexOf(currency as CurrencyCode)
    const next = codes[(idx >= 0 ? idx + 1 : 1) % codes.length]
    setCurrency(next)
  }

  const handleExportCSV = () => {
    const csv = exportTransactionsCSV(transactions)
    downloadFile(csv, `credittrack-transactions-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
  }

  const handleBackup = async () => {
    const data = await exportFullBackup()
    downloadFile(JSON.stringify(data, null, 2), `credittrack-backup-${new Date().toISOString().split('T')[0]}.json`)
  }

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!confirm(t('export.restoreWarning'))) return

    try {
      const text = await file.text()
      const data: BackupData = JSON.parse(text)
      await importFullBackup(data)
      window.location.reload()
    } catch {
      alert('Invalid backup file')
    }
  }

  const currentCurrencyLabel = CURRENCIES.find((c) => c.code === currency)

  const settingItems = [
    { labelKey: 'settings.categories', action: () => navigate('/categories') },
    { labelKey: 'settings.paymentMethods', action: () => navigate('/payment-methods') },
    { labelKey: 'settings.recurring', action: () => navigate('/recurring') },
    { labelKey: 'settings.importData', action: () => navigate('/import') },
    { labelKey: 'settings.exportData', action: handleExportCSV },
    { labelKey: 'settings.backup', action: handleBackup },
    { labelKey: 'settings.restore', action: () => restoreInputRef.current?.click() },
    { labelKey: 'settings.about', action: () => navigate('/about') },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-xl md:text-2xl font-bold">{t('settings.title')}</h2>

      <div className="rounded-xl border bg-card shadow-sm">
        <button onClick={toggleTheme} className="flex w-full items-center justify-between px-4 py-3.5 transition-colors hover:bg-accent">
          <div className="flex items-center gap-3">
            {isDark ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
            <span className="text-sm font-medium">{t('settings.theme')}</span>
          </div>
          <span className="text-sm text-muted-foreground">{isDark ? t('settings.darkMode') : t('settings.lightMode')}</span>
        </button>

        <div className="mx-4 border-t" />

        <button onClick={toggleLanguage} className="flex w-full items-center justify-between px-4 py-3.5 transition-colors hover:bg-accent">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{t('settings.language')}</span>
          </div>
          <span className="text-sm text-muted-foreground">{i18n.language.startsWith('zh') ? '中文' : 'English'}</span>
        </button>

        <div className="mx-4 border-t" />

        <button onClick={cycleCurrency} className="flex w-full items-center justify-between px-4 py-3.5 transition-colors hover:bg-accent">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{t('settings.currency')}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {currentCurrencyLabel ? `${currentCurrencyLabel.symbol} ${t(currentCurrencyLabel.nameKey)}` : currency}
          </span>
        </button>

        <div className="mx-4 border-t" />

        {/* Persistent Notification Toggle */}
        <div className="flex w-full items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-primary" />
            <div>
              <span className="text-sm font-medium">{t('settings.persistentNotification')}</span>
              <p className="text-xs text-muted-foreground">{t('settings.persistentNotificationDesc')}</p>
            </div>
          </div>
          <button
            onClick={async () => {
              const next = !persistentNotification
              if (next) {
                const granted = await requestNotificationPermission()
                if (!granted) return
                await showPersistentNotification()
              } else {
                await hidePersistentNotification()
              }
              setPersistentNotification(next)
            }}
            className={`relative h-6 w-11 rounded-full transition-colors ${persistentNotification ? 'bg-primary' : 'bg-muted'}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${persistentNotification ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        <div className="mx-4 border-t" />

        {/* App Lock */}
        {(() => {
          const { pinEnabled, setPin, removePin } = useAuthStore()
          const [showPinInput, setShowPinInput] = useState(false)
          const [newPin, setNewPin] = useState('')

          return (
            <div className="flex w-full items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-primary" />
                <div>
                  <span className="text-sm font-medium">{t('settings.appLock')}</span>
                  <p className="text-xs text-muted-foreground">{t('settings.appLockDesc')}</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  if (pinEnabled) {
                    removePin()
                  } else {
                    setShowPinInput(true)
                  }
                }}
                className={`relative h-6 w-11 rounded-full transition-colors ${pinEnabled ? 'bg-primary' : 'bg-muted'}`}
              >
                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${pinEnabled ? 'translate-x-5' : ''}`} />
              </button>
              {showPinInput && !pinEnabled && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowPinInput(false)}>
                  <div className="w-full max-w-xs rounded-2xl bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
                    <h3 className="text-base font-semibold mb-3">{t('lock.setPin')}</h3>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="4-6 digits"
                      className="w-full rounded-lg border bg-background px-3 py-2.5 text-center text-lg tracking-widest outline-none"
                      autoFocus
                    />
                    <button
                      onClick={async () => {
                        if (newPin.length >= 4) {
                          await setPin(newPin)
                          setShowPinInput(false)
                          setNewPin('')
                        }
                      }}
                      disabled={newPin.length < 4}
                      className="mt-3 w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
                    >
                      {t('common.confirm')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })()}
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        {settingItems.map(({ labelKey, action }, index, arr) => (
          <div key={labelKey}>
            <button onClick={action} className="flex w-full items-center justify-between px-4 py-3.5 transition-colors hover:bg-accent">
              <span className="text-sm font-medium">{t(labelKey)}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
            {index < arr.length - 1 && <div className="mx-4 border-t" />}
          </div>
        ))}
      </div>

      <input ref={restoreInputRef} type="file" accept=".json" className="hidden" onChange={handleRestore} />
    </div>
  )
}
