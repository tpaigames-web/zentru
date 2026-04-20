import { supabase } from '@/lib/supabase'
import type { ScannedReceiptData } from './receiptScanner'

/**
 * Thrown when the server-side monthly quota is exhausted.
 * Callers should handle this by falling back to local Tesseract OCR.
 */
export class AIQuotaExceededError extends Error {
  remaining: number
  limit: number
  constructor(remaining: number, limit: number) {
    super(`AI scan quota exceeded (${remaining}/${limit})`)
    this.name = 'AIQuotaExceededError'
    this.remaining = remaining
    this.limit = limit
  }
}

/**
 * Read-only remaining quota check (does NOT consume).
 * Returns { remaining, limit, used }. admin roles return 99999.
 */
export async function getAiScanRemaining(): Promise<{
  remaining: number
  limit: number
  used: number
} | null> {
  const { data, error } = await supabase.rpc('get_ai_scan_remaining')
  if (error) {
    console.warn('get_ai_scan_remaining failed:', error)
    return null
  }
  const row = Array.isArray(data) ? data[0] : data
  if (!row) return null
  return {
    remaining: Number(row.remaining ?? 0),
    limit: Number(row.limit_value ?? 0),
    used: Number(row.used ?? 0),
  }
}

/**
 * Downscale a large image File to max MAX_EDGE px on the longest side,
 * then re-encode as JPEG at 0.85 quality. Dramatically cuts upload time
 * and Gemini processing time.
 *
 * Most phone receipt photos are 3000-4000 px wide (~4MB); we bring them
 * down to 1600 px (~300-500 KB) with no meaningful quality loss for OCR.
 */
async function resizeImage(file: File): Promise<{ base64: string; mimeType: string }> {
  const MAX_EDGE = 1600
  const QUALITY = 0.85

  // Read as image
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const el = new Image()
    el.onload = () => {
      URL.revokeObjectURL(url)
      resolve(el)
    }
    el.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image decode failed'))
    }
    el.src = url
  })

  // Compute target dims preserving aspect ratio
  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height))
  const w = Math.round(img.width * scale)
  const h = Math.round(img.height * scale)

  // Draw on canvas
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.drawImage(img, 0, 0, w, h)

  // Encode as JPEG
  const dataUrl = canvas.toDataURL('image/jpeg', QUALITY)
  const match = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/)
  if (!match) throw new Error('Canvas export failed')
  return { mimeType: match[1], base64: match[2] }
}

/**
 * Convert a File or base64 data URL to raw base64 + mimeType.
 * Files are auto-downsized to ≤1600px for fast upload.
 */
async function toBase64(input: File | string): Promise<{ base64: string; mimeType: string }> {
  if (typeof input === 'string') {
    const match = input.match(/^data:(image\/[^;]+);base64,(.+)$/)
    if (!match) throw new Error('Expected data URL format: data:image/...;base64,...')
    return { mimeType: match[1], base64: match[2] }
  }
  // Only resize images; fall back to raw read if canvas fails
  if (input.type.startsWith('image/')) {
    try {
      return await resizeImage(input)
    } catch (e) {
      console.warn('Image resize failed, sending original:', e)
    }
  }
  return await new Promise<{ base64: string; mimeType: string }>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const str = String(reader.result || '')
      const comma = str.indexOf(',')
      if (comma < 0) return reject(new Error('FileReader returned no base64'))
      resolve({ base64: str.slice(comma + 1), mimeType: input.type || 'image/jpeg' })
    }
    reader.onerror = () => reject(reader.error || new Error('read failed'))
    reader.readAsDataURL(input)
  })
}

/**
 * Scan a receipt image using the Supabase Edge Function (Gemini 1.5 Flash).
 * Consumes one AI scan from the user's monthly quota.
 *
 * @throws AIQuotaExceededError if the user is out of AI scans this month
 * @throws Error for auth / network / provider problems
 */
export async function scanReceiptWithAI(
  input: File | string,
): Promise<ScannedReceiptData & { remaining: number; limit: number }> {
  const { base64, mimeType } = await toBase64(input)

  const { data, error } = await supabase.functions.invoke<{
    data?: ScannedReceiptData
    remaining?: number
    limit?: number
    error?: string
  }>('scan-receipt', {
    body: { imageBase64: base64, mimeType },
  })

  if (error) {
    // Supabase wraps HTTP errors in FunctionsHttpError; the body may contain
    // our quota_exceeded payload we need to surface specifically.
    type FnErr = Error & {
      context?: { json?: () => Promise<unknown> }
      status?: number
    }
    const errAny = error as FnErr
    if (errAny.context?.json) {
      try {
        const body = (await errAny.context.json()) as {
          error?: string
          remaining?: number
          limit?: number
        }
        if (body?.error === 'quota_exceeded') {
          throw new AIQuotaExceededError(body.remaining ?? 0, body.limit ?? 0)
        }
        throw new Error(`AI scan failed: ${body?.error || error.message}`)
      } catch (parseErr) {
        if (parseErr instanceof AIQuotaExceededError) throw parseErr
        // fallthrough to generic
      }
    }
    throw new Error(`AI scan failed: ${error.message}`)
  }

  if (!data?.data) {
    throw new Error('AI scan returned empty response')
  }

  return {
    ...data.data,
    remaining: Number(data.remaining ?? 0),
    limit: Number(data.limit ?? 0),
  }
}
