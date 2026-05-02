/**
 * POST /api/cart/reserve
 * Body: { cartId: string, productId: string, quantity: number }
 *
 * Soft-holds stock in Redis for 15 minutes.
 * Checks vendor_products.stock to ensure enough units exist before reserving.
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { reserveStock } from "@/lib/stock-reservation"
import { z } from "zod"

const reserveSchema = z.object({
  cartId: z.string().trim().min(1),
  productId: z.string().trim().min(1),
  quantity: z.coerce.number().int().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const parsedBody = reserveSchema.safeParse(body)
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Geçersiz istek parametreleri." }, { status: 400 })
    }
    const { cartId, productId, quantity } = parsedBody.data

    const supabase = await createClient()

    // Read current DB stock — never trust client
    const { data: product, error } = await supabase
      .from("vendor_products")
      .select("stock, is_active, name")
      .eq("id", productId)
      .eq("is_active", true)
      .maybeSingle()

    if (error || !product) {
      return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 })
    }

    if ((product.stock ?? 0) < quantity) {
      return NextResponse.json(
        { error: `"${product.name}" için yeterli stok yok. Mevcut: ${product.stock ?? 0}` },
        { status: 409 }
      )
    }

    await reserveStock(cartId, productId, quantity)

    return NextResponse.json({ ok: true, reserved: quantity })
  } catch {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}
