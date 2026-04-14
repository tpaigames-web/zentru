import type { ParsedTransaction } from './pdfParser'

/**
 * Parse CSV text into transactions.
 * Auto-detects: delimiter (comma/semicolon/tab), header row, date format, amount format.
 */
export function parseCSV(text: string): ParsedTransaction[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []

  // Detect delimiter
  const delimiter = detectDelimiter(lines[0])

  // Parse all rows
  const rows = lines.map((line) => splitCSVLine(line, delimiter))

  // Find header row (contains date/amount/description keywords)
  const headerIdx = findHeaderRow(rows)
  if (headerIdx < 0) return []

  const headers = rows[headerIdx].map((h) => h.toLowerCase().trim())
  const dataRows = rows.slice(headerIdx + 1)

  // Map columns
  const dateCol = findColumn(headers, ['date', 'transaction date', 'trans date', 'posting date', '日期', '交易日期'])
  const descCol = findColumn(headers, ['description', 'merchant', 'details', 'narrative', 'particulars', '描述', '商户', '摘要', '交易描述'])
  const amountCol = findColumn(headers, ['amount', 'transaction amount', 'debit', '金额', '交易金额'])
  const creditCol = findColumn(headers, ['credit', 'credit amount', '贷方', '收入'])
  const debitCol = findColumn(headers, ['debit', 'debit amount', '借方', '支出'])
  const typeCol = findColumn(headers, ['type', 'dr/cr', 'indicator', '类型'])

  if (dateCol < 0 || (amountCol < 0 && debitCol < 0)) return []
  const effectiveDescCol = descCol >= 0 ? descCol : -1

  const transactions: ParsedTransaction[] = []

  for (const row of dataRows) {
    if (row.length <= Math.max(dateCol, amountCol, effectiveDescCol)) continue

    const dateStr = row[dateCol]?.trim()
    if (!dateStr) continue

    const date = parseFlexDate(dateStr)
    if (!date) continue

    const description = effectiveDescCol >= 0 ? row[effectiveDescCol]?.trim() || '' : ''

    // Determine amount and type
    let amount = 0
    let type: 'expense' | 'income' = 'expense'

    if (debitCol >= 0 && creditCol >= 0) {
      // Separate debit/credit columns
      const debit = parseAmount(row[debitCol])
      const credit = parseAmount(row[creditCol])
      if (credit > 0) { amount = credit; type = 'income' }
      else if (debit > 0) { amount = debit; type = 'expense' }
      else continue
    } else if (amountCol >= 0) {
      const raw = row[amountCol]?.trim() || ''
      amount = parseAmount(raw)

      // Check for CR/DR suffix or type column
      const hasCR = /CR\s*$/i.test(raw) || (typeCol >= 0 && /CR|credit/i.test(row[typeCol] || ''))
      const isNegative = amount < 0
      amount = Math.abs(amount)

      if (hasCR || isNegative) type = 'income'
    }

    if (amount <= 0) continue
    if (description.length < 2 && !dateStr) continue

    transactions.push({ date, description, amount, type })
  }

  return transactions
}

function detectDelimiter(line: string): string {
  const commas = (line.match(/,/g) || []).length
  const semis = (line.match(/;/g) || []).length
  const tabs = (line.match(/\t/g) || []).length
  if (tabs >= commas && tabs >= semis) return '\t'
  if (semis > commas) return ';'
  return ','
}

function splitCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === delimiter && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

function findHeaderRow(rows: string[][]): number {
  const keywords = /\b(date|amount|description|merchant|debit|credit|transaction|日期|金额|描述|交易)\b/i
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const joined = rows[i].join(' ')
    if (keywords.test(joined)) return i
  }
  return -1
}

function findColumn(headers: string[], names: string[]): number {
  for (const name of names) {
    const idx = headers.findIndex((h) => h.includes(name))
    if (idx >= 0) return idx
  }
  return -1
}

function parseAmount(str: string | undefined): number {
  if (!str) return 0
  // Remove currency symbols, quotes, whitespace, CR/DR suffix
  const cleaned = str.replace(/[""''RM$¥€£\s]/gi, '').replace(/\s*(CR|DR)\s*$/i, '').trim()
  // Handle negative: parentheses (1,234.56) or minus sign
  const isNeg = cleaned.startsWith('(') && cleaned.endsWith(')')
  const numStr = cleaned.replace(/[()]/g, '').replace(/,/g, '')
  const val = parseFloat(numStr)
  return isNaN(val) ? 0 : (isNeg ? -val : val)
}

function parseFlexDate(str: string): string | null {
  // YYYY-MM-DD
  let m = str.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`

  // DD/MM/YYYY or DD-MM-YYYY
  m = str.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`

  // MM/DD/YYYY (US format — only if month > 12 swap)
  m = str.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})/)
  if (m && parseInt(m[1]) > 12) return `${m[3]}-${m[1]}-${m[2]}`

  // DD/MM/YY
  m = str.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{2})$/)
  if (m) return `20${m[3]}-${m[2]}-${m[1]}`

  // DD MMM YYYY
  const months: Record<string, string> = {
    JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
    JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
  }
  m = str.match(/^(\d{1,2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+(\d{2,4})/i)
  if (m) {
    const y = m[3].length === 2 ? `20${m[3]}` : m[3]
    return `${y}-${months[m[2].toUpperCase()]}-${m[1].padStart(2, '0')}`
  }

  return null
}
