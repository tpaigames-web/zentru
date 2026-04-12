export interface CashbackRule {
  categoryId: string       // '*' means default/all other categories
  rate: number             // percentage, e.g. 5 means 5%
  monthlyCap?: number      // max cashback per month for this rule, e.g. 50
}

export type RewardType = 'cashback' | 'points' | 'miles'

export interface PointsConfig {
  rewardType: RewardType
  pointsName: string              // e.g. "BonusLink", "Enrich Miles", "TreatsPoints"
  currentBalance: number
  expiryDate?: number             // Unix ms, undefined = no expiry
  earnRate?: number               // points per RM spent
  earnRateCategory?: string       // category for bonus earn rate
  bonusEarnRate?: number          // bonus points per RM for specific category
}

export interface SignUpBonus {
  description: string             // e.g. "Spend RM1500 in 60 days"
  targetAmount: number            // spending target
  currentProgress: number         // how much spent so far
  rewardDescription: string       // e.g. "RM150 cashback" or "50,000 points"
  deadline?: number               // Unix ms
  isCompleted: boolean
}

export interface CreditCard {
  id: string
  name: string
  bank: string
  lastFourDigits?: string
  creditLimit: number
  currentBalance: number
  billingDay: number
  dueDay: number
  interestRate: number
  currency: string
  color?: string
  icon?: string
  isActive: boolean
  notes?: string
  cashbackRules?: CashbackRule[]
  totalMonthlyCashbackCap?: number
  pointsConfig?: PointsConfig
  signUpBonus?: SignUpBonus
  createdAt: number
  updatedAt: number
}
