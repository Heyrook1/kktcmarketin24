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

const otpVerifySchema = z.object({
  orderId: z.string().uuid('Geçersiz sipariş kimliği.'),
  code: z.string().trim().min(4, 'OTP kodu geçersiz.').max(12, 'OTP kodu geçersiz.'),
})

export async function POST(request: Request) {
  try {
    const supabaseUser = await createServerClient()
    const { data: { user } } = await supabaseUser.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Giriş yapmanız gerekiyor.' }, { status: 401 })
    }

    const requestBody = await request.json().catch(() => null)
    const parsedBody = otpVerifySchema.safeParse(requestBody)
    if (!parsedBody.success) {
      const message = parsedBody.error.issues[0]?.message ?? 'Geçersiz istek gövdesi.'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const { orderId, code } = parsedBody.data
    const result = await verifyOtp(orderId, code, user.id)

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 422 })
    }

    return NextResponse.json({ ok: true, orderId })
  } catch {
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}
