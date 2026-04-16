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

export interface CardSection {
  cardNumber?: string       // Last 4 digits (masked) of this card
  cardProductName?: string  // e.g. "SUTERA VISA PLATINUM"
  transactions: ParsedTransaction[]
}

export interface ParsedStatement {
  bank: string
  cardNumber?: string
  cardProductName?: string  // e.g. "SUTERA VISA PLATINUM", "GRAB MASTERCARD"
  statementDate?: string
  totalAmount?: number
  minimumPayment?: number
  creditLimit?: number
  dueDate?: string
  transactions: ParsedTransaction[]
  cardSections?: CardSection[]  // Multi-card: transactions grouped by card
  rawText: string
}

/**
 * Extract all text from a PDF file using coordinate-based sorting.
 *
 * pdfjs getTextContent() returns items in document stream order, which can be
 * wrong for multi-column PDFs (common in bank statements). We use the transform
 * coordinates to sort items by position: group by Y (rows), sort by X within rows.
 */
export async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()

    // Extract items with coordinates
    // transform: [scaleX, skewX, skewY, scaleY, x, y]
    // PDF y-axis goes bottom-up, so we sort descending by y
    const items: { str: string; x: number; y: number }[] = []
    for (const item of content.items) {
      if (!('str' in item) || !item.str) continue
      const t = (item as { transform: number[] }).transform
      if (t) {
        items.push({ str: item.str, x: t[4], y: t[5] })
      }
    }

    // Group by rows: items within ~3px of same Y are on the same line
    const ROW_THRESHOLD = 3
    items.sort((a, b) => b.y - a.y || a.x - b.x) // top-to-bottom, left-to-right

    const rows: { str: string; x: number }[][] = []
    let currentRow: { str: string; x: number }[] = []
    let currentY = items[0]?.y ?? 0

    for (const item of items) {
      if (Math.abs(item.y - currentY) > ROW_THRESHOLD) {
        if (currentRow.length > 0) rows.push(currentRow)
        currentRow = []
        currentY = item.y
      }
      currentRow.push({ str: item.str, x: item.x })
    }
    if (currentRow.length > 0) rows.push(currentRow)

    // Sort items within each row by X, then join
    const lines = rows.map((row) => {
      row.sort((a, b) => a.x - b.x)
      return row.map((r) => r.str).join(' ')
    })

    pages.push(lines.join('\n'))
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
      rawText: '',
    }
  }

  const parser = BANK_PARSERS[bank] || parseDDMMMBank

  // Step 2.5: Check for multiple cards in the PDF
  const cardSplits = splitTextByCard(rawText)

  if (cardSplits && cardSplits.length > 1) {
    // Multi-card PDF: parse each section independently
    const cardSections: CardSection[] = []
    const allTransactions: ParsedTransaction[] = []

    for (const section of cardSplits) {
      const sectionResult = parser(section.text, bank)
      const productName = sectionResult.cardProductName || detectCardProductName(section.text)

      cardSections.push({
        cardNumber: '****' + section.last4,
        cardProductName: productName,
        transactions: sectionResult.transactions,
      })
      allTransactions.push(...sectionResult.transactions)
    }

    // Parse the full text once more for statement-level info (dates, limits, balance)
    const fullResult = parser(rawText, bank)
    if (!fullResult.cardProductName) {
      fullResult.cardProductName = detectCardProductName(rawText)
    }

    // Mask primary card number
    if (fullResult.cardNumber && fullResult.cardNumber.length > 4) {
      fullResult.cardNumber = '****' + fullResult.cardNumber.slice(-4)
    }

    return {
      ...fullResult,
      transactions: allTransactions,
      cardSections,
      rawText: '',
    }
  }

  // Single-card PDF: existing behavior
  const result = parser(rawText, bank)

  if (!result.cardProductName) {
    result.cardProductName = detectCardProductName(rawText)
  }

  // Step 3: Mask sensitive data
  if (result.cardNumber && result.cardNumber.length > 4) {
    result.cardNumber = '****' + result.cardNumber.slice(-4)
  }

  // Step 4: Clear raw text
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
  uob: parseDDMMMBank,
  affin: parseDDMMMBank,
  alliance: parseDDMMMBank,
  bsn: parseDDMMMBank,
  bankislam: parseDDMMMBank,
  bankrakyat: parseDDMMMBank,
  hsbc: parseDDMMMBank,
  ocbc: parseDDMMMBank,
  citibank: parseDDMMMBank,
  scb: parseDDMMMBank,
  aeon: parseDDMMMBank,
}


