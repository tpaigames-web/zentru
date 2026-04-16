/**
 * Malaysian Credit Card Catalog
 * Comprehensive database of credit cards available in Malaysia.
 * Data sourced from RinggitPlus, bank websites, and public information.
 *
 * When user adds a new card, they can pick from this catalog
 * to auto-fill card details, cashback rules, and display the correct card image style.
 */

export interface CardProduct {
  id: string
  bank: string
  name: string
  fullName: string
  network: 'visa' | 'mastercard' | 'amex' | 'jcb' | 'unionpay'
  tier: 'classic' | 'gold' | 'platinum' | 'signature' | 'infinite' | 'world'
  cardColor: string       // Primary card background color
  cashbackRate?: string   // e.g. "up to 12%"
  annualFee?: string      // e.g. "Free" or "RM800"
  minIncome?: number      // RM per month
  features?: string[]
  defaultRules?: {
    categoryKey: string   // '*' = default, or nameKey like 'category.food'
    label: string         // display label e.g. "Dining", "Petrol"
    rate: number          // percentage
    monthlyCap?: number   // RM
  }[]
  defaultTotalCap?: number // overall monthly cap RM
}

export const CARD_CATALOG: CardProduct[] = [
  // ====== RHB ======
  { id: 'rhb-shell-visa', bank: 'RHB Bank', name: 'Shell Visa', fullName: 'RHB Shell Visa Credit Card', network: 'visa', tier: 'classic', cardColor: '#1a1a2e', cashbackRate: 'up to 12%', annualFee: 'Free', minIncome: 2000, features: ['12% Shell petrol cashback (cap RM80/mth)', '5% groceries/online/e-wallet/utilities'], defaultRules: [{ categoryKey: 'category.transport', label: 'Shell Petrol', rate: 12, monthlyCap: 80 }, { categoryKey: 'category.shopping', label: 'Groceries/Online', rate: 5, monthlyCap: 30 }, { categoryKey: '*', label: 'Others', rate: 0.2 }] },
  { id: 'rhb-cashback', bank: 'RHB Bank', name: 'Cash Back Card', fullName: 'RHB Cash Back Credit Card', network: 'visa', tier: 'classic', cardColor: '#003DA5', cashbackRate: 'up to 10%', annualFee: 'Free*', minIncome: 2000, features: ['10% on petrol/dining/groceries/food delivery/utilities', 'RM70/yr fee waived with RM10K annual spend'], defaultRules: [{ categoryKey: 'category.food', label: 'Dining/Food Delivery', rate: 10, monthlyCap: 30 }, { categoryKey: 'category.transport', label: 'Petrol', rate: 10, monthlyCap: 30 }, { categoryKey: 'category.shopping', label: 'Groceries', rate: 10, monthlyCap: 30 }, { categoryKey: '*', label: 'Others', rate: 0.2 }] },
  { id: 'rhb-visa-signature', bank: 'RHB Bank', name: 'Visa Signature', fullName: 'RHB Visa Signature Credit Card', network: 'visa', tier: 'signature', cardColor: '#2C2C2C', cashbackRate: 'up to 6%', annualFee: 'Free*', minIncome: 6667, features: ['6% local cashback', '2% overseas (cap RM100/mth)', '6x Plaza Premium Lounge KLIA', 'Travel insurance up to RM600K'], defaultRules: [{ categoryKey: '*', label: 'Local', rate: 6, monthlyCap: 100 }] },
  { id: 'rhb-world-mc', bank: 'RHB Bank', name: 'World MasterCard', fullName: 'RHB World MasterCard Credit Card', network: 'mastercard', tier: 'world', cardColor: '#1a1a2e', cashbackRate: 'up to 6%', annualFee: 'Free*', minIncome: 6667, features: ['6% petrol & dining cashback', '6 lounge accesses/year', 'Travel insurance up to RM600K'], defaultRules: [{ categoryKey: 'category.transport', label: 'Petrol', rate: 6, monthlyCap: 30 }, { categoryKey: 'category.food', label: 'Dining', rate: 6, monthlyCap: 30 }, { categoryKey: '*', label: 'Others', rate: 1 }] },
  { id: 'rhb-visa-infinite', bank: 'RHB Bank', name: 'Visa Infinite', fullName: 'RHB Visa Infinite Credit Card', network: 'visa', tier: 'infinite', cardColor: '#1a1a2e', features: ['5x Loyalty+ points overseas', 'Unlimited lounge access MY & SG', 'Travel insurance up to RM2M'], annualFee: 'Free*', minIncome: 12500 },
  { id: 'rhb-premier-visa', bank: 'RHB Bank', name: 'Premier Visa Infinite', fullName: 'RHB Premier Visa Infinite Credit Card', network: 'visa', tier: 'infinite', cardColor: '#0D0D0D', features: ['10x Loyalty+ points overseas', 'Unlimited lounge access worldwide', 'By invitation only'], annualFee: 'By invitation', minIncome: 12500 },
  { id: 'rhb-rewards', bank: 'RHB Bank', name: 'Rewards Card', fullName: 'RHB Rewards Credit Card', network: 'visa', tier: 'classic', cardColor: '#003DA5', features: ['Up to 10x Loyalty Points', 'Unlimited rewards earnings'], annualFee: 'Free*', minIncome: 2000 },
  { id: 'rhb-myeg-visa', bank: 'RHB Bank', name: 'MyEG Visa', fullName: 'RHB Visa MyEG Credit Card', network: 'visa', tier: 'classic', cardColor: '#FF6600', features: ['5x Loyalty Points on MyEG transactions', 'Unlimited rewards earnings'], annualFee: 'Free*', minIncome: 2000 },
  { id: 'rhb-biz-plat', bank: 'RHB Bank', name: 'Platinum Business', fullName: 'RHB Platinum Business Credit Card', network: 'visa', tier: 'platinum', cardColor: '#34495E', cashbackRate: 'up to 1%', features: ['1% overseas cashback', '0.5% local cashback'], annualFee: 'Free*', minIncome: 5000, defaultRules: [{ categoryKey: 'category.travel', label: 'Overseas', rate: 1 }, { categoryKey: '*', label: 'Local', rate: 0.5 }] },

  // ====== MAYBANK ======
  // Dual cards (Visa/MC + Amex)
  { id: 'maybank-2-gold', bank: 'Maybank', name: '2 Gold Cards', fullName: 'Maybank 2 Gold Cards', network: 'mastercard', tier: 'gold', cardColor: '#FFC72C', cashbackRate: 'up to 5%', annualFee: 'Free', minIncome: 2500, features: ['5% weekend cashback (Amex)', 'Cap RM50/month', '1x TreatsPoints weekdays'], defaultRules: [{ categoryKey: 'category.food', label: 'Weekend Dining', rate: 5, monthlyCap: 50 }, { categoryKey: '*', label: 'Others', rate: 0.2 }] },
  { id: 'maybank-2-plat', bank: 'Maybank', name: '2 Platinum Cards', fullName: 'Maybank 2 Platinum Cards', network: 'visa', tier: 'platinum', cardColor: '#C0C0C0', cashbackRate: 'up to 5%', annualFee: 'Free', minIncome: 5000, features: ['5% weekend cashback (Amex)', 'Cap RM50/month', '5x TreatsPoints weekday Amex'], defaultRules: [{ categoryKey: 'category.food', label: 'Weekend Dining', rate: 5, monthlyCap: 50 }, { categoryKey: '*', label: 'Others', rate: 0.2 }] },
  { id: 'maybank-2-premier', bank: 'Maybank', name: '2 Cards Premier', fullName: 'Maybank 2 Cards Premier', network: 'visa', tier: 'platinum', cardColor: '#1a1a2e', features: ['5x TreatsPoints/RM1 on Amex', '10,000 TreatsPoints on activation'], annualFee: 'Free', minIncome: 5000 },
  // Signature / Premium
  { id: 'maybank-visa-signature', bank: 'Maybank', name: 'Visa Signature', fullName: 'Maybank Visa Signature', network: 'visa', tier: 'signature', cardColor: '#E91E63', cashbackRate: 'up to 5%', annualFee: 'Free*', minIncome: 5000, features: ['5% petrol & groceries cashback (cap RM88/mth)', '1.5% unlimited cashback all other spend'], defaultRules: [{ categoryKey: 'category.transport', label: 'Petrol', rate: 5, monthlyCap: 88 }, { categoryKey: 'category.shopping', label: 'Groceries', rate: 5, monthlyCap: 88 }, { categoryKey: '*', label: 'Others', rate: 1.5 }] },
  { id: 'maybank-visa-infinite', bank: 'Maybank', name: 'Visa Infinite', fullName: 'Maybank Visa Infinite Credit Card', network: 'visa', tier: 'infinite', cardColor: '#1a1a2e', features: ['Premium travel benefits', 'Airport lounge access', 'Travel insurance'], annualFee: 'Free', minIncome: 12500 },
  { id: 'maybank-world-mc', bank: 'Maybank', name: 'World MasterCard', fullName: 'Maybank World MasterCard', network: 'mastercard', tier: 'world', cardColor: '#1a1a2e', features: ['Golf privileges', 'Airport lounge access', 'Dining discounts', 'Travel benefits'], annualFee: 'Free', minIncome: 8333 },
  { id: 'maybank-amex-plat', bank: 'Maybank', name: 'American Express Platinum', fullName: 'Maybank American Express Platinum', network: 'amex', tier: 'platinum', cardColor: '#006FCF', features: ['Premium Amex benefits', 'Higher TreatsPoints earning'], annualFee: 'Free', minIncome: 5000 },
  { id: 'maybank-amex-cashback-gold', bank: 'Maybank', name: 'Amex Cashback Gold', fullName: 'Maybank American Express Cashback Gold', network: 'amex', tier: 'gold', cardColor: '#B8860B', cashbackRate: 'up to 5%', annualFee: 'Free', minIncome: 2500, features: ['Cashback on everyday spend'] },
  // Partner cards
  { id: 'maybank-grab-mc', bank: 'Maybank', name: 'Grab Mastercard', fullName: 'Maybank Grab Mastercard Platinum', network: 'mastercard', tier: 'platinum', cardColor: '#00B14F', features: ['5 GrabReward Points/RM1 spent', 'Grab ride benefits'], annualFee: 'Free', minIncome: 2500 },
  { id: 'maybank-shopee-visa', bank: 'Maybank', name: 'Shopee Visa Platinum', fullName: 'Maybank Shopee Visa Platinum', network: 'visa', tier: 'platinum', cardColor: '#EE4D2D', features: ['5x Shopee Coins on Shopee/dining/entertainment/contactless', '5000 Welcome Shopee Coins after RM300 spend'], annualFee: 'Free', minIncome: 2500 },
  { id: 'maybank-petronas-visa-plat', bank: 'Maybank', name: 'PETRONAS Visa Platinum', fullName: 'Maybank PETRONAS Visa Platinum', network: 'visa', tier: 'platinum', cardColor: '#00A651', features: ['8x TreatsPoints weekends at PETRONAS', '5x TreatsPoints weekdays'], annualFee: 'Free', minIncome: 2500 },
  { id: 'maybank-petronas-visa-gold', bank: 'Maybank', name: 'PETRONAS Visa Gold', fullName: 'Maybank PETRONAS Visa Gold', network: 'visa', tier: 'gold', cardColor: '#00A651', features: ['TreatsPoints at PETRONAS stations'], annualFee: 'Free', minIncome: 2000 },
  { id: 'maybank-manutd-visa', bank: 'Maybank', name: 'Manchester United Visa', fullName: 'Maybank Manchester United Visa', network: 'visa', tier: 'classic', cardColor: '#DA291C', features: ['Man Utd merchandise rewards'], annualFee: 'Free', minIncome: 2500 },
  { id: 'maybank-manutd-visa-infinite', bank: 'Maybank', name: 'Manchester United Visa Infinite', fullName: 'Maybank Manchester United Visa Infinite', network: 'visa', tier: 'infinite', cardColor: '#DA291C', features: ['Premium Man Utd experiences', 'Travel benefits'], annualFee: 'Free', minIncome: 12500 },
  { id: 'maybank-fc-barcelona', bank: 'Maybank', name: 'FC Barcelona Visa Signature', fullName: 'Maybank FC Barcelona Visa Signature', network: 'visa', tier: 'signature', cardColor: '#A50044', annualFee: 'Free', minIncome: 5000 },
  { id: 'maybank-sia-krisflyer-gold', bank: 'Maybank', name: 'SIA KrisFlyer Amex Gold', fullName: 'Singapore Airlines KrisFlyer Amex Gold', network: 'amex', tier: 'gold', cardColor: '#003C71', features: ['KrisFlyer miles earning', 'Travel benefits'], annualFee: 'RM100', minIncome: 2500 },
  { id: 'maybank-sia-krisflyer-plat', bank: 'Maybank', name: 'SIA KrisFlyer Amex Platinum', fullName: 'Singapore Airlines KrisFlyer Amex Platinum', network: 'amex', tier: 'platinum', cardColor: '#003C71', features: ['Higher KrisFlyer miles earning', 'Premium travel benefits'], annualFee: 'RM300', minIncome: 5000 },
  // myimpact (ESG) — updated Jan 2026
  { id: 'maybank-myimpact-visa-sig', bank: 'Maybank', name: 'myimpact Visa Signature', fullName: 'Maybank myimpact Visa Signature', network: 'visa', tier: 'signature', cardColor: '#2E7D32', cashbackRate: 'up to 8%', annualFee: 'Free', minIncome: 5000, features: ['8% cashback on ESG spend (cap RM35/mth)', 'Carbon footprint tracking', 'Updated Jan 2026'], defaultRules: [{ categoryKey: 'category.transport', label: 'Transport/EV/ESG', rate: 8, monthlyCap: 35 }, { categoryKey: '*', label: 'Others', rate: 0.2 }] },
  // Islamic
  { id: 'maybank-islamic-gold', bank: 'Maybank', name: 'Islamic Ikhwan Gold', fullName: 'Maybank Islamic MasterCard Ikhwan Gold Card-i', network: 'mastercard', tier: 'gold', cardColor: '#2E7D32', annualFee: 'Free', minIncome: 2000 },
  { id: 'maybank-islamic-plat', bank: 'Maybank', name: 'Islamic Ikhwan Platinum', fullName: 'Maybank Islamic MasterCard Ikhwan Platinum Card-i', network: 'mastercard', tier: 'platinum', cardColor: '#1B5E20', annualFee: 'Free', minIncome: 5000 },
  { id: 'maybank-islamic-amex', bank: 'Maybank', name: 'Islamic Ikhwan Amex Platinum', fullName: 'Maybank Islamic Amex Platinum Card-i', network: 'amex', tier: 'platinum', cardColor: '#006FCF', annualFee: 'Free', minIncome: 5000 },
  { id: 'maybank-islamic-visa-infinite', bank: 'Maybank', name: 'Islamic Ikhwan Visa Infinite', fullName: 'Maybank Islamic Ikhwan Visa Infinite', network: 'visa', tier: 'infinite', cardColor: '#1B5E20', annualFee: 'Free', minIncome: 12500 },
  { id: 'maybank-islamic-world-mc', bank: 'Maybank', name: 'Islamic World Mastercard', fullName: 'Maybank Islamic World Mastercard Ikhwan-i', network: 'mastercard', tier: 'world', cardColor: '#1B5E20', annualFee: 'Free', minIncome: 8333 },
  { id: 'maybank-islamic-myimpact', bank: 'Maybank', name: 'Islamic myimpact Ikhwan Platinum', fullName: 'Maybank Islamic myimpact Ikhwan Mastercard Platinum-i', network: 'mastercard', tier: 'platinum', cardColor: '#2E7D32', cashbackRate: 'up to 8%', annualFee: 'Free', minIncome: 5000, features: ['8% ESG cashback (cap RM35/mth)', 'Shariah-compliant'] },
  { id: 'maybank-islamic-petronas-gold', bank: 'Maybank', name: 'Islamic PETRONAS Gold', fullName: 'Maybank Islamic PETRONAS Ikhwan Visa Gold-i', network: 'visa', tier: 'gold', cardColor: '#00A651', annualFee: 'Free', minIncome: 2000 },
  { id: 'maybank-islamic-petronas-plat', bank: 'Maybank', name: 'Islamic PETRONAS Platinum', fullName: 'Maybank Islamic PETRONAS Ikhwan Visa Platinum-i', network: 'visa', tier: 'platinum', cardColor: '#00A651', annualFee: 'Free', minIncome: 2500 },

  // ====== CIMB ======
  { id: 'cimb-cash-rebate-plat', bank: 'CIMB Bank', name: 'Cash Rebate Platinum MC', fullName: 'CIMB Cash Rebate Platinum MasterCard', network: 'mastercard', tier: 'platinum', cardColor: '#EC1C24', cashbackRate: 'up to 5%', annualFee: 'Free', minIncome: 2000, features: ['5% groceries/petrol/cinema/utilities/mobile'], defaultRules: [{ categoryKey: 'category.shopping', label: 'Groceries', rate: 5, monthlyCap: 20 }, { categoryKey: 'category.transport', label: 'Petrol', rate: 5, monthlyCap: 20 }, { categoryKey: '*', label: 'Others', rate: 0.2 }] },
  { id: 'cimb-e-credit', bank: 'CIMB Bank', name: 'e Credit Card', fullName: 'CIMB e Credit Card', network: 'visa', tier: 'classic', cardColor: '#EC1C24', cashbackRate: 'up to 10x', annualFee: 'Free', minIncome: 2000, features: ['Up to 10x bonus points e-wallet/online shopping', 'Unlimited cash rebate', 'Free through 2026; RM6K spend/yr from 2027'], defaultRules: [{ categoryKey: 'category.shopping', label: 'Online/E-wallet', rate: 10, monthlyCap: 30 }, { categoryKey: '*', label: 'Others', rate: 0.2 }] },
  { id: 'cimb-petronas-visa-i', bank: 'CIMB Bank', name: 'PETRONAS Visa-i', fullName: 'CIMB PETRONAS Visa Credit Card-i', network: 'visa', tier: 'classic', cardColor: '#00A651', cashbackRate: 'up to 12%', annualFee: 'Free', minIncome: 2000, features: ['12% PETRONAS/Setel/EV charging cashback', 'Shariah-compliant'], defaultRules: [{ categoryKey: 'category.transport', label: 'PETRONAS/Setel', rate: 12, monthlyCap: 50 }, { categoryKey: '*', label: 'Others', rate: 0.2 }] },
  { id: 'cimb-petronas-visa-plat-i', bank: 'CIMB Bank', name: 'PETRONAS Visa Platinum-i', fullName: 'CIMB PETRONAS Visa Platinum Credit Card-i', network: 'visa', tier: 'platinum', cardColor: '#00A651', cashbackRate: 'up to 8%', annualFee: 'Free', minIncome: 2000, features: ['8% PETRONAS cashback (cap RM50/mth)', 'Requires RM2K statement balance'], defaultRules: [{ categoryKey: 'category.transport', label: 'PETRONAS', rate: 8, monthlyCap: 50 }, { categoryKey: '*', label: 'Others', rate: 0.2 }] },
  { id: 'cimb-petronas-visa-infinite-i', bank: 'CIMB Bank', name: 'PETRONAS Visa Infinite-i', fullName: 'CIMB PETRONAS Visa Infinite Credit Card-i', network: 'visa', tier: 'infinite', cardColor: '#004D25', cashbackRate: 'up to 12%', annualFee: 'Free', minIncome: 5000, features: ['12% PETRONAS rebate (cap RM120/mth)', '6% groceries/dining/parking'], defaultRules: [{ categoryKey: 'category.transport', label: 'PETRONAS', rate: 12, monthlyCap: 120 }, { categoryKey: 'category.food', label: 'Dining/Groceries', rate: 6, monthlyCap: 60 }, { categoryKey: '*', label: 'Others', rate: 0.2 }] },
  { id: 'cimb-travel-plat', bank: 'CIMB Bank', name: 'Travel Platinum', fullName: 'CIMB Travel Platinum Credit Card', network: 'visa', tier: 'platinum', cardColor: '#1a1a2e', features: ['2x points overseas', '4x airport lounge', '2x airport transfer', '12 Subang Sky Lounge visits'], annualFee: 'Free', minIncome: 3000 },
  { id: 'cimb-preferred-visa', bank: 'CIMB Bank', name: 'Preferred Visa Infinite', fullName: 'CIMB Preferred Visa Infinite', network: 'visa', tier: 'infinite', cardColor: '#1a1a2e', features: ['8x bonus points dining/overseas/charitable', '150+ Plaza Premium Lounges'], annualFee: 'Free*', minIncome: 5000 },
  { id: 'cimb-visa-infinite', bank: 'CIMB Bank', name: 'Visa Infinite', fullName: 'CIMB Visa Infinite Credit Card', network: 'visa', tier: 'infinite', cardColor: '#1a1a2e', features: ['5x bonus points dining/overseas', 'Convert to flights with 12 airlines'], annualFee: 'Free*', minIncome: 5000 },

  // ====== PUBLIC BANK ======
  { id: 'pb-quantum', bank: 'Public Bank', name: 'Quantum', fullName: 'Public Bank Quantum', network: 'visa', tier: 'classic', cardColor: '#D4213D', cashbackRate: 'up to 2%', annualFee: 'Free*', minIncome: 3000, features: ['2% cashback overseas', '1% contactless', 'Travel-optimized'], defaultRules: [{ categoryKey: 'category.travel', label: 'Overseas', rate: 2 }, { categoryKey: '*', label: 'Contactless/Others', rate: 1 }] },
  { id: 'pb-world-mc', bank: 'Public Bank', name: 'World MasterCard', fullName: 'Public Bank World MasterCard', network: 'mastercard', tier: 'world', cardColor: '#1a1a2e', features: ['Up to 3x AirMiles Points/RM1', 'Airline partner rewards'], annualFee: 'Free*', minIncome: 8333 },
  { id: 'pb-visa-signature', bank: 'Public Bank', name: 'Visa Signature', fullName: 'Public Bank Visa Signature', network: 'visa', tier: 'signature', cardColor: '#4B0082', cashbackRate: '2%', annualFee: 'Free*', minIncome: 6667, features: ['2% cashback groceries/online/dining', 'Green/VIP Points'], defaultRules: [{ categoryKey: 'category.food', label: 'Dining', rate: 2 }, { categoryKey: 'category.shopping', label: 'Groceries/Online', rate: 2 }, { categoryKey: '*', label: 'Others', rate: 0.2 }] },
  { id: 'pb-visa-infinite', bank: 'Public Bank', name: 'Visa Infinite', fullName: 'Public Bank Visa Infinite', network: 'visa', tier: 'infinite', cardColor: '#1a1a2e', cashbackRate: 'up to 2%', annualFee: 'Free', minIncome: 8333, features: ['2% Cash MegaBonus overseas', '0.3% local retail', '5x free airport lounge', 'Free travel insurance'] },
  { id: 'pb-visa-plat', bank: 'Public Bank', name: 'Visa Platinum', fullName: 'Public Bank Visa Platinum', network: 'visa', tier: 'platinum', cardColor: '#A9A9A9', cashbackRate: '0.2%', annualFee: 'Free*', minIncome: 4167, features: ['0.2% unlimited Cash MegaBonus'] },
  { id: 'pb-plat-mc', bank: 'Public Bank', name: 'Platinum MasterCard', fullName: 'Public Bank Platinum MasterCard', network: 'mastercard', tier: 'platinum', cardColor: '#A9A9A9', features: ['1x VIP Points/RM1'], annualFee: 'Free*', minIncome: 4167 },
  { id: 'pb-visa-gold', bank: 'Public Bank', name: 'Visa Gold', fullName: 'Public Bank Visa Gold', network: 'visa', tier: 'gold', cardColor: '#DAA520', cashbackRate: '0.1%', annualFee: 'Free*', minIncome: 2000, features: ['0.1% unlimited Cash MegaBonus'] },
  { id: 'pb-gold-mc', bank: 'Public Bank', name: 'Gold MasterCard', fullName: 'Public Bank Gold MasterCard', network: 'mastercard', tier: 'gold', cardColor: '#DAA520', cashbackRate: '0.1%', annualFee: 'Free*', minIncome: 2000, features: ['0.1% unlimited Cash MegaBonus'] },
  { id: 'pb-petron-visa-gold', bank: 'Public Bank', name: 'Petron Visa Gold', fullName: 'Public Bank Petron Visa Gold', network: 'visa', tier: 'gold', cardColor: '#0054A6', cashbackRate: 'up to 5%', annualFee: 'Free*', minIncome: 2000, features: ['5% cash rebate at Petron', '0.1% elsewhere'], defaultRules: [{ categoryKey: 'category.transport', label: 'Petron', rate: 5, monthlyCap: 20 }, { categoryKey: '*', label: 'Others', rate: 0.1 }] },
  { id: 'pb-aia-visa-gold', bank: 'Public Bank', name: 'AIA Visa Gold', fullName: 'Public Bank AIA Visa Gold', network: 'visa', tier: 'gold', cardColor: '#CC0033', cashbackRate: '0.2%', annualFee: 'Free*', minIncome: 2000, features: ['0.2% cash rebate on insurance', '0.1% other purchases'] },
  { id: 'pb-visa-commercial', bank: 'Public Bank', name: 'Visa Commercial', fullName: 'Public Bank Visa Commercial', network: 'visa', tier: 'platinum', cardColor: '#34495E', cashbackRate: 'up to 0.5%', annualFee: 'Free*', features: ['0.5% unlimited cashback all transactions', 'Business expenses focus'] },
  { id: 'pb-visa-business', bank: 'Public Bank', name: 'Visa Business', fullName: 'Public Bank Visa Business', network: 'visa', tier: 'classic', cardColor: '#34495E', cashbackRate: 'up to 0.8%', annualFee: 'Free*', features: ['0.8% unlimited cashback business expenses'] },
  // Islamic
  { id: 'pib-visa-plat-i', bank: 'Public Bank', name: 'Islamic Visa Platinum-i', fullName: 'Public Islamic Bank Visa Platinum-i', network: 'visa', tier: 'platinum', cardColor: '#8B4513', cashbackRate: '2%', annualFee: 'Free*', minIncome: 3333, features: ['2% cashback online/overseas'] },
  { id: 'pib-visa-gold-i', bank: 'Public Bank', name: 'Islamic Visa Gold-i', fullName: 'Public Islamic Bank Visa Gold-i', network: 'visa', tier: 'gold', cardColor: '#8B4513', cashbackRate: '1%', annualFee: 'Free*', minIncome: 2000, features: ['1% cashback online transactions'] },

  // ====== HONG LEONG ======
  { id: 'hlb-sutera-plat', bank: 'Hong Leong Bank', name: 'Sutera Platinum', fullName: 'Hong Leong Sutera Platinum Credit Card', network: 'visa', tier: 'platinum', cardColor: '#00539B', features: ['8x HLB Reward Points online/dining/groceries/pharmacies/overseas', 'Redeem Enrich Points/TNG/eVouchers'], annualFee: 'Free*', minIncome: 3000, defaultRules: [{ categoryKey: 'category.transport', label: 'Petrol', rate: 8, monthlyCap: 20 }, { categoryKey: 'category.food', label: 'Dining', rate: 5, monthlyCap: 20 }, { categoryKey: '*', label: 'Others', rate: 0.3 }] },
  { id: 'hlb-wise', bank: 'Hong Leong Bank', name: 'WISE Card', fullName: 'Hong Leong WISE Credit Card', network: 'visa', tier: 'classic', cardColor: '#4CAF50', cashbackRate: 'up to 15%', annualFee: 'RM98', minIncome: 2000, features: ['Up to 15% cashback on dining/groceries/pharmacies/petrol/online', 'RM780+ cashback annually', 'Annual fee RM98 (no waiver) — revised Jan 2025'], defaultRules: [{ categoryKey: 'category.food', label: 'Dining', rate: 15, monthlyCap: 15 }, { categoryKey: 'category.shopping', label: 'Groceries/Pharmacies', rate: 8, monthlyCap: 15 }, { categoryKey: 'category.transport', label: 'Petrol', rate: 5, monthlyCap: 15 }, { categoryKey: '*', label: 'Online/Others', rate: 1 }] },
  { id: 'hlb-essential', bank: 'Hong Leong Bank', name: 'Essential Card', fullName: 'Hong Leong Essential Credit Card', network: 'visa', tier: 'classic', cardColor: '#00539B', cashbackRate: 'up to 1%', annualFee: 'Free*', minIncome: 2000, features: ['Unlimited cashback on most purchases', '1% travel & retail cashback', 'Includes insurance spending'] },
  { id: 'hlb-infinite', bank: 'Hong Leong Bank', name: 'Infinite Card', fullName: 'Hong Leong Infinite Credit Card', network: 'visa', tier: 'infinite', cardColor: '#1a1a2e', features: ['Lifetime annual fee waiver', 'Unlimited Enrich Points (no cap)', '4 Plaza Premium Lounge passes/year', 'Travel insurance'], annualFee: 'Free', minIncome: 8333 },
  { id: 'hlb-gsc-plat', bank: 'Hong Leong Bank', name: 'GSC Platinum', fullName: 'Hong Leong GSC Platinum Credit Card', network: 'visa', tier: 'platinum', cardColor: '#FFD700', features: ['10 free movie tickets on approval', 'RM6 off every movie ticket', '30% off GSC snacks/drinks'], annualFee: 'Free*', minIncome: 5000 },
  { id: 'hlb-gsc-gold', bank: 'Hong Leong Bank', name: 'GSC Gold', fullName: 'Hong Leong GSC Gold Credit Card', network: 'visa', tier: 'gold', cardColor: '#DAA520', features: ['5 free movie tickets on approval', 'RM6 off every movie ticket'], annualFee: 'Free*', minIncome: 2000 },

  // ====== UOB ======
  // Cashback cards
  { id: 'uob-one-classic', bank: 'UOB Bank', name: 'ONE Card Classic', fullName: 'UOB ONE Card', network: 'visa', tier: 'classic', cardColor: '#003DA5', cashbackRate: 'up to 10%', annualFee: 'Free*', minIncome: 3000, features: ['10% petrol/groceries/dining/Grab', 'Unlimited 0.2% other purchases'], defaultRules: [{ categoryKey: 'category.food', label: 'Dining', rate: 10, monthlyCap: 15 }, { categoryKey: 'category.transport', label: 'Petrol/Grab', rate: 10, monthlyCap: 15 }, { categoryKey: 'category.shopping', label: 'Groceries', rate: 10, monthlyCap: 15 }, { categoryKey: '*', label: 'Others', rate: 0.2 }] },
  { id: 'uob-one-plat', bank: 'UOB Bank', name: 'ONE Card Platinum', fullName: 'UOB ONE Card Platinum', network: 'visa', tier: 'platinum', cardColor: '#003DA5', cashbackRate: 'up to 10%', annualFee: 'Free*', minIncome: 3000, features: ['10% petrol/groceries/dining/Grab', 'Unlimited 0.2% other purchases'], defaultRules: [{ categoryKey: 'category.food', label: 'Dining', rate: 10, monthlyCap: 15 }, { categoryKey: 'category.transport', label: 'Petrol/Grab', rate: 10, monthlyCap: 15 }, { categoryKey: 'category.shopping', label: 'Groceries', rate: 10, monthlyCap: 15 }, { categoryKey: '*', label: 'Others', rate: 0.2 }] },
  { id: 'uob-evol', bank: 'UOB Bank', name: 'EVOL Card', fullName: 'UOB EVOL Card', network: 'visa', tier: 'classic', cardColor: '#FF6B35', cashbackRate: 'up to 10%', annualFee: 'Free', minIncome: 2500, features: ['10% online spend', '5% e-wallet top-up', '5X entertainment/dining rewards', 'Monthly fee waiver with 1 transaction'], defaultRules: [{ categoryKey: 'category.shopping', label: 'Online Spend', rate: 10, monthlyCap: 15 }, { categoryKey: 'category.entertainment', label: 'Entertainment/Dining', rate: 5, monthlyCap: 15 }, { categoryKey: '*', label: 'E-wallet Top-up', rate: 5, monthlyCap: 15 }] },
  { id: 'uob-simple', bank: 'UOB Bank', name: 'Simple Card', fullName: 'UOB Simple Card', network: 'visa', tier: 'classic', cardColor: '#4A90D9', cashbackRate: '10% finance charges', annualFee: 'Free', minIncome: 2000, features: ['10% cashback on finance charges', 'Unlimited cashback earnings', 'No late payment charges'] },
  // Rewards / Miles cards
  { id: 'uob-preferred', bank: 'UOB Bank', name: 'Preferred Card', fullName: 'UOB Preferred Card', network: 'visa', tier: 'platinum', cardColor: '#2C3E50', features: ['10X UNIRM streaming', '5X dining/grocery', '3X recurring transactions', '1-for-1 Coffee Bean weekdays'], annualFee: 'Free*', minIncome: 3000 },
  { id: 'uob-world', bank: 'UOB Bank', name: 'World Card', fullName: 'UOB World Card', network: 'mastercard', tier: 'world', cardColor: '#1a1a2e', features: ['12X UNIRM e-commerce/e-wallet', '5X departmental stores', '125,000 UNIRM bonus at RM48K yearly', '6 annual lounge accesses'], annualFee: 'Free*', minIncome: 5000 },
  { id: 'uob-prvi-miles-elite', bank: 'UOB Bank', name: 'PRVI Miles Elite', fullName: 'UOB PRVI Miles Elite Card', network: 'visa', tier: 'signature', cardColor: '#1C1C1C', features: ['Up to 12X UNIRM overseas', '5X airline spend', '2.4 air miles/RM1 on Agoda', '8 Plaza Premium Lounge accesses', '60,000 UNIRM upon annual fee payment'], annualFee: 'RM800', minIncome: 8333 },
  { id: 'uob-visa-infinite', bank: 'UOB Bank', name: 'Visa Infinite', fullName: 'UOB Visa Infinite Card', network: 'visa', tier: 'infinite', cardColor: '#1a1a2e', features: ['10X UNIRM overseas', '5X local dining', '12 complimentary airport lounge visits', 'Complimentary limo to KLIA'], annualFee: 'RM1,200', minIncome: 12500 },
  // Ladies cards
  { id: 'uob-ladys-solitaire', bank: 'UOB Bank', name: "Lady's Solitaire", fullName: "UOB Lady's Solitaire Card", network: 'visa', tier: 'signature', cardColor: '#8B0045', features: ['10X UNIRM fashion', '5X groceries/overseas', '0% installment plan fashion/beauty/travel', '6 annual KLIA T1 lounge accesses'], annualFee: 'RM500', minIncome: 5000 },
  { id: 'uob-ladys-card', bank: 'UOB Bank', name: "Lady's Card", fullName: "UOB Lady's Card", network: 'visa', tier: 'classic', cardColor: '#D4508B', features: ['10X UNIRM fashion', '5X groceries', '0% installment options'], annualFee: 'Free*', minIncome: 2500 },
  // Business / Others
  { id: 'uob-platinum-biz', bank: 'UOB Bank', name: 'Platinum Business', fullName: 'UOB Platinum Business Card', network: 'visa', tier: 'platinum', cardColor: '#34495E', cashbackRate: 'up to 1.2%', features: ['1.2% overseas cashback', '0.5% local cashback', '0.2% utilities cashback', 'No min spend for overseas cashback', 'Travel insurance up to RM1M'], annualFee: 'Free*', minIncome: 5000, defaultRules: [{ categoryKey: 'category.travel', label: 'Overseas', rate: 1.2 }, { categoryKey: '*', label: 'Local', rate: 0.5 }] },
  { id: 'uob-lazada', bank: 'UOB Bank', name: 'Lazada Card', fullName: 'Lazada UOB Card', network: 'visa', tier: 'classic', cardColor: '#0F146D', features: ['10X UNIRM on Lazada', '5X online lifestyle', '1,000 UNIRM bonus at RM1,500 monthly'], annualFee: 'Free*', minIncome: 2500 },
  { id: 'uob-yolo-visa', bank: 'UOB Bank', name: 'YOLO Visa', fullName: 'UOB YOLO Visa Credit Card', network: 'visa', tier: 'classic', cardColor: '#FF1493', cashbackRate: 'up to 8%', annualFee: 'Free', minIncome: 2500, features: ['8% dining', '8% entertainment', '0.2% others'], defaultRules: [{ categoryKey: 'category.food', label: 'Dining', rate: 8, monthlyCap: 20 }, { categoryKey: 'category.entertainment', label: 'Entertainment', rate: 8, monthlyCap: 20 }, { categoryKey: '*', label: 'Others', rate: 0.2 }] },
  { id: 'uob-zenith-mc', bank: 'UOB Bank', name: 'Zenith MasterCard', fullName: 'UOB Zenith MasterCard', network: 'mastercard', tier: 'world', cardColor: '#1a1a2e', annualFee: 'Free*', minIncome: 3000 },

  // ====== AMBANK ======
  { id: 'ambank-cashrebate-visa', bank: 'AmBank', name: 'Cash Rebate Visa Platinum', fullName: 'AmBank Cash Rebate Visa Platinum', network: 'visa', tier: 'platinum', cardColor: '#E31937', cashbackRate: 'up to 10%', annualFee: 'Free', minIncome: 2000, features: ['Up to 8% online shopping cashback', 'Finance charge rebates', 'Free for life (SST RM25)'], defaultRules: [{ categoryKey: 'category.shopping', label: 'Online Shopping', rate: 8, monthlyCap: 30 }, { categoryKey: 'category.transport', label: 'Petrol', rate: 5, monthlyCap: 15 }, { categoryKey: '*', label: 'Others', rate: 1 }] },
  { id: 'ambank-visa-infinite', bank: 'AmBank', name: 'Visa Infinite', fullName: 'AmBank Visa Infinite', network: 'visa', tier: 'infinite', cardColor: '#1a1a2e', features: ['Premium travel benefits'], annualFee: 'Free*', minIncome: 12500 },
  { id: 'ambank-enrich-visa', bank: 'AmBank', name: 'Enrich Visa', fullName: 'AmBank Enrich Visa', network: 'visa', tier: 'classic', cardColor: '#E31937', features: ['Air miles earning', 'For frequent flyers'], annualFee: 'Free*', minIncome: 2500 },
  { id: 'ambank-visa-signature', bank: 'AmBank', name: 'Visa Signature', fullName: 'AmBank Visa Signature', network: 'visa', tier: 'signature', cardColor: '#2C2C2C', features: ['3X points overseas', 'Airport lounge access'], annualFee: 'Free*', minIncome: 5000 },
  { id: 'ambank-bonuslink-visa', bank: 'AmBank', name: 'BonusLink Visa', fullName: 'AmBank BonusLink Visa', network: 'visa', tier: 'classic', cardColor: '#FF6600', features: ['Earn BonusLink Points', 'Redeem for travel/cashback', 'Auto BillPay bonus points'], annualFee: 'Free', minIncome: 2000 },
  { id: 'ambank-islamic-carz', bank: 'AmBank', name: 'Islamic CARz Platinum', fullName: 'AmBank Islamic Visa Platinum CARz Card-i', network: 'visa', tier: 'platinum', cardColor: '#E31937', cashbackRate: 'up to 5%', annualFee: 'Free', minIncome: 2000, features: ['Petrol cashback at all stations', 'Shariah-compliant'], defaultRules: [{ categoryKey: 'category.transport', label: 'Petrol (all stations)', rate: 5, monthlyCap: 20 }, { categoryKey: '*', label: 'Others', rate: 0.2 }] },
  { id: 'ambank-visa-plat', bank: 'AmBank', name: 'Visa Platinum', fullName: 'AmBank Visa Platinum', network: 'visa', tier: 'platinum', cardColor: '#E31937', features: ['Free for life', 'Rewards & travel perks'], annualFee: 'Free', minIncome: 2500 },
  { id: 'ambank-priority-world-mc', bank: 'AmBank', name: 'SIGNATURE Priority Banking World MC', fullName: 'AmBank SIGNATURE Priority Banking World Mastercard', network: 'mastercard', tier: 'world', cardColor: '#1a1a2e', features: ['5X points overseas', 'Unlimited airport lounge access'], annualFee: 'Free*', minIncome: 8333 },
  { id: 'ambank-unionpay-plat', bank: 'AmBank', name: 'UnionPay Platinum', fullName: 'AmBank UnionPay Platinum', network: 'unionpay', tier: 'platinum', cardColor: '#DC241F', features: ['5X points overseas', 'Airport lounge access', 'UnionPay network benefits'], annualFee: 'Free*', minIncome: 2500 },

  // ====== ALLIANCE ======
  { id: 'alliance-visa-signature', bank: 'Alliance Bank', name: 'Visa Signature', fullName: 'Alliance Bank Visa Signature', network: 'visa', tier: 'signature', cardColor: '#003366', annualFee: 'Free*', minIncome: 5000 },
  { id: 'alliance-visa-plat', bank: 'Alliance Bank', name: 'Visa Platinum', fullName: 'Alliance Bank Visa Platinum', network: 'visa', tier: 'platinum', cardColor: '#003366', annualFee: 'Free*', minIncome: 2000 },

  // ====== HSBC ======
  { id: 'hsbc-live-plus', bank: 'HSBC', name: 'Live+ Card', fullName: 'HSBC Live+ Credit Card', network: 'visa', tier: 'classic', cardColor: '#DB0011', features: ['Extra cashback on dining/shopping/entertainment'], annualFee: 'Free*', minIncome: 2000 },
  { id: 'hsbc-travelone', bank: 'HSBC', name: 'TravelOne Card', fullName: 'HSBC TravelOne Credit Card', network: 'visa', tier: 'platinum', cardColor: '#DB0011', features: ['Instant reward redemption', 'Airline & hotel partner rewards'], annualFee: 'Free*', minIncome: 5000 },
  { id: 'hsbc-visa-signature', bank: 'HSBC', name: 'Visa Signature', fullName: 'HSBC Visa Signature Credit Card', network: 'visa', tier: 'signature', cardColor: '#DB0011', features: ['8x Reward Points overseas/online', '5x local purchases'], annualFee: 'Free*', minIncome: 8000 },
  { id: 'hsbc-premier-world-mc', bank: 'HSBC', name: 'Premier World MasterCard', fullName: 'HSBC Premier World MasterCard', network: 'mastercard', tier: 'world', cardColor: '#1a1a2e', features: ['Premium travel benefits', 'Priority banking'], annualFee: 'Free*', minIncome: 12500 },
  { id: 'hsbc-premier-travel', bank: 'HSBC', name: 'Premier Travel Card', fullName: 'HSBC Premier Travel Card', network: 'visa', tier: 'infinite', cardColor: '#1a1a2e', features: ['Premium travel perks'], annualFee: 'Free*', minIncome: 12500 },
  { id: 'hsbc-platinum', bank: 'HSBC', name: 'Platinum Card', fullName: 'HSBC Platinum Credit Card', network: 'visa', tier: 'platinum', cardColor: '#DB0011', features: ['Standard rewards'], annualFee: 'Free*', minIncome: 5000 },
  { id: 'hsbc-amanah-mpower', bank: 'HSBC', name: 'Amanah MPower Card', fullName: 'HSBC Amanah MPower Credit Card-i', network: 'visa', tier: 'classic', cardColor: '#006A4E', features: ['Lifetime fee waiver', 'Shariah-compliant'], annualFee: 'Free', minIncome: 2000 },
  { id: 'hsbc-amanah-mpower-plat', bank: 'HSBC', name: 'Amanah MPower Platinum', fullName: 'HSBC Amanah MPower Platinum Credit Card-i', network: 'visa', tier: 'platinum', cardColor: '#006A4E', features: ['Shariah-compliant', 'Higher rewards tier'], annualFee: 'Free*', minIncome: 5000 },
  { id: 'hsbc-amanah-premier-world', bank: 'HSBC', name: 'Amanah Premier World MC', fullName: 'HSBC Amanah Premier World Mastercard-i', network: 'mastercard', tier: 'world', cardColor: '#006A4E', features: ['Shariah-compliant', 'Premium travel benefits'], annualFee: 'Free*', minIncome: 12500 },

  // ====== STANDARD CHARTERED ======
  { id: 'scb-simply-cash', bank: 'Standard Chartered', name: 'Simply Cash', fullName: 'Standard Chartered Simply Cash Credit Card', network: 'visa', tier: 'classic', cardColor: '#007A33', cashbackRate: 'up to 15%', annualFee: 'Free*', minIncome: 8000, features: ['15% cashback petrol/groceries/dining', 'RM1 ZUS Coffee deals'], defaultRules: [{ categoryKey: 'category.food', label: 'Dining', rate: 15, monthlyCap: 25 }, { categoryKey: 'category.transport', label: 'Petrol', rate: 15, monthlyCap: 25 }, { categoryKey: 'category.shopping', label: 'Groceries', rate: 15, monthlyCap: 25 }, { categoryKey: '*', label: 'Others', rate: 0.2 }] },
  { id: 'scb-journey', bank: 'Standard Chartered', name: 'Journey Card', fullName: 'Standard Chartered Journey Credit Card', network: 'visa', tier: 'signature', cardColor: '#007A33', features: ['5x miles on dining/travel/overseas', 'Up to RM65 airport transfer', 'Plaza Premium Lounge access'], annualFee: 'Free*', minIncome: 8000 },
  { id: 'scb-visa-plat', bank: 'Standard Chartered', name: 'Visa Platinum', fullName: 'Standard Chartered Visa Platinum', network: 'visa', tier: 'platinum', cardColor: '#007A33', features: ['Up to 8x points overseas', '5x dining/grocery', '5,000 bonus points monthly'], annualFee: 'Free*', minIncome: 8000 },
  { id: 'scb-plat-mc-basic', bank: 'Standard Chartered', name: 'Platinum Mastercard Basic', fullName: 'Standard Chartered Platinum Mastercard Basic', network: 'mastercard', tier: 'platinum', cardColor: '#007A33', features: ['1x point/RM1', 'Lifetime fee waiver', 'RM1 deals'], annualFee: 'Free', minIncome: 8000 },
  { id: 'scb-beyond-priority', bank: 'Standard Chartered', name: 'Beyond (Priority Banking)', fullName: 'Standard Chartered Beyond Credit Card (Priority Banking)', network: 'visa', tier: 'infinite', cardColor: '#1a1a2e', features: ['Up to 60% MICHELIN restaurants', '8x airport lounge', 'Up to RM60 Grab transfer credit'], annualFee: 'Free*', minIncome: 12500 },
  { id: 'scb-beyond-private', bank: 'Standard Chartered', name: 'Beyond (Priority Private)', fullName: 'Standard Chartered Beyond Credit Card (Priority Private)', network: 'visa', tier: 'infinite', cardColor: '#0D0D0D', features: ['Up to 60% MICHELIN restaurants', 'Unlimited airport lounge', 'Business Class upgrade benefit'], annualFee: 'Free*', minIncome: 25000 },

  // ====== OCBC ======
  { id: 'ocbc-mc-blue', bank: 'OCBC Bank', name: 'MasterCard Blue', fullName: 'OCBC MasterCard Blue', network: 'mastercard', tier: 'classic', cardColor: '#003DA5', cashbackRate: 'up to 5%', annualFee: 'Free', minIncome: 2000 },
  { id: 'ocbc-mc-pink', bank: 'OCBC Bank', name: 'MasterCard Pink', fullName: 'OCBC MasterCard Pink', network: 'mastercard', tier: 'classic', cardColor: '#FF69B4', cashbackRate: 'up to 5%', annualFee: 'Free', minIncome: 2000 },

  // ====== BSN ======
  { id: 'bsn-visa-classic', bank: 'BSN', name: 'Visa Classic', fullName: 'BSN Visa Classic Credit Card', network: 'visa', tier: 'classic', cardColor: '#003DA5', annualFee: 'Free', minIncome: 2000 },

  // ====== AFFIN ======
  { id: 'affin-duo-cashback', bank: 'Affin Bank', name: 'DUO Visa Cash Back', fullName: 'Affin DUO Visa Cash Back', network: 'visa', tier: 'classic', cardColor: '#003B71', cashbackRate: 'up to 3%', annualFee: 'Free*', minIncome: 2000, features: ['3% online/e-wallet/auto-billing cashback', 'Cap RM50/mth (RM3K balance) or RM30/mth', '3-year annual fee waiver'], defaultRules: [{ categoryKey: 'category.shopping', label: 'Online/E-wallet/Auto-billing', rate: 3, monthlyCap: 50 }, { categoryKey: '*', label: 'Others', rate: 0.3 }] },
  { id: 'affin-duo-plus-visa', bank: 'Affin Bank', name: 'DUO+ Visa', fullName: 'Affin DUO+ Visa', network: 'visa', tier: 'classic', cardColor: '#003B71', cashbackRate: '3%', annualFee: 'Free*', minIncome: 2000, features: ['3% cashback on contactless (max RM250/txn)'] },
  { id: 'affin-duo-plus-mc', bank: 'Affin Bank', name: 'DUO+ Mastercard', fullName: 'Affin DUO+ Mastercard', network: 'mastercard', tier: 'classic', cardColor: '#003B71', features: ['3x reward points on travel/online'], annualFee: 'Free*', minIncome: 2000 },
  { id: 'affin-bhpetrol-mc', bank: 'Affin Bank', name: 'BHPetrol Mastercard', fullName: 'Affin BHPetrol Mastercard', network: 'mastercard', tier: 'classic', cardColor: '#FF6600', cashbackRate: 'up to 10%', annualFee: 'Free*', minIncome: 2000, features: ['Up to 10% cashback on petrol (cap RM50/mth)'], defaultRules: [{ categoryKey: 'category.transport', label: 'BHPetrol', rate: 10, monthlyCap: 50 }, { categoryKey: '*', label: 'Others', rate: 0.2 }] },
  { id: 'affin-classic', bank: 'Affin Bank', name: 'Classic Card', fullName: 'Affin Classic Credit Card', network: 'visa', tier: 'classic', cardColor: '#003B71', cashbackRate: 'up to 0.8%', annualFee: 'Free*', minIncome: 2000, features: ['0.4% cashback (min RM100 spend)', '0.8% if spend above RM1,500'] },

  // ====== BANK ISLAM ======
  { id: 'bi-visa-gold', bank: 'Bank Islam', name: 'Visa Gold-i', fullName: 'Bank Islam Visa Gold-i', network: 'visa', tier: 'gold', cardColor: '#8B1A4A', annualFee: 'Free*', minIncome: 2000 },

  // ====== BANK RAKYAT ======
  { id: 'brakyat-plat-explorer', bank: 'Bank Rakyat', name: 'Platinum Explorer-i', fullName: 'Bank Rakyat Platinum Explorer Credit Card-i', network: 'mastercard', tier: 'platinum', cardColor: '#003DA5', cashbackRate: '5% travel', annualFee: 'Free', minIncome: 3000, features: ['5% cashback airlines/hotels (cap RM1K/yr)', '3x Plaza Premium Lounge/year', 'Shariah-compliant'], defaultRules: [{ categoryKey: 'category.travel', label: 'Airlines/Hotels', rate: 5, monthlyCap: 83 }] },
  { id: 'brakyat-plat', bank: 'Bank Rakyat', name: 'Platinum Card-i', fullName: 'Bank Rakyat Platinum Credit Card-i', network: 'mastercard', tier: 'platinum', cardColor: '#003DA5', features: ['1 Rakyat Reward Point/RM10', 'Annual fee waived unconditionally', 'Shariah-compliant'], annualFee: 'Free', minIncome: 3000 },
  { id: 'brakyat-gold', bank: 'Bank Rakyat', name: 'Gold Card-i', fullName: 'Bank Rakyat Gold Credit Card-i', network: 'mastercard', tier: 'gold', cardColor: '#DAA520', features: ['0% easy payment plans', 'Annual fee waived unconditionally', 'Shariah-compliant'], annualFee: 'Free', minIncome: 3000 },
  { id: 'brakyat-muslimah', bank: 'Bank Rakyat', name: 'Muslimah Card-i', fullName: 'Bank Rakyat Muslimah Credit Card-i', network: 'mastercard', tier: 'classic', cardColor: '#E91E63', features: ['Up to 10% discount at selected merchants', 'Designed for women', 'Shariah-compliant'], annualFee: 'Free', minIncome: 2000 },

  // ====== BANK MUAMALAT ======
  { id: 'muamalat-visa-plat', bank: 'Bank Muamalat', name: 'Visa Platinum-i', fullName: 'Bank Muamalat Credit Card-i Visa Platinum', network: 'visa', tier: 'platinum', cardColor: '#006B3F', cashbackRate: 'up to 1%', annualFee: 'Free', minIncome: 3000, features: ['Lifetime annual fee waiver', '1% cashback overseas', '1% e-commerce cashback', '0.5% contactless cashback', '0% balance transfer 6 months', 'Shariah-compliant'], defaultRules: [{ categoryKey: 'category.travel', label: 'Overseas', rate: 1 }, { categoryKey: 'category.shopping', label: 'E-commerce', rate: 1 }, { categoryKey: '*', label: 'Contactless', rate: 0.5 }] },
  { id: 'muamalat-posmy-plat', bank: 'Bank Muamalat', name: 'Pos Malaysia Visa Platinum-i', fullName: 'Bank Muamalat Pos Malaysia Visa Platinum-i', network: 'visa', tier: 'platinum', cardColor: '#DA291C', cashbackRate: 'up to 8%', annualFee: 'Free', minIncome: 3000, features: ['8% cashback at Pos Malaysia (cap RM100/mth)', '1% overseas cashback', 'Shariah-compliant'], defaultRules: [{ categoryKey: '*', label: 'Pos Malaysia', rate: 8, monthlyCap: 100 }] },
  { id: 'muamalat-posmy-infinite', bank: 'Bank Muamalat', name: 'Pos Malaysia Visa Infinite-i', fullName: 'Bank Muamalat Pos Malaysia Visa Infinite-i', network: 'visa', tier: 'infinite', cardColor: '#1a1a2e', features: ['Plaza Premium Lounge access worldwide', 'Travel accident takaful up to RM1M', 'Shariah-compliant'], annualFee: 'Free', minIncome: 8333 },

  // ====== AEON ======
  { id: 'aeon-member-plus-visa-plat', bank: 'AEON', name: 'Member Plus Visa Platinum', fullName: 'AEON Member Plus (AMP) Visa Platinum', network: 'visa', tier: 'platinum', cardColor: '#E31837', cashbackRate: 'up to 10%', annualFee: 'Free*', minIncome: 3000, defaultRules: [{ categoryKey: 'category.shopping', label: 'AEON BiG Day (20th/28th)', rate: 10, monthlyCap: 100 }, { categoryKey: '*', label: 'Online Spend', rate: 2, monthlyCap: 25 }] },
  { id: 'aeon-member-plus-mc-plat', bank: 'AEON', name: 'Member Plus MC Platinum', fullName: 'AEON Member Plus (AMP) MasterCard Platinum', network: 'mastercard', tier: 'platinum', cardColor: '#E31837', cashbackRate: 'up to 10%', annualFee: 'Free*', minIncome: 5000, defaultRules: [{ categoryKey: 'category.shopping', label: 'AEON BiG Day (20th/28th)', rate: 10, monthlyCap: 100 }, { categoryKey: '*', label: 'Online Spend', rate: 2, monthlyCap: 25 }] },
  { id: 'aeon-member-plus-mc-gold', bank: 'AEON', name: 'Member Plus MC Gold', fullName: 'AEON Member Plus (AMP) MasterCard Gold', network: 'mastercard', tier: 'gold', cardColor: '#DAA520', cashbackRate: 'up to 8%', annualFee: 'Free*', minIncome: 3000 },
  { id: 'aeon-big-visa-gold', bank: 'AEON', name: 'BiG Visa Gold', fullName: 'AEON BiG Visa Gold', network: 'visa', tier: 'gold', cardColor: '#0054A6', cashbackRate: 'up to 5%', annualFee: 'Free*', minIncome: 3000 },
  { id: 'aeon-big-visa-classic', bank: 'AEON', name: 'BiG Visa Classic', fullName: 'AEON BiG Visa Classic', network: 'visa', tier: 'classic', cardColor: '#0054A6', cashbackRate: 'up to 5%', annualFee: 'Free', minIncome: 2000 },
  { id: 'aeon-biker-gold', bank: 'AEON', name: 'Biker Gold Visa', fullName: 'AEON Biker Gold Visa Card', network: 'visa', tier: 'gold', cardColor: '#1a1a2e', cashbackRate: 'up to 5%', annualFee: 'Free*', minIncome: 2000 },
  { id: 'aeon-biker-infinite', bank: 'AEON', name: 'Biker Infinite Visa', fullName: 'AEON Biker Infinite Visa Card', network: 'visa', tier: 'infinite', cardColor: '#1a1a2e', cashbackRate: 'up to 8%', annualFee: 'Free*', minIncome: 7500 },
  { id: 'aeon-classic-visa', bank: 'AEON', name: 'Classic Visa', fullName: 'AEON Member Plus (AMP) Visa Classic', network: 'visa', tier: 'classic', cardColor: '#E31837', annualFee: 'Free', minIncome: 1500 },
]

