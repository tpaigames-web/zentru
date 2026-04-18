import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  Moon, Sun, Globe, ChevronRight, DollarSign, Bell, Lock, LogOut,
  Cloud, CloudUpload, CloudDownload, Loader2, User, Crown, Info,
  FileSpreadsheet, Download, Upload, Database, FolderSync,
  Tags, Wallet, CalendarClock, Layers,
} from 'lucide-react'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { CURRENCIES } from '@/lib/currency'
import { exportFullBackup, importFullBackup, exportTransactionsCSV, downloadFile, type BackupData } from '@/services/backup'
import { showPersistentNotification, hidePersistentNotification, requestNotificationPermission } from '@/services/notification'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUserStore } from '@/stores/useUserStore'
import { uploadAllData, downloadAllData } from '@/services/syncService'

export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { theme, setTheme, setLanguage, currency, setCurrency, persistentNotification, setPersistentNotification } = useSettingsStore()
  const { transactions } = useTransactionStore()
  const restoreInputRef = useRef<HTMLInputElement>(null)
  const { user, profile, signOut, isPremium } = useUserStore()
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')
  const isZh = i18n.language.startsWith('zh')

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  const handleSync = async (direction: 'up' | 'down') => {
    if (!user) return
    setSyncing(true)
    setSyncMsg('')
    if (direction === 'up') {
      const r = await uploadAllData(user.id)
      setSyncMsg(r.success ? (isZh ? '✓ 上传成功' : '✓ Upload done') : r.error || 'Error')
    } else {
      const r = await downloadAllData(user.id)
      if (r.success) { setSyncMsg(isZh ? '✓ 下载成功' : '✓ Download done'); setTimeout(() => window.location.reload(), 800) }
      else setSyncMsg(r.error || 'Error')
    }
    setSyncing(false)
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl md:text-2xl font-bold">{t('settings.title')}</h2>

      {/* ============ SECTION: Account ============ */}
      <div className="rounded-xl border bg-card shadow-sm">
        {user ? (
          <>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{profile?.displayName || user.email}</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  {isPremium && <Crown className="h-3 w-3 text-warning" />}
                </div>
              </div>
            </div>

            <div className="mx-4 border-t" />

            <button
              onClick={async () => { await signOut(); localStorage.removeItem('zentru-skip-auth'); window.location.reload() }}
              className="flex w-full items-center gap-3 px-4 py-3 text-destructive hover:bg-destructive/5 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">{isZh ? '退出登录' : 'Sign Out'}</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => { localStorage.removeItem('zentru-skip-auth'); window.location.reload() }}
            className="flex w-full items-center justify-between px-4 py-3.5 hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{isZh ? '登录 / 注册' : 'Sign In / Sign Up'}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* ============ SECTION: Cloud Sync ============ */}
      {user && (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-center gap-3 px-4 pt-3.5 pb-2">
            <Cloud className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {isZh ? '云同步' : 'Cloud Sync'}
            </span>
          </div>
          <p className="px-4 pb-2 text-[11px] text-muted-foreground">
            {isZh ? '数据变更后 30 秒自动上传。登录新设备时自动下载。' : 'Auto-uploads 30s after changes. Auto-downloads on new device login.'}
          </p>
          <div className="flex gap-2 px-4 pb-3">
            <button
              onClick={() => handleSync('up')}
              disabled={syncing}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium hover:bg-accent disabled:opacity-50"
            >
              {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CloudUpload className="h-3.5 w-3.5" />}
              {isZh ? '手动上传' : 'Manual Upload'}
            </button>
            <button
              onClick={() => handleSync('down')}
              disabled={syncing}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium hover:bg-accent disabled:opacity-50"
            >
              {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CloudDownload className="h-3.5 w-3.5" />}
              {isZh ? '手动下载' : 'Manual Download'}
            </button>
          </div>
          {syncMsg && <p className="px-4 pb-3 text-xs text-muted-foreground">{syncMsg}</p>}
        </div>
      )}

      {/* ============ SECTION: Preferences ============ */}
      <div className="rounded-xl border bg-card shadow-sm">
        {/* Theme */}
        <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className="flex w-full items-center justify-between px-4 py-3.5 transition-colors hover:bg-accent">
          <div className="flex items-center gap-3">
            {isDark ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
            <span className="text-sm font-medium">{t('settings.theme')}</span>
          </div>
          <span className="text-sm text-muted-foreground">{isDark ? t('settings.darkMode') : t('settings.lightMode')}</span>
        </button>

        <div className="mx-4 border-t" />

        {/* Language */}
        <button onClick={() => { const nl = isZh ? 'en' : 'zh'; i18n.changeLanguage(nl); setLanguage(nl) }} className="flex w-full items-center justify-between px-4 py-3.5 transition-colors hover:bg-accent">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{t('settings.language')}</span>
          </div>
          <span className="text-sm text-muted-foreground">{isZh ? '中文' : 'English'}</span>
        </button>

        <div className="mx-4 border-t" />

        {/* Currency */}
        <div className="flex w-full items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{t('settings.currency')}</span>
          </div>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="rounded-lg border bg-card px-2 py-1.5 text-sm text-right outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
            ))}
          </select>
        </div>

        <div className="mx-4 border-t" />

        {/* Persistent Notification */}
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
              if (next) { const ok = await requestNotificationPermission(); if (!ok) return; await showPersistentNotification() }
              else await hidePersistentNotification()
              setPersistentNotification(next)
            }}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${persistentNotification ? 'bg-primary' : 'bg-muted'}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${persistentNotification ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        <div className="mx-4 border-t" />

        {/* Daily Reminder */}
        <div className="flex w-full items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-primary" />
            <div>
              <span className="text-sm font-medium">{t('settings.dailyReminder')}</span>
              <p className="text-xs text-muted-foreground">{t('settings.dailyReminderDesc')}</p>
            </div>
          </div>
          <select
            value={useSettingsStore.getState().dailyReminderHour}
            onChange={async (e) => {
              const hour = parseInt(e.target.value)
              useSettingsStore.getState().setDailyReminderHour(hour)
              const { scheduleDailyReminder } = await import('@/services/notification')
              scheduleDailyReminder(hour)
            }}
            className="rounded border bg-background px-2 py-1 text-xs"
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
            ))}
          </select>
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
                onClick={() => { if (pinEnabled) removePin(); else setShowPinInput(true) }}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${pinEnabled ? 'bg-primary' : 'bg-muted'}`}
              >
                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${pinEnabled ? 'translate-x-5' : ''}`} />
              </button>
              {showPinInput && !pinEnabled && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowPinInput(false)}>
                  <div className="w-full max-w-xs rounded-2xl bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
                    <h3 className="text-base font-semibold mb-3">{t('lock.setPin')}</h3>
                    <input
                      type="password" inputMode="numeric" maxLength={6}
                      value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="4-6 digits"
                      className="w-full rounded-lg border bg-background px-3 py-2.5 text-center text-lg tracking-widest outline-none"
                      autoFocus
                    />
                    <button
                      onClick={async () => { if (newPin.length >= 4) { await setPin(newPin); setShowPinInput(false); setNewPin('') } }}
                      disabled={newPin.length < 4}
                      className="mt-3 w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
                    >{t('common.confirm')}</button>
                  </div>
                </div>
              )}
            </div>
          )
        })()}
      </div>

      {/* ============ SECTION: Manage ============ */}
      <div className="rounded-xl border bg-card shadow-sm">
        <button onClick={() => navigate('/settings/ui-customize')} className="flex w-full items-center justify-between px-4 py-3.5 hover:bg-accent transition-colors">
          <div className="flex items-center gap-3">
            <Layers className="h-5 w-5 text-primary" />
            <div>
              <span className="text-sm font-medium">{isZh ? '界面定制' : 'UI Customize'}</span>
              <p className="text-xs text-muted-foreground">{isZh ? '选择场景预设或自定义模块' : 'Choose preset or customize modules'}</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="mx-4 border-t" />
        <button onClick={() => navigate('/categories')} className="flex w-full items-center justify-between px-4 py-3.5 hover:bg-accent transition-colors">
          <div className="flex items-center gap-3">
            <Tags className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{t('settings.categories')}</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="mx-4 border-t" />
        <button onClick={() => navigate('/payment-methods')} className="flex w-full items-center justify-between px-4 py-3.5 hover:bg-accent transition-colors">
          <div className="flex items-center gap-3">
            <Wallet className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{t('settings.paymentMethods')}</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="mx-4 border-t" />
        <button onClick={() => navigate('/recurring')} className="flex w-full items-center justify-between px-4 py-3.5 hover:bg-accent transition-colors">
          <div className="flex items-center gap-3">
            <CalendarClock className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{t('settings.recurring')}</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* ============ SECTION: Data ============ */}
      <div className="rounded-xl border bg-card shadow-sm">
        <button onClick={() => navigate('/import')} className="flex w-full items-center justify-between px-4 py-3.5 hover:bg-accent transition-colors">
          <div className="flex items-center gap-3">
            <Upload className="h-5 w-5 text-primary" />
            <div>
              <span className="text-sm font-medium">{t('settings.importData')}</span>
              <p className="text-xs text-muted-foreground">{isZh ? 'PDF 账单 / CSV 文件' : 'PDF statements / CSV files'}</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="mx-4 border-t" />
        <button onClick={() => { const csv = exportTransactionsCSV(transactions); downloadFile(csv, `zentru-transactions-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv') }} className="flex w-full items-center justify-between px-4 py-3.5 hover:bg-accent transition-colors">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <div>
              <span className="text-sm font-medium">{t('settings.exportData')}</span>
              <p className="text-xs text-muted-foreground">{isZh ? '导出交易记录为 CSV' : 'Export transactions as CSV'}</p>
            </div>
          </div>
          <Download className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="mx-4 border-t" />
        <button onClick={async () => { const data = await exportFullBackup(); downloadFile(JSON.stringify(data, null, 2), `zentru-backup-${new Date().toISOString().split('T')[0]}.json`) }} className="flex w-full items-center justify-between px-4 py-3.5 hover:bg-accent transition-colors">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-primary" />
            <div>
              <span className="text-sm font-medium">{t('settings.backup')}</span>
              <p className="text-xs text-muted-foreground">{isZh ? '完整备份为 JSON 文件' : 'Full backup as JSON file'}</p>
            </div>
          </div>
          <Download className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="mx-4 border-t" />
        <button onClick={() => restoreInputRef.current?.click()} className="flex w-full items-center justify-between px-4 py-3.5 hover:bg-accent transition-colors">
          <div className="flex items-center gap-3">
            <FolderSync className="h-5 w-5 text-primary" />
            <div>
              <span className="text-sm font-medium">{t('settings.restore')}</span>
              <p className="text-xs text-muted-foreground">{isZh ? '从 JSON 备份恢复数据' : 'Restore data from JSON backup'}</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* ============ SECTION: About ============ */}
      <div className="rounded-xl border bg-card shadow-sm">
        <button onClick={() => navigate('/about')} className="flex w-full items-center justify-between px-4 py-3.5 hover:bg-accent transition-colors">
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{t('settings.about')}</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <input ref={restoreInputRef} type="file" accept=".json" className="hidden" onChange={async (e) => {
        const file = e.target.files?.[0]; if (!file) return
        if (!confirm(t('export.restoreWarning'))) return
        try { const text = await file.text(); const data: BackupData = JSON.parse(text); await importFullBackup(data); window.location.reload() }
        catch { alert('Invalid backup file') }
      }} />
    </div>
  )
}