/**
 * Detect specific card product name from PDF text.
 * e.g. "SUTERA VISA PLATINUM", "GRAB MASTERCARD", "ONE VISA CARD"
 */
function detectCardProductName(text: string): string | undefined {
  const patterns = [
    // Specific product names
    /SUTERA\s+VISA\s+PLATINUM/i,
    /WISE\s+VISA\s+(?:GOLD|PLATINUM)/i,
    /GSC\s+(?:HONG\s+LEONG\s+)?VISA\s+GOLD/i,
    /ESSENTIAL\s+(?:VISA|MASTERCARD)/i,
    /GRAB\s+MASTER\w*/i,
    /SHELL\s+VISA/i,
    /QUANTUM\s+(?:VISA|MASTERCARD)/i,
    /PETRON\s+VISA/i,
    /ONE\s+VISA\s+(?:CARD|CLASSIC|PLATINUM)/i,
    /EVOL\s+VISA\s+CARD/i,
    /EVOL\s+(?:VISA|CARD)/i,
    /YOLO\s+VISA/i,
    /ZENITH\s+MASTER\w*/i,
    /VISA\s+INFINITE\s+CARD/i,
    /WORLD\s+MASTER\w*\s*CARD/i,
    /SIMPLY\s+(?:VISA|CASH)/i,
    /CASH\s+(?:REBATE|BACK)\s+(?:VISA|MASTER\w*)\s*(?:PLATINUM|GOLD|CLASSIC)?/i,
    /WORLD\s+MASTER\w*/i,
    /VISA\s+(?:SIGNATURE|INFINITE)/i,
    /PREMIER\s+VISA\s+INFINITE/i,
    /FC\s+BARCELONA/i,
    /IKHWAN\s+(?:GOLD|PLATINUM)/i,
    /AMANAH\s+MPOWER/i,
    /JUSTONE\s+PLATINUM/i,
    /LIVERPOOL\s+FC/i,
    /MEMBER\s+PLUS/i,
    /BIKER\s+(?:GOLD|INFINITE)/i,
    /DUO\s+VISA/i,
    /TRUE\s+VISA/i,
  ]

  for (const p of patterns) {
    const m = text.match(p)
    if (m) return m[0].toUpperCase()
  }

  return undefined
}

/**
 * Sanitize PDF text for anonymous sample submission.
 * Removes all personal/financial data, keeps only structural format.
 *
 * What gets redacted:
 * - Card numbers (full/partial) → XXXX XXXX XXXX XXXX
 * - All monetary amounts → 0.00
 * - Malaysian IC numbers → XXXXXX-XX-XXXX
 * - Email addresses → xxx@xxx.com
 * - Phone numbers → XXX-XXXXXXX
 * - Uppercase full names (2-4 word patterns) → NAME REDACTED
 * - Account numbers (8+ digits) → XXXXXXXX
 *
 * What's preserved:
 * - Date formats and positions
 * - Bank headers and logos text
 * - Transaction structure patterns (field order, separators)
 * - Line count and layout
 */
