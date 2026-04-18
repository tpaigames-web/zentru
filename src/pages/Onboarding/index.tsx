import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { CreditCard, ChevronRight, Notebook, BarChart3, Grid3x3, Shield, Check } from 'lucide-react'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useUserStore } from '@/stores/useUserStore'
import { useModulesStore } from '@/stores/useModulesStore'
import { cn } from '@/lib/utils'

interface OnboardingProps {
  onComplete: () => void
}

type Step = 'language' | 'welcome' | 'preset' | 'done'

const PRESET_OPTIONS = [
  { key: 'minimal',   icon: Notebook,     color: '#3b82f6',  titleKey: 'onboarding.presetMinimal',   descKey: 'onboarding.presetMinimalDesc' },
  { key: 'cards',     icon: CreditCard,   color: '#22c55e',  titleKey: 'onboarding.presetCards',     descKey: 'onboarding.presetCardsDesc' },
  { key: 'analytics', icon: BarChart3,    color: '#f59e0b',  titleKey: 'onboarding.presetAnalytics', descKey: 'onboarding.presetAnalyticsDesc' },
  { key: 'full',      icon: Grid3x3,      color: '#8b5cf6',  titleKey: 'onboarding.presetFull',      descKey: 'onboarding.presetFullDesc' },
]

export function Onboarding({ onComplete }: OnboardingProps) {
  const { t, i18n } = useTranslation()
  const { setLanguage } = useSettingsStore()
  const { user } = useUserStore()
  const { presets, applyPreset, loadModules } = useModulesStore()

  const [step, setStep] = useState<Step>('language')
  const [selectedPreset, setSelectedPreset] = useState<string>('full')
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    loadModules()
  }, [loadModules])

  const handleLangSelect = (lang: string) => {
    i18n.changeLanguage(lang)
    setLanguage(lang)
    setStep('welcome')
  }

  const handlePresetApply = async () => {
    setApplying(true)
    if (user?.id) {
      await applyPreset(user.id, selectedPreset)
    } else {
      // Local mode: save preference to localStorage
      localStorage.setItem('zentru-ui-preset', selectedPreset)
    }
    setApplying(false)
    setStep('done')
  }

  const isZh = i18n.language.startsWith('zh')

  // Step 1: Language
  if (step === 'language') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary">
          <CreditCard className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-xl md:text-2xl font-bold">Zentru</h1>
        <p className="mt-2 text-sm text-muted-foreground mb-8">Select your language / 选择语言</p>

        <div className="w-full max-w-xs space-y-3">
          <button
            onClick={() => handleLangSelect('en')}
            className="flex w-full items-center justify-between rounded-xl border bg-card px-4 py-4 hover:bg-accent transition-colors"
          >
            <span className="text-sm font-medium">English</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => handleLangSelect('zh')}
            className="flex w-full items-center justify-between rounded-xl border bg-card px-4 py-4 hover:bg-accent transition-colors"
          >
            <span className="text-sm font-medium">中文</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    )
  }

  // Step 2: Welcome + trial info
  if (step === 'welcome') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-between bg-background p-8">
        <div />
        <div className="flex flex-col items-center text-center max-w-sm">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary">
            <CreditCard className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold">
            {isZh ? '欢迎使用 Zentru' : 'Welcome to Zentru'}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {isZh
              ? '智能信用卡记账与消费管理工具'
              : 'Smart credit card tracking & expense management'}
          </p>

          <div className="mt-8 w-full rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                {isZh ? '90 天免费试用' : '90-Day Free Trial'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isZh
                ? '所有功能免费使用 90 天。贡献账单样本还可额外延长试用期！'
                : 'All features free for 90 days. Contribute statement samples to extend!'}
            </p>
          </div>
        </div>

        <div className="w-full max-w-xs">
          <button
            onClick={() => setStep('preset')}
            className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {isZh ? '开始设置' : 'Get Started'}
          </button>
        </div>
      </div>
    )
  }

  // Step 3: Choose preset
  if (step === 'preset') {
    return (
      <div className="flex min-h-screen flex-col bg-background p-6 overflow-y-auto">
        <div className="mb-6 pt-4">
          <h2 className="text-xl font-bold">
            {isZh ? '你想用 Zentru 做什么？' : 'How will you use Zentru?'}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {isZh ? '选择一个场景，之后可以在设置里随时调整' : 'Pick a scenario. You can change it later in Settings.'}
          </p>
        </div>

        <div className="space-y-3 flex-1">
          {PRESET_OPTIONS.map(({ key, icon: Icon, color, titleKey, descKey }) => {
            const preset = presets.find((p) => p.key === key)
            const isSelected = selectedPreset === key
            return (
              <button
                key={key}
                onClick={() => setSelectedPreset(key)}
                className={cn(
                  'w-full flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all',
                  isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-accent/50'
                )}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: color + '15' }}
                >
                  <Icon className="h-5 w-5" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      {preset ? (isZh ? preset.name_zh : preset.name_en) : t(titleKey)}
                    </p>
                    {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {preset?.description_zh ? (isZh ? preset.description_zh : preset.description_en) : t(descKey)}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-6">
          <button
            onClick={handlePresetApply}
            disabled={applying}
            className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {applying
              ? (isZh ? '正在应用...' : 'Applying...')
              : (isZh ? '应用并继续' : 'Apply & Continue')}
          </button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {isZh ? '以后可在「设置 → 界面定制」中更改' : 'Change anytime in Settings → UI Customize'}
          </p>
        </div>
      </div>
    )
  }

  // Step 4: Done
  if (step === 'done') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-between bg-background p-8">
        <div />
        <div className="flex flex-col items-center text-center max-w-sm">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-green-500/10">
            <Check className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold">
            {isZh ? '设置完成！' : 'All Set!'}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {isZh
              ? '你的 90 天免费试用已激活，尽情探索吧'
              : 'Your 90-day free trial is active. Enjoy!'}
          </p>
        </div>

        <div className="w-full max-w-xs">
          <button
            onClick={onComplete}
            className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {isZh ? '进入 App' : 'Enter App'}
          </button>
        </div>
      </div>
    )
  }

  return null
}
