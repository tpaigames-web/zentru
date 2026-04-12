export type BudgetPeriod = 'monthly' | 'weekly' | 'yearly'

export interface Budget {
  id: string
  name: string
  categoryId?: string
  amount: number
  period: BudgetPeriod
  startDate: number
  endDate?: number
  alertThreshold: number
  isActive: boolean
  createdAt: number
  updatedAt: number
}
