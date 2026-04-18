export type TransactionType = 'expense' | 'income' | 'transfer'

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  currency: string
  categoryId: string
  accountId: string
  cardId?: string
  /** For transfer: destination account (savings/ewallet/bank) */
  toAccountId?: string
  /** For transfer: destination credit card (e.g. paying off card debt) */
  toCardId?: string
  /** Transfer subtype — helps categorize transfer purpose */
  transferType?: 'account_to_account' | 'account_to_card' | 'card_to_account' | 'card_to_card'
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
