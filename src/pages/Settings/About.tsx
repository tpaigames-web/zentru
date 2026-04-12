import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Mail, Shield, Heart } from 'lucide-react'

const APP_VERSION = '1.0.0'

export default function AboutPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/settings')} className="rounded-full p-1 hover:bg-accent">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl md:text-2xl font-bold">{t('about.title')}</h2>
      </div>

      {/* App info */}
      <div className="flex flex-col items-center py-6">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary">
          <svg viewBox="0 0 100 100" className="h-12 w-12">
            <rect x="15" y="30" width="70" height="45" rx="8" fill="white" opacity="0.9"/>
            <rect x="15" y="30" width="70" height="14" rx="8" fill="white" opacity="0.6"/>
            <circle cx="30" cy="58" r="5" fill="white" opacity="0.6"/>
            <rect x="45" y="53" width="25" height="3" rx="1.5" fill="white" opacity="0.4"/>
            <rect x="45" y="59" width="18" height="3" rx="1.5" fill="white" opacity="0.3"/>
          </svg>
        </div>
        <h1 className="text-xl font-bold">Zentru</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('app.tagline')}</p>
        <p className="mt-2 text-xs text-muted-foreground">v{APP_VERSION}</p>
      </div>

      {/* Developer info */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="px-4 py-3.5">
          <p className="text-xs text-muted-foreground">{t('about.developer')}</p>
          <p className="text-sm font-medium">TPAIGames</p>
        </div>

        <div className="mx-4 border-t" />

        <a href="mailto:tpaigames@gmail.com" className="flex items-center gap-3 px-4 py-3.5 hover:bg-accent transition-colors">
          <Mail className="h-4 w-4 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">{t('about.contact')}</p>
            <p className="text-sm">tpaigames@gmail.com</p>
          </div>
        </a>

        <div className="mx-4 border-t" />

        <button onClick={() => navigate('/privacy')} className="flex w-full items-center gap-3 px-4 py-3.5 hover:bg-accent transition-colors">
          <Shield className="h-4 w-4 text-primary" />
          <p className="text-sm">{t('about.privacyPolicy')}</p>
        </button>
      </div>

      {/* Features */}
      <div className="rounded-xl border bg-card shadow-sm p-4">
        <h3 className="text-sm font-semibold mb-3">{t('about.features')}</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>- {t('about.feature1')}</p>
          <p>- {t('about.feature2')}</p>
          <p>- {t('about.feature3')}</p>
          <p>- {t('about.feature4')}</p>
          <p>- {t('about.feature5')}</p>
          <p>- {t('about.feature6')}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col items-center py-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <span>Made with</span>
          <Heart className="h-3 w-3 text-destructive" />
          <span>by TPAIGames</span>
        </div>
        <p className="mt-1">&copy; {new Date().getFullYear()} TPAIGames. All rights reserved.</p>
      </div>
    </div>
  )
}
