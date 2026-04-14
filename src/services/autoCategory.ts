import type { Category } from '@/models/category'

/**
 * Keyword-to-category mapping rules.
 * Each rule maps a keyword pattern to a category nameKey.
 * Patterns are tested case-insensitively against merchant name.
 */
const CATEGORY_RULES: { pattern: RegExp; nameKey: string }[] = [
  // Food & Dining
  { pattern: /\b(restaurant|cafe|coffee|starbucks|mcdonald|kfc|pizza|sushi|nasi|mee|roti|mamak|kopitiam|food|bakery|bread|dim sum|steamboat|bbq|grill|burger|subway|domino|nando|secret recipe|old town|papparich|pelita|ali maju|mydin.*food|hotpot|hot\s*pot|mookata|nippon\s*sushi|hai\s*ke|yeeka|jm\s*coffee|7.eleven|7-eleven|99\s*speed\s*mart|speedmart|family\s*mart)\b/i, nameKey: 'category.food' },

  // Transport
  { pattern: /\b(grab(?:pay)?|uber|taxi|mrt|lrt|ktm|rapidkl|bus|parking|toll|plus\s*highway|smart\s*tag|touch.*go.*topup|petrol|shell|petronas|petron|caltex|bp\s|fuel|gas\s*station|redbus|puspakom)\b/i, nameKey: 'category.transport' },

  // Shopping
  { pattern: /\b(shopee|lazada|amazon|aeon|tesco|lotus|giant|mydin|mr\.?diy|daiso|ikea|uniqlo|h&m|zara|cotton on|padini|watson|guardian|sephora|zalora|legoland)\b/i, nameKey: 'category.shopping' },

  // Entertainment
  { pattern: /\b(netflix|spotify|youtube|disney|hbo|cinema|gsc|tgv|mbo|karaoke|game|steam|playstation|xbox|nintendo|concert|ticket)\b/i, nameKey: 'category.entertainment' },
  { pattern: /youtube\s*premium|google.*youtube/i, nameKey: 'category.entertainment' },

  // Housing
  { pattern: /\b(rent|rental|condo|apartment|mortgage|property|real estate|maintenance fee|sinking fund)\b/i, nameKey: 'category.housing' },

  // Utilities
  { pattern: /\b(tnb|tenaga|water|air|indah water|telco|digi|maxis|celcom|unifi|tm|astro|internet|broadband|electric|gas.*bill|myeg|payex|lonpac|takaful|msig|credit\s*shield|sykt\s*takaful|excess\s*limit)\b/i, nameKey: 'category.utilities' },

  // Medical
  { pattern: /\b(clinic|hospital|pharmacy|doctor|dental|dentist|medical|health|guardian.*pharma|watson.*pharma|prescription|medicine)\b/i, nameKey: 'category.medical' },

  // Education
  { pattern: /\b(school|university|tuition|course|udemy|coursera|book|bookstore|popular|mph|kinokuniya|training|seminar|workshop)\b/i, nameKey: 'category.education' },

  // Travel
  { pattern: /\b(airasia|malindo|mas|airline|hotel|agoda|booking\.com|trivago|airbnb|travel|resort|hostel|flight)\b/i, nameKey: 'category.travel' },

  // Clothing
  { pattern: /\b(clothes|clothing|fashion|tailor|laundry|dry clean|shoes|adidas|nike|puma|skechers)\b/i, nameKey: 'category.clothing' },

  // Digital / Electronics
  { pattern: /\b(apple|samsung|huawei|oppo|vivo|xiaomi|computer|laptop|phone|electronic|lowyat|senheng|harvey norman|courts|best buy)\b/i, nameKey: 'category.digital' },

  // Gifts
  { pattern: /\b(gift|present|flower|florist|donation|charity|zakat)\b/i, nameKey: 'category.gifts' },

  // Pets
  { pattern: /\b(pet|vet|veterinary|dog|cat|animal|pet shop)\b/i, nameKey: 'category.pets' },

  // Bill payments / installments
  { pattern: /\b(ezypay|instalment|installment|ipl\b|bnpl|hire\s*purchase)\b/i, nameKey: 'category.shopping' },

  // E-wallet top-up (classify as transfer, but default to shopping if no transfer category)
  { pattern: /\b(grabpay|grab\s*pay|tng.*topup|boost.*topup|shopeepay|mae.*topup)\b/i, nameKey: 'category.shopping' },

  // Income categories
  { pattern: /\b(salary|gaji|wages|payroll)\b/i, nameKey: 'category.salary' },
  { pattern: /\b(bonus|incentive|commission)\b/i, nameKey: 'category.bonus' },
  { pattern: /\b(dividend|interest|investment|return|capital gain|unit trust|asnb|epf|kwsp)\b/i, nameKey: 'category.investment_income' },
  { pattern: /\b(freelance|gig|part.time|side.*income)\b/i, nameKey: 'category.freelance' },
  { pattern: /\b(refund|rebate|cashback.*received|reimbursement|cash\s*rebate|payment.*thank|payment\s*rec)/i, nameKey: 'category.refund' },
]

/**
 * Auto-detect category based on merchant name / description.
 * Returns the best matching category, or undefined if no match.
 */
export function autoDetectCategory(
  merchantOrDescription: string,
  categories: Category[],
): Category | undefined {
  if (!merchantOrDescription) return undefined

  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(merchantOrDescription)) {
      return categories.find((c) => c.nameKey === rule.nameKey && c.isActive)
    }
  }

  return undefined
}

/**
 * Learn from user's past transactions to suggest category.
 * If the same merchant was categorized before, use that category.
 */
export function suggestFromHistory(
  merchant: string,
  pastTransactions: { merchant?: string; categoryId: string }[],
): string | undefined {
  if (!merchant) return undefined

  const normalized = merchant.toLowerCase().trim()

  // Find most recent transaction with same merchant
  for (const tx of pastTransactions) {
    if (tx.merchant && tx.merchant.toLowerCase().trim() === normalized) {
      return tx.categoryId
    }
  }

  return undefined
}
