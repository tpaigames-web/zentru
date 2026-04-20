import { useEffect, useState, useCallback } from 'react'
import { getAiScanRemaining } from '@/services/aiReceiptScanner'
import { useUserStore } from '@/stores/useUserStore'

interface AiScanQuota {
  remaining: number
  limit: number
  used: number
  loading: boolean
  /** True if the user can currently use AI scan (has remaining > 0) */
  canUse: boolean
  /** Manually re-fetch (call after a successful AI scan to update display) */
  refresh: () => Promise<void>
}

/**
 * Fetch the current month's AI scan quota from Supabase RPC.
 * Returns stable defaults while loading; real values after first fetch.
 *
 * Usage:
 *   const { canUse, remaining, limit, refresh } = useAiScanQuota()
 *   // after successful scan:
 *   refresh()
 */
export function useAiScanQuota(): AiScanQuota {
  const { user } = useUserStore()
  const [remaining, setRemaining] = useState(0)
  const [limit, setLimit] = useState(0)
  const [used, setUsed] = useState(0)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) {
      setRemaining(0)
      setLimit(0)
      setUsed(0)
      return
    }
    setLoading(true)
    try {
      const res = await getAiScanRemaining()
      if (res) {
        setRemaining(res.remaining)
        setLimit(res.limit)
        setUsed(res.used)
      }
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    remaining,
    limit,
    used,
    loading,
    canUse: remaining > 0,
    refresh,
  }
}
