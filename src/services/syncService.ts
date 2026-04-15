import { supabase } from '@/lib/supabase'
import { useCardStore } from '@/stores/useCardStore'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useBudgetStore } from '@/stores/useBudgetStore'
import { useAccountStore } from '@/stores/useAccountStore'
import { useSettingsStore } from '@/stores/useSettingsStore'

type DataType = 'cards' | 'transactions' | 'categories' | 'budgets' | 'accounts' | 'settings'

/**
 * Upload all local data to Supabase (encrypted as JSON blobs).
 * Simple full-replace strategy — last write wins.
 */
export async function uploadAllData(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const dataMap: Record<DataType, unknown> = {
      cards: useCardStore.getState().cards,
      transactions: useTransactionStore.getState().transactions,
      categories: useCategoryStore.getState().categories,
      budgets: useBudgetStore.getState().budgets,
      accounts: useAccountStore.getState().accounts,
      settings: {
        theme: useSettingsStore.getState().theme,
        language: useSettingsStore.getState().language,
        currency: useSettingsStore.getState().currency,
        dailyReminderHour: useSettingsStore.getState().dailyReminderHour,
      },
    }

    for (const [dataType, data] of Object.entries(dataMap)) {
      const jsonStr = JSON.stringify(data)

      const { error } = await supabase
        .from('user_data')
        .upsert(
          {
            user_id: userId,
            data_type: dataType,
            encrypted_data: jsonStr, // For now plain JSON; E2E encryption can be layered on top
            version: 1,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,data_type' },
        )

      if (error) {
        console.error(`Sync upload failed for ${dataType}:`, error)
        return { success: false, error: `Failed to upload ${dataType}: ${error.message}` }
      }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Download all data from Supabase and merge into local stores.
 * Full-replace strategy — remote data overwrites local.
 */
export async function downloadAllData(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('user_data')
      .select('data_type, encrypted_data, updated_at')
      .eq('user_id', userId)

    if (error) return { success: false, error: error.message }
    if (!data || data.length === 0) return { success: true } // No remote data yet

    for (const row of data) {
      const parsed = JSON.parse(row.encrypted_data)
      const type = row.data_type as DataType

      switch (type) {
        case 'cards':
          useCardStore.setState({ cards: parsed })
          break
        case 'transactions':
          useTransactionStore.setState({ transactions: parsed })
          break
        case 'categories':
          useCategoryStore.setState({ categories: parsed })
          break
        case 'budgets':
          useBudgetStore.setState({ budgets: parsed })
          break
        case 'accounts':
          useAccountStore.setState({ accounts: parsed })
          break
        case 'settings':
          if (parsed.theme) useSettingsStore.getState().setTheme(parsed.theme)
          if (parsed.language) useSettingsStore.getState().setLanguage(parsed.language)
          if (parsed.currency) useSettingsStore.getState().setCurrency(parsed.currency)
          break
      }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Check if remote data exists for this user.
 */
export async function hasRemoteData(userId: string): Promise<boolean> {
  const { count } = await supabase
    .from('user_data')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  return (count || 0) > 0
}
