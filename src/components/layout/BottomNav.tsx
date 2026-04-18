import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  CreditCard,
  PlusCircle,
  BarChart3,
  Menu,
  Wallet,
  TrendingUp,
  Gift,
  Sparkles,
  RefreshCw,
  FileText,
  Settings,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useModules } from '@/hooks/useModules'

const mainItems = [
  { to: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard', module: 'dashboard' },
  { to: '/cards', icon: CreditCard, labelKey: 'nav.cards', module: 'cards' },
  { to: '/transactions/new', icon: PlusCircle, labelKey: 'nav.add', isCenter: true, module: 'transactions' },
  { to: '/analytics', icon: BarChart3, labelKey: 'nav.analytics', module: 'analytics_overview' },
]

const moreItems = [
  { to: '/budget', icon: Wallet, labelKey: 'nav.budget', color: '#f59e0b', module: 'budget' },
  { to: '/predictions', icon: TrendingUp, labelKey: 'nav.predictions', color: '#8b5cf6', module: 'predictions' },
  { to: '/cashback', icon: Gift, labelKey: 'nav.cashback', color: '#22c55e', module: 'cashback_tracking' },
  { to: '/smart', icon: Sparkles, labelKey: 'nav.smartCard', color: '#3b82f6', module: 'smart_card' },
  { to: '/recurring', icon: RefreshCw, labelKey: 'nav.recurring', color: '#ec4899', module: 'recurring' },
  { to: '/import', icon: FileText, labelKey: 'nav.import', color: '#06b6d4', module: 'import_pdf' },
  { to: '/transactions', icon: CreditCard, labelKey: 'nav.transactions', color: '#64748b', module: 'transactions' },
  { to: '/settings', icon: Settings, labelKey: 'nav.settings', color: '#94a3b8', module: null }, // Always visible
]

export function BottomNav() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [showMore, setShowMore] = useState(false)
  const { isModuleVisible } = useModules()

  const visibleMainItems = mainItems.filter((item) => !item.module || isModuleVisible(item.module))
  const visibleMoreItems = moreItems.filter((item) => !item.module || isModuleVisible(item.module))

  return (
    <>
      {/* More panel overlay */}
      {showMore && (
        <div className="fixed inset-0 z-[55] bg-black/40" onClick={() => setShowMore(false)}>
          <div
            className="absolute bottom-14 left-0 right-0 rounded-t-2xl bg-card p-4 pb-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">{t('nav.more')}</h3>
              <button onClick={() => setShowMore(false)} className="rounded-full p-1 hover:bg-accent">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {visibleMoreItems.map(({ to, icon: Icon, labelKey, color }) => (
                <button
                  key={to}
                  onClick={() => { navigate(to); setShowMore(false) }}
                  className="flex flex-col items-center gap-1.5 rounded-xl p-2 hover:bg-accent transition-colors"
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: color + '15' }}
                  >
                    <Icon className="h-5 w-5" style={{ color }} />
                  </div>
                  <span className="text-[10px] font-medium text-center leading-tight">{t(labelKey)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-around border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
        {visibleMainItems.map(({ to, icon: Icon, labelKey, isCenter }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-0.5 px-3 py-1 text-xs transition-colors',
                isCenter
                  ? 'text-primary'
                  : isActive
                    ? 'text-primary'
                    : 'text-muted-foreground',
              )
            }
          >
            <Icon className={cn('h-5 w-5', isCenter && 'h-7 w-7')} />
            <span className={cn(isCenter && 'font-medium')}>{t(labelKey)}</span>
          </NavLink>
        ))}

        {/* More button */}
        <button
          onClick={() => setShowMore(!showMore)}
          className={cn(
            'flex flex-col items-center justify-center gap-0.5 px-3 py-1 text-xs transition-colors',
            showMore ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          <Menu className="h-5 w-5" />
          <span>{t('nav.more')}</span>
        </button>
      </nav>
    </>
  )
}
