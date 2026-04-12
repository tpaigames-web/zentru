import type { RecurringTransaction } from '@/models/recurring'
import type { RecurringRepository } from '../repository'
import { db } from './DexieDatabase'

export class DexieRecurringRepository implements RecurringRepository {
  async getAll(): Promise<RecurringTransaction[]> {
    return db.recurringTransactions.toArray()
  }

  async getById(id: string): Promise<RecurringTransaction | undefined> {
    return db.recurringTransactions.get(id)
  }

  async create(item: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<RecurringTransaction> {
    const now = Date.now()
    const recurring: RecurringTransaction = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }
    await db.recurringTransactions.add(recurring)
    return recurring
  }

  async update(id: string, updates: Partial<RecurringTransaction>): Promise<RecurringTransaction> {
    await db.recurringTransactions.update(id, { ...updates, updatedAt: Date.now() })
    const recurring = await db.recurringTransactions.get(id)
    if (!recurring) throw new Error(`RecurringTransaction ${id} not found`)
    return recurring
  }

  async delete(id: string): Promise<void> {
    await db.recurringTransactions.delete(id)
  }

  async getActive(): Promise<RecurringTransaction[]> {
    return db.recurringTransactions.where('isActive').equals(1).toArray()
  }

  async getDue(beforeDate: number): Promise<RecurringTransaction[]> {
    const active = await this.getActive()
    return active.filter((r) => !r.lastGeneratedDate || r.lastGeneratedDate < beforeDate)
  }
}
