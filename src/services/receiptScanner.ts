import { createWorker } from 'tesseract.js'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { extractPdfText } from './pdfParser'

export interface ScannedReceiptData {
  totalAmount?: number
  merchant?: string
  date?: string
  items?: { name: string; amount: number }[]
  rawText: string
  /** E-invoice fields */
  invoiceNo?: string
  tin?: string
  taxAmount?: number
}

/**
 * Capture a receipt image via camera or gallery.
 */
export async function captureReceiptImage(source: 'camera' | 'gallery' = 'camera'): Promise<string> {
  const photo = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.Base64,
    source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
    width: 1500,
    correctOrientation: true,
  })

  if (!photo.base64String) throw new Error('No image captured')
  return `data:image/${photo.format};base64,${photo.base64String}`
}

/**
 * Run OCR on a receipt image and extract details.
 */
export async function scanReceiptImage(imageData: string): Promise<ScannedReceiptData> {
  const worker = await createWorker('eng')
  const { data } = await worker.recognize(imageData)
  await worker.terminate()
  return parseReceiptText(data.text)
}

/**
 * Scan receipt from file input (web fallback).
 */
export async function scanReceiptFromFile(file: File): Promise<ScannedReceiptData> {
  const worker = await createWorker('eng')
  const { data } = await worker.recognize(file)
  await worker.terminate()
  return parseReceiptText(data.text)
}

/**
 * Scan receipt/e-invoice from PDF file.
 * Uses pdfjs coordinate-based text extraction, then parses with e-invoice awareness.
 */
export async function scanReceiptFromPdf(file: File): Promise<ScannedReceiptData> {
  const text = await extractPdfText(file)
  return parseReceiptPdfText(text)
}

/**
 * Parse PDF receipt/e-invoice text.
 * Handles Malaysia e-Invoice (e-Invois) format with TIN, MSIC, SST, etc.
 */