export function sanitizeForSample(text: string): string {
  let s = text

  // 1. Card numbers: 16 digits with spaces/dashes/stars
  s = s.replace(/\b\d{4}[\s\-*xX]+\d{4}[\s\-*xX]+\d{4}[\s\-*xX]+\d{4}\b/g, 'XXXX XXXX XXXX XXXX')
  // Partial card: 4+4 with mask
  s = s.replace(/\b\d{4}[\s\-*xX]+\d{4}\b/g, 'XXXX XXXX')

  // 2. Malaysian IC: 123456-12-1234
  s = s.replace(/\b\d{6}[\s\-]\d{2}[\s\-]\d{4}\b/g, 'XXXXXX-XX-XXXX')

  // 3. Email addresses
  s = s.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, 'xxx@xxx.com')

  // 4. Phone numbers: 01X-XXXXXXX, +60XXXXXXXXX, etc.
  s = s.replace(/\+?6?0\d[\s\-]?\d{3,4}[\s\-]?\d{4}/g, 'XXX-XXXXXXX')

  // 5. Monetary amounts: 1,234.56 or 123.45 → 0.00
  s = s.replace(/\b\d{1,3}(?:,\d{3})*\.\d{2}\b/g, '0.00')

  // 6. Account numbers: sequences of 8+ digits (not dates)
  s = s.replace(/\b\d{8,}\b/g, 'XXXXXXXX')

  // 7. Uppercase full names (2-4 capitalized words, min 5 chars each word — likely names)
  // e.g. "MOHAMMAD BIN ABDULLAH", "TAN AH KEAT"
  s = s.replace(/\b[A-Z]{2,}(?:\s+(?:BIN|BINTI|A\/L|A\/P|S\/O|D\/O)\s+)?[A-Z]{2,}(?:\s+[A-Z]{2,}){0,2}\b/g, (match) => {
    // Don't redact known bank/structural terms
    const keepPatterns = /^(?:VISA|MASTERCARD|AMEX|AMERICAN EXPRESS|CREDIT|DEBIT|CARD|STATEMENT|PAYMENT|BALANCE|TOTAL|DATE|AMOUNT|DESCRIPTION|REFERENCE|TRANSACTION|MINIMUM|PREVIOUS|CURRENT|DUE|LIMIT|AVAILABLE|PAGE|BANK|MALAYSIA|BERHAD|SDN BHD|PTY LTD|INTEREST|RATE|ANNUAL|FEE|CASHBACK|REWARD|POINT|PLATINUM|GOLD|CLASSIC|SIGNATURE|INFINITE|WORLD|PREMIER|ISLAMIC|AMANAH|IKHWAN|PETRONAS|SHELL|GRAB|SHOPEE|LAZADA|NEW|SUB|CLOSING|OPENING|YOUR|JUMLAH|TARIKH|PENYATA|BAYARAN|BAKI|KREDIT|AKHIR|NAMA|NOMBOR)/i
    if (keepPatterns.test(match)) return match
    // Don't redact short matches (likely abbreviations or structural)
    if (match.length < 8) return match
    return 'NAME REDACTED'
  })

  // 8. Truncate to first 500 lines max (enough for format analysis)
  const lines = s.split('\n')
  if (lines.length > 500) {
    s = lines.slice(0, 500).join('\n') + '\n... [TRUNCATED]'
  }

  return s
}

