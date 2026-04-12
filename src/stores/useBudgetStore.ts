import { create } from 'zustand'
import type { Budget } from '@/models/budget'
import type { BudgetRepository } from '@/data/repository'

interface BudgetState {
  budgets: Budget[]
  isLoading: boolean
  _repo: BudgetRepository | null
  init: (repo: BudgetRepository) => void
  loadBudgets: () => Promise<void>
  addBudget: (data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Budget>
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>
  deleteBudget: (id: string) => Promise<void>
}

export const useBudgetStore = create<BudgetState>()((set, get) => ({
  budgets: [],
  isLoading: false,
  _repo: null,

  init: (repo) => set({ _repo: repo }),

  loadBudgets: async () => {
    const repo = get()._repo
    if (!repo) return
    set({ isLoading: true })
    const budgets = await repo.getAll()
    set({ budgets, isLoading: false })
  },

  addBudget: async (data) => {
    const repo = get()._repo
    if (!repo) throw new Error('BudgetRepository not initialized')
    const budget = await repo.create(data)
    set((s) => ({ budgets: [budget, ...s.budgets] }))
    return budget
  },

  updateBudget: async (id, updates) => {
    const repo = get()._repo
    if (!repo) return
    const updated = await repo.update(id, updates)
    set((s) => ({ budgets: s.budgets.map((b) => (b.id === id ? updated : b)) }))
  },

  deleteBudget: async (id) => {
    const repo = get()._repo
    if (!repo) return
    await repo.delete(id)
    set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) }))
  },
}))
