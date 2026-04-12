import type { CreditCard, Account, Transaction, Category, Budget, RecurringTransaction } from '@/models'

export interface Repository<T> {
  getAll(): Promise<T[]>
  getById(id: string): Promise<T | undefined>
  create(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>
  update(id: string, updates: Partial<T>): Promise<T>
  delete(id: string): Promise<void>
}

export interface MonthlyTotal {
  year: number
  month: number
  income: number
  expense: number
}

export interface CardRepository extends Repository<CreditCard> {
  getActive(): Promise<CreditCard[]>
  getUpcomingDueDates(daysAhead: number): Promise<CreditCard[]>
}

export interface AccountRepository extends Repository<Account> {
  getActive(): Promise<Account[]>
  getByType(type: string): Promise<Account[]>
}

export interface TransactionRepository extends Repository<Transaction> {
  getByDateRange(start: number, end: number): Promise<Transaction[]>
  getByCard(cardId: string): Promise<Transaction[]>
  getByCategory(categoryId: string): Promise<Transaction[]>
  getByAccount(accountId: string): Promise<Transaction[]>
  getMonthlyTotals(year: number): Promise<MonthlyTotal[]>
}

export interface CategoryRepository extends Repository<Category> {
  getByGroup(group: 'expense' | 'income'): Promise<Category[]>
  getActive(): Promise<Category[]>
}

export interface BudgetRepository extends Repository<Budget> {
  getActive(): Promise<Budget[]>
  getByCategory(categoryId: string): Promise<Budget[]>
}

export interface RecurringRepository extends Repository<RecurringTransaction> {
  getActive(): Promise<RecurringTransaction[]>
  getDue(beforeDate: number): Promise<RecurringTransaction[]>
}

export interface DataRepositories {
  cards: CardRepository
  accounts: AccountRepository
  transactions: TransactionRepository
  categories: CategoryRepository
  budgets: BudgetRepository
  recurring: RecurringRepository
}
