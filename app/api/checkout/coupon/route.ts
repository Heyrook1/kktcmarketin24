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

const CouponSchema = z.object({
  code: z.string().trim().min(1, "Kupon kodu gereklidir.").max(32, "Kupon kodu en fazla 32 karakter olabilir."),
})

export async function POST(req: NextRequest) {
  try {
    let raw: unknown
    try {
      raw = await req.json()
    } catch {
      return NextResponse.json({ valid: false, message: "Geçersiz istek gövdesi." }, { status: 400 })
    }

    const parsed = CouponSchema.safeParse(raw)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Geçersiz kupon kodu."
      return NextResponse.json({ valid: false, message }, { status: 400 })
    }
    const { code } = parsed.data

    const supabase = await createClient()
    const { data: coupon, error } = await supabase
      .from("coupons")
      .select("id, code, type, value, description, min_order_amount, max_uses, current_uses, expires_at, is_active")
      .eq("code", code.trim().toUpperCase())
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
  } catch (err) {
    console.error("[coupon-validate]", err)
    return NextResponse.json({ valid: false, message: "Sunucu hatası." }, { status: 500 })
  }
}
