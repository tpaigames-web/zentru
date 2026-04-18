import { useTranslation } from 'react-i18next'
import { X, Crown, Gift, Smartphone } from 'lucide-react'
import { useUserStore } from '@/stores/useUserStore'
import { Capacitor } from '@capacitor/core'

interface PaywallModalProps {
  /** @deprecated Use featureName instead. Kept for backward compat. */
  feature?: string
  onClose: () => void
  /** Optional: specific feature name for the header text */
  featureName?: string
}

export function PaywallModal({ onClose, featureName }: PaywallModalProps) {
  const { i18n } = useTranslation()
  const { isInTrial, trialDaysLeft } = useUserStore()
  const isZh = i18n.language.startsWith('zh')
  const isNative = Capacitor.isNativePlatform()

  const features = isZh ? [
    { icon: '💳', text: '无限信用卡（免费版 2 张）' },
    { icon: '📥', text: '无限导入（免费版每月 2 次）' },
    { icon: '📊', text: '完整报表（返现 + 商户分析）' },
    { icon: '☁️', text: '云端同步与数据导出' },
    { icon: '🎯', text: '优先客服支持' },
  ] : [
    { icon: '💳', text: 'Unlimited cards (Free: 2)' },
    { icon: '📥', text: 'Unlimited imports (Free: 2/mo)' },
    { icon: '📊', text: 'Full analytics (Cashback + Merchant)' },
    { icon: '☁️', text: 'Cloud sync & data export' },
    { icon: '🎯', text: 'Priority support' },
  ]

  const handleUpgrade = () => {
    if (isNative) {
      // Google Play Billing — TODO implement via Capacitor plugin
      alert(isZh ? '即将推出 Google Play 内购' : 'Google Play Billing coming soon')
    } else {
      // Web users: guide them to download APK
      alert(isZh
        ? '请下载 Zentru APK 进行升级。网页版暂不支持付费。'
        : 'Please download the Zentru APK to upgrade. Web version does not support payments yet.')
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-card shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-warning" />
            <h3 className="text-lg font-bold">Zentru Premium</h3>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          {/* Trial status hint */}
          {isInTrial && trialDaysLeft > 0 && (
            <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs text-primary font-medium">
                {isZh
                  ? `你的 Premium 试用还剩 ${trialDaysLeft} 天`
                  : `Your Premium trial: ${trialDaysLeft} days left`}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {isZh
                  ? '贡献账单样本可延长试用期'
                  : 'Contribute samples to extend trial'}
              </p>
            </div>
          )}

          <p className="text-sm text-muted-foreground mb-5">
            {featureName
              ? (isZh
                ? `"${featureName}" 需要 Premium 订阅`
                : `"${featureName}" requires Premium subscription`)
              : (isZh
                ? '解锁所有功能，无限使用'
                : 'Unlock all features, unlimited usage')}
          </p>

          <div className="space-y-2.5 mb-5">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="text-sm">{f.icon}</span>
                <span className="text-xs">{f.text}</span>
              </div>
            ))}
          </div>

          {/* Earn trial via samples */}
          <div className="mb-5 rounded-xl border border-success/20 bg-success/5 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Gift className="h-4 w-4 text-success" />
              <p className="text-xs font-medium text-success">
                {isZh ? '免费延长试用' : 'Earn free extension'}
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {isZh
                ? '贡献账单样本可免费延长 7 天 · 新银行格式 +30 天'
                : 'Submit samples to earn +7 days · +30 for new banks'}
            </p>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl border-2 border-primary p-3 text-center">
              <p className="text-lg font-bold">RM 9.90</p>
              <p className="text-[10px] text-muted-foreground">{isZh ? '/月' : '/month'}</p>
            </div>
            <div className="rounded-xl border p-3 text-center relative">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-success px-2 py-0.5 text-[8px] font-bold text-white">
                -33%
              </div>
              <p className="text-lg font-bold">RM 79.90</p>
              <p className="text-[10px] text-muted-foreground">{isZh ? '/年' : '/year'}</p>
            </div>
          </div>

          <button
            onClick={handleUpgrade}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {isNative ? (
              <>
                <Crown className="h-4 w-4" />
                {isZh ? '立即升级' : 'Upgrade Now'}
              </>
            ) : (
              <>
                <Smartphone className="h-4 w-4" />
                {isZh ? '下载 APK 升级' : 'Download APK to Upgrade'}
              </>
            )}
          </button>

          <p className="mt-3 text-center text-[10px] text-muted-foreground">
            {isNative
              ? (isZh ? '通过 Google Play 订阅，随时取消' : 'Subscribe via Google Play, cancel anytime')
              : (isZh ? '目前仅 APK 版本支持内购' : 'Payments available on APK only')}
          </p>
        </div>
      </div>
    </div>
  )
}
