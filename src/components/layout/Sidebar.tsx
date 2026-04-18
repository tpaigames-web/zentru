import { NavLink } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  CreditCard,
  Receipt,
  BarChart3,
  Settings,
  TrendingUp,
  Wallet,
  BadgePercent,
  Sparkles,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useModules } from '@/hooks/useModules'

// Each item maps to a module key; hidden if module is off
const navItems = [
  { to: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard', module: 'dashboard' },
  { to: '/cards', icon: CreditCard, labelKey: 'nav.cards', module: 'cards' },
  { to: '/transactions', icon: Receipt, labelKey: 'nav.transactions', module: 'transactions' },
  { to: '/analytics', icon: BarChart3, labelKey: 'nav.analytics', module: 'analytics_overview' },
  { to: '/predictions', icon: TrendingUp, labelKey: 'nav.predictions', module: 'predictions' },
  { to: '/budget', icon: Wallet, labelKey: 'nav.budget', module: 'budget' },
  { to: '/cashback', icon: BadgePercent, labelKey: 'nav.cashback', module: 'cashback_tracking' },
  { to: '/smart', icon: Sparkles, labelKey: 'nav.smartCard', module: 'smart_card' },
  { to: '/recurring', icon: RefreshCw, labelKey: 'nav.recurring', module: 'recurring' },
]

export function Sidebar() {
  const { t } = useTranslation()
  const { isModuleVisible } = useModules()

  const visibleItems = navItems.filter((item) => isModuleVisible(item.module))

  return (
    <aside className="hidden md:flex md:w-[var(--sidebar-width)] md:flex-col md:border-r md:bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-lg font-bold text-primary">{t('app.name')}</span>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {visibleItems.map(({ to, icon: Icon, labelKey }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
          >
            <Icon className="h-5 w-5" />
            {t(labelKey)}
          </NavLink>
        ))}

        {/* Settings always visible */}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )
          }
        >
          <Settings className="h-5 w-5" />
          {t('nav.settings')}
        </NavLink>
      </nav>
    </aside>
  )
}
