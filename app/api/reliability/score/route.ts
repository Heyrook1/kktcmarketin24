/**
 * GET  /api/reliability/score?customerId=...
 *   Returns the reliability score for a customer.
 *   Only callable by vendors (owns at least one store) or admins.
 *
 * POST /api/reliability/verify/approve
 *   Admin approves a secondary verification (clears the gate).
 *   Body: { userId: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { getReliabilityScore, approveSecondaryVerification } from '@/lib/reliability'
import { z } from 'zod'

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const getQuerySchema = z.object({
  customerId: z.string().uuid('Geçersiz müşteri kimliği.'),
})

const postBodySchema = z.object({
  userId: z.string().uuid('Geçersiz kullanıcı kimliği.'),
})

export async function GET(request: NextRequest) {
  try {
    const supabaseUser = await createServerClient()
    const { data: { user } } = await supabaseUser.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 })

    const parsedQuery = getQuerySchema.safeParse({
      customerId: request.nextUrl.searchParams.get('customerId'),
    })
    if (!parsedQuery.success) {
      return NextResponse.json({ error: parsedQuery.error.issues[0]?.message ?? 'Geçersiz sorgu parametresi.' }, { status: 400 })
    }
    const { customerId } = parsedQuery.data

    const admin = sb()

    // Must be a vendor or admin
    const { data: store } = await admin
      .from('vendor_stores')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle()

    const { data: profile } = await admin
      .from('profiles')
      .select('role_id, roles(name)')
      .eq('id', user.id)
      .maybeSingle()

    const roleName = (profile?.roles as { name: string } | null)?.name
    const isAdmin = roleName === 'admin' || roleName === 'super_admin'

    if (!store && !isAdmin) {
      return NextResponse.json({ error: 'Sadece satıcılar veya yöneticiler puan sorgulayabilir.' }, { status: 403 })
    }

    const score = await getReliabilityScore(customerId)
    if (!score) return NextResponse.json({ error: 'Müşteri bulunamadı.' }, { status: 404 })

    return NextResponse.json({ ok: true, score })
  } catch {
    return NextResponse.json({ error: 'Güvenilirlik puanı alınamadı.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUser = await createServerClient()
    const { data: { user } } = await supabaseUser.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 })

    const admin = sb()
    const { data: profile } = await admin
      .from('profiles')
      .select('role_id, roles(name)')
      .eq('id', user.id)
      .maybeSingle()

    const roleName = (profile?.roles as { name: string } | null)?.name
    if (roleName !== 'admin' && roleName !== 'super_admin') {
      return NextResponse.json({ error: 'Yalnızca yöneticiler ikincil doğrulamayı onaylayabilir.' }, { status: 403 })
    }

    const parsedBody = postBodySchema.safeParse(await request.json())
    if (!parsedBody.success) {
      return NextResponse.json({ error: parsedBody.error.issues[0]?.message ?? 'Geçersiz istek gövdesi.' }, { status: 400 })
    }

    await approveSecondaryVerification(parsedBody.data.userId, user.id)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'İşlem tamamlanamadı.' }, { status: 500 })
  }
}
