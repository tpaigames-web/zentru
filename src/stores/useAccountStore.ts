import { create } from 'zustand'
import type { Account, AccountType } from '@/models/account'
import type { AccountRepository } from '@/data/repository'

interface AccountState {
  accounts: Account[]
  isLoading: boolean
  _repo: AccountRepository | null
  init: (repo: AccountRepository) => void
  loadAccounts: () => Promise<void>
  addAccount: (data: { name: string; type: AccountType; icon: string; color: string }) => Promise<Account>
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>
  deleteAccount: (id: string) => Promise<void>
  getActiveAccounts: () => Account[]
}

export const useAccountStore = create<AccountState>()((set, get) => ({
  accounts: [],
  isLoading: false,
  _repo: null,

  init: (repo) => set({ _repo: repo }),

  loadAccounts: async () => {
    const repo = get()._repo
    if (!repo) return
    set({ isLoading: true })
    const accounts = await repo.getAll()
    set({ accounts, isLoading: false })
  },

  addAccount: async (data) => {
    const repo = get()._repo
    if (!repo) throw new Error('AccountRepository not initialized')
    const account = await repo.create({
      ...data,
      balance: 0,
      currency: 'MYR',
      isDefault: false,
      isActive: true,
    })
    set((s) => ({ accounts: [...s.accounts, account] }))
    return account
  },

  updateAccount: async (id, updates) => {
    const repo = get()._repo
    if (!repo) return
    const updated = await repo.update(id, updates)
    set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? updated : a)) }))
  },

  deleteAccount: async (id) => {
    const repo = get()._repo
    if (!repo) return
    await repo.delete(id)
    set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) }))
  },

  getActiveAccounts: () => get().accounts.filter((a) => a.isActive),
}))
