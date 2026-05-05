/**
 * POST /api/otp/verify
 * Body: { orderId: string; code: string }
 *
 * Verifies the submitted OTP code. On success the order moves to
 * saga_status = 'completed' and sub-orders to step_status = 'confirmed'.
 */

import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { verifyOtp } from '@/lib/otp'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const verifyOtpSchema = z.object({
  orderId: z.string().uuid('Geçersiz sipariş kimliği.'),
  code: z.string().trim().regex(/^\d{6}$/, 'Geçersiz doğrulama kodu.'),
})

export async function POST(request: Request) {
  try {
    const supabaseUser = await createServerClient()
    const { data: { user } } = await supabaseUser.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Giriş yapmanız gerekiyor.' }, { status: 401 })
    }

    const parsed = verifyOtpSchema.safeParse(await request.json().catch(() => null))

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'orderId ve code gerekli.' },
        { status: 400 }
      )
    }

    const result = await verifyOtp(parsed.data.orderId, parsed.data.code, user.id)

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 422 })
    }

    return NextResponse.json({ ok: true, orderId: parsed.data.orderId })
  } catch {
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}
