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
  cartId: z.string().trim().min(1),
  productId: z.string().trim().min(1).optional().nullable(),
})

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const parsedBody = releaseReservationSchema.safeParse(body)
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Geçersiz istek parametreleri." }, { status: 400 })
    }

    const { cartId, productId } = parsedBody.data
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
