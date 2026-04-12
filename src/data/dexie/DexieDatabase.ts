import Dexie, { type EntityTable } from 'dexie'
import type { CreditCard } from '@/models/card'
import type { Account } from '@/models/account'
import type { Transaction } from '@/models/transaction'
import type { Category } from '@/models/category'
import type { Budget } from '@/models/budget'
import type { RecurringTransaction } from '@/models/recurring'
import type { CardPayment } from '@/models/payment'

export class ZentruDB extends Dexie {
  cards!: EntityTable<CreditCard, 'id'>
  accounts!: EntityTable<Account, 'id'>
  transactions!: EntityTable<Transaction, 'id'>
  categories!: EntityTable<Category, 'id'>
  budgets!: EntityTable<Budget, 'id'>
  recurringTransactions!: EntityTable<RecurringTransaction, 'id'>
  payments!: EntityTable<CardPayment, 'id'>

  constructor() {
    super('ZentruDB')

    this.version(1).stores({
      cards: 'id, bank, isActive, dueDay',
      accounts: 'id, type, linkedCardId, isActive',
      transactions: 'id, type, categoryId, accountId, cardId, date, [date+type], [categoryId+date]',
      categories: 'id, group, parentId, isDefault, sortOrder, isActive',
      budgets: 'id, categoryId, period, isActive',
      recurringTransactions: 'id, isActive, lastGeneratedDate',
    })

    this.version(2).stores({
      cards: 'id, bank, isActive, dueDay',
      accounts: 'id, type, linkedCardId, isActive',
      transactions: 'id, type, categoryId, accountId, cardId, date, [date+type], [categoryId+date]',
      categories: 'id, group, parentId, isDefault, sortOrder, isActive',
      budgets: 'id, categoryId, period, isActive',
      recurringTransactions: 'id, isActive, lastGeneratedDate',
      payments: 'id, cardId, date',
    })
  }
}

export const db = new ZentruDB()
