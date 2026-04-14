import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import {
  CreditCard, BarChart3, Sparkles, Bell, Shield,
  ShieldCheck, Eye, HardDrive, Lock,
  Search, PiggyBank, TrendingDown,
  Globe, Heart,
} from 'lucide-react'

const BENEFITS = [
  { icon: Search, titleKey: 'about.benefit1', descKey: 'about.benefit1Desc', color: '#3b82f6' },
  { icon: PiggyBank, titleKey: 'about.benefit2', descKey: 'about.benefit2Desc', color: '#22c55e' },
  { icon: TrendingDown, titleKey: 'about.benefit3', descKey: 'about.benefit3Desc', color: '#f59e0b' },
]

const SECURITY = [
  { icon: ShieldCheck, titleKey: 'about.security1', descKey: 'about.security1Desc' },
  { icon: Eye, titleKey: 'about.security2', descKey: 'about.security2Desc' },
  { icon: HardDrive, titleKey: 'about.security3', descKey: 'about.security3Desc' },
  { icon: Lock, titleKey: 'about.security4', descKey: 'about.security4Desc' },
]

const FEATURES = [
  { icon: CreditCard, titleKey: 'onboarding.step1Title', descKey: 'onboarding.step1Desc', color: '#3b82f6' },
  { icon: BarChart3, titleKey: 'onboarding.step2Title', descKey: 'onboarding.step2Desc', color: '#22c55e' },
  { icon: Sparkles, titleKey: 'onboarding.step3Title', descKey: 'onboarding.step3Desc', color: '#f59e0b' },
  { icon: Bell, titleKey: 'onboarding.step4Title', descKey: 'onboarding.step4Desc', color: '#8b5cf6' },
]

export default function LandingPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isZh = i18n.language.startsWith('zh')

  const toggleLang = () => {
    i18n.changeLanguage(isZh ? 'en' : 'zh')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <CreditCard className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold">Zentru</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleLang} className="rounded-lg border px-3 py-1.5 text-xs hover:bg-accent transition-colors">
              <Globe className="inline h-3.5 w-3.5 mr-1" />
              {isZh ? 'EN' : '中文'}
            </button>
            <button
              onClick={() => navigate('/')}
              className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground"
            >
              {isZh ? '打开应用' : 'Open App'}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-primary">
            <svg viewBox="0 0 100 100" className="h-14 w-14">
              <rect x="15" y="30" width="70" height="45" rx="8" fill="white" opacity="0.9"/>
              <rect x="15" y="30" width="70" height="14" rx="8" fill="white" opacity="0.6"/>
              <circle cx="30" cy="58" r="5" fill="white" opacity="0.6"/>
              <rect x="45" y="53" width="25" height="3" rx="1.5" fill="white" opacity="0.4"/>
              <rect x="45" y="59" width="18" height="3" rx="1.5" fill="white" opacity="0.3"/>
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">Zentru</h1>
          <p className="mt-3 text-lg text-muted-foreground">{t('app.tagline')}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-8 rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {isZh ? '立即体验' : 'Get Started'}
          </button>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-4 py-12 bg-muted/30">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-10">{t('about.benefits')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BENEFITS.map(({ icon: Icon, titleKey, descKey, color }) => (
              <div key={titleKey} className="rounded-xl border bg-card p-6 shadow-sm text-center">
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: color + '15' }}
                >
                  <Icon className="h-7 w-7" style={{ color }} />
                </div>
                <h3 className="font-semibold mb-2">{t(titleKey)}</h3>
                <p className="text-sm text-muted-foreground">{t(descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-10">{t('about.features')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map(({ icon: Icon, titleKey, descKey, color }) => (
              <div key={titleKey} className="flex gap-4 rounded-xl border bg-card p-5 shadow-sm">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: color + '15' }}
                >
                  <Icon className="h-6 w-6" style={{ color }} />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{t(titleKey)}</h3>
                  <p className="text-sm text-muted-foreground">{t(descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="px-4 py-12 bg-foreground text-background">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-center gap-3 mb-10">
            <Shield className="h-8 w-8" />
            <h2 className="text-2xl font-bold">{t('about.security')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SECURITY.map(({ icon: Icon, titleKey, descKey }) => (
              <div key={titleKey} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background/10">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{t(titleKey)}</h3>
                  <p className="text-sm opacity-70">{t(descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 text-center">
        <div className="mx-auto max-w-md">
          <h2 className="text-2xl font-bold mb-3">
            {isZh ? '开始管理你的财务' : 'Start Managing Your Finances'}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {isZh ? '免费使用，无需注册，数据完全在你的设备上。' : 'Free to use, no registration required, data stays on your device.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {isZh ? '立即体验' : 'Get Started Free'}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-4 py-6">
        <div className="mx-auto max-w-4xl flex flex-col items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/privacy')} className="hover:text-foreground transition-colors">
              {t('about.privacyPolicy')}
            </button>
            <a href="mailto:tpaigames@gmail.com" className="hover:text-foreground transition-colors">
              {t('about.contact')}
            </a>
          </div>
          <div className="flex items-center gap-1">
            <span>Made with</span>
            <Heart className="h-3 w-3 text-destructive" />
            <span>by TPAIGames</span>
          </div>
          <p>&copy; {new Date().getFullYear()} TPAIGames. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
