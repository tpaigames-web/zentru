import { useEffect, useRef } from 'react'
import { useData } from '@/data/DataProvider'
import { useCardStore } from '@/stores/useCardStore'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useBudgetStore } from '@/stores/useBudgetStore'
import { useAccountStore } from '@/stores/useAccountStore'
import { generatePendingTransactions } from '@/services/recurring'
import {
  requestNotificationPermission,
  createNotificationChannels,
  schedulePaymentReminders,
  scheduleDailyReminder,
  showPersistentNotification,
} from '@/services/notification'
import { useSettingsStore } from '@/stores/useSettingsStore'

export function useInitStores() {
  const repos = useData()
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    useCardStore.getState().init(repos.cards)
    useTransactionStore.getState().init(repos.transactions)
    useCategoryStore.getState().init(repos.categories)
    useBudgetStore.getState().init(repos.budgets)
    useAccountStore.getState().init(repos.accounts)

    Promise.all([
      useCardStore.getState().loadCards(),
      useTransactionStore.getState().loadTransactions(),
      useCategoryStore.getState().loadCategories(),
      useBudgetStore.getState().loadBudgets(),
      useAccountStore.getState().loadAccounts(),
    ]).then(async () => {
      // Auto-generate recurring transactions
      const recurring = await repos.recurring.getActive()
      if (recurring.length > 0) {
        const pending = generatePendingTransactions(recurring)
        for (const { recurringId, transactions } of pending) {
          for (const tx of transactions) {
            await repos.transactions.create(tx)
          }
          const lastTx = transactions[transactions.length - 1]
          await repos.recurring.update(recurringId, { lastGeneratedDate: lastTx.date })
        }
        if (pending.length > 0) {
          await useTransactionStore.getState().loadTransactions()
        }
      }

      // Setup notifications
      try {
        // 1. Request permission (will prompt user on first launch)
        const granted = await requestNotificationPermission()

        if (granted) {
          // 2. Create notification channels (Android 8+)
          await createNotificationChannels()

          // 3. Schedule payment reminders
          const cards = useCardStore.getState().cards
          await schedulePaymentReminders(cards)

          // 4. Schedule daily tracking reminder
          await scheduleDailyReminder()

          // 5. Show persistent quick-entry notification (if enabled)
          if (useSettingsStore.getState().persistentNotification) {
            await showPersistentNotification()
          }
        }
      } catch {
        // Silently fail if notifications not supported
      }
    })
  }, [repos])
}
