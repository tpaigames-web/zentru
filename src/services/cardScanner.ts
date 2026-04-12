import { createWorker } from 'tesseract.js'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'

export interface ScannedCardData {
  cardNumber?: string
  lastFourDigits?: string
  bank?: string
  expiryDate?: string
  cardholderName?: string
  rawText: string
}

import { ALL_BANKS } from '@/config/banks'

/**
 * Take a photo using the device camera or select from gallery.
 * Returns base64 image data.
 */
export async function captureCardImage(source: 'camera' | 'gallery' = 'camera'): Promise<string> {
  const photo = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.Base64,
    source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
    width: 1200,
    correctOrientation: true,
  })

  if (!photo.base64String) throw new Error('No image captured')
  return `data:image/${photo.format};base64,${photo.base64String}`
}

/**
 * Run OCR on a card image and extract card details.
 */
export async function scanCardImage(imageData: string): Promise<ScannedCardData> {
  const worker = await createWorker('eng')

  const { data } = await worker.recognize(imageData)
  await worker.terminate()

  const rawText = data.text
  return parseCardText(rawText)
}

/**
 * Also support file input for web/browser testing.
 */
export async function scanCardFromFile(file: File): Promise<ScannedCardData> {
  const worker = await createWorker('eng')

  const { data } = await worker.recognize(file)
  await worker.terminate()

  return parseCardText(data.text)
}

function parseCardText(rawText: string): ScannedCardData {
  const result: ScannedCardData = { rawText }

  // Extract card number (4 groups of 4 digits, possibly with spaces/dashes)
  const cardNumberMatch = rawText.match(
    /\b(\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4})\b/,
  )
  if (cardNumberMatch) {
    result.cardNumber = cardNumberMatch[1].replace(/[\s\-]/g, '')
    result.lastFourDigits = result.cardNumber.slice(-4)
  }

  // Extract expiry date (MM/YY or MM/YYYY)
  const expiryMatch = rawText.match(
    /(?:VALID\s*(?:THRU|THROUGH)|EXP(?:IRY)?|GOOD\s*THRU)[\s:]*(\d{2}\s*\/\s*\d{2,4})/i,
  )
  if (expiryMatch) {
    result.expiryDate = expiryMatch[1].replace(/\s/g, '')
  } else {
    // Fallback: look for MM/YY pattern
    const dateMatch = rawText.match(/\b(\d{2}\/\d{2})\b/)
    if (dateMatch) {
      const [mm] = dateMatch[1].split('/')
      const month = parseInt(mm)
      if (month >= 1 && month <= 12) {
        result.expiryDate = dateMatch[1]
      }
    }
  }

  // Detect bank name
  for (const bank of ALL_BANKS) {
    if (bank.pdfKeywords.test(rawText)) {
      result.bank = bank.name
      break
    }
  }

  // Extract cardholder name (usually uppercase letters on a line by itself near the bottom)
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean)
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]
    // Name is usually all caps, 2+ words, no digits
    if (/^[A-Z\s]{5,40}$/.test(line) && /\s/.test(line) && !/\d/.test(line)) {
      // Skip common non-name lines
      if (!/VISA|MASTER|CARD|BANK|VALID|THRU|DEBIT|CREDIT|PLATINUM|GOLD|CLASSIC/i.test(line)) {
        result.cardholderName = line
        break
      }
    }
  }

  return result
}
