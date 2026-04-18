import { useEffect, useState } from 'react'
import { RefreshCw, X } from 'lucide-react'
import { registerSW } from 'virtual:pwa-register'

/**
 * Non-blocking update banner.
 *
 * Behavior:
 * - When a new service worker is waiting, shows a small banner at the top
 * - User can click "Reload" to apply the update immediately
 * - Or dismiss it and the new SW stays pending — applied next natural reload
 * - NEVER forces a reload mid-operation, so in-progress forms stay intact
 */
export function UpdateBanner() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [updateSW, setUpdateSW] = useState<(reload?: boolean) => Promise<void> | null>(() => null)

  useEffect(() => {
    const update = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true)
      },
      onRegisterError(err: unknown) {
        console.warn('SW register failed:', err)
      },
    })
    setUpdateSW(() => update)
  }, [])

  if (!needRefresh || dismissed) return null

  const isZh = typeof navigator !== 'undefined' && navigator.language?.startsWith('zh')

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-between gap-3 border-b bg-primary/95 backdrop-blur px-4 py-2 text-primary-foreground shadow-lg animate-in slide-in-from-top">
      <div className="flex items-center gap-2 min-w-0">
        <RefreshCw className="h-4 w-4 shrink-0" />
        <p className="text-xs sm:text-sm truncate">
          {isZh ? '新版本可用 — 方便时点击刷新' : 'New version available — reload when ready'}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={async () => {
            if (updateSW) await updateSW(true)
          }}
          className="rounded-md bg-white/20 px-3 py-1 text-xs font-medium hover:bg-white/30 active:scale-95 transition-all"
        >
          {isZh ? '刷新' : 'Reload'}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="rounded-md p-1 hover:bg-white/20 active:scale-95 transition-all"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
