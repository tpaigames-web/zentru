import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useModules } from '@/hooks/useModules'

interface ModuleGuardProps {
  module: string
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Route guard: redirects to /404 if module is disabled or hidden.
 * Usage: <ModuleGuard module="budget"><BudgetPage /></ModuleGuard>
 */
export function ModuleGuard({ module, children, fallback }: ModuleGuardProps) {
  const { isModuleVisible, loading } = useModules()

  // While loading, show nothing (prevents flash)
  if (loading) return null

  if (!isModuleVisible(module)) {
    return fallback ? <>{fallback}</> : <Navigate to="/" replace />
  }

  return <>{children}</>
}
