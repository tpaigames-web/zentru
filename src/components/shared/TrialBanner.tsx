import { useTranslation } from 'react-i18next'
import { Crown, Clock, X } from 'lucide-react'
import { useState } from 'react'
import { useUserStore } from '@/stores/useUserStore'

/**
 * Shows trial status banner on top of Dashboard.
 * Dismissible for 24h unless urgent (< 7 days left).
 */
export function TrialBanner() {
  const { i18n } = useTranslation()
  const { user, profile, isInTrial, trialDaysLeft, isPremium } = useUserStore()
  const [dismissed, setDismissed] = useState(() => {
    const until = localStorage.getItem('zentru-trial-banner-dismissed-until')
    return until ? parseInt(until) > Date.now() : false
  })

  const isZh = i18n.language.startsWith('zh')

  // Don't show if: no user / paid premium / trial ended
  if (!user || !profile) return null
  if (profile.plan === 'premium' && !isInTrial) return null

  const handleDismiss = () => {
    // Dismiss for 24 hours
    localStorage.setItem('zentru-trial-banner-dismissed-until', String(Date.now() + 24 * 60 * 60 * 1000))
    setDismissed(true)
  }

  // Case 1: Trial active
  if (isInTrial) {
    const urgent = trialDaysLeft <= 7
    if (dismissed && !urgent) return null

    return (
      <div
        className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
          urgent
            ? 'border-warning/30 bg-warning/5'
            : 'border-primary/20 bg-primary/5'
        }`}
      >
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            urgent ? 'bg-warning/15' : 'bg-primary/15'
          }`}
        >
          {urgent ? <Clock className="h-5 w-5 text-warning" /> : <Crown className="h-5 w-5 text-primary" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {urgent
              ? (isZh ? `免费试用剩 ${trialDaysLeft} 天` : `${trialDaysLeft} days left in trial`)
              : (isZh ? `Premium 试用中 · 剩 ${trialDaysLeft} 天` : `Premium Trial · ${trialDaysLeft} days left`)}
          </p>
          <p className="text-xs text-muted-foreground">
            {isZh
              ? '贡献账单样本可延长 7 天（新银行格式 +30 天）'
              : 'Contribute samples to extend 7 days (+30 for new banks)'}
          </p>
        </div>
        {!urgent && (
          <button
            onClick={handleDismiss}
            className="rounded-full p-1 hover:bg-accent transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
    )
  }

  // Case 2: Trial ended, on free plan
  if (!isPremium && profile.trialEndsAt) {
    if (dismissed) return null
    return (
      <div className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning/15">
          <Clock className="h-5 w-5 text-warning" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-warning">
            {isZh ? '试用已结束' : 'Trial Ended'}
          </p>
          <p className="text-xs text-muted-foreground">
            {isZh ? '已降级为免费版。升级 Premium 解锁完整功能' : 'Downgraded to Free. Upgrade to unlock all features'}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="rounded-full p-1 hover:bg-accent transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    )
  }

  return null
}
