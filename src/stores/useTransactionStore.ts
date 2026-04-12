import { create } from 'zustand'
import type { Transaction } from '@/models/transaction'
import type { TransactionRepository } from '@/data/repository'

interface TransactionState {
  transactions: Transaction[]
  isLoading: boolean
  _repo: TransactionRepository | null
  init: (repo: TransactionRepository) => void
  loadTransactions: () => Promise<void>
  loadByDateRange: (start: number, end: number) => Promise<void>
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Transaction>
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
}

export const useTransactionStore = create<TransactionState>()((set, get) => ({
  transactions: [],
  isLoading: false,
  _repo: null,

  init: (repo) => {
    set({ _repo: repo })
  },

  loadTransactions: async () => {
    const repo = get()._repo
    if (!repo) return
    set({ isLoading: true })
    const transactions = await repo.getAll()
    set({ transactions, isLoading: false })
  },

  loadByDateRange: async (start, end) => {
    const repo = get()._repo
    if (!repo) return
    set({ isLoading: true })
    const transactions = await repo.getByDateRange(start, end)
    set({ transactions, isLoading: false })
  },

  addTransaction: async (data) => {
    const repo = get()._repo
    if (!repo) throw new Error('TransactionRepository not initialized')
    const tx = await repo.create(data)
    set((s) => ({ transactions: [tx, ...s.transactions] }))
    return tx
  },

  updateTransaction: async (id, updates) => {
    const repo = get()._repo
    if (!repo) return
    const updated = await repo.update(id, updates)
    set((s) => ({ transactions: s.transactions.map((t) => (t.id === id ? updated : t)) }))
  },

  deleteTransaction: async (id) => {
    const repo = get()._repo
    if (!repo) return
    await repo.delete(id)
    set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }))
  },
}))
