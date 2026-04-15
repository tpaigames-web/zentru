import { useTranslation } from 'react-i18next'
import { X, Crown, Check } from 'lucide-react'

interface PaywallModalProps {
  feature: string
  onClose: () => void
}

const PREMIUM_FEATURES = [
  'paywall.unlimitedCards',
  'paywall.unlimitedTx',
  'paywall.unlimitedPdf',
  'paywall.allAnalytics',
  'paywall.smartCard',
  'paywall.cloudSync',
  'paywall.export',
]

export function PaywallModal({ feature, onClose }: PaywallModalProps) {
  const { t, i18n } = useTranslation()
  const isZh = i18n.language.startsWith('zh')

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-warning" />
            <h3 className="text-lg font-bold">{t('paywall.title')}</h3>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          {t('paywall.featureRequired', { feature })}
        </p>

        <div className="space-y-2.5 mb-6">
          {PREMIUM_FEATURES.map((key) => (
            <div key={key} className="flex items-center gap-2.5">
              <Check className="h-4 w-4 text-success shrink-0" />
              <span className="text-xs">{t(key)}</span>
            </div>
          ))}
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
          onClick={() => {
            // TODO: Integrate Stripe/Google Play Billing
            window.open('mailto:tpaigames@gmail.com?subject=Zentru Premium', '_blank')
            onClose()
          }}
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {isZh ? '升级到 Premium' : 'Upgrade to Premium'}
        </button>

        <p className="mt-3 text-center text-[10px] text-muted-foreground">
          {isZh ? '取消随时生效，不自动续费' : 'Cancel anytime, no auto-renewal'}
        </p>
      </div>
    </div>
  )
}
