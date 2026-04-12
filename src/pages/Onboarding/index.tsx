import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CreditCard, BarChart3, Sparkles, Bell, ChevronRight } from 'lucide-react'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { cn } from '@/lib/utils'

interface OnboardingProps {
  onComplete: () => void
}

const STEPS = [
  {
    icon: CreditCard,
    titleKey: 'onboarding.step1Title',
    descKey: 'onboarding.step1Desc',
    color: '#3b82f6',
  },
  {
    icon: BarChart3,
    titleKey: 'onboarding.step2Title',
    descKey: 'onboarding.step2Desc',
    color: '#22c55e',
  },
  {
    icon: Sparkles,
    titleKey: 'onboarding.step3Title',
    descKey: 'onboarding.step3Desc',
    color: '#f59e0b',
  },
  {
    icon: Bell,
    titleKey: 'onboarding.step4Title',
    descKey: 'onboarding.step4Desc',
    color: '#8b5cf6',
  },
]

export function Onboarding({ onComplete }: OnboardingProps) {
  const { t, i18n } = useTranslation()
  const { setLanguage } = useSettingsStore()
  const [step, setStep] = useState(0)

  const handleLangSelect = (lang: string) => {
    i18n.changeLanguage(lang)
    setLanguage(lang)
  }

  // Language selection screen (step -1)
  if (step === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-8">
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary">
          <CreditCard className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-xl md:text-2xl font-bold">Zentru</h1>
        <p className="mt-2 text-sm text-muted-foreground mb-8">Select your language / 选择语言</p>

        <div className="w-full max-w-xs space-y-3">
          <button
            onClick={() => { handleLangSelect('en'); setStep(1) }}
            className="flex w-full items-center justify-between rounded-xl border bg-card px-4 py-4 hover:bg-accent transition-colors"
          >
            <span className="text-sm font-medium">English</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => { handleLangSelect('zh'); setStep(1) }}
            className="flex w-full items-center justify-between rounded-xl border bg-card px-4 py-4 hover:bg-accent transition-colors"
          >
            <span className="text-sm font-medium">中文</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    )
  }

  const currentStep = STEPS[step - 1] || STEPS[0]
  const StepIcon = currentStep.icon
  const actualStep = step - 1
  const actualLast = actualStep === STEPS.length - 1

  return (
    <div className="flex h-screen flex-col items-center justify-between bg-background p-8">
      <div />

      <div className="flex flex-col items-center text-center">
        <div
          className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl"
          style={{ backgroundColor: currentStep.color + '15' }}
        >
          <StepIcon className="h-12 w-12" style={{ color: currentStep.color }} />
        </div>

        <h2 className="text-xl font-bold">{t(currentStep.titleKey)}</h2>
        <p className="mt-3 max-w-xs text-sm text-muted-foreground leading-relaxed">
          {t(currentStep.descKey)}
        </p>
      </div>

      <div className="w-full max-w-xs space-y-4">
        {/* Dots */}
        <div className="flex justify-center gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-2 rounded-full transition-all',
                i === actualStep ? 'w-6 bg-primary' : 'w-2 bg-muted',
              )}
            />
          ))}
        </div>

        <button
          onClick={() => actualLast ? onComplete() : setStep(step + 1)}
          className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {actualLast ? t('onboarding.getStarted') : t('onboarding.next')}
        </button>

        {!actualLast && (
          <button
            onClick={onComplete}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('onboarding.skip')}
          </button>
        )}
      </div>
    </div>
  )
}
