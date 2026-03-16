import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { runCheckoutSaga } from '@/lib/checkout/saga'
import type { SagaInput } from '@/lib/checkout/types'

interface ConfirmBody {
  // Line items and cartId are NOT accepted from the client.
  // They are loaded server-side from server_carts keyed to the user session.
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

function adminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ConfirmBody

    // Validate required fields (no items[] — those come from the server cart)
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

    const admin = adminClient()

    // Check for flagged / no-show accounts
    const { data: profile } = await admin
      .from('profiles')
      .select('flagged_at, no_show_count')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.flagged_at) {
      return NextResponse.json(
        {
          error: 'Hesabınız inceleme için işaretlenmiştir. Yeni sipariş veremezsiniz. Lütfen destek ekibiyle iletişime geçin.',
          flagged: true,
        },
        { status: 403 }
      )
    }

    // ── Load cart from server (single source of truth) ────────────────────
    // Uses service-role client so it bypasses RLS — we already verified user above.
    const { data: serverCart } = await admin
      .from('server_carts')
      .select('cart_id, items, coupon_code')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!serverCart || !Array.isArray(serverCart.items) || serverCart.items.length === 0) {
      return NextResponse.json(
        { error: 'Sunucu tarafında sepetiniz bulunamadı veya boş. Lütfen sepetinizi güncelleyip tekrar deneyin.' },
        { status: 422 }
      )
    }

    // Strip to productId + quantity only — vendor_id and price always re-fetched in Saga
    const rawItems = (serverCart.items as { productId: string; quantity: number }[])
      .filter((i) => i.productId && Number(i.quantity) > 0)
      .map(({ productId, quantity }) => ({ productId, quantity: Number(quantity) }))

    if (rawItems.length === 0) {
      return NextResponse.json({ error: 'Geçerli sepet kalemi bulunamadı.' }, { status: 422 })
    }

    // Coupon: prefer server cart's stored coupon; allow override only if provided
    const couponCode = body.couponCode ?? serverCart.coupon_code ?? undefined

    const sagaInput: SagaInput = {
      cartId: serverCart.cart_id,          // server's cartId, not client's
      customerId: user.id,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      deliveryAddress: body.deliveryAddress,
      couponCode,
      rawItems,                             // from server_carts — never client body
    }

    const result = await runCheckoutSaga(sagaInput)

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, details: result.details },
        { status: 409 }
      )
    }

    // Clear the server cart now that the Saga has committed
    await admin
      .from('server_carts')
      .delete()
      .eq('user_id', user.id)

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

