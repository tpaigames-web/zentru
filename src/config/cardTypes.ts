/**
 * Card network detection by BIN (first 4-6 digits) or last 4 digits pattern.
 * Also includes known Malaysian credit card product names.
 */

export type CardNetwork = 'visa' | 'mastercard' | 'amex' | 'jcb' | 'unionpay' | 'unknown'

export interface CardBrand {
  network: CardNetwork
  color: string
  textColor: string
  label: string
}

export const CARD_NETWORKS: Record<CardNetwork, CardBrand> = {
  visa: { network: 'visa', color: '#1A1F71', textColor: '#FFFFFF', label: 'VISA' },
  mastercard: { network: 'mastercard', color: '#EB001B', textColor: '#FFFFFF', label: 'Mastercard' },
  amex: { network: 'amex', color: '#006FCF', textColor: '#FFFFFF', label: 'AMEX' },
  jcb: { network: 'jcb', color: '#0E4C96', textColor: '#FFFFFF', label: 'JCB' },
  unionpay: { network: 'unionpay', color: '#D71A1A', textColor: '#FFFFFF', label: 'UnionPay' },
  unknown: { network: 'unknown', color: '#64748b', textColor: '#FFFFFF', label: '' },
}

/**
 * Detect card network from card number (full or last 4 digits).
 * Uses BIN ranges for first-digit detection.
 */
export function detectCardNetwork(cardNumber?: string): CardNetwork {
  if (!cardNumber) return 'unknown'

  // Get first digit if we have full or partial number
  const clean = cardNumber.replace(/[\s\-*•]/g, '')
  const first = clean.charAt(0)
  const first2 = clean.substring(0, 2)
  const first4 = clean.substring(0, 4)

  // Visa: starts with 4
  if (first === '4') return 'visa'
  // Mastercard: starts with 5 (51-55) or 2 (2221-2720)
  if (first === '5' && ['51', '52', '53', '54', '55'].includes(first2)) return 'mastercard'
  if (first === '2' && parseInt(first4) >= 2221 && parseInt(first4) <= 2720) return 'mastercard'
  // AMEX: starts with 34 or 37
  if (first2 === '34' || first2 === '37') return 'amex'
  // JCB: starts with 35
  if (first2 === '35') return 'jcb'
  // UnionPay: starts with 62
  if (first2 === '62') return 'unionpay'

  return 'unknown'
}

/**
 * Detect card network from card name keywords.
 */
export function detectNetworkFromName(cardName: string): CardNetwork {
  const upper = cardName.toUpperCase()
  if (upper.includes('VISA')) return 'visa'
  if (upper.includes('MASTERCARD') || upper.includes('MASTER')) return 'mastercard'
  if (upper.includes('AMEX') || upper.includes('AMERICAN EXPRESS')) return 'amex'
  if (upper.includes('JCB')) return 'jcb'
  if (upper.includes('UNIONPAY') || upper.includes('UNION PAY')) return 'unionpay'
  return 'unknown'
}

/** Bank brand colors for card header */
export const BANK_COLORS: Record<string, { bg: string; text: string }> = {
  'Maybank': { bg: '#FFC72C', text: '#000000' },
  'CIMB Bank': { bg: '#EC1C24', text: '#FFFFFF' },
  'Public Bank': { bg: '#D4213D', text: '#FFFFFF' },
  'RHB Bank': { bg: '#003DA5', text: '#FFFFFF' },
  'Hong Leong Bank': { bg: '#00539B', text: '#FFFFFF' },
  'Ambank': { bg: '#E31937', text: '#FFFFFF' },
  'Affin Bank': { bg: '#003B71', text: '#FFFFFF' },
  'Alliance Bank': { bg: '#003366', text: '#FFFFFF' },
  'BSN': { bg: '#003DA5', text: '#FFFFFF' },
  'Bank Islam': { bg: '#8B1A4A', text: '#FFFFFF' },
  'HSBC': { bg: '#DB0011', text: '#FFFFFF' },
  'OCBC Bank': { bg: '#D9272D', text: '#FFFFFF' },
  'UOB Bank': { bg: '#003DA5', text: '#FFFFFF' },
  'Citibank': { bg: '#003DA5', text: '#FFFFFF' },
  'Standard Chartered': { bg: '#007A33', text: '#FFFFFF' },
}

export function getBankColors(bankName: string): { bg: string; text: string } {
  return BANK_COLORS[bankName] || { bg: '#3b82f6', text: '#FFFFFF' }
}
