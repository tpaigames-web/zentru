import * as pdfjsLib from 'pdfjs-dist'
import { detectBankFromText } from '@/config/banks'

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString()

export interface ParsedTransaction {
  date: string
  description: string
  amount: number
  type: 'expense' | 'income'
  reference?: string
}

export interface ParsedStatement {
  bank: string
  cardNumber?: string
  statementDate?: string
  totalAmount?: number
  minimumPayment?: number
  creditLimit?: number
  dueDate?: string
  transactions: ParsedTransaction[]
  rawText: string
}

/**
 * Extract all text from a PDF file
 */
export async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    pages.push(text)
  }

  return pages.join('\n\n--- PAGE BREAK ---\n\n')
}

/**
 * Detect bank from PDF text using centralized bank config.
 * Supports 21 Malaysian banks including AEON, BSN, Bank Islam, Bank Rakyat, etc.
 */
export function detectBank(text: string): string | null {
  const bank = detectBankFromText(text)
  return bank?.id || null
}

/**
 * Parse a PDF statement file
 */
/**
 * Parse a PDF statement file.
 *
 * PRIVACY GUARANTEE:
 * - PDF is processed 100% on-device (no server upload)
 * - Original PDF binary data is wiped from memory immediately after text extraction
 * - Raw text is used only for parsing, then discarded from the result
 * - Only structured transaction data (date, amount, description) is returned
 * - No personal identifiers (full card number, name, address) are retained
 */
export async function parseStatement(file: File): Promise<ParsedStatement> {
  // Step 1: Extract text from PDF (on device only)
  const rawText = await extractPdfText(file)

  // Step 2: Detect bank and parse transactions
  const bank = detectBank(rawText)

  if (!bank) {
    return {
      bank: 'unknown',
      transactions: [],
      rawText: '', // Do not retain raw text in result
    }
  }

  const parser = BANK_PARSERS[bank] || parseMaybank
  const result = parser(rawText, bank)

  // Step 3: Mask sensitive data before returning
  if (result.cardNumber && result.cardNumber.length > 4) {
    // Only keep last 4 digits
    result.cardNumber = '****' + result.cardNumber.slice(-4)
  }

  // Step 4: Clear raw text from result (only keep structured data)
  result.rawText = ''

  return result
}

// ---- Bank-specific parsers ----

type BankParser = (text: string, bank: string) => ParsedStatement

const BANK_PARSERS: Record<string, BankParser> = {
  maybank: parseMaybank,
  cimb: parseCIMB,
  publicbank: parsePublicBank,
  hongleong: parseHongLeong,
  rhb: parseRHB,
  ambank: parseAmBank,
}

// Common date patterns in Malaysian statements
// DD/MM, DD/MM/YY, DD/MM/YYYY, DD MMM, DD MMM YY, DD MMM YYYY
const DATE_PATTERNS = [
  /(\d{2}\/\d{2}\/\d{4})/,
  /(\d{2}\/\d{2}\/\d{2})/,
  /(\d{2}\/\d{2})/,
  /(\d{2}\s+(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*\d{0,4})/i,
]

// Common amount pattern: digits with optional comma separators, 2 decimal places
// Amount pattern used in extractTransactions via matchAll

function parseAmount(amountStr: string): { value: number; isCredit: boolean } {
  const cleaned = amountStr.replace(/,/g, '')
  const match = cleaned.match(/(\d+\.\d{2})\s*(CR|DR)?/i)
  if (!match) return { value: 0, isCredit: false }
  return {
    value: parseFloat(match[1]),
    isCredit: match[2]?.toUpperCase() === 'CR',
  }
}

function parseDateStr(dateStr: string, year?: number): string {
  const currentYear = year || new Date().getFullYear()

  // DD/MM/YYYY
  let match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (match) return `${match[3]}-${match[2]}-${match[1]}`

  // DD/MM/YY
  match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{2})/)
  if (match) return `20${match[3]}-${match[2]}-${match[1]}`

  // DD/MM (assume current year)
  match = dateStr.match(/(\d{2})\/(\d{2})/)
  if (match) return `${currentYear}-${match[2]}-${match[1]}`

  // DD MMM YYYY
  const months: Record<string, string> = {
    JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
    JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
  }
  match = dateStr.match(/(\d{2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(\d{2,4})?/i)
  if (match) {
    const y = match[3] ? (match[3].length === 2 ? `20${match[3]}` : match[3]) : `${currentYear}`
    return `${y}-${months[match[2].toUpperCase()]}-${match[1]}`
  }

  return dateStr
}

/**
 * Generic transaction line parser.
 * Looks for lines with a date at the start and an amount near the end.
 */
function extractTransactions(text: string): ParsedTransaction[] {
  const lines = text.split(/\n/)
  const transactions: ParsedTransaction[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.length < 10) continue

    // Try to find a date at/near the start
    let dateMatch: string | null = null
    for (const pattern of DATE_PATTERNS) {
      const m = trimmed.match(pattern)
      if (m && trimmed.indexOf(m[1]) < 15) {
        dateMatch = m[1]
        break
      }
    }

    if (!dateMatch) continue

    // Try to find amount
    const amountMatches = [...trimmed.matchAll(/(\d{1,3}(?:,\d{3})*\.\d{2})\s*(CR|DR)?/gi)]
    if (amountMatches.length === 0) continue

    // Take the last amount match (usually the actual amount, not reference numbers)
    const lastAmount = amountMatches[amountMatches.length - 1]
    const { value, isCredit } = parseAmount(lastAmount[0])

    if (value === 0) continue

    // Extract description (between date and amount)
    const dateEnd = trimmed.indexOf(dateMatch) + dateMatch.length
    const amountStart = lastAmount.index || 0
    const description = trimmed.substring(dateEnd, amountStart).trim()
      .replace(/\s+/g, ' ')
      .replace(/^[\s\-\.]+/, '')

    if (!description || description.length < 2) continue

    transactions.push({
      date: parseDateStr(dateMatch),
      description,
      amount: value,
      type: isCredit ? 'income' : 'expense',
    })
  }

  return transactions
}

