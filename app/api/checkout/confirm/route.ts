import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
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

function sb() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
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

    // Auth — guest checkout not allowed
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Sipariş vermek için giriş yapmanız gerekiyor.', requiresAuth: true },
        { status: 401 }
      )
    }

    // Check for flagged / no-show accounts
    const admin = sb()
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

    const sagaInput: SagaInput = {
      cartId: body.cartId,
      customerId: user.id,
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
      // Tell client OTP verification is required
      requiresOtp: true,
    })
  } catch (err) {
    console.error('[checkout/confirm]', err)
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}
