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
 * Convert a File or base64 data URL to raw base64 + mimeType.
 */
async function toBase64(input: File | string): Promise<{ base64: string; mimeType: string }> {
  if (typeof input === 'string') {
    // Assume it's already a data URL like "data:image/jpeg;base64,XXXX"
    const match = input.match(/^data:(image\/[^;]+);base64,(.+)$/)
    if (!match) {
      throw new Error('Expected data URL format: data:image/...;base64,...')
    }
    return { mimeType: match[1], base64: match[2] }
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
