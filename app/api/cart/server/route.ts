/**
 * GET    /api/cart/server  — load the server-side cart for the authenticated user
 * POST   /api/cart/server  — upsert (sync) the client cart to the server
 * DELETE /api/cart/server  — clear the server-side cart
 *
 * Cart is stored in Redis, keyed to the authenticated user's session:
 *   cart:{userId}:session
 *
 * Only productId + quantity are stored — prices are NEVER persisted here.
 * All prices are re-fetched from vendor_products at checkout confirm time.
 *
 * TTL: 7 days (rolling — refreshed on every POST).
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { redis } from "@/lib/redis"
import { redisKeys } from "@/lib/redis-keys"
import { z } from "zod"

const CART_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days
const CartSyncSchema = z.object({
  cartId: z.string().trim().min(1, "cartId zorunludur."),
  items: z.array(
    z.object({
      productId: z.string().uuid("Geçersiz ürün kimliği."),
      quantity: z.coerce.number().int().min(1).max(99),
    }),
  ).max(50),
  couponCode: z.string().trim().max(32).optional().nullable(),
})

export interface ServerCartPayload {
  cartId: string
  // Only IDs + quantities — no prices, no vendor info
  items: { productId: string; quantity: number }[]
  couponCode?: string | null
  updatedAt: string
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 })

    const raw = await redis.get<ServerCartPayload>(redisKeys.cartSession(user.id))
    return NextResponse.json({ cart: raw ?? null })
  } catch (err) {
    console.error("[cart-server GET]", err)
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 })

    let raw: unknown
    try {
      raw = await req.json()
    } catch {
      return NextResponse.json({ error: "Geçersiz JSON gövdesi." }, { status: 400 })
    }

    const parsed = CartSyncSchema.safeParse(raw)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Geçersiz istek."
      return NextResponse.json({ error: message }, { status: 400 })
    }

    // Strip to productId + quantity only — prices are NEVER stored
    const payload: ServerCartPayload = {
      cartId: parsed.data.cartId,
      items: parsed.data.items.map(({ productId, quantity }) => ({ productId, quantity })),
      couponCode: parsed.data.couponCode ?? null,
      updatedAt: new Date().toISOString(),
    }

    await redis.set(redisKeys.cartSession(user.id), payload, { ex: CART_TTL_SECONDS })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[cart-server POST]", err)
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 })

    await redis.del(redisKeys.cartSession(user.id))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[cart-server DELETE]", err)
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}
