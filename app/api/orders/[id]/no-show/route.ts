/**
 * POST /api/orders/[id]/no-show
 *
 * Called by vendor or admin to report a delivery no-show.
 * Increments no_show_count on the customer profile and flags
 * the account for manual review after NO_SHOW_THRESHOLD.
 *
 * Ownership: vendors must own a sub-order for the given order.
 * Admins bypass the ownership check via role lookup.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { recordNoShow } from '@/lib/otp'
import { assertDeliveryEventOwnership, isUuid } from '@/lib/vendor-auth'
import { createClient as createServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params

  if (!isUuid(orderId)) {
    return NextResponse.json({ error: 'Geçersiz sipariş kimliği.' }, { status: 400 })
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 })
  }

  const admin = adminClient()

  // Check if caller is admin — admins bypass ownership check
  const { data: profile } = await admin
    .from('profiles')
    .select('role_id, roles(name)')
    .eq('id', user.id)
    .maybeSingle()

  const roleName = (profile?.roles as { name: string } | null)?.name
  const isAdmin = roleName === 'admin'

  if (!isAdmin) {
    // Vendors must own a sub-order for this order via assertDeliveryEventOwnership
    const auth = await assertDeliveryEventOwnership(orderId)
    if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })
  }

  // Fetch order to get customer_id
  const { data: order } = await admin
    .from('orders')
    .select('customer_id, saga_status')
    .eq('id', orderId)
    .maybeSingle()

  if (!order) {
    return NextResponse.json({ error: 'Sipariş bulunamadı.' }, { status: 404 })
  }

  await recordNoShow(order.customer_id, orderId)

  const { data: updated } = await admin
    .from('profiles')
    .select('no_show_count, flagged_at')
    .eq('id', order.customer_id)
    .maybeSingle()

  return NextResponse.json({
    ok: true,
    noShowCount: updated?.no_show_count ?? 1,
    flagged: !!updated?.flagged_at,
  })
}
