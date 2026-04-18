import { useTranslation } from 'react-i18next'
import { Download, AlertCircle, X } from 'lucide-react'
import type { VersionCheckResult } from '@/services/versionCheck'

interface UpdateModalProps {
  result: VersionCheckResult
  onDismiss?: () => void
}

export function UpdateModal({ result, onDismiss }: UpdateModalProps) {
  const { i18n } = useTranslation()
  const isZh = i18n.language.startsWith('zh')
  const isForced = result.action === 'forced'

  const handleUpdate = () => {
    if (result.info?.download_url) {
      window.location.href = result.info.download_url
    }
  }

  // Forced update: no dismiss option
  if (isForced) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-7 w-7 text-destructive" />
          </div>
          <h3 className="text-center text-lg font-bold">
            {isZh ? '需要更新' : 'Update Required'}
          </h3>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {isZh
              ? `当前版本 ${result.current} 已过时，请更新到最新版 ${result.latest}`
              : `Version ${result.current} is outdated. Please update to ${result.latest}`}
          </p>

          {result.info?.changelog_en && (
            <div className="mt-4 rounded-lg bg-muted/30 p-3">
              <p className="mb-1 text-xs font-semibold">{isZh ? '更新说明' : "What's New"}</p>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                {isZh ? result.info.changelog_zh : result.info.changelog_en}
              </p>
            </div>
          )}

          <button
            onClick={handleUpdate}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
          >
            <Download className="h-4 w-4" />
            {isZh ? '立即更新' : 'Update Now'}
          </button>

          <p className="mt-3 text-center text-[10px] text-muted-foreground">
            {isZh ? '此更新是必需的，无法跳过' : 'This update is required and cannot be skipped'}
          </p>
        </div>
      </div>
    )
  }

  // Optional update: dismissable
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onDismiss}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold">
              {isZh ? '有新版本' : 'Update Available'}
            </h3>
          </div>
          {onDismiss && (
            <button onClick={onDismiss} className="rounded-full p-1 hover:bg-accent">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          {isZh
            ? `新版本 ${result.latest} 可用（当前 ${result.current}）`
            : `New version ${result.latest} available (current ${result.current})`}
        </p>

        {result.info?.changelog_en && (
          <div className="rounded-lg bg-muted/30 p-3 mb-4">
            <p className="mb-1 text-xs font-semibold">{isZh ? '更新说明' : "What's New"}</p>
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">
              {isZh ? result.info.changelog_zh : result.info.changelog_en}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onDismiss}
            className="flex-1 rounded-xl border py-2.5 text-sm font-medium hover:bg-accent"
          >
            {isZh ? '稍后' : 'Later'}
          </button>
          <button
            onClick={handleUpdate}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
          >
            <Download className="h-4 w-4" />
            {isZh ? '更新' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  )
}
