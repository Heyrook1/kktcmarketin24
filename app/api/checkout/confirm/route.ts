import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runCheckoutSaga } from '@/lib/checkout/saga'
import type { SagaInput } from '@/lib/checkout/types'
import { checkCheckoutGate } from '@/lib/reliability'
import { redis } from '@/lib/redis'
import { redisKeys } from '@/lib/redis-keys'
import type { ServerCartPayload } from '@/app/api/cart/server/route'
import { z } from 'zod'

const ConfirmSchema = z.object({
  customerName: z.string().trim().min(2, 'Ad Soyad en az 2 karakter olmalıdır.'),
  customerEmail: z.string().trim().email('Geçerli bir e-posta giriniz.'),
  customerPhone: z.string().trim().optional(),
  deliveryAddress: z.object({
    fullName: z.string().trim().min(2, 'Ad Soyad en az 2 karakter olmalıdır.'),
    phone: z.string().trim().min(7, 'Geçerli bir telefon numarası giriniz.'),
    line1: z.string().trim().min(5, 'Adres en az 5 karakter olmalıdır.'),
    city: z.string().trim().min(1, 'Şehir zorunludur.'),
    district: z.string().trim().optional().default(''),
  }),
  couponCode: z.string().trim().max(32).optional(),
})

type ConfirmBody = z.infer<typeof ConfirmSchema>

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json().catch(() => null)
    const parsed = ConfirmSchema.safeParse(raw)
    if (!parsed.success) {
      const messages = parsed.error.issues.map((issue) => issue.message)
      return NextResponse.json({ error: messages[0] ?? 'Geçersiz istek gövdesi.', details: messages }, { status: 400 })
    }
    const body: ConfirmBody = parsed.data

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
    // Key: cart:{userId}:session  (set by POST /api/cart/server)
    // Contains only productId + quantity — prices are NEVER stored here.
    const serverCart = await redis.get<ServerCartPayload>(redisKeys.cartSession(user.id))

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
    await redis.del(redisKeys.cartSession(user.id))

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


