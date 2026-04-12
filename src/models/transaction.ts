export type TransactionType = 'expense' | 'income' | 'transfer'

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  currency: string
  categoryId: string
  accountId: string
  cardId?: string
  toAccountId?: string
  date: number
  merchant?: string
  notes?: string
  tags?: string[]
  recurringId?: string
  cashbackAmount?: number
  cashbackRate?: number
  isTaxDeductible?: boolean
  taxCategory?: string
  importSource?: 'manual' | 'csv' | 'excel' | 'pdf'
  isConfirmed: boolean
  createdAt: number
  updatedAt: number
}