function parseReceiptPdfText(rawText: string): ScannedReceiptData {
  const result = parseReceiptText(rawText)

  // E-Invoice specific fields — extract invoice number for notes
  const invoiceMatch = rawText.match(/(?:Invoice\s*(?:No|Number|#)|No\.\s*Invois|e-Invoice\s*No)\s*[:\s]*([A-Z0-9\-\/]+)/i)
  if (invoiceMatch) {
    result.invoiceNo = invoiceMatch[1].trim()
  }

  // TIN (Tax Identification Number) — Malaysia e-invoice requirement
  const tinMatch = rawText.match(/(?:TIN|Tax\s*ID|No\.\s*Pengenalan\s*Cukai)\s*[:\s]*([A-Z0-9\-]+)/i)
  if (tinMatch) {
    result.tin = tinMatch[1].trim()
  }

  // SST amount
  const sstMatch = rawText.match(/(?:SST|Sales\s*&?\s*Service\s*Tax|Cukai\s*Perkhidmatan)\s*[:\s]*(?:RM|MYR)?\s*(\d{1,3}(?:,\d{3})*\.\d{2})/i)
  if (sstMatch) {
    result.taxAmount = parseFloat(sstMatch[1].replace(/,/g, ''))
  }

  // GST / Tax amount (fallback)
  if (!result.taxAmount) {
    const taxMatch = rawText.match(/(?:GST|TAX|CUKAI)\s*(?:AMOUNT)?\s*[:\s]*(?:RM|MYR)?\s*(\d{1,3}(?:,\d{3})*\.\d{2})/i)
    if (taxMatch) {
      result.taxAmount = parseFloat(taxMatch[1].replace(/,/g, ''))
    }
  }

  // Seller/Merchant from e-invoice structured fields
  if (!result.merchant) {
    const sellerMatch = rawText.match(/(?:Seller|Supplier|Penjual|Company\s*Name|Nama\s*Syarikat)\s*[:\s]*(.+)/i)
    if (sellerMatch) {
      result.merchant = sellerMatch[1].trim().substring(0, 60)
    }
  }

  return result
}

function parseReceiptText(rawText: string): ScannedReceiptData {
  const result: ScannedReceiptData = { rawText }
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean)

  // 1. Extract total amount - look for TOTAL, GRAND TOTAL, AMOUNT DUE, etc.
  const totalPatterns = [
    /(?:GRAND\s*TOTAL|TOTAL\s*(?:AMOUNT|DUE|PAYABLE)|AMOUNT\s*DUE|JUMLAH\s*BESAR|JUMLAH)\s*[:.]?\s*(?:RM|MYR)?\s*(\d{1,3}(?:[,.]?\d{3})*\.\d{2})/i,
    /(?:TOTAL|JUMLAH)\s*[:.]?\s*(?:RM|MYR)?\s*(\d{1,3}(?:[,.]?\d{3})*\.\d{2})/i,
    /(?:RM|MYR)\s*(\d{1,3}(?:[,.]?\d{3})*\.\d{2})\s*$/im,
  ]

  for (const pattern of totalPatterns) {
    const match = rawText.match(pattern)
    if (match) {
      result.totalAmount = parseFloat(match[1].replace(/,/g, ''))
      break
    }
  }

  // If no labeled total found, find the largest amount on the receipt
  if (!result.totalAmount) {
    const amounts = [...rawText.matchAll(/(\d{1,3}(?:,\d{3})*\.\d{2})/g)]
      .map((m) => parseFloat(m[1].replace(/,/g, '')))
      .filter((a) => a > 0)
    if (amounts.length > 0) {
      result.totalAmount = Math.max(...amounts)
    }
  }

  // 2. Extract merchant name - usually the first 1-3 non-empty lines
  const merchantCandidates: string[] = []
  for (const line of lines.slice(0, 5)) {
    // Skip lines that are mostly numbers, dates, or common non-merchant text
    if (/^\d+$/.test(line)) continue
    if (/^(TAX|GST|SST|INVOICE|RECEIPT|DATE|TIME|BILL|NO[.:])/i.test(line)) continue
    if (/\d{2}[\/\-]\d{2}[\/\-]\d{2,4}/.test(line)) continue
    if (line.length < 3) continue
    merchantCandidates.push(line)
    if (merchantCandidates.length >= 2) break
  }
  if (merchantCandidates.length > 0) {
    result.merchant = merchantCandidates[0]
  }

  // 3. Extract date
  const datePatterns = [
    /(\d{2}[\/\-]\d{2}[\/\-]\d{4})/,
    /(\d{2}[\/\-]\d{2}[\/\-]\d{2})/,
    /(\d{2}\s+(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+\d{2,4})/i,
    /(\d{4}[\/\-]\d{2}[\/\-]\d{2})/,
  ]

  for (const pattern of datePatterns) {
    const match = rawText.match(pattern)
    if (match) {
      result.date = normalizeDate(match[1])
      break
    }
  }

  // 4. Extract line items (amount at end of line)
  const items: { name: string; amount: number }[] = []
  for (const line of lines) {
    const itemMatch = line.match(/^(.{3,}?)\s+(\d{1,3}(?:,\d{3})*\.\d{2})\s*$/)
    if (itemMatch) {
      const name = itemMatch[1].trim()
      const amount = parseFloat(itemMatch[2].replace(/,/g, ''))
      // Skip if it looks like a total/subtotal line
      if (!/TOTAL|SUBTOTAL|TAX|GST|SST|CHANGE|CASH|CARD|ROUNDING|JUMLAH/i.test(name) && amount > 0) {
        items.push({ name, amount })
      }
    }
  }
  if (items.length > 0) result.items = items

  return result
}

function normalizeDate(dateStr: string): string {
  const months: Record<string, string> = {
    JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
    JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
  }

  // DD MMM YYYY
  let m = dateStr.match(/(\d{2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+(\d{2,4})/i)
  if (m) {
    const y = m[3].length === 2 ? `20${m[3]}` : m[3]
    return `${y}-${months[m[2].toUpperCase()]}-${m[1]}`
  }

  // YYYY-MM-DD
  m = dateStr.match(/(\d{4})[\/\-](\d{2})[\/\-](\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`

  // DD/MM/YYYY
  m = dateStr.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`

  // DD/MM/YY
  m = dateStr.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{2})/)
  if (m) return `20${m[3]}-${m[2]}-${m[1]}`

  return dateStr
}