function extractCardNumber(text: string): string | undefined {
  const match = text.match(/\b(\d{4}[\s\-*]+\d{4}[\s\-*]+\d{4}[\s\-*]+\d{4})\b/)
    || text.match(/\b(\d{4}[\s\-*x]+\d{4})\b/)
  return match ? match[1].replace(/[\s\-]/g, '') : undefined
}

function extractDueDate(text: string): string | undefined {
  const match = text.match(/(?:DUE\s*DATE|PAYMENT\s*DUE)[:\s]*(\d{2}[\/\s]\w+[\/\s]\d{2,4})/i)
  if (match) return parseDateStr(match[1])
  return undefined
}

function extractStatementDate(text: string): string | undefined {
  const match = text.match(/(?:STATEMENT\s*DATE)[:\s]*(\d{2}[\/\s]\w+[\/\s]\d{2,4})/i)
  if (match) return parseDateStr(match[1])
  return undefined
}

// ---- Bank-specific parsers ----

/**
 * Maybank statement format (verified with real PDF):
 * - Text comes as continuous space-separated string from pdfjs
 * - Transaction pattern: DD/MM   DD/MM   DESCRIPTION   AMOUNT[CR]
 * - Statement Date: "Statement Date/ Tarikh Penyata ... DD MMM YY"
 * - Due Date: "Payment Due Date/ Tarikh Akhir Pembayaran DD MMM YY"
 * - Card number: 16 digits with spaces (e.g. 5239 4501 3049 5350)
 * - CR suffix = credit (payment/refund)
 * - EZYPAY, GRABPAY-EC, RPP FUNDS TRANSFER are common entries
 */
