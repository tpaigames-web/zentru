import { useUserStore } from '@/stores/useUserStore'

export type AdminRole = 'user' | 'support' | 'admin' | 'super_admin'

const ROLE_HIERARCHY: Record<AdminRole, number> = {
  user: 0,
  support: 1,
  admin: 2,
  super_admin: 3,
}

/**
 * Hook for checking admin permissions.
 * Returns current role and helper checks.
 */
export function useIsAdmin() {
  const { profile, user } = useUserStore()
  const role = (profile?.role || 'user') as AdminRole

  const hasRole = (required: AdminRole) => {
    return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[required]
  }

  return {
    role,
    isLoggedIn: !!user,
    isSupport: hasRole('support'),
    isAdmin: hasRole('admin'),
    isSuperAdmin: hasRole('super_admin'),
    hasRole,
  }
}
