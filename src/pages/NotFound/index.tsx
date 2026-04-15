import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { FileQuestion } from 'lucide-react'

export default function NotFoundPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center py-24">
      <FileQuestion className="mb-4 h-16 w-16 text-muted-foreground/40" />
      <h2 className="text-xl font-bold">{t('notFound.title')}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t('notFound.message')}</p>
      <button
        onClick={() => navigate('/')}
        className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        {t('notFound.goHome')}
      </button>
    </div>
  )
}
