import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { ShieldAlert } from 'lucide-react'
import { useIsAdmin, type AdminRole } from '@/hooks/useIsAdmin'
import { useUserStore } from '@/stores/useUserStore'

interface AdminGuardProps {
  required?: AdminRole
  children: ReactNode
}

/**
 * Route guard for admin pages.
 * Redirects to / if user doesn't have required role.
 * Shows access denied if logged in but insufficient role.
 */
export function AdminGuard({ required = 'admin', children }: AdminGuardProps) {
  const { user } = useUserStore()
  const { hasRole, role } = useIsAdmin()

  // Not logged in
  if (!user) {
    return <Navigate to="/" replace />
  }

  // Insufficient role
  if (!hasRole(required)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
          <ShieldAlert className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-lg font-bold">Access Denied</h2>
        <p className="mt-2 text-sm text-muted-foreground text-center max-w-xs">
          This page requires <span className="font-semibold">{required}</span> role.
          Your current role: <span className="font-semibold">{role}</span>
        </p>
        <a
          href="/"
          className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Back to Home
        </a>
      </div>
    )
  }

  return <>{children}</>
}