/**
 * Search card catalog by bank name or card name.
 */
export function searchCards(query: string): CardProduct[] {
  if (!query || query.length < 2) return []
  const q = query.toLowerCase()
  return CARD_CATALOG.filter(
    (c) =>
      c.bank.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.fullName.toLowerCase().includes(q),
  )
}

/**
 * Get cards for a specific bank.
 */
export function getCardsByBank(bankName: string): CardProduct[] {
  const q = bankName.toLowerCase()
  return CARD_CATALOG.filter((c) => c.bank.toLowerCase().includes(q))
}

/**
 * Find best matching card product from catalog.
 */
export function matchCardProduct(bankName: string, cardName: string): CardProduct | undefined {
  const bn = bankName.toLowerCase()
  const cn = cardName.toLowerCase()

  // Exact match on full name
  let match = CARD_CATALOG.find((c) => c.fullName.toLowerCase() === cn)
  if (match) return match

  // Bank + partial name match
  match = CARD_CATALOG.find(
    (c) => c.bank.toLowerCase().includes(bn) && (cn.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(cn)),
  )
  if (match) return match

  // Bank match only — return first card from bank
  return CARD_CATALOG.find((c) => c.bank.toLowerCase().includes(bn))
}

/**
 * Get tier display info
 */
export const TIER_COLORS: Record<string, { bg: string; text: string }> = {
  classic: { bg: '#64748b', text: '#FFFFFF' },
  gold: { bg: '#DAA520', text: '#000000' },
  platinum: { bg: '#A9A9A9', text: '#000000' },
  signature: { bg: '#4B0082', text: '#FFFFFF' },
  infinite: { bg: '#1a1a2e', text: '#FFFFFF' },
  world: { bg: '#1a1a2e', text: '#FFFFFF' },
}
