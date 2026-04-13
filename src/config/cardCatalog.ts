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
}

export const CARD_CATALOG: CardProduct[] = [
  // ====== RHB ======
  { id: 'rhb-shell-visa', bank: 'RHB Bank', name: 'Shell Visa', fullName: 'RHB Shell Visa Credit Card', network: 'visa', tier: 'classic', cardColor: '#1a1a2e', cashbackRate: 'up to 12%', annualFee: 'Free*', minIncome: 2000, features: ['12% fuel cashback at Shell', 'Cap RM30/month'] },
  { id: 'rhb-cashback-visa', bank: 'RHB Bank', name: 'Cash Back Visa', fullName: 'RHB Cash Back Visa Credit Card', network: 'visa', tier: 'classic', cardColor: '#003DA5', cashbackRate: 'up to 10%', annualFee: 'Free*', minIncome: 2000, features: ['10% cashback', 'Min spend RM2,500/month'] },
  { id: 'rhb-world-mc', bank: 'RHB Bank', name: 'World MasterCard', fullName: 'RHB World MasterCard Credit Card', network: 'mastercard', tier: 'world', cardColor: '#1a1a2e', cashbackRate: 'up to 6%', annualFee: 'Free*', minIncome: 2000, features: ['6% travel/petrol/dining', 'Cap RM30/month'] },
  { id: 'rhb-premier-visa', bank: 'RHB Bank', name: 'Premier Visa Infinite', fullName: 'RHB Premier Visa Infinite Credit Card', network: 'visa', tier: 'infinite', cardColor: '#1a1a2e', annualFee: 'RM800', minIncome: 8333, features: ['Lounge access', '3x rewards points'] },
  { id: 'rhb-dual-visa', bank: 'RHB Bank', name: 'Dual Visa/MC', fullName: 'RHB Dual Credit Card', network: 'visa', tier: 'classic', cardColor: '#003DA5', annualFee: 'Free', minIncome: 2000 },

  // ====== MAYBANK ======
  { id: 'maybank-grab-mc', bank: 'Maybank', name: 'Grab Mastercard', fullName: 'Maybank Grab Mastercard Credit Card', network: 'mastercard', tier: 'platinum', cardColor: '#00B14F', cashbackRate: 'up to 8%', annualFee: 'Free', minIncome: 2500, features: ['Grab Points', '8% on Grab spending'] },
  { id: 'maybank-2-gold', bank: 'Maybank', name: '2 Gold Cards', fullName: 'Maybank 2 Gold Cards', network: 'visa', tier: 'gold', cardColor: '#FFC72C', cashbackRate: 'up to 5%', annualFee: 'Free', minIncome: 2500, features: ['5% cashback weekend', 'TreatsPoints'] },
  { id: 'maybank-2-plat', bank: 'Maybank', name: '2 Platinum Cards', fullName: 'Maybank 2 Platinum Cards', network: 'visa', tier: 'platinum', cardColor: '#C0C0C0', cashbackRate: 'up to 5%', annualFee: 'RM300', minIncome: 5000, features: ['5% cashback', 'Airport lounge'] },
  { id: 'maybank-visa-infinite', bank: 'Maybank', name: 'Visa Infinite', fullName: 'Maybank Visa Infinite Credit Card', network: 'visa', tier: 'infinite', cardColor: '#1a1a2e', annualFee: 'RM800', minIncome: 12500, features: ['Unlimited lounge', 'Concierge'] },
  { id: 'maybank-fc-barcelona', bank: 'Maybank', name: 'FC Barcelona Visa', fullName: 'Maybank FC Barcelona Visa Signature', network: 'visa', tier: 'signature', cardColor: '#A50044', annualFee: 'RM450', minIncome: 5000 },
  { id: 'maybank-islamic-gold', bank: 'Maybank', name: 'Islamic Gold', fullName: 'Maybank Islamic MasterCard Ikhwan Gold', network: 'mastercard', tier: 'gold', cardColor: '#2E7D32', annualFee: 'Free', minIncome: 2000 },

  // ====== CIMB ======
  { id: 'cimb-cash-rebate-plat', bank: 'CIMB Bank', name: 'Cash Rebate Platinum', fullName: 'CIMB Cash Rebate Platinum Credit Card', network: 'mastercard', tier: 'platinum', cardColor: '#EC1C24', cashbackRate: 'up to 5%', annualFee: 'Free', minIncome: 2000, features: ['5% cashback groceries/petrol'] },
  { id: 'cimb-preferred-visa', bank: 'CIMB Bank', name: 'Preferred Visa', fullName: 'CIMB Preferred Visa Credit Card', network: 'visa', tier: 'platinum', cardColor: '#1a1a2e', cashbackRate: 'up to 8%', annualFee: 'Free*', minIncome: 2500 },
  { id: 'cimb-world-mc', bank: 'CIMB Bank', name: 'World MasterCard', fullName: 'CIMB World MasterCard Credit Card', network: 'mastercard', tier: 'world', cardColor: '#1a1a2e', annualFee: 'RM800', minIncome: 8333 },
  { id: 'cimb-petronas-visa', bank: 'CIMB Bank', name: 'Petronas Visa', fullName: 'CIMB Petronas Visa Credit Card', network: 'visa', tier: 'classic', cardColor: '#00A651', cashbackRate: 'up to 8%', annualFee: 'Free', minIncome: 2000, features: ['8% Petronas cashback'] },
  { id: 'cimb-e-credit', bank: 'CIMB Bank', name: 'e Credit Card', fullName: 'CIMB e Credit Card', network: 'visa', tier: 'classic', cardColor: '#EC1C24', cashbackRate: 'up to 10%', annualFee: 'Free', minIncome: 2000 },

  // ====== PUBLIC BANK ======
  { id: 'pb-quantum-visa', bank: 'Public Bank', name: 'Quantum Visa', fullName: 'Public Bank Quantum Visa Credit Card', network: 'visa', tier: 'classic', cardColor: '#D4213D', cashbackRate: 'up to 5%', annualFee: 'Free*', minIncome: 2000 },
  { id: 'pb-visa-gold', bank: 'Public Bank', name: 'Visa Gold', fullName: 'Public Bank Visa Gold Credit Card', network: 'visa', tier: 'gold', cardColor: '#DAA520', annualFee: 'RM75', minIncome: 2500 },
  { id: 'pb-visa-plat', bank: 'Public Bank', name: 'Visa Platinum', fullName: 'Public Bank Visa Platinum Credit Card', network: 'visa', tier: 'platinum', cardColor: '#A9A9A9', annualFee: 'RM300', minIncome: 5000 },

  // ====== HONG LEONG ======
  { id: 'hlb-sutera-plat', bank: 'Hong Leong Bank', name: 'Sutera Visa Platinum', fullName: 'Hong Leong Sutera Visa Platinum', network: 'visa', tier: 'platinum', cardColor: '#00539B', cashbackRate: 'up to 8%', annualFee: 'Free*', minIncome: 2000 },
  { id: 'hlb-wise-gold', bank: 'Hong Leong Bank', name: 'Wise Visa Gold', fullName: 'Hong Leong Wise Visa Gold', network: 'visa', tier: 'gold', cardColor: '#B8860B', annualFee: 'Free*', minIncome: 2000 },
  { id: 'hlb-gsc-visa-gold', bank: 'Hong Leong Bank', name: 'GSC Visa Gold', fullName: 'Hong Leong GSC Visa Gold', network: 'visa', tier: 'gold', cardColor: '#FFD700', cashbackRate: 'up to 8%', annualFee: 'Free*', minIncome: 2000, features: ['Free movie tickets'] },
  { id: 'hlb-essential-mc', bank: 'Hong Leong Bank', name: 'Essential MasterCard', fullName: 'Hong Leong Essential MasterCard', network: 'mastercard', tier: 'classic', cardColor: '#00539B', annualFee: 'Free', minIncome: 2000 },

  // ====== UOB ======
  { id: 'uob-one-card', bank: 'UOB Bank', name: 'ONE Card', fullName: 'UOB ONE Card', network: 'visa', tier: 'classic', cardColor: '#003DA5', cashbackRate: 'up to 10%', annualFee: 'Free*', minIncome: 3000, features: ['10% cashback', '5 categories'] },
  { id: 'uob-evol', bank: 'UOB Bank', name: 'EVOL Card', fullName: 'UOB EVOL Card', network: 'visa', tier: 'classic', cardColor: '#FF6B35', cashbackRate: 'up to 10%', annualFee: 'Free', minIncome: 2500, features: ['10% online', '5% e-wallet'] },
  { id: 'uob-visa-infinite', bank: 'UOB Bank', name: 'Visa Infinite', fullName: 'UOB Visa Infinite Metal Card', network: 'visa', tier: 'infinite', cardColor: '#1a1a2e', annualFee: 'RM1,200', minIncome: 12500, features: ['Metal card', 'Unlimited lounge'] },
  { id: 'uob-yolo-visa', bank: 'UOB Bank', name: 'YOLO Visa', fullName: 'UOB YOLO Visa Credit Card', network: 'visa', tier: 'classic', cardColor: '#FF1493', cashbackRate: 'up to 8%', annualFee: 'Free', minIncome: 2500 },
  { id: 'uob-zenith-mc', bank: 'UOB Bank', name: 'Zenith MasterCard', fullName: 'UOB Zenith MasterCard', network: 'mastercard', tier: 'world', cardColor: '#1a1a2e', annualFee: 'Free*', minIncome: 3000 },
  { id: 'uob-simply-visa', bank: 'UOB Bank', name: 'Simply Visa', fullName: 'UOB Simply Visa Credit Card', network: 'visa', tier: 'classic', cardColor: '#4169E1', annualFee: 'Free', minIncome: 2000 },

  // ====== AMBANK ======
  { id: 'ambank-cashrebate-plat', bank: 'Ambank', name: 'Cash Rebate Visa Platinum', fullName: 'AmBank Cash Rebate Visa Platinum', network: 'visa', tier: 'platinum', cardColor: '#E31937', cashbackRate: 'up to 10%', annualFee: 'Free', minIncome: 2000 },
  { id: 'ambank-cashrebate-mc', bank: 'Ambank', name: 'Cash Rebate MasterCard', fullName: 'AmBank Cash Rebate MasterCard Platinum', network: 'mastercard', tier: 'platinum', cardColor: '#E31937', cashbackRate: 'up to 10%', annualFee: 'Free', minIncome: 2000 },

  // ====== ALLIANCE ======
  { id: 'alliance-visa-plat', bank: 'Alliance Bank', name: 'Visa Platinum', fullName: 'Alliance Bank Visa Platinum', network: 'visa', tier: 'platinum', cardColor: '#003366', annualFee: 'Free*', minIncome: 2000 },
  { id: 'alliance-visa-virtual', bank: 'Alliance Bank', name: 'Visa Virtual', fullName: 'Alliance Bank Visa Virtual Credit Card', network: 'visa', tier: 'classic', cardColor: '#003366', annualFee: 'Free', minIncome: 2000 },

  // ====== HSBC ======
  { id: 'hsbc-visa-signature', bank: 'HSBC', name: 'Visa Signature', fullName: 'HSBC Visa Signature Credit Card', network: 'visa', tier: 'signature', cardColor: '#DB0011', annualFee: 'Free*', minIncome: 8500 },
  { id: 'hsbc-visa-plat', bank: 'HSBC', name: 'Visa Platinum', fullName: 'HSBC Visa Platinum Credit Card', network: 'visa', tier: 'platinum', cardColor: '#DB0011', cashbackRate: 'up to 5%', annualFee: 'Free*', minIncome: 5000 },
  { id: 'hsbc-cash-back-mc', bank: 'HSBC', name: 'Cash Back MasterCard', fullName: 'HSBC Cash Back MasterCard Credit Card', network: 'mastercard', tier: 'classic', cardColor: '#DB0011', cashbackRate: 'up to 5%', annualFee: 'Free*', minIncome: 2000 },
  { id: 'hsbc-amanah-mc', bank: 'HSBC', name: 'Amanah MPower Platinum', fullName: 'HSBC Amanah MPower Platinum', network: 'mastercard', tier: 'platinum', cardColor: '#006A4E', annualFee: 'Free*', minIncome: 2000 },

  // ====== STANDARD CHARTERED ======
  { id: 'scb-simply-cash-visa', bank: 'Standard Chartered', name: 'Simply Cash Visa', fullName: 'Standard Chartered Simply Cash Visa', network: 'visa', tier: 'classic', cardColor: '#007A33', cashbackRate: 'up to 15%', annualFee: 'Free*', minIncome: 3000, features: ['15% cashback dining'] },
  { id: 'scb-unlimited-mc', bank: 'Standard Chartered', name: 'Unlimited MC', fullName: 'Standard Chartered Unlimited Cashback MasterCard', network: 'mastercard', tier: 'classic', cardColor: '#007A33', cashbackRate: '1.5% unlimited', annualFee: 'Free*', minIncome: 3000 },

  // ====== CITIBANK ======
  { id: 'citi-cashback-mc', bank: 'Citibank', name: 'Cash Back MasterCard', fullName: 'Citi Cash Back MasterCard', network: 'mastercard', tier: 'classic', cardColor: '#003DA5', cashbackRate: 'up to 10%', annualFee: 'Free*', minIncome: 2000 },
  { id: 'citi-rewards-visa', bank: 'Citibank', name: 'Rewards Visa', fullName: 'Citi Rewards Visa Credit Card', network: 'visa', tier: 'gold', cardColor: '#003DA5', annualFee: 'Free*', minIncome: 2000 },

  // ====== OCBC ======
  { id: 'ocbc-titanium-mc', bank: 'OCBC Bank', name: 'Titanium MC', fullName: 'OCBC Titanium MasterCard', network: 'mastercard', tier: 'platinum', cardColor: '#D9272D', cashbackRate: 'up to 5%', annualFee: 'Free', minIncome: 2000 },
  { id: 'ocbc-365-visa', bank: 'OCBC Bank', name: '365 Visa', fullName: 'OCBC 365 Visa Credit Card', network: 'visa', tier: 'classic', cardColor: '#D9272D', cashbackRate: 'up to 6%', annualFee: 'Free*', minIncome: 2500 },

  // ====== BSN ======
  { id: 'bsn-visa-classic', bank: 'BSN', name: 'Visa Classic', fullName: 'BSN Visa Classic Credit Card', network: 'visa', tier: 'classic', cardColor: '#003DA5', annualFee: 'Free', minIncome: 2000 },

  // ====== AFFIN ======
  { id: 'affin-duo-visa-mc', bank: 'Affin Bank', name: 'DUO Visa/MC', fullName: 'Affin DUO Visa/MasterCard', network: 'visa', tier: 'classic', cardColor: '#003B71', cashbackRate: 'up to 8%', annualFee: 'Free*', minIncome: 2000 },

  // ====== BANK ISLAM ======
  { id: 'bi-visa-gold', bank: 'Bank Islam', name: 'Visa Gold-i', fullName: 'Bank Islam Visa Gold-i', network: 'visa', tier: 'gold', cardColor: '#8B1A4A', annualFee: 'Free*', minIncome: 2000 },

  // ====== AEON ======
  { id: 'aeon-classic-visa', bank: 'AEON', name: 'Classic Visa', fullName: 'AEON Classic Visa Credit Card', network: 'visa', tier: 'classic', cardColor: '#E31837', annualFee: 'Free', minIncome: 1500 },
  { id: 'aeon-gold-visa', bank: 'AEON', name: 'Gold Visa', fullName: 'AEON Gold Visa Credit Card', network: 'visa', tier: 'gold', cardColor: '#DAA520', cashbackRate: 'up to 5%', annualFee: 'RM60', minIncome: 2000 },
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
