import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Trash2, RotateCcw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

async function clearCachesAndReload() {
  try {
    // Unregister service workers (stale SW serves old chunks)
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((r) => r.unregister()))
    }
    // Clear CacheStorage (PWA precache + runtime caches)
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    }
  } catch (e) {
    console.warn('Cache cleanup failed:', e)
  } finally {
    // Bypass any remaining HTTP cache
    window.location.reload()
  }
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      const isZh = typeof navigator !== 'undefined' && navigator.language?.startsWith('zh')
      const msg = this.state.error?.message || (isZh ? '发生未知错误' : 'An unexpected error occurred')
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
          <AlertTriangle className="mb-4 h-12 w-12 text-destructive" />
          <h2 className="text-lg font-bold">
            {isZh ? '出了点问题' : 'Something went wrong'}
          </h2>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground break-words">
            {msg}
          </p>
          <div className="mt-6 flex flex-col gap-2 w-full max-w-xs">
            <button
              onClick={this.handleReset}
              className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground active:scale-95 transition-transform"
            >
              <RotateCcw className="h-4 w-4" />
              {isZh ? '重试' : 'Try Again'}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm font-medium active:scale-95 transition-transform"
            >
              <RefreshCw className="h-4 w-4" />
              {isZh ? '刷新页面' : 'Reload'}
            </button>
            <button
              onClick={clearCachesAndReload}
              className="flex items-center justify-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground active:scale-95 transition-transform"
            >
              <Trash2 className="h-4 w-4" />
              {isZh ? '清缓存并重新加载' : 'Clear Cache & Reload'}
            </button>
          </div>
          <p className="mt-6 text-[10px] text-muted-foreground/60">
            {isZh
              ? '若反复出现此错误，请尝试"清缓存并重新加载"'
              : 'If this keeps happening, try "Clear Cache & Reload"'}
          </p>
        </div>
      )
    }

    return this.props.children
  }
}
