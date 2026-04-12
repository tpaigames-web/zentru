import type { Account } from '@/models/account'
import type { AccountRepository } from '../repository'
import { db } from './DexieDatabase'

export class DexieAccountRepository implements AccountRepository {
  async getAll(): Promise<Account[]> {
    return db.accounts.toArray()
  }

  async getById(id: string): Promise<Account | undefined> {
    return db.accounts.get(id)
  }

  async create(item: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<Account> {
    const now = Date.now()
    const account: Account = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }
    await db.accounts.add(account)
    return account
  }

  async update(id: string, updates: Partial<Account>): Promise<Account> {
    await db.accounts.update(id, { ...updates, updatedAt: Date.now() })
    const account = await db.accounts.get(id)
    if (!account) throw new Error(`Account ${id} not found`)
    return account
  }

  async delete(id: string): Promise<void> {
    await db.accounts.delete(id)
  }

  async getActive(): Promise<Account[]> {
    return db.accounts.where('isActive').equals(1).toArray()
  }

  async getByType(type: string): Promise<Account[]> {
    return db.accounts.where('type').equals(type).toArray()
  }
}