function parseDateStr(dateStr: string, year?: number, stmtMonth?: number): string {
  const currentYear = year || new Date().getFullYear()

  const months: Record<string, string> = {
    JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
    JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
  }

  // Adjust year for cross-year statements (e.g. Jan statement with Dec transactions)
  function adjustYear(parsedYear: number, txMonth: number): number {
    if (stmtMonth !== undefined && stmtMonth <= 2 && txMonth >= 10) {
      return parsedYear - 1
    }
    return parsedYear
  }

  // DD/MM/YYYY
  let match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (match) return `${match[3]}-${match[2]}-${match[1]}`

  // DD/MM/YY
  match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{2})/)
  if (match) return `20${match[3]}-${match[2]}-${match[1]}`

  // DD/MM (assume statement year, adjust for cross-year)
  match = dateStr.match(/(\d{2})\/(\d{2})/)
  if (match) {
    const txMonth = parseInt(match[2])
    const y = adjustYear(currentYear, txMonth)
    return `${y}-${match[2]}-${match[1]}`
  }

  // DD MMM [YYYY]
  match = dateStr.match(/(\d{1,2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(\d{2,4})?/i)
  if (match) {
    const monthStr = months[match[2].toUpperCase()]
    const txMonth = parseInt(monthStr)
    let y: number
    if (match[3]) {
      y = match[3].length === 2 ? 2000 + parseInt(match[3]) : parseInt(match[3])
    } else {
      y = adjustYear(currentYear, txMonth)
    }
    return `${y}-${monthStr}-${match[1].padStart(2, '0')}`
  }

  return dateStr
}

function extractCardNumber(text: string): string | undefined {
  // UOB format: **4599-1441-0610-3232**
  const uobMatch = text.match(/\*\*(\d{4}[\-\s]\d{4}[\-\s]\d{4}[\-\s]\d{4})\*\*/)
  if (uobMatch) return uobMatch[1].replace(/[\s\-]/g, '')

  const match = text.match(/\b(\d{4}[\s\-*]+\d{4}[\s\-*]+\d{4}[\s\-*]+\d{4})\b/)
    || text.match(/\b(\d{4}[\s\-*x]+\d{4})\b/)
  return match ? match[1].replace(/[\s\-]/g, '') : undefined
}

/**
 * Find all card numbers in text and their positions.
 * Returns array of { cardNumber, position } sorted by position.
 * Common formats in Malaysian bank statements:
 *   - "5239 4501 3049 5350" (full 16 digits with spaces)
 *   - "XXXX-XXXX-XXXX-5350" (masked)
 *   - "Card No: **** **** **** 5350"
 *   - "4556 12XX XXXX 1234" (partially masked)
 */
function findAllCardNumbers(text: string): { last4: string; position: number }[] {
  const results: { last4: string; position: number }[] = []
  const seen = new Set<string>()

  // Pattern 1: UOB format with ** wrapper: **4599-1441-0610-3232**
  const uobPattern = /\*\*(\d{4}[\-\s]\d{4}[\-\s]\d{4}[\-\s](\d{4}))\*\*/g
  let m
  while ((m = uobPattern.exec(text)) !== null) {
    const last4 = m[2]
    if (!seen.has(last4)) {
      seen.add(last4)
      results.push({ last4, position: m.index })
    }
  }

  // Pattern 2: Standard full/partially masked 16-digit (4 groups of 4)
  const fullPattern = /\b(\d{4}[\s\-*xX]+\d{4}[\s\-*xX]+\d{4}[\s\-*xX]+(\d{4}))\b/g
  while ((m = fullPattern.exec(text)) !== null) {
    const last4 = m[2]
    if (!seen.has(last4)) {
      seen.add(last4)
      results.push({ last4, position: m.index })
    }
  }

  return results.sort((a, b) => a.position - b.position)
}

/**
 * Split raw PDF text into sections by card number.
 * Each section contains the text between one card number header and the next.
 * Returns null if only 0 or 1 unique card numbers found (no splitting needed).
 */
function splitTextByCard(text: string): { last4: string; text: string }[] | null {
  const cardPositions = findAllCardNumbers(text)

  // Get unique card numbers
  const uniqueCards = [...new Set(cardPositions.map((c) => c.last4))]
  if (uniqueCards.length <= 1) return null // Single card or no card — no split needed

  // For multi-card: find the FIRST occurrence of each unique card number
  // This marks the start of each card's transaction section
  const sectionStarts: { last4: string; position: number }[] = []
  for (const last4 of uniqueCards) {
    const first = cardPositions.find((c) => c.last4 === last4)
    if (first) sectionStarts.push(first)
  }
  sectionStarts.sort((a, b) => a.position - b.position)

  // Split text into sections
  const sections: { last4: string; text: string }[] = []
  for (let i = 0; i < sectionStarts.length; i++) {
    const start = sectionStarts[i].position
    const end = i + 1 < sectionStarts.length ? sectionStarts[i + 1].position : text.length
    sections.push({
      last4: sectionStarts[i].last4,
      text: text.substring(start, end),
    })
  }

  return sections
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

  // Extract statement year and month for date parsing
  let stmtYear = new Date().getFullYear()
  let stmtMonth: number | undefined
  if (statementDate) {
    const parts = statementDate.split('-')
    const y = parseInt(parts[0])
    if (y > 2000) stmtYear = y
    stmtMonth = parseInt(parts[1])
  }

  // Extract transactions line by line
  // Maybank format: "DD/MM   DD/MM   DESCRIPTION   AMOUNT[CR]"
  // With coordinate-sorted text, each transaction is on its own line
  const transactions: ParsedTransaction[] = []
  const lines = text.split('\n')

  for (const line of lines) {
    // Match: starts with DD/MM, followed by another DD/MM, then description, then amount at end
    const m = line.match(/^(\d{2}\/\d{2})\s+\d{2}\/\d{2}\s+(.+?)\s+(\d{1,3}(?:,\d{3})*\.\d{2})\s*(CR)?\s*$/)
    if (!m) continue

    const dateStr = m[1]
    let description = m[2].trim()
    const amount = parseFloat(m[3].replace(/,/g, ''))
    const isCredit = !!m[4]

    if (amount <= 0) continue
    // Clean up description
    description = description.replace(/\s*:\d{3}\/\d{3}\s*$/, '').trim()
    if (/INTEREST\s*RATE/i.test(description)) continue
    if (description.length < 3) continue

    transactions.push({
      date: parseDateStr(dateStr, stmtYear, stmtMonth),
      description,
      amount,
      type: isCredit ? 'income' : 'expense',
    })
  }

  // Fallback: try full-text regex if line-based parsing found nothing
  // (handles case where pdfjs still outputs continuous text for some PDFs)
  if (transactions.length === 0) {
    const txPattern = /(\d{2}\/\d{2})\s+\d{2}\/\d{2}\s+(.*?)\s+(\d{1,3}(?:,\d{3})*\.\d{2})\s*(CR)?(?=\s+\d{2}\/\d{2}\s|\s+TOTAL|\s+SUB\s*TOTAL|\s+YOUR|\s+JUMLAH|\s*$)/gi
    let match
    while ((match = txPattern.exec(text)) !== null) {
      const dateStr = match[1]
      let description = match[2].trim()
      const amount = parseFloat(match[3].replace(/,/g, ''))
      const isCredit = !!match[4]

      if (amount <= 0) continue
      description = description.replace(/\s*:\d{3}\/\d{3}\s*$/, '').trim()
      if (/INTEREST\s*RATE/i.test(description)) continue
      if (description.length < 3) continue

      transactions.push({
        date: parseDateStr(dateStr, stmtYear, stmtMonth),
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

/**
 * Generic parser for DD MMM format (RHB, Hong Leong, UOB, etc.)
 * Pattern: DD MMM  [DD MMM]  DESCRIPTION  AMOUNT [CR]
 */
function parseDDMMMBank(text: string, bank: string): ParsedStatement {
  // Extract dates
  let statementDate: string | undefined
  let dueDate: string | undefined
  const stmtMatch = text.match(/(?:Statement\s*Date|Tarikh\s*Penyata)\s*[:\s]*(\d{1,2}\s+[A-Z]{3}\s+\d{2,4})/i)
  if (stmtMatch) statementDate = parseDateStr(stmtMatch[1])
  const dueMatch = text.match(/(?:Payment\s*Due\s*Date|Tarikh\s*Akhir\s*Bayar\w*|Bayar\s*Sebelum)\s*[:\s]*(\d{1,2}\s+[A-Z]{3}\s+\d{2,4})/i)
  if (dueMatch) dueDate = parseDateStr(dueMatch[1])

  // Card number
  const cardNumber = extractCardNumber(text)

  // Credit limit
  let creditLimit: number | undefined
  const limitMatch = text.match(/(?:Credit\s*Limit|Combine\s*Credit\s*Limit|Had\s*Kredit)\s*(?:\(RM\))?\s*[:\s]*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i)
  if (limitMatch) creditLimit = parseFloat(limitMatch[1].replace(/,/g, ''))

  // Balance
  let totalAmount: number | undefined
  const balMatch = text.match(/(?:Current\s*Balance|Total\s*Balance\s*Due|Baki\s*Perlu|Outstanding\s*Balance|Jumlah\s*Terkini)\s*(?:\(RM\))?\s*[:\s]*(\d{1,3}(?:,\d{3})*\.\d{2})/i)
  if (balMatch) totalAmount = parseFloat(balMatch[1].replace(/,/g, ''))

  // Statement year and month
  let stmtYear = new Date().getFullYear()
  let stmtMonth: number | undefined
  if (statementDate) {
    const parts = statementDate.split('-')
    const y = parseInt(parts[0])
    if (y > 2000) stmtYear = y
    stmtMonth = parseInt(parts[1])
  }

  const transactions: ParsedTransaction[] = []
  const lines = text.split('\n')

  // Line-based parsing (with coordinate-sorted text, each transaction is a line)
  for (const line of lines) {
    // Pattern 1: DD MMM  DD MMM  DESCRIPTION  AMOUNT [CR] (Hong Leong, RHB)
    let m = line.match(/^(\d{2}\s+[A-Z]{3})\s+\d{2}\s+[A-Z]{3}\s+(.+?)\s+(\d{1,3}(?:,\d{3})*\.\d{2})\s*(CR)?\s*$/)
    // Pattern 2: DD MMM  DESCRIPTION  AMOUNT [CR] (UOB - single date)
    if (!m) m = line.match(/^(\d{2}\s+[A-Z]{3})\s+(.+?)\s+(\d{1,3}(?:,\d{3})*\.\d{2})\s*(CR)?\s*$/)
    if (!m) continue

    const dateStr = m[1]
    let description = m[2].trim()
    const amount = parseFloat(m[3].replace(/,/g, ''))
    const isCredit = !!m[4]

    if (amount <= 0) continue
    if (/INTEREST\s*(IS|RATE)|PREVIOUS\s*BAL|OPENING\s*BAL|CREDIT\s*LIMIT|CREDIT\s*SHIELD|FLEXI\s*PAYMENT.*:0\/|FPP\s*XFER|HLB-FLEXI/i.test(description)) continue

    description = description.replace(/\s{2,}/g, ' ').replace(/MYS?\s*$/i, '').replace(/MY\s*$/i, '').trim()
    if (description.length < 3) continue

    transactions.push({
      date: parseDateStr(dateStr, stmtYear, stmtMonth),
      description,
      amount,
      type: isCredit ? 'income' : 'expense',
    })
  }

  // Fallback: full-text regex if line-based found nothing
  if (transactions.length === 0) {
    const pattern = /(\d{2}\s+[A-Z]{3})\s+(?:\d{2}\s+[A-Z]{3}\s+)?(.+?)\s+(\d{1,3}(?:,\d{3})*\.\d{2})\s*(CR)?(?=\s+\d{2}\s+[A-Z]{3}\s|\s+(?:SUB|TOTAL|CLOSING|PREVIOUS|OPENING|MINIMUM|Page)\b|\s*$)/gi
    let fm
    while ((fm = pattern.exec(text)) !== null) {
      const dateStr = fm[1]
      let description = fm[2].trim()
      const amount = parseFloat(fm[3].replace(/,/g, ''))
      const isCredit = !!fm[4]

      if (amount <= 0) continue
      if (/INTEREST\s*(IS|RATE)|PREVIOUS\s*BAL|OPENING\s*BAL|CREDIT\s*LIMIT|CREDIT\s*SHIELD/i.test(description)) continue
      description = description.replace(/\s{2,}/g, ' ').replace(/MYS?\s*$/i, '').replace(/MY\s*$/i, '').trim()
      if (description.length < 3) continue

      transactions.push({
        date: parseDateStr(dateStr, stmtYear, stmtMonth),
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
    creditLimit,
    transactions,
    rawText: text,
  }
}

function parseCIMB(text: string, bank: string): ParsedStatement {
  return parseDDMMMBank(text, bank)
}

function parsePublicBank(text: string, bank: string): ParsedStatement {
  return parseDDMMMBank(text, bank)
}

function parseHongLeong(text: string, bank: string): ParsedStatement {
  return parseDDMMMBank(text, bank)
}

function parseRHB(text: string, bank: string): ParsedStatement {
  return parseDDMMMBank(text, bank)
}

function parseAmBank(text: string, bank: string): ParsedStatement {
  return parseDDMMMBank(text, bank)
}
