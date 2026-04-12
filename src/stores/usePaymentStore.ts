import { create } from 'zustand'
import type { CardPayment } from '@/models/payment'
import { DexiePaymentRepository } from '@/data/dexie/PaymentRepository'
import { useCardStore } from './useCardStore'

const repo = new DexiePaymentRepository()

interface PaymentState {
  payments: CardPayment[]
  isLoading: boolean
  loadPayments: () => Promise<void>
  loadByCard: (cardId: string) => Promise<void>
  addPayment: (data: { cardId: string; amount: number; date: number; notes?: string }) => Promise<CardPayment>
  deletePayment: (id: string) => Promise<void>
}

export const usePaymentStore = create<PaymentState>()((set) => ({
  payments: [],
  isLoading: false,

  loadPayments: async () => {
    set({ isLoading: true })
    const payments = await repo.getAll()
    set({ payments, isLoading: false })
  },

  loadByCard: async (cardId: string) => {
    set({ isLoading: true })
    const payments = await repo.getByCard(cardId)
    set({ payments, isLoading: false })
  },

  addPayment: async (data) => {
    const payment = await repo.create(data)
    set((s) => ({ payments: [payment, ...s.payments] }))

    // Reduce card balance
    const cardStore = useCardStore.getState()
    const card = cardStore.cards.find((c) => c.id === data.cardId)
    if (card) {
      const newBalance = Math.max(0, card.currentBalance - data.amount)
      await cardStore.updateCard(data.cardId, { currentBalance: newBalance })
    }

    return payment
  },

  deletePayment: async (id: string) => {
    const payment = await repo.getById(id)
    if (!payment) return

    await repo.delete(id)
    set((s) => ({ payments: s.payments.filter((p) => p.id !== id) }))

    // Restore card balance
    const cardStore = useCardStore.getState()
    const card = cardStore.cards.find((c) => c.id === payment.cardId)
    if (card) {
      const newBalance = card.currentBalance + payment.amount
      await cardStore.updateCard(payment.cardId, { currentBalance: newBalance })
    }
  },
}))
