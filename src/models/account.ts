export type AccountType = 'cash' | 'debit' | 'credit' | 'ewallet' | 'investment' | 'other'

export interface Account {
  id: string
  name: string
  type: AccountType
  balance: number
  currency: string
  linkedCardId?: string
  icon?: string
  color?: string
  isDefault: boolean
  isActive: boolean
  createdAt: number
  updatedAt: number
}
