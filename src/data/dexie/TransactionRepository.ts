import type { Transaction } from '@/models/transaction'
import type { TransactionRepository, MonthlyTotal } from '../repository'
import { db } from './DexieDatabase'

export class DexieTransactionRepository implements TransactionRepository {
  async getAll(): Promise<Transaction[]> {
    return db.transactions.orderBy('date').reverse().toArray()
  }

  async getById(id: string): Promise<Transaction | undefined> {
    return db.transactions.get(id)
  }

  async create(item: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const now = Date.now()
    const transaction: Transaction = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }
    await db.transactions.add(transaction)
    return transaction
  }

  async update(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    await db.transactions.update(id, { ...updates, updatedAt: Date.now() })
    const transaction = await db.transactions.get(id)
    if (!transaction) throw new Error(`Transaction ${id} not found`)
    return transaction
  }

  async delete(id: string): Promise<void> {
    await db.transactions.delete(id)
  }

  async getByDateRange(start: number, end: number): Promise<Transaction[]> {
    return db.transactions
      .where('date')
      .between(start, end, true, true)
      .reverse()
      .toArray()
  }

  async getByCard(cardId: string): Promise<Transaction[]> {
    return db.transactions.where('cardId').equals(cardId).reverse().toArray()
  }

  async getByCategory(categoryId: string): Promise<Transaction[]> {
    return db.transactions.where('categoryId').equals(categoryId).reverse().toArray()
  }

  async getByAccount(accountId: string): Promise<Transaction[]> {
    return db.transactions.where('accountId').equals(accountId).reverse().toArray()
  }

  async getMonthlyTotals(year: number): Promise<MonthlyTotal[]> {
    const startOfYear = new Date(year, 0, 1).getTime()
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999).getTime()

    const transactions = await db.transactions
      .where('date')
      .between(startOfYear, endOfYear, true, true)
      .toArray()

    const monthlyMap = new Map<number, MonthlyTotal>()

    for (let m = 0; m < 12; m++) {
      monthlyMap.set(m, { year, month: m + 1, income: 0, expense: 0 })
    }

    for (const tx of transactions) {
      const month = new Date(tx.date).getMonth()
      const total = monthlyMap.get(month)!
      if (tx.type === 'income') {
        total.income += tx.amount
      } else if (tx.type === 'expense') {
        total.expense += tx.amount
      }
    }

    return Array.from(monthlyMap.values())
  }
}
