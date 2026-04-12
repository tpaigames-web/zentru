import type { Category } from '@/models/category'
import type { Account } from '@/models/account'
import { db } from './dexie/DexieDatabase'

const DEFAULT_EXPENSE_CATEGORIES: Omit<Category, 'id' | 'createdAt'>[] = [
  { name: '餐饮', nameKey: 'category.food', group: 'expense', icon: 'Utensils', color: '#ef4444', isDefault: true, sortOrder: 1, isActive: true },
  { name: '交通', nameKey: 'category.transport', group: 'expense', icon: 'Car', color: '#3b82f6', isDefault: true, sortOrder: 2, isActive: true },
  { name: '购物', nameKey: 'category.shopping', group: 'expense', icon: 'ShoppingBag', color: '#f59e0b', isDefault: true, sortOrder: 3, isActive: true },
  { name: '娱乐', nameKey: 'category.entertainment', group: 'expense', icon: 'Gamepad2', color: '#8b5cf6', isDefault: true, sortOrder: 4, isActive: true },
  { name: '住房', nameKey: 'category.housing', group: 'expense', icon: 'Home', color: '#06b6d4', isDefault: true, sortOrder: 5, isActive: true },
  { name: '水电煤', nameKey: 'category.utilities', group: 'expense', icon: 'Zap', color: '#eab308', isDefault: true, sortOrder: 6, isActive: true },
  { name: '医疗', nameKey: 'category.medical', group: 'expense', icon: 'Heart', color: '#ec4899', isDefault: true, sortOrder: 7, isActive: true },
  { name: '教育', nameKey: 'category.education', group: 'expense', icon: 'GraduationCap', color: '#14b8a6', isDefault: true, sortOrder: 8, isActive: true },
  { name: '旅行', nameKey: 'category.travel', group: 'expense', icon: 'Plane', color: '#0ea5e9', isDefault: true, sortOrder: 9, isActive: true },
  { name: '服饰', nameKey: 'category.clothing', group: 'expense', icon: 'Shirt', color: '#d946ef', isDefault: true, sortOrder: 10, isActive: true },
  { name: '数码', nameKey: 'category.digital', group: 'expense', icon: 'Smartphone', color: '#6366f1', isDefault: true, sortOrder: 11, isActive: true },
  { name: '礼物', nameKey: 'category.gifts', group: 'expense', icon: 'Gift', color: '#f43f5e', isDefault: true, sortOrder: 12, isActive: true },
  { name: '宠物', nameKey: 'category.pets', group: 'expense', icon: 'PawPrint', color: '#a855f7', isDefault: true, sortOrder: 13, isActive: true },
  { name: '其他支出', nameKey: 'category.other_expense', group: 'expense', icon: 'MoreHorizontal', color: '#64748b', isDefault: true, sortOrder: 14, isActive: true },
]

const DEFAULT_INCOME_CATEGORIES: Omit<Category, 'id' | 'createdAt'>[] = [
  { name: '工资', nameKey: 'category.salary', group: 'income', icon: 'Banknote', color: '#22c55e', isDefault: true, sortOrder: 1, isActive: true },
  { name: '奖金', nameKey: 'category.bonus', group: 'income', icon: 'Trophy', color: '#f59e0b', isDefault: true, sortOrder: 2, isActive: true },
  { name: '投资收益', nameKey: 'category.investment_income', group: 'income', icon: 'TrendingUp', color: '#3b82f6', isDefault: true, sortOrder: 3, isActive: true },
  { name: '兼职', nameKey: 'category.freelance', group: 'income', icon: 'Briefcase', color: '#8b5cf6', isDefault: true, sortOrder: 4, isActive: true },
  { name: '退款', nameKey: 'category.refund', group: 'income', icon: 'RotateCcw', color: '#06b6d4', isDefault: true, sortOrder: 5, isActive: true },
  { name: '其他收入', nameKey: 'category.other_income', group: 'income', icon: 'MoreHorizontal', color: '#64748b', isDefault: true, sortOrder: 6, isActive: true },
]

const DEFAULT_ACCOUNTS: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'Cash', type: 'cash', balance: 0, currency: 'MYR', icon: 'Banknote', color: '#22c55e', isDefault: true, isActive: true },
  { name: 'Touch \'n Go', type: 'ewallet', balance: 0, currency: 'MYR', icon: 'Smartphone', color: '#3b82f6', isDefault: true, isActive: true },
  { name: 'GrabPay', type: 'ewallet', balance: 0, currency: 'MYR', icon: 'Smartphone', color: '#22c55e', isDefault: true, isActive: true },
  { name: 'Shopee Pay', type: 'ewallet', balance: 0, currency: 'MYR', icon: 'Smartphone', color: '#f43f5e', isDefault: true, isActive: true },
  { name: 'Boost', type: 'ewallet', balance: 0, currency: 'MYR', icon: 'Smartphone', color: '#ef4444', isDefault: true, isActive: true },
  { name: 'MAE', type: 'ewallet', balance: 0, currency: 'MYR', icon: 'Smartphone', color: '#f59e0b', isDefault: true, isActive: true },
  { name: 'Bank Transfer', type: 'debit', balance: 0, currency: 'MYR', icon: 'Building2', color: '#6366f1', isDefault: true, isActive: true },
]

export async function seedDefaultCategories() {
  const catCount = await db.categories.count()
  if (catCount === 0) {
    const now = Date.now()
    const allCategories: Category[] = [
      ...DEFAULT_EXPENSE_CATEGORIES,
      ...DEFAULT_INCOME_CATEGORIES,
    ].map((cat) => ({
      ...cat,
      id: crypto.randomUUID(),
      createdAt: now,
    }))
    await db.categories.bulkAdd(allCategories)
  }

  // Check for default accounts - avoid duplicates even if some accounts exist
  const existingAccounts = await db.accounts.toArray()
  const existingNames = new Set(existingAccounts.map((a) => a.name))
  const missingAccounts = DEFAULT_ACCOUNTS.filter((a) => !existingNames.has(a.name))
  if (missingAccounts.length > 0 && existingAccounts.length === 0) {
    const now = Date.now()
    const allAccounts: Account[] = DEFAULT_ACCOUNTS.map((acc) => ({
      ...acc,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }))
    await db.accounts.bulkAdd(allAccounts)
  }
}
