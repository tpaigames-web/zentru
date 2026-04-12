import type { Transaction } from '@/models/transaction'

/**
 * Malaysian tax relief categories (LHDN - Lembaga Hasil Dalam Negeri)
 * Based on common personal tax deductions for YA 2025/2026
 */
export const TAX_CATEGORIES = [
  { key: 'medical', label: 'Medical & Health', labelZh: '医疗保健', maxRelief: 10000 },
  { key: 'education', label: 'Education (Self)', labelZh: '教育 (本人)', maxRelief: 7000 },
  { key: 'lifestyle', label: 'Lifestyle', labelZh: '生活方式', maxRelief: 2500 },
  { key: 'insurance', label: 'Life Insurance & EPF', labelZh: '人寿保险/公积金', maxRelief: 7000 },
  { key: 'medical_insurance', label: 'Medical Insurance', labelZh: '医疗保险', maxRelief: 3000 },
  { key: 'child_education', label: 'Child Education', labelZh: '子女教育', maxRelief: 8000 },
  { key: 'sspn', label: 'SSPN (Education Savings)', labelZh: 'SSPN 教育储蓄', maxRelief: 8000 },
  { key: 'childcare', label: 'Childcare', labelZh: '托儿/幼儿园', maxRelief: 3000 },
  { key: 'ev', label: 'EV Charging', labelZh: '电动车充电', maxRelief: 2500 },
  { key: 'donation', label: 'Approved Donations', labelZh: '慈善捐款', maxRelief: 0 }, // percentage based
  { key: 'other_tax', label: 'Other Deductible', labelZh: '其他抵税', maxRelief: 0 },
] as const

export type TaxCategoryKey = typeof TAX_CATEGORIES[number]['key']

/**
 * Auto-detect if a transaction might be tax deductible based on category/merchant.
 */
const TAX_DETECTION_RULES: { pattern: RegExp; taxCategory: TaxCategoryKey }[] = [
  // Medical
  { pattern: /\b(hospital|clinic|doctor|dental|pharmacy|medical|prescription|health\s*screening)\b/i, taxCategory: 'medical' },
  // Education
  { pattern: /\b(university|college|course|udemy|coursera|tuition|training|certification|exam\s*fee)\b/i, taxCategory: 'education' },
  // Lifestyle (books, sports, internet)
  { pattern: /\b(book|bookstore|popular|kinokuniya|mph|gym|fitness|sport|internet|broadband|unifi|tm\s*net)\b/i, taxCategory: 'lifestyle' },
  // Insurance
  { pattern: /\b(insurance|prudential|aia|great eastern|allianz|zurich|takaful|epf|kwsp)\b/i, taxCategory: 'insurance' },
  // Medical insurance
  { pattern: /\b(medical\s*insurance|health\s*insurance|medical\s*card)\b/i, taxCategory: 'medical_insurance' },
  // SSPN
  { pattern: /\b(sspn|sspn-i|ptptn)\b/i, taxCategory: 'sspn' },
  // Childcare
  { pattern: /\b(nursery|kindergarten|childcare|tadika|taska)\b/i, taxCategory: 'childcare' },
  // EV
  { pattern: /\b(ev\s*charg|electric\s*vehicle|tesla\s*charg)\b/i, taxCategory: 'ev' },
  // Donation
  { pattern: /\b(donation|charity|zakat|tabung|derma)\b/i, taxCategory: 'donation' },
]

export function autoDetectTaxCategory(merchantOrDescription: string): TaxCategoryKey | undefined {
  for (const rule of TAX_DETECTION_RULES) {
    if (rule.pattern.test(merchantOrDescription)) {
      return rule.taxCategory
    }
  }
  return undefined
}

export interface TaxSummary {
  taxCategory: TaxCategoryKey
  label: string
  labelZh: string
  maxRelief: number
  totalClaimed: number
  remaining: number
  transactions: Transaction[]
}

/**
 * Generate annual tax deduction summary.
 */
export function getTaxSummary(
  transactions: Transaction[],
  year: number,
): TaxSummary[] {
  const startOfYear = new Date(year, 0, 1).getTime()
  const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999).getTime()

  const yearTx = transactions.filter(
    (tx) => tx.isTaxDeductible && tx.date >= startOfYear && tx.date <= endOfYear,
  )

  const summaries = new Map<TaxCategoryKey, TaxSummary>()

  for (const taxCat of TAX_CATEGORIES) {
    summaries.set(taxCat.key, {
      taxCategory: taxCat.key,
      label: taxCat.label,
      labelZh: taxCat.labelZh,
      maxRelief: taxCat.maxRelief,
      totalClaimed: 0,
      remaining: taxCat.maxRelief,
      transactions: [],
    })
  }

  for (const tx of yearTx) {
    const key = (tx.taxCategory || 'other_tax') as TaxCategoryKey
    const summary = summaries.get(key)
    if (summary) {
      summary.totalClaimed += tx.amount
      summary.remaining = summary.maxRelief > 0 ? Math.max(0, summary.maxRelief - summary.totalClaimed) : 0
      summary.transactions.push(tx)
    }
  }

  return Array.from(summaries.values()).filter((s) => s.totalClaimed > 0)
}

export function getTotalTaxRelief(summaries: TaxSummary[]): number {
  return summaries.reduce((total, s) => {
    if (s.maxRelief > 0) {
      return total + Math.min(s.totalClaimed, s.maxRelief)
    }
    return total + s.totalClaimed
  }, 0)
}
