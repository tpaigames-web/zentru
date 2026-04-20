// Supabase Edge Function: scan-receipt
// Deploy:  npx supabase functions deploy scan-receipt --project-ref <your-ref>
// Secrets: GEMINI_API_KEY must be set in Supabase Dashboard → Edge Functions → Secrets
//
// Accepts:  { imageBase64: string, mimeType: string }   (JWT required)
// Returns:  { data: ScannedReceiptData, remaining: number, limit: number }
// Or on quota: 402  { error: 'quota_exceeded', remaining: 0, limit: N }

// @ts-expect-error — Deno std import works at runtime on Supabase
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
// @ts-expect-error — remote ESM import works at runtime on Supabase
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

// Tell TS about Deno global (no types available locally)
declare const Deno: { env: { get: (key: string) => string | undefined } }

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// gemini-1.5-flash was retired in 2025. Use the current stable flash model.
// `gemini-flash-latest` auto-tracks the newest Flash release.
// If you want to pin a specific version, swap to `gemini-2.0-flash`.
const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent'

const EXTRACTION_PROMPT = `You are a Malaysian receipt and e-invoice OCR expert.
Extract structured data from the attached receipt image.
Return ONLY this exact JSON shape (no prose, no markdown fences):
{
  "totalAmount": number,
  "merchant": string,
  "date": "YYYY-MM-DD",
  "items": [{ "name": string, "amount": number }],
  "invoiceNo": string | null,
  "tin": string | null,
  "taxAmount": number | null
}
Rules:
- totalAmount is the final amount the customer paid in MYR (look for GRAND TOTAL / TOTAL / JUMLAH).
- merchant is the business / shop name (top of receipt).
- date MUST be ISO YYYY-MM-DD. If the receipt shows DD/MM/YYYY convert it.
- items = line items with amounts; skip tax/rounding/subtotal lines.
- tin = Malaysia Tax Identification Number (e-Invoice). null if absent.
- taxAmount = SST or GST value as a number. null if absent.
- Support Malay, Chinese, and English text.
- If any field is genuinely unreadable, use null (or omit from items).`

interface ScannedReceiptData {
  totalAmount?: number
  merchant?: string
  date?: string
  items?: { name: string; amount: number }[]
  rawText?: string
  invoiceNo?: string
  tin?: string
  taxAmount?: number
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405)
  }

  const authHeader = req.headers.get('Authorization') || ''
  console.log('[scan-receipt] auth header present:', authHeader.slice(0, 20) + '...')

  if (!authHeader.startsWith('Bearer ')) {
    console.warn('[scan-receipt] no Bearer token — rejecting')
    return jsonResponse({ error: 'unauthorized', reason: 'missing_bearer' }, 401)
  }
  const jwt = authHeader.slice('Bearer '.length).trim()

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('[scan-receipt] missing SUPABASE_URL/ANON_KEY env')
    return jsonResponse({ error: 'server_misconfigured_supabase' }, 500)
  }
  if (!GEMINI_API_KEY) {
    console.error('[scan-receipt] missing GEMINI_API_KEY env')
    return jsonResponse({ error: 'server_misconfigured_gemini' }, 500)
  }

  // Verify JWT with explicit token (most reliable pattern in Edge Functions)
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData, error: userErr } = await supabase.auth.getUser(jwt)

  if (userErr || !userData?.user) {
    console.warn('[scan-receipt] getUser failed:', userErr?.message || 'no user')
    return jsonResponse(
      { error: 'unauthorized', reason: userErr?.message || 'no_user', jwtPreview: jwt.slice(0, 30) + '...' },
      401,
    )
  }
  console.log('[scan-receipt] authed user:', userData.user.id, userData.user.email)

  // Parse body
  let body: { imageBase64?: string; mimeType?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400)
  }
  const { imageBase64, mimeType } = body
  if (!imageBase64 || !mimeType) {
    return jsonResponse({ error: 'missing_image_fields' }, 400)
  }
  if (!mimeType.startsWith('image/')) {
    return jsonResponse({ error: 'only_images_supported' }, 400)
  }
  // Rough size guard (~ 8 MB binary)
  if (imageBase64.length > 12_000_000) {
    return jsonResponse({ error: 'image_too_large' }, 413)
  }

  // Consume quota BEFORE spending money on Gemini call
  const { data: quotaRows, error: quotaErr } = await supabase.rpc('consume_ai_scan_quota')
  if (quotaErr) {
    console.error('quota rpc error:', quotaErr)
    return jsonResponse({ error: 'quota_check_failed', detail: quotaErr.message }, 500)
  }
  const quota = Array.isArray(quotaRows) ? quotaRows[0] : quotaRows
  if (!quota || quota.allowed === false) {
    return jsonResponse(
      { error: 'quota_exceeded', remaining: 0, limit: quota?.limit_value ?? 3 },
      402,
    )
  }

  // Strip data URL prefix if the client included it
  const base64Body = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64

  // Call Gemini
  let geminiResult: unknown
  try {
    const resp = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: EXTRACTION_PROMPT },
              { inline_data: { mime_type: mimeType, data: base64Body } },
            ],
          },
        ],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.1,
          maxOutputTokens: 1024,
        },
      }),
    })

    if (!resp.ok) {
      const errText = await resp.text()
      console.error('gemini error:', resp.status, errText)
      // Don't refund the quota on upstream error — next attempt would double-charge
      // Instead log and return a generic error. Admin can manually grant scans if needed.
      return jsonResponse({ error: 'ai_provider_error', status: resp.status }, 502)
    }
    geminiResult = await resp.json()
  } catch (e) {
    console.error('gemini fetch failed:', e)
    return jsonResponse({ error: 'ai_fetch_failed' }, 502)
  }

  // Extract model text (should be JSON string per response_mime_type)
  let structured: ScannedReceiptData = {}
  try {
    // Gemini shape: { candidates: [ { content: { parts: [ { text: "..." } ] } } ] }
    const rawText =
      (geminiResult as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
      })?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const cleaned = rawText.trim().replace(/^```json\s*|\s*```$/g, '')
    const parsed = JSON.parse(cleaned) as Record<string, unknown>

    structured = {
      totalAmount: typeof parsed.totalAmount === 'number' ? parsed.totalAmount : undefined,
      merchant: typeof parsed.merchant === 'string' ? parsed.merchant : undefined,
      date: typeof parsed.date === 'string' ? parsed.date : undefined,
      items: Array.isArray(parsed.items)
        ? (parsed.items as Array<Record<string, unknown>>)
            .filter(
              (it) =>
                typeof it?.name === 'string' &&
                typeof it?.amount === 'number' &&
                it.amount > 0,
            )
            .map((it) => ({ name: String(it.name), amount: Number(it.amount) }))
        : undefined,
      invoiceNo: typeof parsed.invoiceNo === 'string' ? parsed.invoiceNo : undefined,
      tin: typeof parsed.tin === 'string' ? parsed.tin : undefined,
      taxAmount: typeof parsed.taxAmount === 'number' ? parsed.taxAmount : undefined,
      rawText: cleaned,
    }
  } catch (e) {
    console.error('parse gemini json failed:', e)
    return jsonResponse({ error: 'ai_response_parse_failed' }, 502)
  }

  return jsonResponse({
    data: structured,
    remaining: Number(quota.remaining ?? 0),
    limit: Number(quota.limit_value ?? 0),
  })
})
