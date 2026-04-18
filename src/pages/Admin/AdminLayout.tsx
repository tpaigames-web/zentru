import { Outlet, NavLink } from 'react-router'
import {
  LayoutDashboard, Users, Layers, FileSearch, Cog,
  ClipboardList, Radio, Key, History, DollarSign,
  Home, ShieldCheck,
} from 'lucide-react'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { cn } from '@/lib/utils'

interface NavItem {
  path: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  required: 'support' | 'admin' | 'super_admin'
}

const navItems: NavItem[] = [
  { path: '/internal/ops',            label: 'Dashboard',    icon: LayoutDashboard, required: 'support' },
  { path: '/internal/ops/users',      label: 'Users',        icon: Users,           required: 'support' },
  { path: '/internal/ops/modules',    label: 'Modules',      icon: Layers,          required: 'admin' },
  { path: '/internal/ops/samples',    label: 'Samples',      icon: FileSearch,      required: 'admin' },
  { path: '/internal/ops/versions',   label: 'Versions',     icon: Cog,             required: 'super_admin' },
  { path: '/internal/ops/broadcasts', label: 'Broadcasts',   icon: Radio,           required: 'admin' },
  { path: '/internal/ops/audit',      label: 'Audit Log',    icon: ClipboardList,   required: 'super_admin' },
  { path: '/internal/ops/roles',      label: 'Roles',        icon: ShieldCheck,     required: 'super_admin' },
  { path: '/internal/ops/api-keys',   label: 'API Keys',     icon: Key,             required: 'super_admin' },
  { path: '/internal/ops/revenue',    label: 'Revenue',      icon: DollarSign,      required: 'admin' },
]

export function AdminLayout() {
  const { role, hasRole } = useIsAdmin()
  const visibleItems = navItems.filter((item) => hasRole(item.required))

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {/* Admin Sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r bg-card">
        <div className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold">Zentru Ops</span>
          </div>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            {role}
          </span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/internal/ops'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t p-2">
          <a
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
            Back to App
          </a>
          <a
            href="/internal/ops/audit"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-accent transition-colors"
            style={{ display: hasRole('super_admin') ? 'flex' : 'none' }}
          >
            <History className="h-3 w-3" />
            Audit log active
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b px-4 md:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold">Zentru Ops</span>
          </div>
          <a href="/" className="text-xs text-primary">← App</a>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
