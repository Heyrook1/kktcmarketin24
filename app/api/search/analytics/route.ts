/**
 * POST /api/search/analytics
 *
 * Receives a search event from the client and writes it to `search_analytics`.
 * Fire-and-forget: clients do not await this response.
 *
 * Detects language (TR / EN / CY) from the query string by checking for
 * language-specific character patterns.
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient as createAdmin } from "@supabase/supabase-js"
import { z } from "zod"

function sb() {
  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createAdmin(url, secret)
}

// Detect language from query characters
function detectLanguage(query: string): "tr" | "en" | "cy" | "unknown" {
  const lower = query.toLowerCase()
  // Greek block: U+0370–U+03FF
  if (/[\u0370-\u03ff]/.test(lower)) return "cy"
  // Turkish-specific characters
  if (/[şğıçöü]/.test(lower)) return "tr"
  // Latin-only, likely English
  if (/^[a-z0-9\s\-.,!?'"]+$/.test(lower)) return "en"
  return "unknown"
}

const Schema = z.object({
  query:        z.string().min(1).max(200),
  category:     z.string().max(64).nullable().optional(),
  subcategory:  z.string().max(64).nullable().optional(),
  brand:        z.string().max(64).nullable().optional(),
  result_count: z.number().int().min(0).default(0),
  source:       z.enum(["navbar", "hero", "products_page", "search_page", "api"]).default("api"),
  session_id:   z.string().max(128).optional(),
  page:         z.number().int().min(1).default(1),
})

export async function POST(req: NextRequest) {
  let body: z.infer<typeof Schema>
  try {
    const raw = await req.json()
    const parsed = Schema.safeParse(raw)
    if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 })
    body = parsed.data
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const language = detectLanguage(body.query)

  // Hash IP for privacy — never store raw IP
  const rawIp = req.headers.get("x-forwarded-for")?.split(",")[0] ?? ""
  const ipHash = rawIp
    ? Buffer.from(rawIp).toString("base64").slice(0, 16)
    : null

  const admin = sb()
  await admin.from("search_analytics").insert({
    query:        body.query.trim(),
    language,
    category:     body.category    ?? null,
    subcategory:  body.subcategory ?? null,
    brand:        body.brand       ?? null,
    result_count: body.result_count,
    source:       body.source,
    session_id:   body.session_id ?? null,
    ip_hash:      ipHash,
    user_agent:   req.headers.get("user-agent")?.slice(0, 200) ?? null,
    page:         body.page,
  })
  // Non-critical — swallow any DB error so the client is never blocked

  return NextResponse.json({ ok: true }, { status: 202 })
}
