export type CategoryGroup = 'expense' | 'income'

export interface Category {
  id: string
  name: string
  nameKey?: string
  group: CategoryGroup
  icon: string
  color: string
  parentId?: string
  isDefault: boolean
  sortOrder: number
  isActive: boolean
  createdAt: number
}
