/**
 * POST /api/otp/send
 * Body: { orderId: string }
 *
 * Looks up the order, verifies ownership, then sends an OTP to the
 * phone number on the user's profile.
 */

import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { createOtp } from '@/lib/otp'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const requestBodySchema = z.object({
  orderId: z.string().uuid('Geçersiz sipariş kimliği.'),
})

export async function POST(request: Request) {
  try {
    // Auth — must be signed in
    const supabaseUser = await createServerClient()
    const { data: { user } } = await supabaseUser.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Giriş yapmanız gerekiyor.' }, { status: 401 })
    }

    const parsedBody = requestBodySchema.safeParse(await request.json())
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.issues[0]?.message ?? 'Geçersiz istek gövdesi.' },
        { status: 400 },
      )
    }
    const { orderId } = parsedBody.data

    const admin = sb()

    // Verify order belongs to this user and is in awaiting_otp state
    const { data: order } = await admin
      .from('orders')
      .select('id, saga_status, customer_id')
      .eq('id', orderId)
      .eq('customer_id', user.id)
      .maybeSingle()

    if (!order) {
      return NextResponse.json({ error: 'Sipariş bulunamadı.' }, { status: 404 })
    }
    if (order.saga_status !== 'awaiting_otp') {
      return NextResponse.json({ error: 'Bu sipariş OTP doğrulaması gerektirmiyor.' }, { status: 409 })
    }

    // Get phone from profile
    const { data: profile } = await admin
      .from('profiles')
      .select('phone, flagged_at')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.flagged_at) {
      return NextResponse.json({
        error: 'Hesabınız inceleme için işaretlenmiştir. Destek ekibiyle iletişime geçin.',
        flagged: true,
      }, { status: 403 })
    }

    const phone = profile?.phone ?? user.phone ?? user.user_metadata?.phone
    if (!phone) {
      return NextResponse.json({
        error: 'Profilinizde telefon numarası kayıtlı değil. Lütfen hesap ayarlarınızı güncelleyin.',
      }, { status: 422 })
    }

    const result = await createOtp(orderId, phone, user.id)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 429 })
    }

    return NextResponse.json({
      ok: true,
      phone: phone.replace(/(\+?\d{2,3})\d+(\d{2})/, '$1*****$2'),
      // devCode only present in development — strip before production
      ...(result.devCode ? { devCode: result.devCode } : {}),
    })
  } catch {
    return NextResponse.json({ error: 'OTP gönderimi sırasında beklenmeyen bir hata oluştu.' }, { status: 500 })
  }
}
