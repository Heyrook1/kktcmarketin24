/**
 * POST /api/checkout/confirm
 *
 * Entry point for multi-vendor checkout using the Saga pattern.
 *
 * This route:
 *  1. Reads user session (customerId may be null for guest checkouts).
 *  2. Delegates entirely to runCheckoutSaga() which:
 *     - Re-fetches ALL prices from DB (never trusts client-submitted values)
 *     - Validates vendor_store ownership per line item
 *     - Validates Redis reservations (15-min soft-holds)
 *     - Creates parent order + vendor sub-orders in sequence
 *     - Runs compensating transactions on any failure (restores stock)
 *     - Writes outbox events for async vendor notification
 *  3. Returns { ok, orderId, serverTotal, ... } on success
 *     or { error, details } on any failure.
 *
 * Request body:
 *  {
 *    cartId: string
 *    items: { productId: string, quantity: number }[]
 *    customerName: string
 *    customerEmail: string
 *    customerPhone?: string
 *    deliveryAddress: { fullName, phone, line1, city, district }
 *    couponCode?: string
 *  }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runCheckoutSaga } from '@/lib/checkout/saga'
import type { SagaInput } from '@/lib/checkout/types'

interface ConfirmBody {
  cartId: string
  items: { productId: string; quantity: number }[]
  customerName: string
  customerEmail: string
  customerPhone?: string
  deliveryAddress: {
    fullName: string
    phone: string
    line1: string
    city: string
    district: string
  }
  couponCode?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ConfirmBody

    // Basic shape validation
    if (
      !body.cartId ||
      !Array.isArray(body.items) ||
      body.items.length === 0 ||
      !body.customerName ||
      !body.customerEmail ||
      !body.deliveryAddress
    ) {
      return NextResponse.json({ error: 'Geçersiz istek gövdesi.' }, { status: 400 })
    }

    // Read session — guest checkouts allowed (customerId may be null)
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const sagaInput: SagaInput = {
      cartId: body.cartId,
      customerId: user?.id ?? null,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      deliveryAddress: body.deliveryAddress,
      couponCode: body.couponCode,
      rawItems: body.items,
    }

    const result = await runCheckoutSaga(sagaInput)

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, details: result.details },
        { status: 409 }
      )
    }

    return NextResponse.json({
      ok: true,
      orderId: result.orderId,
      serverSubtotal: result.serverSubtotal,
      serverTotal: result.serverTotal,
      discountAmount: result.discountAmount,
    })
  } catch (err) {
    console.error('[checkout/confirm]', err)
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}
