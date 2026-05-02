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
  orderId: z.string().uuid(),
  code: z.string().trim().min(4).max(12),
})

export async function POST(request: Request) {
  try {
    const supabaseUser = await createServerClient()
    const { data: { user } } = await supabaseUser.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Giriş yapmanız gerekiyor.' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const parsedBody = verifyOtpSchema.safeParse(body)
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'orderId ve code geçerli olmalıdır.' }, { status: 400 })
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
