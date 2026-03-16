/**
 * POST /api/orders/[id]/no-show
 *
 * Called by vendor or admin to report a delivery no-show.
 * Increments no_show_count on the customer profile and flags
 * the account for manual review after NO_SHOW_THRESHOLD.
 */

import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { recordNoShow } from '@/lib/otp'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function sb() {
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

  // Auth — must be vendor or admin
  const supabaseUser = await createServerClient()
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 })
  }

  const admin = sb()

  // Verify caller owns the store for this order (or is admin)
  const { data: profile } = await admin
    .from('profiles')
    .select('role_id, roles(name)')
    .eq('id', user.id)
    .maybeSingle()

  const roleName = (profile?.roles as { name: string } | null)?.name
  const isAdmin = roleName === 'admin'

  if (!isAdmin) {
    // Check vendor owns a sub-order for this order
    const { data: subOrder } = await admin
      .from('order_vendor_sub_orders')
      .select('id')
      .eq('order_id', orderId)
      .in(
        'store_id',
        admin.from('vendor_stores').select('id').eq('owner_id', user.id)
      )
      .maybeSingle()

    if (!subOrder) {
      return NextResponse.json({ error: 'Bu sipariş üzerinde yetkiniz yok.' }, { status: 403 })
    }
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

  // Fetch updated profile to return flagged status
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
