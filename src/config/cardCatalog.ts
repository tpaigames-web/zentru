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
  { id: 'rhb-shell-visa', bank: 'RHB Bank', name: 'Shell Visa', fullName: 'RHB Shell Visa Credit Card', network: 'visa', tier: 'classic', cardColor: '#1a1a2e', cashbackRate: 'up to 12%', annualFee: 'Free*', minIncome: 2000, defaultRules: [{ categoryKey: 'category.transport', label: 'Shell Petrol', rate: 12, monthlyCap: 30 }, { categoryKey: '*', label: 'Others', rate: 0.2 }], defaultTotalCap: 30 },
  { id: 'rhb-cashback-visa', bank: 'RHB Bank', name: 'Cash Back Visa', fullName: 'RHB Cash Back Visa Credit Card', network: 'visa', tier: 'classic', cardColor: '#003DA5', cashbackRate: 'up to 10%', annualFee: 'Free*', minIncome: 2000, defaultRules: [{ categoryKey: 'category.shopping', label: 'Groceries', rate: 10, monthlyCap: 30 }, { categoryKey: 'category.transport', label: 'Petrol', rate: 10, monthlyCap: 30 }, { categoryKey: '*', label: 'Others', rate: 0.2 }] },
  { id: 'rhb-world-mc', bank: 'RHB Bank', name: 'World MasterCard', fullName: 'RHB World MasterCard Credit Card', network: 'mastercard', tier: 'world', cardColor: '#1a1a2e', cashbackRate: 'up to 6%', annualFee: 'Free*', minIncome: 2000, defaultRules: [{ categoryKey: 'category.travel', label: 'Travel', rate: 6, monthlyCap: 30 }, { categoryKey: 'category.transport', label: 'Petrol', rate: 6, monthlyCap: 30 }, { categoryKey: 'category.food', label: 'Dining', rate: 6, monthlyCap: 30 }, { categoryKey: '*', label: 'Others', rate: 1 }] },
  { id: 'rhb-premier-visa', bank: 'RHB Bank', name: 'Premier Visa Infinite', fullName: 'RHB Premier Visa Infinite Credit Card', network: 'visa', tier: 'infinite', cardColor: '#1a1a2e', annualFee: 'RM800', minIncome: 8333 },
  { id: 'rhb-dual-visa', bank: 'RHB Bank', name: 'Dual Visa/MC', fullName: 'RHB Dual Credit Card', network: 'visa', tier: 'classic', cardColor: '#003DA5', annualFee: 'Free', minIncome: 2000 },

  // ====== MAYBANK ======
  { id: 'maybank-grab-mc', bank: 'Maybank', name: 'Grab Mastercard', fullName: 'Maybank Grab Mastercard Credit Card', network: 'mastercard', tier: 'platinum', cardColor: '#00B14F', cashbackRate: 'up to 8%', annualFee: 'Free', minIncome: 2500, defaultRules: [{ categoryKey: 'category.transport', label: 'Grab', rate: 8, monthlyCap: 30 }, { categoryKey: '*', label: 'Others', rate: 0.2 }] },
  { id: 'maybank-2-gold', bank: 'Maybank', name: '2 Gold Cards', fullName: 'Maybank 2 Gold Cards', network: 'mastercard', tier: 'gold', cardColor: '#FFC72C', cashbackRate: 'up to 5%', annualFee: 'Free', minIncome: 2500, defaultRules: [{ categoryKey: 'category.food', label: 'Weekend Dining', rate: 5, monthlyCap: 25 }, { categoryKey: 'category.transport', label: 'Petrol', rate: 5, monthlyCap: 25 }, { categoryKey: '*', label: 'Others', rate: 0.2 }] },
  { id: 'maybank-2-plat', bank: 'Maybank', name: '2 Platinum Cards', fullName: 'Maybank 2 Platinum Cards', network: 'visa', tier: 'platinum', cardColor: '#C0C0C0', cashbackRate: 'up to 5%', annualFee: 'RM300', minIncome: 5000, defaultRules: [{ categoryKey: 'category.food', label: 'Weekend Dining', rate: 5, monthlyCap: 50 }, { categoryKey: 'category.transport', label: 'Petrol', rate: 5, monthlyCap: 50 }, { categoryKey: '*', label: 'Others', rate: 0.2 }] },
  { id: 'maybank-visa-infinite', bank: 'Maybank', name: 'Visa Infinite', fullName: 'Maybank Visa Infinite Credit Card', network: 'visa', tier: 'infinite', cardColor: '#1a1a2e', annualFee: 'RM800', minIncome: 12500 },
  { id: 'maybank-visa-signature', bank: 'Maybank', name: 'Visa Signature', fullName: 'Maybank Visa Signature', network: 'visa', tier: 'signature', cardColor: '#E91E63', annualFee: 'RM450', minIncome: 5000 },
  { id: 'maybank-fc-barcelona', bank: 'Maybank', name: 'FC Barcelona Visa', fullName: 'Maybank FC Barcelona Visa Signature', network: 'visa', tier: 'signature', cardColor: '#A50044', annualFee: 'RM450', minIncome: 5000 },
  { id: 'maybank-islamic-gold', bank: 'Maybank', name: 'Islamic MasterCard Ikhwan Gold', fullName: 'Maybank Islamic MasterCard Ikhwan Gold Card-i', network: 'mastercard', tier: 'gold', cardColor: '#2E7D32', annualFee: 'Free', minIncome: 2000 },
  { id: 'maybank-islamic-plat', bank: 'Maybank', name: 'Islamic MasterCard Ikhwan Platinum', fullName: 'Maybank Islamic MasterCard Ikhwan Platinum Card-i', network: 'mastercard', tier: 'platinum', cardColor: '#1B5E20', annualFee: 'RM300', minIncome: 5000 },
  { id: 'maybank-islamic-amex', bank: 'Maybank', name: 'Islamic AMEX Platinum', fullName: 'Maybank Islamic American Express Platinum Card-i', network: 'amex', tier: 'platinum', cardColor: '#006FCF', annualFee: 'RM300', minIncome: 5000 },

  // ====== CIMB ======
  { id: 'cimb-cash-rebate-plat', bank: 'CIMB Bank', name: 'Cash Rebate Platinum MC', fullName: 'CIMB Cash Rebate Platinum MasterCard', network: 'mastercard', tier: 'platinum', cardColor: '#EC1C24', cashbackRate: 'up to 5%', annualFee: 'Free', minIncome: 2000, defaultRules: [{ categoryKey: 'category.shopping', label: 'Groceries', rate: 5, monthlyCap: 20 }, { categoryKey: 'category.transport', label: 'Petrol', rate: 5, monthlyCap: 20 }, { categoryKey: '*', label: 'Others', rate: 0.2 }] },
  { id: 'cimb-preferred-visa', bank: 'CIMB Bank', name: 'Preferred Visa', fullName: 'CIMB Preferred Visa Credit Card', network: 'visa', tier: 'platinum', cardColor: '#1a1a2e', cashbackRate: 'up to 8%', annualFee: 'Free*', minIncome: 2500 },
  { id: 'cimb-world-mc', bank: 'CIMB Bank', name: 'World MasterCard', fullName: 'CIMB World MasterCard Credit Card', network: 'mastercard', tier: 'world', cardColor: '#1a1a2e', annualFee: 'RM800', minIncome: 8333 },
  { id: 'cimb-petronas-visa', bank: 'CIMB Bank', name: 'Petronas Visa', fullName: 'CIMB Petronas Visa Credit Card', network: 'visa', tier: 'classic', cardColor: '#00A651', cashbackRate: 'up to 8%', annualFee: 'Free', minIncome: 2000, defaultRules: [{ categoryKey: 'category.transport', label: 'Petronas', rate: 8, monthlyCap: 30 }, { categoryKey: '*', label: 'Others', rate: 0.2 }] },
  { id: 'cimb-e-credit', bank: 'CIMB Bank', name: 'e Credit Card', fullName: 'CIMB e Credit Card', network: 'visa', tier: 'classic', cardColor: '#EC1C24', cashbackRate: 'up to 10%', annualFee: 'Free', minIncome: 2000, defaultRules: [{ categoryKey: 'category.shopping', label: 'Online Shopping', rate: 10, monthlyCap: 30 }, { categoryKey: '*', label: 'Others', rate: 0.2 }] },

  // ====== PUBLIC BANK ======
  { id: 'pb-quantum-visa', bank: 'Public Bank', name: 'Quantum Visa', fullName: 'Public Bank Quantum Visa', network: 'visa', tier: 'classic', cardColor: '#D4213D', cashbackRate: 'up to 5%', annualFee: 'Free*', minIncome: 2000, defaultRules: [{ categoryKey: 'category.shopping', label: 'Groceries', rate: 5, monthlyCap: 20 }, { categoryKey: '*', label: 'Others', rate: 0.2 }] },
  { id: 'pb-quantum-mc', bank: 'Public Bank', name: 'Quantum MasterCard', fullName: 'Public Bank Quantum MasterCard', network: 'mastercard', tier: 'classic', cardColor: '#D4213D', cashbackRate: 'up to 5%', annualFee: 'Free*', minIncome: 2000, defaultRules: [{ categoryKey: 'category.shopping', label: 'Groceries', rate: 5, monthlyCap: 20 }, { categoryKey: '*', label: 'Others', rate: 0.2 }] },
  { id: 'pb-visa-gold', bank: 'Public Bank', name: 'Visa Gold', fullName: 'Public Bank Visa Gold', network: 'visa', tier: 'gold', cardColor: '#DAA520', annualFee: 'RM75', minIncome: 2500 },
  { id: 'pb-gold-mc', bank: 'Public Bank', name: 'Gold MasterCard', fullName: 'Public Bank Gold MasterCard', network: 'mastercard', tier: 'gold', cardColor: '#DAA520', annualFee: 'RM75', minIncome: 2500 },
  { id: 'pb-visa-plat', bank: 'Public Bank', name: 'Visa Platinum', fullName: 'Public Bank Visa Platinum', network: 'visa', tier: 'platinum', cardColor: '#A9A9A9', annualFee: 'RM300', minIncome: 5000 },
  { id: 'pb-visa-signature', bank: 'Public Bank', name: 'Visa Signature', fullName: 'Public Bank Visa Signature', network: 'visa', tier: 'signature', cardColor: '#4B0082', annualFee: 'RM500', minIncome: 8333 },
  { id: 'pb-visa-infinite', bank: 'Public Bank', name: 'Visa Infinite', fullName: 'Public Bank Visa Infinite', network: 'visa', tier: 'infinite', cardColor: '#1a1a2e', annualFee: 'RM800', minIncome: 12500 },
  { id: 'pb-petron-visa-gold', bank: 'Public Bank', name: 'Petron Visa Gold', fullName: 'Public Bank Petron Visa Gold', network: 'visa', tier: 'gold', cardColor: '#0054A6', cashbackRate: 'up to 10%', annualFee: 'Free*', minIncome: 2000, defaultRules: [{ categoryKey: 'category.transport', label: 'Petron', rate: 10, monthlyCap: 20 }, { categoryKey: '*', label: 'Others', rate: 0.2 }] },
  { id: 'pb-aia-visa-gold', bank: 'Public Bank', name: 'AIA Visa Gold', fullName: 'Public Bank AIA Visa Gold', network: 'visa', tier: 'gold', cardColor: '#CC0033', annualFee: 'RM75', minIncome: 2500 },
  { id: 'pib-gold-mc', bank: 'Public Bank', name: 'Islamic Gold MC', fullName: 'Public Islamic Bank Gold MasterCard Credit Card-i', network: 'mastercard', tier: 'gold', cardColor: '#8B4513', annualFee: 'RM75', minIncome: 2500 },
  { id: 'pib-plat-mc', bank: 'Public Bank', name: 'Islamic Platinum MC', fullName: 'Public Islamic Bank MasterCard Platinum Credit Card-i', network: 'mastercard', tier: 'platinum', cardColor: '#8B4513', annualFee: 'RM300', minIncome: 5000 },
  { id: 'pib-visa-gold', bank: 'Public Bank', name: 'Islamic Visa Gold', fullName: 'Public Islamic Bank Visa Gold Credit Card-i', network: 'visa', tier: 'gold', cardColor: '#8B4513', annualFee: 'RM75', minIncome: 2500 },
  { id: 'pib-visa-plat', bank: 'Public Bank', name: 'Islamic Visa Platinum', fullName: 'Public Islamic Bank Visa Platinum Credit Card-i', network: 'visa', tier: 'platinum', cardColor: '#8B4513', annualFee: 'RM300', minIncome: 5000 },

  // ====== HONG LEONG ======
  { id: 'hlb-sutera-plat', bank: 'Hong Leong Bank', name: 'Sutera Visa Platinum', fullName: 'Hong Leong Sutera Visa Platinum', network: 'visa', tier: 'platinum', cardColor: '#00539B', cashbackRate: 'up to 8%', annualFee: 'Free*', minIncome: 2000, defaultRules: [{ categoryKey: 'category.transport', label: 'Petrol', rate: 8, monthlyCap: 20 }, { categoryKey: 'category.food', label: 'Dining', rate: 5, monthlyCap: 20 }, { categoryKey: '*', label: 'Others', rate: 0.3 }] },
  { id: 'hlb-wise-gold', bank: 'Hong Leong Bank', name: 'Wise Visa Gold', fullName: 'Hong Leong Wise Visa Gold', network: 'visa', tier: 'gold', cardColor: '#B8860B', annualFee: 'Free*', minIncome: 2000 },
  { id: 'hlb-wise-plat', bank: 'Hong Leong Bank', name: 'Wise Visa Platinum', fullName: 'Hong Leong Wise Visa Platinum', network: 'visa', tier: 'platinum', cardColor: '#A9A9A9', annualFee: 'Free*', minIncome: 2000 },
  { id: 'hlb-gsc-visa-gold', bank: 'Hong Leong Bank', name: 'GSC Visa Gold', fullName: 'Hong Leong GSC Visa Gold', network: 'visa', tier: 'gold', cardColor: '#FFD700', cashbackRate: 'up to 8%', annualFee: 'Free*', minIncome: 2000 },
  { id: 'hlb-essential', bank: 'Hong Leong Bank', name: 'Essential Visa', fullName: 'Hong Leong Essential Visa', network: 'visa', tier: 'classic', cardColor: '#00539B', annualFee: 'Free', minIncome: 2000 },

  // ====== UOB ======
  { id: 'uob-one-classic', bank: 'UOB Bank', name: 'ONE Visa Classic', fullName: 'UOB ONE Visa Classic', network: 'visa', tier: 'classic', cardColor: '#003DA5', cashbackRate: 'up to 10%', annualFee: 'Free*', minIncome: 3000, defaultRules: [{ categoryKey: 'category.food', label: 'Dining', rate: 10, monthlyCap: 15 }, { categoryKey: 'category.transport', label: 'Petrol/Grab', rate: 10, monthlyCap: 15 }, { categoryKey: 'category.shopping', label: 'Groceries', rate: 10, monthlyCap: 15 }, { categoryKey: '*', label: 'Others', rate: 0.3 }] },
  { id: 'uob-one-plat', bank: 'UOB Bank', name: 'ONE Visa Platinum', fullName: 'UOB ONE Visa Platinum', network: 'visa', tier: 'platinum', cardColor: '#003DA5', cashbackRate: 'up to 10%', annualFee: 'Free*', minIncome: 3000, defaultRules: [{ categoryKey: 'category.food', label: 'Dining', rate: 10, monthlyCap: 15 }, { categoryKey: 'category.transport', label: 'Petrol/Grab', rate: 10, monthlyCap: 15 }, { categoryKey: 'category.shopping', label: 'Groceries', rate: 10, monthlyCap: 15 }, { categoryKey: '*', label: 'Others', rate: 0.3 }] },
  { id: 'uob-evol', bank: 'UOB Bank', name: 'EVOL Card', fullName: 'UOB EVOL Card', network: 'visa', tier: 'classic', cardColor: '#FF6B35', cashbackRate: 'up to 10%', annualFee: 'Free', minIncome: 2500, defaultRules: [{ categoryKey: 'category.shopping', label: 'Online Spend', rate: 10, monthlyCap: 15 }, { categoryKey: '*', label: 'E-wallet Top-up', rate: 5, monthlyCap: 15 }] },
  { id: 'uob-visa-infinite', bank: 'UOB Bank', name: 'Visa Infinite', fullName: 'UOB Visa Infinite Metal Card', network: 'visa', tier: 'infinite', cardColor: '#1a1a2e', annualFee: 'RM1,200', minIncome: 12500 },
  { id: 'uob-yolo-visa', bank: 'UOB Bank', name: 'YOLO Visa', fullName: 'UOB YOLO Visa Credit Card', network: 'visa', tier: 'classic', cardColor: '#FF1493', cashbackRate: 'up to 8%', annualFee: 'Free', minIncome: 2500, defaultRules: [{ categoryKey: 'category.food', label: 'Dining', rate: 8, monthlyCap: 20 }, { categoryKey: 'category.entertainment', label: 'Entertainment', rate: 8, monthlyCap: 20 }, { categoryKey: '*', label: 'Others', rate: 0.2 }] },
  { id: 'uob-zenith-mc', bank: 'UOB Bank', name: 'Zenith MasterCard', fullName: 'UOB Zenith MasterCard', network: 'mastercard', tier: 'world', cardColor: '#1a1a2e', annualFee: 'Free*', minIncome: 3000 },

  // ====== AMBANK ======
  { id: 'ambank-cashrebate-visa', bank: 'Ambank', name: 'Cash Rebate Visa Platinum', fullName: 'AmBank Cash Rebate Visa Platinum', network: 'visa', tier: 'platinum', cardColor: '#E31937', cashbackRate: 'up to 10%', annualFee: 'Free', minIncome: 2000, defaultRules: [{ categoryKey: 'category.transport', label: 'Petrol', rate: 10, monthlyCap: 15 }, { categoryKey: 'category.shopping', label: 'Groceries', rate: 8, monthlyCap: 15 }, { categoryKey: '*', label: 'Others', rate: 1 }] },
  { id: 'ambank-true-visa', bank: 'Ambank', name: 'TRUE Visa', fullName: 'AmBank TRUE Visa', network: 'visa', tier: 'classic', cardColor: '#E31937', annualFee: 'Free', minIncome: 2000 },

  // ====== ALLIANCE ======
  { id: 'alliance-visa-signature', bank: 'Alliance Bank', name: 'Visa Signature', fullName: 'Alliance Bank Visa Signature', network: 'visa', tier: 'signature', cardColor: '#003366', annualFee: 'Free*', minIncome: 5000 },
  { id: 'alliance-visa-plat', bank: 'Alliance Bank', name: 'Visa Platinum', fullName: 'Alliance Bank Visa Platinum', network: 'visa', tier: 'platinum', cardColor: '#003366', annualFee: 'Free*', minIncome: 2000 },

  // ====== HSBC ======
  { id: 'hsbc-visa-signature', bank: 'HSBC', name: 'Visa Signature', fullName: 'HSBC Visa Signature Credit Card', network: 'visa', tier: 'signature', cardColor: '#DB0011', annualFee: 'Free*', minIncome: 8500 },
  { id: 'hsbc-visa-plat', bank: 'HSBC', name: 'Visa Platinum', fullName: 'HSBC Visa Platinum Credit Card', network: 'visa', tier: 'platinum', cardColor: '#DB0011', cashbackRate: 'up to 5%', annualFee: 'Free*', minIncome: 5000, defaultRules: [{ categoryKey: 'category.food', label: 'Dining', rate: 5, monthlyCap: 50 }, { categoryKey: '*', label: 'Others', rate: 0.2 }] },
  { id: 'hsbc-cash-back-mc', bank: 'HSBC', name: 'Cash Back MasterCard', fullName: 'HSBC Cash Back MasterCard', network: 'mastercard', tier: 'classic', cardColor: '#DB0011', cashbackRate: 'up to 5%', annualFee: 'Free*', minIncome: 2000, defaultRules: [{ categoryKey: 'category.food', label: 'Dining', rate: 5, monthlyCap: 50 }, { categoryKey: '*', label: 'Others', rate: 0.2 }] },
  { id: 'hsbc-amanah-mpower', bank: 'HSBC', name: 'Amanah MPower Platinum', fullName: 'HSBC Amanah MPower Platinum Credit Card-i', network: 'visa', tier: 'platinum', cardColor: '#006A4E', annualFee: 'Free*', minIncome: 2000 },

  // ====== STANDARD CHARTERED ======
  { id: 'scb-simply-cash', bank: 'Standard Chartered', name: 'Simply Cash', fullName: 'Standard Chartered Simply Cash Credit Card', network: 'visa', tier: 'classic', cardColor: '#007A33', cashbackRate: 'up to 15%', annualFee: 'Free*', minIncome: 3000, defaultRules: [{ categoryKey: 'category.food', label: 'Dining', rate: 15, monthlyCap: 25 }, { categoryKey: 'category.transport', label: 'Petrol', rate: 5, monthlyCap: 25 }, { categoryKey: 'category.shopping', label: 'Groceries', rate: 5, monthlyCap: 25 }, { categoryKey: '*', label: 'Others', rate: 0.2 }] },
  { id: 'scb-justone-plat', bank: 'Standard Chartered', name: 'JustOne Platinum MC', fullName: 'Standard Chartered JustOne Platinum MasterCard', network: 'mastercard', tier: 'platinum', cardColor: '#007A33', cashbackRate: 'up to 5%', annualFee: 'Free*', minIncome: 3000, defaultRules: [{ categoryKey: 'category.transport', label: 'Petrol', rate: 5, monthlyCap: 15 }, { categoryKey: '*', label: 'Others', rate: 0.2 }] },
  { id: 'scb-liverpool-mc', bank: 'Standard Chartered', name: 'Liverpool FC Cashback', fullName: 'Standard Chartered Liverpool FC Cashback MasterCard', network: 'mastercard', tier: 'classic', cardColor: '#C8102E', cashbackRate: 'up to 5%', annualFee: 'Free*', minIncome: 3000 },
  { id: 'scb-smart', bank: 'Standard Chartered', name: 'Smart Credit Card', fullName: 'Standard Chartered Smart Credit Card', network: 'visa', tier: 'classic', cardColor: '#007A33', annualFee: 'Free*', minIncome: 2000 },

  // ====== CITIBANK ======
  { id: 'citi-cashback-mc', bank: 'Citibank', name: 'Cash Back MasterCard', fullName: 'Citi Cash Back MasterCard', network: 'mastercard', tier: 'classic', cardColor: '#003DA5', cashbackRate: 'up to 10%', annualFee: 'Free*', minIncome: 2000, defaultRules: [{ categoryKey: 'category.food', label: 'Dining', rate: 10, monthlyCap: 30 }, { categoryKey: 'category.shopping', label: 'Groceries', rate: 10, monthlyCap: 30 }, { categoryKey: '*', label: 'Others', rate: 0.2 }] },
  { id: 'citi-cashback-plat-visa', bank: 'Citibank', name: 'Cash Back Platinum Visa', fullName: 'Citi Cash Back Platinum Visa', network: 'visa', tier: 'platinum', cardColor: '#003DA5', cashbackRate: 'up to 10%', annualFee: 'Free*', minIncome: 2000, defaultRules: [{ categoryKey: 'category.food', label: 'Dining', rate: 10, monthlyCap: 30 }, { categoryKey: 'category.shopping', label: 'Groceries', rate: 10, monthlyCap: 30 }, { categoryKey: '*', label: 'Others', rate: 0.2 }] },

  // ====== OCBC ======
  { id: 'ocbc-mc-blue', bank: 'OCBC Bank', name: 'MasterCard Blue', fullName: 'OCBC MasterCard Blue', network: 'mastercard', tier: 'classic', cardColor: '#003DA5', cashbackRate: 'up to 5%', annualFee: 'Free', minIncome: 2000 },
  { id: 'ocbc-mc-pink', bank: 'OCBC Bank', name: 'MasterCard Pink', fullName: 'OCBC MasterCard Pink', network: 'mastercard', tier: 'classic', cardColor: '#FF69B4', cashbackRate: 'up to 5%', annualFee: 'Free', minIncome: 2000 },

  // ====== BSN ======
  { id: 'bsn-visa-classic', bank: 'BSN', name: 'Visa Classic', fullName: 'BSN Visa Classic Credit Card', network: 'visa', tier: 'classic', cardColor: '#003DA5', annualFee: 'Free', minIncome: 2000 },

  // ====== AFFIN ======
  { id: 'affin-duo-cashback', bank: 'Affin Bank', name: 'DUO Visa Cash Back', fullName: 'Affin DUO Visa Cash Back', network: 'visa', tier: 'classic', cardColor: '#003B71', cashbackRate: 'up to 8%', annualFee: 'Free*', minIncome: 2000, defaultRules: [{ categoryKey: 'category.transport', label: 'Petrol', rate: 8, monthlyCap: 20 }, { categoryKey: '*', label: 'Others', rate: 0.2 }] },
  { id: 'affin-visa-signature', bank: 'Affin Bank', name: 'Visa Signature', fullName: 'Affinbank Visa Signature Card', network: 'visa', tier: 'signature', cardColor: '#003B71', annualFee: 'Free*', minIncome: 5000 },

  // ====== BANK ISLAM ======
  { id: 'bi-visa-gold', bank: 'Bank Islam', name: 'Visa Gold-i', fullName: 'Bank Islam Visa Gold-i', network: 'visa', tier: 'gold', cardColor: '#8B1A4A', annualFee: 'Free*', minIncome: 2000 },

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
