"use server"

import { createClient } from "@/lib/supabase/server"
import type { Coupon } from "@/lib/store/account-store"

export type ClaimResult =
  | { success: true; coupon: Coupon; alreadyHad: boolean }
  | { success: false; error: string }

/**
 * Assigns the TEST20 coupon (and optionally others) to the currently
 * authenticated user. Safe to call multiple times — returns alreadyHad:true
 * if the user already owns the coupon.
 */
export async function claimTestCoupon(couponCode = "TEST20"): Promise<ClaimResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "Bu işlem için giriş yapmanız gerekiyor." }
  }

  // 1. Fetch the coupon definition
  const { data: coupon, error: couponError } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", couponCode.toUpperCase())
    .eq("is_active", true)
    .single()

  if (couponError || !coupon) {
    return { success: false, error: `"${couponCode}" kodu bulunamadı veya aktif değil.` }
  }

  // Enforce max_uses if set
  if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) {
    return { success: false, error: "Bu kuponun kullanım limiti dolmuş." }
  }

  // Check expiry
  if (new Date(coupon.expires_at) < new Date()) {
    return { success: false, error: "Bu kuponun süresi dolmuş." }
  }

  // 2. Assign to user (upsert — idempotent)
  const { data: existing } = await supabase
    .from("user_coupons")
    .select("id")
    .eq("user_id", user.id)
    .eq("coupon_id", coupon.id)
    .maybeSingle()

  if (existing) {
    // Already assigned — just return the coupon so the client can hydrate
    return {
      success: true,
      alreadyHad: true,
      coupon: mapCoupon(coupon),
    }
  }

  const { error: insertError } = await supabase
    .from("user_coupons")
    .insert({ user_id: user.id, coupon_id: coupon.id })

  if (insertError) {
    return { success: false, error: "Kupon ataması sırasında bir hata oluştu." }
  }

  return {
    success: true,
    alreadyHad: false,
    coupon: mapCoupon(coupon),
  }
}

/**
 * Fetches all coupons currently assigned to the logged-in user.
 */
export async function getUserCoupons(): Promise<Coupon[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from("user_coupons")
    .select("used_at, coupon:coupon_id(*)")
    .eq("user_id", user.id)

  if (error || !data) return []

  return data
    .filter((row) => row.coupon)
    .map((row) =>
      mapCoupon(row.coupon as Record<string, unknown>, row.used_at as string | null)
    )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapCoupon(
  row: Record<string, unknown>,
  usedAt: string | null = null
): Coupon {
  return {
    id:              row.id as string,
    code:            row.code as string,
    type:            row.type as Coupon["type"],
    value:           Number(row.value),
    minOrderAmount:  Number(row.min_order_amount ?? 0),
    expiresAt:       row.expires_at as string,
    usedAt:          usedAt ?? (row.used_at as string | undefined),
    description:     row.description as string,
    isActive:        row.is_active as boolean,
  }
}
