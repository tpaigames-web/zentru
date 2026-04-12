import { NavLink } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  CreditCard,
  PlusCircle,
  BarChart3,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { to: '/cards', icon: CreditCard, labelKey: 'nav.cards' },
  { to: '/transactions/new', icon: PlusCircle, labelKey: 'nav.add', isCenter: true },
  { to: '/analytics', icon: BarChart3, labelKey: 'nav.analytics' },
  { to: '/settings', icon: Settings, labelKey: 'nav.settings' },
]

export function BottomNav() {
  const { t } = useTranslation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-around border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      {navItems.map(({ to, icon: Icon, labelKey, isCenter }) => (
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
    </nav>
  )
}
