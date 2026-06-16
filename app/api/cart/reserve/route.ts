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

const ReserveStockSchema = z.object({
  cartId: z.string().trim().min(1, "cartId zorunludur."),
  productId: z.string().uuid("Geçersiz ürün kimliği."),
  quantity: z.coerce.number().int().min(1, "Miktar en az 1 olmalıdır.").max(99, "Miktar 99'u geçemez."),
})

export async function POST(req: NextRequest) {
  try {
    let raw: unknown
    try {
      raw = await req.json()
    } catch {
      return NextResponse.json({ error: "Geçersiz JSON gövdesi." }, { status: 400 })
    }

    const parsed = ReserveStockSchema.safeParse(raw)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Geçersiz istek parametreleri."
      return NextResponse.json({ error: message }, { status: 400 })
    }
    const { cartId, productId, quantity } = parsed.data

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
  } catch (err) {
    console.error("[stock-reserve]", err)
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}