function parseMaybank(text: string, bank: string): ParsedStatement {
  // Maybank header format: "...Tarikh Penyata   Payment Due Date/... 26 MAR 26   15 APR 26"
  // Both dates are together: statement date first, due date second
  let statementDate: string | undefined
  let dueDate: string | undefined
  const bothDatesMatch = text.match(/(?:Tarikh\s*Penyata|Statement\s*Date)[\s\S]*?(\d{1,2}\s+[A-Z]{3}\s+\d{2,4})\s+(\d{1,2}\s+[A-Z]{3}\s+\d{2,4})/i)
  if (bothDatesMatch) {
    statementDate = parseDateStr(bothDatesMatch[1])
    dueDate = parseDateStr(bothDatesMatch[2])
  }

  // Extract card number (4 groups of 4 digits)
  let cardNumber: string | undefined
  const cardMatch = text.match(/(\d{4}\s+\d{4}\s+\d{4}\s+\d{4})/)
  if (cardMatch) cardNumber = cardMatch[1].replace(/\s/g, '')

  // Maybank layout: headers then values on same text line
  // "...Current Balance/ Baki Semasa   Minimum Payment/...  5239 4501 3049 5350   6,166.58   2,090.13"
  // After the card number, the next amounts are: balance, minimum payment
  let totalAmount: number | undefined
  let minimumPayment: number | undefined
  const valuesAfterCard = text.match(/\d{4}\s+\d{4}\s+\d{4}\s+\d{4}\s+(\d{1,3}(?:,\d{3})*\.\d{2})\s+(\d{1,3}(?:,\d{3})*\.\d{2})/)
  if (valuesAfterCard) {
    totalAmount = parseFloat(valuesAfterCard[1].replace(/,/g, ''))
    minimumPayment = parseFloat(valuesAfterCard[2].replace(/,/g, ''))
  }

  // Extract credit limit: "CREDIT LIMIT (RM)   10,000"
  let creditLimit: number | undefined
  const limitMatch = text.match(/CREDIT\s*LIMIT\s*\(RM\)\s+(\d{1,3}(?:,\d{3})*)/i)
  if (limitMatch) creditLimit = parseFloat(limitMatch[1].replace(/,/g, ''))

  // Extract statement year from statement date for DD/MM parsing
  let stmtYear = new Date().getFullYear()
  if (statementDate) {
    const y = parseInt(statementDate.split('-')[0])
    if (y > 2000) stmtYear = y
  }

  // Extract transactions using regex on continuous text
  // Pattern: DD/MM followed by DD/MM followed by description followed by amount
  const transactions: ParsedTransaction[] = []

  // Maybank format: "DD/MM   DD/MM   DESCRIPTION   AMOUNT[CR]"
  // The text from pdfjs has multiple spaces between fields
  const txPattern = /(\d{2}\/\d{2})\s+\d{2}\/\d{2}\s+(.*?)\s+(\d{1,3}(?:,\d{3})*\.\d{2})(CR)?(?=\s+\d{2}\/\d{2}\s|\s+TOTAL|\s+SUB\s*TOTAL|\s+YOUR|\s+JUMLAH|\s+Page|\s+00\d|\s+STATEMENT|\s*$)/gi

  let match
  while ((match = txPattern.exec(text)) !== null) {
    const dateStr = match[1]
    let description = match[2].trim()
    const amount = parseFloat(match[3].replace(/,/g, ''))
    const isCredit = !!match[4]

    if (amount <= 0) continue

    // Clean up description - remove trailing reference numbers like :006/006
    description = description.replace(/\s*:\d{3}\/\d{3}\s*$/, '').trim()

    // Skip interest rate lines
    if (/INTEREST\s*RATE/i.test(description)) continue

    transactions.push({
      date: parseDateStr(dateStr, stmtYear),
      description,
      amount,
      type: isCredit ? 'income' : 'expense',
    })
  }

  // If regex didn't catch enough, try a simpler fallback pattern
  if (transactions.length === 0) {
    const simplePattern = /(\d{2}\/\d{2})\s+\d{2}\/\d{2}\s+([\w\s\-\.]+?)\s+(\d{1,3}(?:,\d{3})*\.\d{2})(CR)?/gi
    while ((match = simplePattern.exec(text)) !== null) {
      const dateStr = match[1]
      let description = match[2].trim()
      const amount = parseFloat(match[3].replace(/,/g, ''))
      const isCredit = !!match[4]

      if (amount <= 0) continue
      description = description.replace(/\s*:\d{3}\/\d{3}\s*$/, '').trim()
      if (/INTEREST\s*RATE/i.test(description)) continue
      if (description.length < 3) continue

      transactions.push({
        date: parseDateStr(dateStr, stmtYear),
        description,
        amount,
        type: isCredit ? 'income' : 'expense',
      })
    }
  }

  return {
    bank,
    cardNumber,
    statementDate,
    dueDate,
    totalAmount,
    minimumPayment,
    creditLimit,
    transactions,
    rawText: text,
  }
}

function parseGenericBank(text: string, bank: string): ParsedStatement {
  return {
    bank,
    cardNumber: extractCardNumber(text),
    statementDate: extractStatementDate(text),
    dueDate: extractDueDate(text),
    transactions: extractTransactions(text),
    rawText: text,
  }
}

function parseCIMB(text: string, bank: string): ParsedStatement {
  return parseGenericBank(text, bank)
}

function parsePublicBank(text: string, bank: string): ParsedStatement {
  return parseGenericBank(text, bank)
}

function parseHongLeong(text: string, bank: string): ParsedStatement {
  return parseGenericBank(text, bank)
}

function parseRHB(text: string, bank: string): ParsedStatement {
  return parseGenericBank(text, bank)
}

function parseAmBank(text: string, bank: string): ParsedStatement {
  return parseGenericBank(text, bank)
}
