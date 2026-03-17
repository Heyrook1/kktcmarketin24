/**
 * GET    /api/cart/server  — load the server-side cart for the authenticated user
 * POST   /api/cart/server  — upsert (sync) the client cart to the server
 * DELETE /api/cart/server  — clear the server-side cart
 *
 * Cart is stored in Redis, keyed to the authenticated user's session:
 *   cart:session:{userId}
 *
 * Only productId + quantity are stored — prices are NEVER persisted here.
 * All prices are re-fetched from vendor_products at checkout confirm time.
 *
 * TTL: 7 days (rolling — refreshed on every POST).
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { redis } from "@/lib/redis"

const CART_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

function cartKey(userId: string) {
  return `cart:session:${userId}`
}

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

    const raw = await redis.get<ServerCartPayload>(cartKey(user.id))
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

    const body = await req.json() as {
      cartId: string
      items: { productId: string; quantity: number }[]
      couponCode?: string
    }

    if (!body.cartId || !Array.isArray(body.items)) {
      return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 })
    }

    // Strip to productId + quantity only — prices are NEVER stored
    const payload: ServerCartPayload = {
      cartId: body.cartId,
      items: body.items
        .filter((i) => i.productId && Number(i.quantity) > 0)
        .map(({ productId, quantity }) => ({ productId, quantity: Number(quantity) })),
      couponCode: body.couponCode ?? null,
      updatedAt: new Date().toISOString(),
    }

    await redis.set(cartKey(user.id), payload, { ex: CART_TTL_SECONDS })

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

    await redis.del(cartKey(user.id))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[cart-server DELETE]", err)
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}
