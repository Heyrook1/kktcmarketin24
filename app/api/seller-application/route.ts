import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Redis } from '@upstash/redis'

// Edge runtime — runs at the CDN edge for IP-accurate rate limiting
export const runtime = 'edge'

const GENERIC_OK = { ok: true, message: 'Başvurunuz alındı. En kısa sürede sizinle iletişime geçeceğiz.' }
const RATE_LIMIT = 3       // max submissions per window
const WINDOW_SEC = 3600    // 1 hour

const redis = Redis.fromEnv()

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ── Turnstile verification ──────────────────────────────────────────────────
async function verifyTurnstile(token: string, ip: string): Promise<{ ok: boolean; errorCodes?: string[] }> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    // No key configured — allow in dev, block in production
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, errorCodes: ['missing-secret'] }
    }
    return { ok: true }
  }

  const body = new URLSearchParams({
    secret,
    response: token,
    remoteip: ip,
  })

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

  if (!res.ok) return { ok: false, errorCodes: ['cf-unreachable'] }

  const data = await res.json() as { success: boolean; 'error-codes': string[] }
  return { ok: data.success, errorCodes: data['error-codes'] }
}

// ── Rate limiter (Redis sliding window) ────────────────────────────────────
async function checkRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  const key = `rl:contact:${ip}`
  const now = Date.now()
  const windowStart = now - WINDOW_SEC * 1000

  // Remove old entries outside the window, then count + add current
  const pipeline = redis.pipeline()
  pipeline.zremrangebyscore(key, 0, windowStart)
  pipeline.zcard(key)
  pipeline.zadd(key, { score: now, member: `${now}` })
  pipeline.expire(key, WINDOW_SEC)

  const results = await pipeline.exec() as [unknown, number, unknown, unknown]
  const count = results[1] ?? 0
  const remaining = Math.max(0, RATE_LIMIT - (count as number))

  return { allowed: (count as number) < RATE_LIMIT, remaining }
}

// ── Route handler ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '0.0.0.0'

  const userAgent = req.headers.get('user-agent') ?? ''

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    // Return generic OK — never reveal why a submission failed
    return NextResponse.json(GENERIC_OK)
  }

  const {
    fullName, email, phone, storeName, category, city, description,
    turnstileToken,
  } = body as {
    fullName?: string; email?: string; phone?: string; storeName?: string;
    category?: string; city?: string; description?: string; turnstileToken?: string
  }

  // ── 1. Rate limit check ─────────────────────────────────────────────────
  const { allowed } = await checkRateLimit(ip)

  // ── 2. Turnstile check (run in parallel with rate limit for speed) ──────
  const turnstileOk = allowed
    ? (await verifyTurnstile(turnstileToken ?? '', ip)).ok
    : false

  // ── 3. Queue to DB regardless of outcome (with flags) ──────────────────
  // We log EVERYTHING — valid, rate-limited, bot — to detect patterns.
  const admin = adminClient()
  await admin.from('form_submissions').insert({
    form_type:      'seller_application',
    status:         !allowed ? 'rate_limited' : !turnstileOk ? 'bot_suspected' : 'pending',
    applicant_name: String(fullName ?? '').slice(0, 255),
    applicant_email: String(email ?? '').slice(0, 255),
    applicant_phone: String(phone ?? '').slice(0, 50),
    store_name:     String(storeName ?? '').slice(0, 255),
    raw_payload: {
      category:    String(category ?? '').slice(0, 100),
      city:        String(city ?? '').slice(0, 100),
      description: String(description ?? '').slice(0, 500),
    },
    ip_address:     ip,
    user_agent:     userAgent.slice(0, 512),
    turnstile_ok:   turnstileOk,
  })

  // ── 4. Always return identical generic success response ─────────────────
  // Never reveal rate-limit state, bot detection, or validation errors —
  // this prevents enumeration and timing-based probing.
  return NextResponse.json(GENERIC_OK)
}
