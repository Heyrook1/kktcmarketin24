/**
 * GET  /api/cart/server — load the server-side cart for the authenticated user
 * POST /api/cart/server — upsert (sync) the client cart to the server
 * DELETE /api/cart/server — clear the server-side cart after checkout
 *
 * The server cart is stored in `public.server_carts` keyed to auth.users(id).
 * It is the authoritative fallback: if a user signs in on a new device, their
 * cart is restored from here.  The client (Zustand persist) is kept as the
 * primary fast-path; this is the durable backup.
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 })

    const { data, error } = await supabase
      .from("server_carts")
      .select("cart_id, items, coupon_code, updated_at")
      .eq("user_id", user.id)
      .maybeSingle()

    if (error) return NextResponse.json({ error: "Sepet alınamadı." }, { status: 500 })
    return NextResponse.json({ cart: data ?? null })
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

    const { cartId, items, couponCode } = await req.json() as {
      cartId: string
      items: { productId: string; quantity: number }[]
      couponCode?: string
    }

    if (!cartId || !Array.isArray(items)) {
      return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 })
    }

    // Store only productId + quantity — no prices, no vendor info
    // (prices are always re-fetched from DB at checkout)
    const safeItems = items.map(({ productId, quantity }) => ({ productId, quantity }))

    const { error } = await supabase
      .from("server_carts")
      .upsert(
        {
          user_id: user.id,
          cart_id: cartId,
          items: safeItems,
          coupon_code: couponCode ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )

    if (error) return NextResponse.json({ error: "Sepet kaydedilemedi." }, { status: 500 })
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

    const { error } = await supabase
      .from("server_carts")
      .delete()
      .eq("user_id", user.id)

    if (error) return NextResponse.json({ error: "Sepet silinemedi." }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[cart-server DELETE]", err)
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}
