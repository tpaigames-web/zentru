import type { Category } from '@/models/category'
import type { CategoryRepository } from '../repository'
import { db } from './DexieDatabase'

export class DexieCategoryRepository implements CategoryRepository {
  async getAll(): Promise<Category[]> {
    return db.categories.orderBy('sortOrder').toArray()
  }

  async getById(id: string): Promise<Category | undefined> {
    return db.categories.get(id)
  }

  async create(item: Omit<Category, 'id' | 'createdAt'>): Promise<Category> {
    const category: Category = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    }
    await db.categories.add(category)
    return category
  }

  async update(id: string, updates: Partial<Category>): Promise<Category> {
    await db.categories.update(id, updates)
    const category = await db.categories.get(id)
    if (!category) throw new Error(`Category ${id} not found`)
    return category
  }

  async delete(id: string): Promise<void> {
    await db.categories.delete(id)
  }

  async getByGroup(group: 'expense' | 'income'): Promise<Category[]> {
    return db.categories.where('group').equals(group).sortBy('sortOrder')
  }

  async getActive(): Promise<Category[]> {
    return db.categories.where('isActive').equals(1).sortBy('sortOrder')
  }
}
