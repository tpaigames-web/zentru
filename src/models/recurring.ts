import type { Transaction } from './transaction'

export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'

export interface RecurringTransaction {
  id: string
  templateTransaction: Omit<Transaction, 'id' | 'date' | 'createdAt' | 'updatedAt'>
  frequency: RecurrenceFrequency
  dayOfMonth?: number
  dayOfWeek?: number
  startDate: number
  endDate?: number
  lastGeneratedDate?: number
  isActive: boolean
  createdAt: number
  updatedAt: number
}
