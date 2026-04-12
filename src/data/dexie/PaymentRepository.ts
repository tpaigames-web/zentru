import type { CardPayment } from '@/models/payment'
import { db } from './DexieDatabase'

export class DexiePaymentRepository {
  async getAll(): Promise<CardPayment[]> {
    return db.payments.orderBy('date').reverse().toArray()
  }

  async getByCard(cardId: string): Promise<CardPayment[]> {
    return db.payments.where('cardId').equals(cardId).reverse().toArray()
  }

  async create(item: Omit<CardPayment, 'id' | 'createdAt'>): Promise<CardPayment> {
    const payment: CardPayment = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    }
    await db.payments.add(payment)
    return payment
  }

  async delete(id: string): Promise<void> {
    await db.payments.delete(id)
  }

  async getById(id: string): Promise<CardPayment | undefined> {
    return db.payments.get(id)
  }
}
