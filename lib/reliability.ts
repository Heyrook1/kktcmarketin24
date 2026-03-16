/**
 * lib/reliability.ts
 *
 * Customer reliability scoring — records delivery events, computes scores,
 * enforces secondary-verification gate after 3 failed deliveries.
 *
 * Score formula (0–100):
 *   Start 100 − (door_refused × 20) − (cancelled_after_dispatch × 15) − (no_show_count × 10)
 *
 * Tiers: excellent ≥ 80 | good 60–79 | fair 40–59 | poor < 40
 *
 * Secondary verification is required when failed_delivery_count ≥ FAILED_DELIVERY_THRESHOLD.
 * "Failed delivery" = door_refused OR cancelled_after_dispatch.
 */

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const FAILED_DELIVERY_THRESHOLD = 3

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type DeliveryEventType =
  | 'confirmed'
  | 'delivered'
  | 'cancelled_after_dispatch'
  | 'door_refused'

export interface ReliabilityScore {
  customerId: string
  fullName: string | null
  phone: string | null
  score: number
  tier: 'excellent' | 'good' | 'fair' | 'poor'
  confirmedOrders: number
  successfulDeliveries: number
  doorRefusals: number
  cancellationsAfterDispatch: number
  noShowCount: number
  totalOrders: number
  failedDeliveryCount: number
  flaggedAt: string | null
  secondaryVerificationRequired: boolean
}

// ── Record a delivery event ────────────────────────────────────────────────────

export async function recordDeliveryEvent(
  orderId: string,
  storeId: string,
  customerId: string,
  eventType: DeliveryEventType,
  recordedBy: string,
  notes?: string
): Promise<{ ok: boolean; error?: string; score?: ReliabilityScore }> {
  const supabase = sb()

  // Upsert prevents duplicate event types per order per store (DB unique index)
  const { error: insertError } = await supabase
    .from('delivery_events')
    .upsert(
      { order_id: orderId, store_id: storeId, customer_id: customerId, event_type: eventType, notes, recorded_by: recordedBy },
      { onConflict: 'order_id,store_id,event_type' }
    )

  if (insertError) {
    return { ok: false, error: insertError.message }
  }

  // Update failed_delivery_count on profile for door_refused / cancelled_after_dispatch
  const isFailed = eventType === 'door_refused' || eventType === 'cancelled_after_dispatch'
  if (isFailed) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('failed_delivery_count, secondary_verification_required')
      .eq('id', customerId)
      .maybeSingle()

    const newCount = (profile?.failed_delivery_count ?? 0) + 1
    const requiresVerify = newCount >= FAILED_DELIVERY_THRESHOLD

    await supabase.from('profiles').update({
      failed_delivery_count: newCount,
      ...(requiresVerify && !profile?.secondary_verification_required
        ? { secondary_verification_required: true }
        : {}),
    }).eq('id', customerId)

    // If crossing threshold — insert a secondary_verifications request
    if (requiresVerify && !profile?.secondary_verification_required) {
      const token = crypto.randomBytes(32).toString('hex')
      await supabase.from('secondary_verifications').insert({
        user_id: customerId,
        method: 'email_link',
        token_hash: crypto.createHash('sha256').update(token).digest('hex'),
        expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 72h
      })
    }
  }

  const score = await getReliabilityScore(customerId)
  return { ok: true, score: score ?? undefined }
}

// ── Get score for a customer ───────────────────────────────────────────────────

export async function getReliabilityScore(customerId: string): Promise<ReliabilityScore | null> {
  const supabase = sb()
  const { data, error } = await supabase
    .from('customer_reliability_scores')
    .select('*')
    .eq('customer_id', customerId)
    .maybeSingle()

  if (error || !data) return null

  return {
    customerId:                    data.customer_id,
    fullName:                      data.full_name,
    phone:                         data.phone,
    score:                         Number(data.score),
    tier:                          data.tier as ReliabilityScore['tier'],
    confirmedOrders:               Number(data.confirmed_orders),
    successfulDeliveries:          Number(data.successful_deliveries),
    doorRefusals:                  Number(data.door_refusals),
    cancellationsAfterDispatch:    Number(data.cancellations_after_dispatch),
    noShowCount:                   Number(data.no_show_count),
    totalOrders:                   Number(data.total_orders),
    failedDeliveryCount:           Number(data.failed_delivery_count),
    flaggedAt:                     data.flagged_at,
    secondaryVerificationRequired: Boolean(data.secondary_verification_required),
  }
}

// ── Complete secondary verification (admin/manual) ────────────────────────────

export async function approveSecondaryVerification(userId: string, reviewedBy: string): Promise<void> {
  const supabase = sb()
  const now = new Date().toISOString()

  await supabase.from('secondary_verifications')
    .update({ verified_at: now, reviewed_by: reviewedBy })
    .eq('user_id', userId)
    .is('verified_at', null)

  await supabase.from('profiles').update({
    secondary_verification_required: false,
    failed_delivery_count: 0,
  }).eq('id', userId)
}

// ── Check if customer is blocked at checkout ──────────────────────────────────

export interface CheckoutGateResult {
  allowed: boolean
  reason?: 'flagged' | 'secondary_verification_required'
  message?: string
}

export async function checkCheckoutGate(customerId: string): Promise<CheckoutGateResult> {
  const supabase = sb()
  const { data: profile } = await supabase
    .from('profiles')
    .select('flagged_at, secondary_verification_required, failed_delivery_count')
    .eq('id', customerId)
    .maybeSingle()

  if (!profile) return { allowed: true }

  if (profile.flagged_at) {
    return {
      allowed: false,
      reason: 'flagged',
      message: 'Hesabınız inceleme için işaretlenmiştir. Lütfen destek ekibiyle iletişime geçin.',
    }
  }

  if (profile.secondary_verification_required) {
    return {
      allowed: false,
      reason: 'secondary_verification_required',
      message: `${profile.failed_delivery_count} başarısız teslimat kaydedilmiştir. Yeni sipariş vermeden önce ikincil doğrulama gereklidir. E-postanızı kontrol edin.`,
    }
  }

  return { allowed: true }
}
