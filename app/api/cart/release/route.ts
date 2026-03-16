/**
 * DELETE /api/cart/release
 * Body: { cartId: string, productId?: string }
 *
 * Releases a single product reservation (productId provided) or ALL
 * reservations for the cart (productId omitted / null).
 */
import { NextRequest, NextResponse } from "next/server"
import { releaseReservation, releaseAllReservations } from "@/lib/stock-reservation"

export async function DELETE(req: NextRequest) {
  try {
    const { cartId, productId } = await req.json()

    if (!cartId) {
      return NextResponse.json({ error: "cartId zorunludur." }, { status: 400 })
    }

    if (productId) {
      await releaseReservation(cartId, productId)
    } else {
      await releaseAllReservations(cartId)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[stock-release]", err)
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}
