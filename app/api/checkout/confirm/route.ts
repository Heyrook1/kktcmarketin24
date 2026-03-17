import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runCheckoutSaga } from '@/lib/checkout/saga'
import type { SagaInput } from '@/lib/checkout/types'
import { checkCheckoutGate } from '@/lib/reliability'
import { redis } from '@/lib/redis'
import type { ServerCartPayload } from '@/app/api/cart/server/route'

interface ConfirmBody {
  // Line items, prices, and cartId are NOT accepted from the client.
  // They are loaded server-side from Redis keyed to the authenticated user session.
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

function cartKey(userId: string) {
  return `cart:session:${userId}`
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ConfirmBody

    // Validate required delivery fields — no items[], no prices
    if (
      !body.customerName ||
      !body.customerEmail ||
      !body.deliveryAddress?.line1 ||
      !body.deliveryAddress?.city
    ) {
      return NextResponse.json({ error: 'Geçersiz istek gövdesi.' }, { status: 400 })
    }

    // Auth — guest checkout not allowed
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Sipariş vermek için giriş yapmanız gerekiyor.', requiresAuth: true },
        { status: 401 }
      )
    }

    // ── Checkout gate: flagged + reliability checks ───────────────────────
    const gate = await checkCheckoutGate(user.id)
    if (!gate.allowed) {
      return NextResponse.json(
        { error: gate.message, reason: gate.reason, flagged: gate.reason === 'flagged' },
        { status: 403 }
      )
    }

    // ── Load cart from Redis — server is the single source of truth ───────
    // Key: cart:session:{userId}  (set by POST /api/cart/server)
    // Contains only productId + quantity — prices are NEVER stored here.
    const serverCart = await redis.get<ServerCartPayload>(cartKey(user.id))

    if (!serverCart || !Array.isArray(serverCart.items) || serverCart.items.length === 0) {
      return NextResponse.json(
        { error: 'Sunucu tarafında sepetiniz bulunamadı veya boş. Lütfen sepetinizi güncelleyip tekrar deneyin.' },
        { status: 422 }
      )
    }

    // Strip to productId + quantity — vendor_id and price are always re-fetched in the Saga
    const rawItems = serverCart.items
      .filter((i) => i.productId && Number(i.quantity) > 0)
      .map(({ productId, quantity }) => ({ productId, quantity: Number(quantity) }))

    if (rawItems.length === 0) {
      return NextResponse.json({ error: 'Geçerli sepet kalemi bulunamadı.' }, { status: 422 })
    }

    // Coupon: prefer the value stored in the server cart; allow body override
    const couponCode = body.couponCode ?? serverCart.couponCode ?? undefined

    const sagaInput: SagaInput = {
      cartId: serverCart.cartId,   // server's cartId — never trusted from client body
      customerId: user.id,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      deliveryAddress: body.deliveryAddress,
      couponCode,
      rawItems,                    // from Redis — never from client body
    }

    const result = await runCheckoutSaga(sagaInput)

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, details: result.details },
        { status: 409 }
      )
    }

    // Clear the Redis cart now that the Saga has committed
    await redis.del(cartKey(user.id))

    return NextResponse.json({
      ok: true,
      orderId: result.orderId,
      serverSubtotal: result.serverSubtotal,
      serverTotal: result.serverTotal,
      discountAmount: result.discountAmount,
      requiresOtp: true,
    })
  } catch (err) {
    console.error('[checkout/confirm]', err)
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}


