/**
 * POST /api/checkout/coupon
 * Body: { code: string }
 *
 * Validates a coupon code against the Supabase `coupons` table.
 * Returns { valid: true, ...coupon } or { valid: false, message }.
 * Coupon codes are NEVER exposed in the client bundle.
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const couponRequestSchema = z.object({
  code: z.string().trim().min(1, "Kupon kodu gereklidir.").max(64, "Kupon kodu çok uzun."),
})

export async function POST(req: NextRequest) {
  try {
    const parsed = couponRequestSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Geçersiz kupon isteği."
      return NextResponse.json({ valid: false, message }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: coupon, error } = await supabase
      .from("coupons")
      .select("id, code, type, value, description, min_order_amount, max_uses, current_uses, expires_at, is_active")
      .eq("code", parsed.data.code.toUpperCase())
      .eq("is_active", true)
      .maybeSingle()

    if (error || !coupon) {
      return NextResponse.json({ valid: false, message: "Geçersiz veya süresi dolmuş kupon kodu." })
    }

    // Check expiry
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, message: "Bu kuponun süresi dolmuş." })
    }

    // Check max usage
    if (coupon.max_uses !== null && (coupon.current_uses ?? 0) >= coupon.max_uses) {
      return NextResponse.json({ valid: false, message: "Bu kupon kullanım limitine ulaştı." })
    }

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      description: coupon.description,
      min_order_amount: coupon.min_order_amount,
    })
  } catch {
    return NextResponse.json({ valid: false, message: "Sunucu hatası." }, { status: 500 })
  }
}
