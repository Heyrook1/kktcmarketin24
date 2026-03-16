/**
 * lib/otp.ts
 *
 * SMS OTP lifecycle management backed by Redis + Supabase.
 *
 * Key schema in Redis:
 *   otp:{orderId}          → { code, phone, attempts }  TTL = OTP_TTL_SECONDS
 *   otp:rate:{phone}       → request count              TTL = 10 minutes
 *
 * Flow:
 *   createOtp()  → generates 6-digit code, writes Redis key, writes sms_otps row
 *   verifyOtp()  → checks code + attempts, marks order otp_verified_at
 *   expireStaleOrders() → called by cron worker to cancel awaiting_otp orders > 15 min
 */

import { redis } from '@/lib/redis'
import { createClient } from '@supabase/supabase-js'

const OTP_TTL_SECONDS   = 15 * 60   // 15 minutes
const RATE_TTL_SECONDS  = 10 * 60   // 10-minute rate-limit window
const MAX_OTP_ATTEMPTS  = 5
const MAX_OTP_RATE      = 3         // max sends per phone per 10 min
const NO_SHOW_THRESHOLD = 2         // flag account after this many no-shows

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function sixDigit(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

// ── Send OTP ──────────────────────────────────────────────────────────────────

export interface OtpSendResult {
  ok: boolean
  error?: string
  /** For demo/dev environments — remove in production with real SMS provider */
  devCode?: string
}

export async function createOtp(
  orderId: string,
  phone: string,
  userId: string
): Promise<OtpSendResult> {
  const supabase = sb()

  // 1. Rate limiting — max MAX_OTP_RATE sends per phone per 10 min
  const rateKey = `otp:rate:${phone}`
  const count = await redis.incr(rateKey)
  if (count === 1) await redis.expire(rateKey, RATE_TTL_SECONDS)
  if (count > MAX_OTP_RATE) {
    return { ok: false, error: 'Çok fazla OTP talebi. Lütfen 10 dakika bekleyin.' }
  }

  // 2. Generate code + write to Redis
  const code = sixDigit()
  const otpKey = `otp:${orderId}`
  await redis.set(otpKey, JSON.stringify({ code, phone, attempts: 0 }), { ex: OTP_TTL_SECONDS })

  // 3. Write audit row to sms_otps
  await supabase.from('sms_otps').insert({
    order_id: orderId,
    user_id: userId,
    phone,
    expires_at: new Date(Date.now() + OTP_TTL_SECONDS * 1000).toISOString(),
  })

  // 4. Log phone
  await supabase.from('phone_logs').insert({
    user_id: userId,
    phone,
    event: 'otp_sent',
    order_id: orderId,
  })

  // 5. Send SMS — swap this block for a real SMS provider (Twilio, Vonage, etc.)
  const isDev = process.env.NODE_ENV !== 'production'
  if (!isDev) {
    // await sendSmsViaTwilio(phone, `KKTC Market doğrulama kodunuz: ${code}`)
  }

  return { ok: true, devCode: isDev ? code : undefined }
}

// ── Verify OTP ────────────────────────────────────────────────────────────────

export interface OtpVerifyResult {
  ok: boolean
  error?: string
}

export async function verifyOtp(
  orderId: string,
  submittedCode: string,
  userId: string
): Promise<OtpVerifyResult> {
  const supabase = sb()
  const otpKey = `otp:${orderId}`

  const raw = await redis.get<string>(otpKey)
  if (!raw) {
    return { ok: false, error: 'OTP süresi doldu veya bulunamadı. Lütfen tekrar sipariş verin.' }
  }

  const record = typeof raw === 'string' ? JSON.parse(raw) : raw as { code: string; phone: string; attempts: number }

  // Increment attempt count first (prevent timing attacks)
  record.attempts += 1
  if (record.attempts > MAX_OTP_ATTEMPTS) {
    await redis.del(otpKey)
    await supabase.from('sms_otps')
      .update({ status: 'max_attempts' })
      .eq('order_id', orderId)
    return { ok: false, error: 'Maksimum deneme sayısına ulaşıldı. Sipariş iptal edildi.' }
  }
  // Write back updated attempt count
  const ttl = await redis.ttl(otpKey)
  await redis.set(otpKey, JSON.stringify(record), { ex: Math.max(ttl, 1) })

  if (record.code !== submittedCode.trim()) {
    return { ok: false, error: `Yanlış kod. ${MAX_OTP_ATTEMPTS - record.attempts} deneme hakkınız kaldı.` }
  }

  // Correct code — mark verified
  await redis.del(otpKey)
  const now = new Date().toISOString()

  // Mark order verified + promote sub-orders to 'confirmed'
  await supabase.from('orders')
    .update({ otp_verified_at: now, saga_status: 'completed' })
    .eq('id', orderId)

  await supabase.from('order_vendor_sub_orders')
    .update({ step_status: 'confirmed' })
    .eq('order_id', orderId)
    .eq('step_status', 'stock_reserved')

  await supabase.from('sms_otps')
    .update({ status: 'verified', verified_at: now })
    .eq('order_id', orderId)

  await supabase.from('phone_logs').insert({
    user_id: userId,
    phone: record.phone,
    event: 'otp_verified',
    order_id: orderId,
  })

  return { ok: true }
}

// ── Auto-cancel stale awaiting_otp orders (called by cron worker) ─────────────

export async function expireStaleOrders(): Promise<{ cancelled: string[] }> {
  const supabase = sb()
  const cutoff = new Date(Date.now() - OTP_TTL_SECONDS * 1000).toISOString()

  const { data: stale } = await supabase
    .from('orders')
    .select('id, customer_id')
    .eq('saga_status', 'awaiting_otp')
    .lt('created_at', cutoff)

  if (!stale?.length) return { cancelled: [] }

  const cancelled: string[] = []

  for (const order of stale) {
    // Restore stock for each sub-order
    const { data: subOrders } = await supabase
      .from('order_vendor_sub_orders')
      .select('id')
      .eq('order_id', order.id)

    if (subOrders?.length) {
      const subIds = subOrders.map((s) => s.id)

      const { data: items } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .in('sub_order_id', subIds)

      if (items?.length) {
        for (const item of items) {
          await supabase.rpc('restore_stock', {
            p_product_id: item.product_id,
            p_quantity: item.quantity,
          })
        }
      }

      await supabase.from('order_vendor_sub_orders')
        .update({ step_status: 'cancelled' })
        .in('id', subIds)
    }

    await supabase.from('orders')
      .update({ saga_status: 'failed' })
      .eq('id', order.id)

    // Increment no-show counter on profile
    await recordNoShow(order.customer_id, order.id)

    cancelled.push(order.id)
  }

  return { cancelled }
}

// ── No-show tracking ──────────────────────────────────────────────────────────

export async function recordNoShow(userId: string, orderId: string): Promise<void> {
  const supabase = sb()

  const { data: profile } = await supabase
    .from('profiles')
    .select('no_show_count, flagged_at')
    .eq('id', userId)
    .maybeSingle()

  if (!profile) return

  const newCount = (profile.no_show_count ?? 0) + 1
  const shouldFlag = newCount >= NO_SHOW_THRESHOLD && !profile.flagged_at

  await supabase.from('profiles').update({
    no_show_count: newCount,
    ...(shouldFlag ? { flagged_at: new Date().toISOString() } : {}),
  }).eq('id', userId)

  await supabase.from('phone_logs').insert({
    user_id: userId,
    phone: null,
    event: shouldFlag ? 'account_flagged' : 'no_show_recorded',
    order_id: orderId,
  })
}
