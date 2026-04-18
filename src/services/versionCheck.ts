import { Capacitor } from '@capacitor/core'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

// Current app version — bump this when releasing new builds
// For APK, this should also match the versionName in android/app/build.gradle
export const CURRENT_APP_VERSION = '1.0.0'

export interface AppVersionInfo {
  platform: string
  latest_version: string
  min_version: string
  changelog_zh?: string
  changelog_en?: string
  download_url?: string
}

export type UpdateAction = 'none' | 'optional' | 'forced'

export interface VersionCheckResult {
  action: UpdateAction
  current: string
  latest: string
  info?: AppVersionInfo
}

/**
 * Compare semantic versions. Returns:
 *   -1 if a < b
 *    0 if a == b
 *    1 if a > b
 */
function compareVersions(a: string, b: string): number {
  const aParts = a.split('.').map((p) => parseInt(p) || 0)
  const bParts = b.split('.').map((p) => parseInt(p) || 0)
  const len = Math.max(aParts.length, bParts.length)
  for (let i = 0; i < len; i++) {
    const diff = (aParts[i] || 0) - (bParts[i] || 0)
    if (diff !== 0) return diff < 0 ? -1 : 1
  }
  return 0
}

function getPlatform(): 'android' | 'ios' | 'web' {
  if (Capacitor.isNativePlatform()) {
    return Capacitor.getPlatform() === 'ios' ? 'ios' : 'android'
  }
  return 'web'
}

/**
 * Check if app needs update.
 * Returns 'forced' if current < min_version, 'optional' if current < latest, 'none' otherwise.
 */
export async function checkForUpdate(): Promise<VersionCheckResult> {
  const platform = getPlatform()
  const current = CURRENT_APP_VERSION
  const defaultResult: VersionCheckResult = { action: 'none', current, latest: current }

  if (!isSupabaseConfigured) return defaultResult

  try {
    const { data, error } = await supabase
      .from('app_versions')
      .select('*')
      .eq('platform', platform)
      .eq('is_active', true)
      .single()

    if (error || !data) return defaultResult

    const info = data as AppVersionInfo
    const latest = info.latest_version
    const min = info.min_version

    if (compareVersions(current, min) < 0) {
      return { action: 'forced', current, latest, info }
    }
    if (compareVersions(current, latest) < 0) {
      return { action: 'optional', current, latest, info }
    }
    return { action: 'none', current, latest, info }
  } catch (e) {
    console.warn('Version check failed:', e)
    return defaultResult
  }
}
