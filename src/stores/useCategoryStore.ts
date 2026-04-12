import { create } from 'zustand'
import type { Category, CategoryGroup } from '@/models/category'
import type { CategoryRepository } from '@/data/repository'

interface CategoryState {
  categories: Category[]
  isLoading: boolean
  _repo: CategoryRepository | null
  init: (repo: CategoryRepository) => void
  loadCategories: () => Promise<void>
  addCategory: (data: { name: string; group: CategoryGroup; icon: string; color: string }) => Promise<Category>
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  getExpenseCategories: () => Category[]
  getIncomeCategories: () => Category[]
}

export const useCategoryStore = create<CategoryState>()((set, get) => ({
  categories: [],
  isLoading: false,
  _repo: null,

  init: (repo) => set({ _repo: repo }),

  loadCategories: async () => {
    const repo = get()._repo
    if (!repo) return
    set({ isLoading: true })
    const categories = await repo.getAll()
    set({ categories, isLoading: false })
  },

  addCategory: async (data) => {
    const repo = get()._repo
    if (!repo) throw new Error('CategoryRepository not initialized')
    const maxOrder = Math.max(0, ...get().categories.filter((c) => c.group === data.group).map((c) => c.sortOrder))
    const cat = await repo.create({
      ...data,
      isDefault: false,
      sortOrder: maxOrder + 1,
      isActive: true,
    })
    set((s) => ({ categories: [...s.categories, cat] }))
    return cat
  },

  updateCategory: async (id, updates) => {
    const repo = get()._repo
    if (!repo) return
    const updated = await repo.update(id, updates)
    set((s) => ({ categories: s.categories.map((c) => (c.id === id ? updated : c)) }))
  },

  deleteCategory: async (id) => {
    const repo = get()._repo
    if (!repo) return
    await repo.delete(id)
    set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }))
  },

  getExpenseCategories: () => get().categories.filter((c) => c.group === 'expense' && c.isActive),
  getIncomeCategories: () => get().categories.filter((c) => c.group === 'income' && c.isActive),
}))
