import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { DataRepositories } from './repository'
import { DexieCardRepository } from './dexie/CardRepository'
import { DexieAccountRepository } from './dexie/AccountRepository'
import { DexieTransactionRepository } from './dexie/TransactionRepository'
import { DexieCategoryRepository } from './dexie/CategoryRepository'
import { DexieBudgetRepository } from './dexie/BudgetRepository'
import { DexieRecurringRepository } from './dexie/RecurringRepository'

const DataContext = createContext<DataRepositories | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const repos = useMemo<DataRepositories>(
    () => ({
      cards: new DexieCardRepository(),
      accounts: new DexieAccountRepository(),
      transactions: new DexieTransactionRepository(),
      categories: new DexieCategoryRepository(),
      budgets: new DexieBudgetRepository(),
      recurring: new DexieRecurringRepository(),
    }),
    [],
  )

  return <DataContext.Provider value={repos}>{children}</DataContext.Provider>
}

export function useData(): DataRepositories {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
