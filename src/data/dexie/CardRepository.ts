import type { CreditCard } from '@/models/card'
import type { CardRepository } from '../repository'
import { db } from './DexieDatabase'
import { getDaysUntilDue } from '@/lib/date'

export class DexieCardRepository implements CardRepository {
  async getAll(): Promise<CreditCard[]> {
    return db.cards.toArray()
  }

  async getById(id: string): Promise<CreditCard | undefined> {
    return db.cards.get(id)
  }

  async create(item: Omit<CreditCard, 'id' | 'createdAt' | 'updatedAt'>): Promise<CreditCard> {
    const now = Date.now()
    const card: CreditCard = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }
    await db.cards.add(card)
    return card
  }

  async update(id: string, updates: Partial<CreditCard>): Promise<CreditCard> {
    await db.cards.update(id, { ...updates, updatedAt: Date.now() })
    const card = await db.cards.get(id)
    if (!card) throw new Error(`Card ${id} not found`)
    return card
  }

  async delete(id: string): Promise<void> {
    await db.cards.delete(id)
  }

  async getActive(): Promise<CreditCard[]> {
    return db.cards.where('isActive').equals(1).toArray()
  }

  async getUpcomingDueDates(daysAhead: number): Promise<CreditCard[]> {
    const allActive = await this.getActive()
    return allActive.filter((card) => {
      const days = getDaysUntilDue(card.dueDay)
      return days >= 0 && days <= daysAhead
    })
  }
}
