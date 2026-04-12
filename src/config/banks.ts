export interface BankInfo {
  id: string
  name: string
  color: string
  pdfKeywords: RegExp
}

/**
 * All Malaysian banks supported by Zentru.
 * Covers all banks from Finory + additional ones.
 */
export const ALL_BANKS: BankInfo[] = [
  // Major local banks
  { id: 'maybank', name: 'Maybank', color: '#FFC72C', pdfKeywords: /MAYBANK|MALAYAN\s*BANKING/i },
  { id: 'cimb', name: 'CIMB Bank', color: '#EC1C24', pdfKeywords: /CIMB/i },
  { id: 'publicbank', name: 'Public Bank', color: '#D4213D', pdfKeywords: /PUBLIC\s*BANK|PB\s*CARD/i },
  { id: 'rhb', name: 'RHB Bank', color: '#003DA5', pdfKeywords: /RHB\s*BANK|RHB\s*CARD/i },
  { id: 'hongleong', name: 'Hong Leong Bank', color: '#00539B', pdfKeywords: /HONG\s*LEONG|HLB/i },
  { id: 'ambank', name: 'Ambank', color: '#E31937', pdfKeywords: /AMBANK|AM\s*BANK|AMISLAMIC/i },
  { id: 'affin', name: 'Affin Bank', color: '#003B71', pdfKeywords: /AFFIN\s*BANK|AFFIN\s*HWANG|AFFINBANK/i },
  { id: 'alliance', name: 'Alliance Bank', color: '#003366', pdfKeywords: /ALLIANCE\s*BANK|ALLIANCE\s*ISLAMIC/i },
  { id: 'bsn', name: 'BSN', color: '#003DA5', pdfKeywords: /BSN|BANK\s*SIMPANAN\s*NASIONAL/i },

  // Islamic banks
  { id: 'bankislam', name: 'Bank Islam', color: '#8B1A4A', pdfKeywords: /BANK\s*ISLAM/i },
  { id: 'bankrakyat', name: 'Bank Rakyat', color: '#E8611D', pdfKeywords: /BANK\s*RAKYAT/i },
  { id: 'bankmuamalat', name: 'Bank Muamalat', color: '#00843D', pdfKeywords: /BANK\s*MUAMALAT/i },
  { id: 'agrobank', name: 'Agrobank', color: '#009639', pdfKeywords: /AGROBANK|BANK\s*PERTANIAN/i },

  // Foreign banks in Malaysia
  { id: 'hsbc', name: 'HSBC', color: '#DB0011', pdfKeywords: /HSBC/i },
  { id: 'ocbc', name: 'OCBC Bank', color: '#D9272D', pdfKeywords: /OCBC/i },
  { id: 'uob', name: 'UOB Bank', color: '#003DA5', pdfKeywords: /UOB/i },
  { id: 'citibank', name: 'Citibank', color: '#003DA5', pdfKeywords: /CITIBANK|CITI\b/i },
  { id: 'scb', name: 'Standard Chartered', color: '#007A33', pdfKeywords: /STANDARD\s*CHARTERED/i },
  { id: 'icbc', name: 'ICBC Bank', color: '#C8102E', pdfKeywords: /ICBC|INDUSTRIAL.*COMMERCIAL.*CHINA/i },

  // Credit service providers
  { id: 'aeon', name: 'AEON', color: '#E31837', pdfKeywords: /AEON\s*CREDIT|AEON\s*FINANCIAL/i },

  // China banks (中国银行)
  { id: 'boc', name: 'Bank of China', color: '#C8102E', pdfKeywords: /BANK\s*OF\s*CHINA|中国银行/i },
  { id: 'icbc_cn', name: 'ICBC (China)', color: '#C8102E', pdfKeywords: /工商银行|INDUSTRIAL.*COMMERCIAL.*BANK.*CHINA/i },
  { id: 'ccb', name: 'China Construction Bank', color: '#003DA5', pdfKeywords: /CHINA\s*CONSTRUCTION|建设银行|CCB/i },
  { id: 'abc', name: 'Agricultural Bank of China', color: '#00843D', pdfKeywords: /AGRICULTURAL\s*BANK.*CHINA|农业银行|ABC/i },
  { id: 'cmb', name: 'China Merchants Bank', color: '#C8102E', pdfKeywords: /CHINA\s*MERCHANTS|招商银行|CMB/i },
  { id: 'comm', name: 'Bank of Communications', color: '#003DA5', pdfKeywords: /BANK\s*OF\s*COMMUNICATIONS|交通银行|BOCOM/i },
  { id: 'spdb', name: 'SPD Bank', color: '#003DA5', pdfKeywords: /SHANGHAI\s*PUDONG|浦发银行|SPDB/i },
  { id: 'citic', name: 'CITIC Bank', color: '#E31837', pdfKeywords: /CITIC\s*BANK|中信银行/i },
  { id: 'ceb', name: 'China Everbright Bank', color: '#7B2D8E', pdfKeywords: /EVERBRIGHT|光大银行|CEB/i },
  { id: 'cmbc', name: 'China Minsheng Bank', color: '#00843D', pdfKeywords: /MINSHENG|民生银行|CMBC/i },
  { id: 'pab', name: 'Ping An Bank', color: '#FF6600', pdfKeywords: /PING\s*AN\s*BANK|平安银行/i },
  { id: 'hxb', name: 'Hua Xia Bank', color: '#C8102E', pdfKeywords: /HUA\s*XIA|华夏银行/i },
  { id: 'cib', name: 'Industrial Bank', color: '#003DA5', pdfKeywords: /INDUSTRIAL\s*BANK|兴业银行|CIB/i },
  { id: 'bob', name: 'Bank of Beijing', color: '#C8102E', pdfKeywords: /BANK\s*OF\s*BEIJING|北京银行/i },
  { id: 'bos', name: 'Bank of Shanghai', color: '#003DA5', pdfKeywords: /BANK\s*OF\s*SHANGHAI|上海银行/i },
  { id: 'psbc', name: 'Postal Savings Bank', color: '#00843D', pdfKeywords: /POSTAL\s*SAVINGS|邮储银行|PSBC/i },
]

/**
 * Detect bank from PDF text using keyword matching.
 */
export function detectBankFromText(text: string): BankInfo | null {
  for (const bank of ALL_BANKS) {
    if (bank.pdfKeywords.test(text)) {
      return bank
    }
  }
  return null
}

/**
 * Get bank info by ID.
 */
export function getBankById(id: string): BankInfo | undefined {
  return ALL_BANKS.find((b) => b.id === id)
}

/**
 * Get display name for a bank ID.
 */
export function getBankName(id: string): string {
  return getBankById(id)?.name || id
}
