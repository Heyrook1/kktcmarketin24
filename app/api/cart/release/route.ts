/**
 * DELETE /api/cart/release
 * Body: { cartId: string, productId?: string }
 *
 * Releases a single product reservation (productId provided) or ALL
 * reservations for the cart (productId omitted / null).
 */
import { NextRequest, NextResponse } from "next/server"
import { releaseReservation, releaseAllReservations } from "@/lib/stock-reservation"
import { z } from "zod"

const releaseReservationSchema = z.object({
  cartId: z.string().trim().min(1, "cartId zorunludur."),
  productId: z.string().uuid("productId geçersiz.").optional().nullable(),
})

export async function DELETE(req: NextRequest) {
  try {
    const parsed = releaseReservationSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Geçersiz istek parametreleri." },
        { status: 400 }
      )
    }

    const { cartId, productId } = parsed.data
    if (productId) {
      await releaseReservation(cartId, productId)
    } else {
      await releaseAllReservations(cartId)
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}
