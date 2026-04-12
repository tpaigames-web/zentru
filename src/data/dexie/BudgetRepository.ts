import type { Budget } from '@/models/budget'
import type { BudgetRepository } from '../repository'
import { db } from './DexieDatabase'

export class DexieBudgetRepository implements BudgetRepository {
  async getAll(): Promise<Budget[]> {
    return db.budgets.toArray()
  }

  async getById(id: string): Promise<Budget | undefined> {
    return db.budgets.get(id)
  }

  async create(item: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<Budget> {
    const now = Date.now()
    const budget: Budget = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }
    await db.budgets.add(budget)
    return budget
  }

  async update(id: string, updates: Partial<Budget>): Promise<Budget> {
    await db.budgets.update(id, { ...updates, updatedAt: Date.now() })
    const budget = await db.budgets.get(id)
    if (!budget) throw new Error(`Budget ${id} not found`)
    return budget
  }

  async delete(id: string): Promise<void> {
    await db.budgets.delete(id)
  }

  async getActive(): Promise<Budget[]> {
    return db.budgets.where('isActive').equals(1).toArray()
  }

  async getByCategory(categoryId: string): Promise<Budget[]> {
    return db.budgets.where('categoryId').equals(categoryId).toArray()
  }
}
