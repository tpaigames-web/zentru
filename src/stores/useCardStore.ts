import { create } from 'zustand'
import type { CreditCard } from '@/models/card'
import type { CardRepository } from '@/data/repository'

interface CardState {
  cards: CreditCard[]
  isLoading: boolean
  _repo: CardRepository | null
  init: (repo: CardRepository) => void
  loadCards: () => Promise<void>
  addCard: (data: Omit<CreditCard, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CreditCard>
  updateCard: (id: string, updates: Partial<CreditCard>) => Promise<void>
  deleteCard: (id: string) => Promise<void>
}

export const useCardStore = create<CardState>()((set, get) => ({
  cards: [],
  isLoading: false,
  _repo: null,

  init: (repo) => {
    set({ _repo: repo })
  },

  loadCards: async () => {
    const repo = get()._repo
    if (!repo) return
    set({ isLoading: true })
    const cards = await repo.getAll()
    set({ cards, isLoading: false })
  },

  addCard: async (data) => {
    const repo = get()._repo
    if (!repo) throw new Error('CardRepository not initialized')
    const card = await repo.create(data)
    set((s) => ({ cards: [card, ...s.cards] }))
    return card
  },

  updateCard: async (id, updates) => {
    const repo = get()._repo
    if (!repo) return
    const updated = await repo.update(id, updates)
    set((s) => ({ cards: s.cards.map((c) => (c.id === id ? updated : c)) }))
  },

  deleteCard: async (id) => {
    const repo = get()._repo
    if (!repo) return
    await repo.delete(id)
    set((s) => ({ cards: s.cards.filter((c) => c.id !== id) }))
  },
}))
