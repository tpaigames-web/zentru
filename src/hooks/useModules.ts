import { useEffect, useMemo } from 'react'
import { useModulesStore, isModuleVisible as checkVisible } from '@/stores/useModulesStore'
import { useUserStore } from '@/stores/useUserStore'

/**
 * Hook for checking module visibility.
 * Auto-loads modules on mount and when user changes.
 */
export function useModules() {
  const { modules, userPrefs, presets, loading, loadModules, loadUserPrefs } = useModulesStore()
  const { user, isPremium } = useUserStore()

  useEffect(() => {
    loadModules()
  }, [loadModules])

  useEffect(() => {
    if (user?.id) {
      loadUserPrefs(user.id)
    }
  }, [user?.id, loadUserPrefs])

  const isModuleVisible = useMemo(() => {
    return (moduleKey: string) => checkVisible(moduleKey, modules, userPrefs, isPremium)
  }, [modules, userPrefs, isPremium])

  const visibleModules = useMemo(() => {
    return modules
      .filter((m) => checkVisible(m.key, modules, userPrefs, isPremium))
      .sort((a, b) => a.sort_order - b.sort_order)
  }, [modules, userPrefs, isPremium])

  return {
    modules,
    visibleModules,
    userPrefs,
    presets,
    loading,
    isModuleVisible,
  }
}
