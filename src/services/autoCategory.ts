import type { Category } from '@/models/category'

/**
 * Keyword-to-category mapping rules.
 * Each rule maps a keyword pattern to a category nameKey.
 * Patterns are tested case-insensitively against merchant name.
 *
 * Comprehensive coverage of Malaysian merchants, chains, and common payment descriptions.
 */
const CATEGORY_RULES: { pattern: RegExp; nameKey: string }[] = [
  // ========== Food & Dining ==========
  { pattern: /\b(restaurant|cafe|coffee|kopitiam|mamak|warung|kedai makan|gerai|hawker|food\s*court|canteen|bistro|diner|eatery|catering)\b/i, nameKey: 'category.food' },
  // Fast food & chains
  { pattern: /\b(mcdonald|kfc|pizza\s*hut|domino|subway|burger\s*king|nando|texas\s*chicken|a&w|marry\s*brown|carl.*jr|wendy|jollibee|popeyes|shake\s*shack)\b/i, nameKey: 'category.food' },
  // MY local chains
  { pattern: /\b(secret\s*recipe|old\s*town|papparich|pelita|ali\s*maju|village\s*park|nasi\s*kandar|nam\s*heong|restoran|sushi\s*king|nippon\s*sushi|sakae|genki|zanmai)\b/i, nameKey: 'category.food' },
  // Coffee & bubble tea
  { pattern: /\b(starbucks|zus\s*coffee|gigi\s*coffee|bask\s*bear|luckin|tealive|daboba|each\s*a\s*cup|coolblog|tiger\s*sugar|chatime|liho|coco\s*tea|coffee\s*bean)\b/i, nameKey: 'category.food' },
  // Bakery & desserts
  { pattern: /\b(bakery|bread|cake|pastry|donut|roti|lavender|rt\s*pastry|barcook|tous\s*les\s*jours|big\s*apple|dunkin|baskin|inside\s*scoop|cakery)\b/i, nameKey: 'category.food' },
  // Food types
  { pattern: /\b(nasi|mee|roti|dim\s*sum|steamboat|bbq|grill|burger|hotpot|hot\s*pot|mookata|satay|laksa|char\s*kuey|bak\s*kut\s*teh|claypot|fish\s*head|tom\s*yam|spicy)\b/i, nameKey: 'category.food' },
  // Convenience stores (food)
  { pattern: /\b(7.eleven|7-eleven|99\s*speed\s*mart|speedmart|family\s*mart|familymart|petronas\s*mesra|shell\s*select|mini\s*market|kedai\s*runcit)\b/i, nameKey: 'category.food' },
  // Grocery / supermarket
  { pattern: /\b(lotus|tesco|giant|mydin|aeon\s*big|econsave|nsk|hero|village\s*grocer|jaya\s*grocer|ben.*shop|cold\s*storage|sam.*club|costco|mercato|grocery|grocer|supermarket|hypermarket|pasaraya)\b/i, nameKey: 'category.food' },
  // Generic food keywords
  { pattern: /\b(f&b|F&B|fnb|FNB|cafeteri|dining|makan|makanan|minuman|drinks?|beverage)\b/i, nameKey: 'category.food' },
  // Specific merchants from PDF data
  { pattern: /\b(hai\s*ke|yeeka|jm\s*coffee|wei\s*lai|xiao\s*yao|magic\s*stone|dragon\s*b|bbq\s*go|tian\s*tian|aroi\s*house|pss\s*bakri|kokoro|fish\s*vibe)\b/i, nameKey: 'category.food' },

  // ========== Transport ==========
  { pattern: /\b(grab(?:pay)?-?(?:ec)?|uber|taxi|mrt|lrt|ktm|rapidkl|monorel|bus|transit|commute)\b/i, nameKey: 'category.transport' },
  { pattern: /\b(parking|parkir|toll|plus\s*highway|smart\s*tag|touch.*go|tng|tngo)\b/i, nameKey: 'category.transport' },
  { pattern: /\b(petrol|shell|petronas|petron|caltex|bp\s|fuel|gas\s*station|setel|ev\s*charg)\b/i, nameKey: 'category.transport' },
  { pattern: /\b(car\s*wash|car\s*park|car\s*svc|j&s\s*car|workshop|tayar|tyre|tire|bengkel|radiator|proton|perodua|honda\s*service)\b/i, nameKey: 'category.transport' },
  { pattern: /\b(redbus|easybook|ktmb|busticket|klia\s*ekspress|grab\s*car)\b/i, nameKey: 'category.transport' },
  { pattern: /\b(puspakom|jpj|road\s*tax|insuran.*motor|motor\s*insur)\b/i, nameKey: 'category.transport' },

  // ========== Shopping ==========
  { pattern: /\b(shopee|lazada|amazon|tokopedia|aliexpress|tiktok\s*shop|pgmall)\b/i, nameKey: 'category.shopping' },
  { pattern: /\b(aeon|aeon\s*mall|ioi\s*mall|mid\s*valley|pavilion|sunway|1\s*utama|ikea|mr\.?diy|daiso|kaison|eco\s*shop)\b/i, nameKey: 'category.shopping' },
  { pattern: /\b(watson|guardian|caring|sephora|innisfree|body\s*shop|bath\s*body)\b/i, nameKey: 'category.shopping' },
  { pattern: /\b(uniqlo|h&m|zara|cotton\s*on|padini|brands\s*outlet|vincci|bata|charles.*keith|pedro)\b/i, nameKey: 'category.shopping' },
  { pattern: /\b(zalora|shein|pomelo|fashionvalet)\b/i, nameKey: 'category.shopping' },
  { pattern: /\b(legoland|toys\s*r\s*us|hamleys|lego)\b/i, nameKey: 'category.shopping' },
  { pattern: /\b(spaylater|SPayLater|buy\s*now\s*pay\s*later|bnpl|atome|pace|split)\b/i, nameKey: 'category.shopping' },

  // ========== Entertainment ==========
  { pattern: /\b(netflix|spotify|youtube|disney|hbo|apple\s*tv|prime\s*video|viu|wetv|iqiyi)\b/i, nameKey: 'category.entertainment' },
  { pattern: /\b(cinema|gsc|tgv|mbo|golden\s*screen|movie|filem)\b/i, nameKey: 'category.entertainment' },
  { pattern: /\b(karaoke|bowling|arcade|theme\s*park|water\s*park|escape|sunway\s*lagoon|genting)\b/i, nameKey: 'category.entertainment' },
  { pattern: /\b(game|gaming|steam|playstation|xbox|nintendo|riot|garena|mobile\s*legends|pubg)\b/i, nameKey: 'category.entertainment' },
  { pattern: /\b(concert|ticket|event|festival|show|performance)\b/i, nameKey: 'category.entertainment' },
  { pattern: /youtube\s*premium|google.*youtube|openai|chatgpt/i, nameKey: 'category.entertainment' },

  // ========== Housing ==========
  { pattern: /\b(rent|rental|sewa|condo|apartment|mortgage|property|real\s*estate|maintenance\s*fee|sinking\s*fund|indah\s*water)\b/i, nameKey: 'category.housing' },

  // ========== Utilities & Bills ==========
  { pattern: /\b(tnb|tenaga|electric|elektrik|letrik|water\s*bill|air\s*bill|bil\s*air|sewage)\b/i, nameKey: 'category.utilities' },
  { pattern: /\b(digi|maxis|celcom|u\s*mobile|unifi|tm\s*net|telekom|astro|internet|broadband|wifi|fiber|fibre)\b/i, nameKey: 'category.utilities' },
  { pattern: /\b(myeg|payex|lonpac|takaful|msig|credit\s*shield|insuran|insurance|great\s*eastern|aia\s*|prudential|zurich|allianz|etiqa)\b/i, nameKey: 'category.utilities' },
  { pattern: /\b(cukai|tax\s*payment|lhdn|hasil|assessment|quit\s*rent|cukai\s*pintu|cukai\s*tanah)\b/i, nameKey: 'category.utilities' },
  { pattern: /\b(service\s*tax|SST|stamp\s*duty|duti\s*setem)\b/i, nameKey: 'category.utilities' },

  // ========== Medical & Health ==========
  { pattern: /\b(clinic|klinik|hospital|pharmacy|farmasi|doctor|doktor|dental|dentist|medical|health|prescription|medicine|ubat)\b/i, nameKey: 'category.medical' },
  { pattern: /\b(am\s*pm\s*pharmacy|guardian.*pharma|watson.*pharma|caring\s*pharmacy|alpro|big\s*pharmacy)\b/i, nameKey: 'category.medical' },

  // ========== Education ==========
  { pattern: /\b(school|sekolah|university|universiti|tuition|course|kursus|udemy|coursera|skillshare)\b/i, nameKey: 'category.education' },
  { pattern: /\b(book|buku|bookstore|popular|mph|kinokuniya|big\s*bad\s*wolf)\b/i, nameKey: 'category.education' },
  { pattern: /\b(training|seminar|workshop|bengkel|kelas|class\b)\b/i, nameKey: 'category.education' },

  // ========== Travel ==========
  { pattern: /\b(airasia|malindo|batik\s*air|mas|malaysia\s*airlines|firefly|airline|penerbangan)\b/i, nameKey: 'category.travel' },
  { pattern: /\b(hotel|agoda|booking\.com|trivago|airbnb|resort|hostel|homestay|inn\b)\b/i, nameKey: 'category.travel' },
  { pattern: /\b(travel|pelancongan|trip|tour|percutian|flight|tiket\s*kapal)\b/i, nameKey: 'category.travel' },

  // ========== Clothing ==========
  { pattern: /\b(clothes|clothing|fashion|fesyen|tailor|laundry|dobi|dry\s*clean|shoes|kasut|adidas|nike|puma|skechers|new\s*balance|converse|crocs)\b/i, nameKey: 'category.clothing' },
  { pattern: /\b(hi\s*style|apparel|garment|kemeja|baju)\b/i, nameKey: 'category.clothing' },

  // ========== Digital / Electronics ==========
  { pattern: /\b(apple\s*store|samsung|huawei|oppo|vivo|xiaomi|realme|computer|laptop|phone|gadget|electronic|elektron)\b/i, nameKey: 'category.digital' },
  { pattern: /\b(lowyat|senheng|harvey\s*norman|courts|best\s*buy|switch|machines|tmshop)\b/i, nameKey: 'category.digital' },
  { pattern: /\b(icloud|google\s*one|google\s*storage|microsoft\s*365|adobe|canva\s*pro|cloud\s*storage)\b/i, nameKey: 'category.digital' },

  // ========== Gifts & Donations ==========
  { pattern: /\b(gift|hadiah|present|flower|bunga|florist|donation|sumbangan|charity|amal|zakat|sedekah|tabung)\b/i, nameKey: 'category.gifts' },

  // ========== Pets ==========
  { pattern: /\b(pet|haiwan|vet|veterinary|dog|cat|kucing|anjing|animal|pet\s*shop|pet\s*mart)\b/i, nameKey: 'category.pets' },

  // ========== E-wallet / Transfer ==========
  { pattern: /\b(tng.*ecom|tng.*ewallet|TNG-EWALLET)/i, nameKey: 'category.shopping' },
  { pattern: /\bGO\+\s*(Cash Out|Reload)/i, nameKey: 'category.other_expense' },
  { pattern: /\b(eWallet Cash Out|DuitNow Transfer|Transfer to Wallet)/i, nameKey: 'category.other_expense' },
  { pattern: /\bDuitNow\s*(QR|Payment)/i, nameKey: 'category.shopping' },
  { pattern: /\bQuick Reload|^Reload$|^TNG Reload/i, nameKey: 'category.other_income' },

  // ========== Installments / Loans ==========
  { pattern: /\b(ezypay|flexi\s*pay|easi.*payment|instalment|installment|EPP|FPP|hire\s*purchase|loan\s*repay|ansuran|pinjaman)\b/i, nameKey: 'category.shopping' },
  { pattern: /\b(balance\s*conversion|BC\s*INTEREST|BC\s*INSTALMENT|UOB\s*PL-EPP)\b/i, nameKey: 'category.shopping' },

  // ========== Income ==========
  { pattern: /\b(salary|gaji|wages|payroll|upah)\b/i, nameKey: 'category.salary' },
  { pattern: /\b(bonus|incentive|commission|insentif|komisen)\b/i, nameKey: 'category.bonus' },
  { pattern: /\b(dividend|dividen|interest|faedah|investment|pelaburan|return|capital\s*gain|unit\s*trust|asnb|asb|epf|kwsp|profit|hibah)\b/i, nameKey: 'category.investment_income' },
  { pattern: /\b(freelance|gig|part.time|side.*income|sambilan)\b/i, nameKey: 'category.freelance' },
  { pattern: /\b(refund|rebate|cashback|cash\s*rebate|reimbursement|bayaran\s*balik)\b/i, nameKey: 'category.refund' },
  { pattern: /\b(payment.*thank|payment\s*rec|PAYMENT REC'D)\b/i, nameKey: 'category.refund' },
  { pattern: /\b(I-FUNDS TR FROM|IBG CREDIT|GIRO CREDIT)\b/i, nameKey: 'category.other_income' },
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
