import { useTranslation } from 'react-i18next'
import { Moon, Sun, Globe } from 'lucide-react'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { cn } from '@/lib/utils'

export function Header() {
  const { t, i18n } = useTranslation()
  const { theme, setTheme, setLanguage } = useSettingsStore()

  const toggleTheme = () => {
    const effective = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark')
      : theme === 'dark' ? 'light' : 'dark'
    setTheme(effective)
  }

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('zh') ? 'en' : 'zh'
    i18n.changeLanguage(newLang)
    setLanguage(newLang)
  }

  return (
    <header className="sticky top-0 z-40 flex h-12 md:h-14 shrink-0 items-center justify-between border-b bg-background/95 px-3 md:px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <h1 className="text-base md:text-lg font-semibold text-foreground">
        {t('app.name')}
      </h1>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleLanguage}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-md',
            'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            'transition-colors',
          )}
          aria-label={t('settings.language')}
        >
          <Globe className="h-5 w-5" />
        </button>

        <button
          onClick={toggleTheme}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-md',
            'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            'transition-colors',
          )}
          aria-label={t('settings.theme')}
        >
          {theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
            ? <Sun className="h-5 w-5" />
            : <Moon className="h-5 w-5" />
          }
        </button>
      </div>
    </header>
  )
}
