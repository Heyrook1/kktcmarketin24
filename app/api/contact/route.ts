import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Redis } from '@upstash/redis'

export const runtime = 'edge'

const GENERIC_OK = { ok: true, message: 'Mesajınız alındı. En kısa sürede size dönüş yapacağız.' }
const RATE_LIMIT = 3
const WINDOW_SEC = 3600

const redis = Redis.fromEnv()

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return process.env.NODE_ENV !== 'production'

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  if (!res.ok) return false
  const data = await res.json() as { success: boolean }
  return data.success
}

async function checkRateLimit(ip: string): Promise<boolean> {
  const key = `rl:contact:${ip}`
  const now = Date.now()
  const windowStart = now - WINDOW_SEC * 1000
  const pipeline = redis.pipeline()
  pipeline.zremrangebyscore(key, 0, windowStart)
  pipeline.zcard(key)
  pipeline.zadd(key, { score: now, member: `${now}` })
  pipeline.expire(key, WINDOW_SEC)
  const results = await pipeline.exec() as [unknown, number, unknown, unknown]
  const count = results[1] ?? 0
  return (count as number) < RATE_LIMIT
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '0.0.0.0'
  const userAgent = req.headers.get('user-agent') ?? ''

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json(GENERIC_OK) }

  const { fullName, email, subject, message, turnstileToken } = body as {
    fullName?: string; email?: string; subject?: string; message?: string; turnstileToken?: string
  }

  const [allowed, turnstileOk] = await Promise.all([
    checkRateLimit(ip),
    (async () => {
      const allowed = await checkRateLimit(ip)
      return allowed ? verifyTurnstile(turnstileToken ?? '', ip) : false
    })(),
  ])

  const admin = adminClient()
  await admin.from('form_submissions').insert({
    form_type:   'contact',
    status:      !allowed ? 'spam' : !turnstileOk ? 'spam' : 'pending',
    full_name:   String(fullName ?? '').slice(0, 255),
    email:       String(email ?? '').slice(0, 255),
    description: String(message ?? '').slice(0, 2000),
    payload: {
      subject:      String(subject ?? '').slice(0, 255),
      rate_limited: !allowed,
      turnstile_ok: turnstileOk,
    },
    ip_address:  ip,
    user_agent:  userAgent.slice(0, 512),
    turnstile_ok: turnstileOk,
  })

  return NextResponse.json(GENERIC_OK)
}
