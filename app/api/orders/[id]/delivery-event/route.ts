/**
 * POST /api/orders/[id]/delivery-event
 *
 * Vendor records a delivery outcome for a specific order.
 * Ownership is verified via assertDeliveryEventOwnership() from lib/vendor-auth.ts —
 * the single source of truth for all vendor ownership checks.
 *
 * Body: { eventType: 'confirmed'|'delivered'|'cancelled_after_dispatch'|'door_refused', notes?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { recordDeliveryEvent, type DeliveryEventType } from '@/lib/reliability'
import { assertDeliveryEventOwnership, isUuid } from '@/lib/vendor-auth'
import { assertAdminAuth } from '@/lib/admin-auth'

const VALID_EVENT_TYPES: DeliveryEventType[] = [
  'confirmed', 'delivered', 'cancelled_after_dispatch', 'door_refused',
]

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params

  if (!isUuid(orderId)) {
    return NextResponse.json({ error: 'Geçersiz sipariş kimliği.' }, { status: 400 })
  }

  // Vendor ownership first; fallback to admin/super_admin override.
  const vendorAuth = await assertDeliveryEventOwnership(orderId)
  let effectiveStoreId: string | null = vendorAuth.ok ? vendorAuth.session.storeId : null
  let actorUserId: string | null = vendorAuth.ok ? vendorAuth.session.userId : null

  const admin = adminClient()

  if (!effectiveStoreId || !actorUserId) {
    const adminAuth = await assertAdminAuth()
    if (!adminAuth.ok) {
      return NextResponse.json({ error: vendorAuth.ok ? 'Yetkiniz yok.' : vendorAuth.message }, { status: vendorAuth.ok ? 403 : vendorAuth.status })
    }

    const { data: row } = await admin
      .from('vendor_orders')
      .select('store_id')
      .eq('order_id', orderId)
      .limit(1)
      .maybeSingle()

    if (!row?.store_id) {
      return NextResponse.json({ error: 'Sipariş bulunamadı.' }, { status: 404 })
    }

    effectiveStoreId = row.store_id
    actorUserId = adminAuth.userId
  }

  let body: { eventType?: string; notes?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON gövdesi.' }, { status: 400 })
  }

  const eventType = body.eventType as DeliveryEventType
  if (!VALID_EVENT_TYPES.includes(eventType)) {
    return NextResponse.json({ error: 'Geçersiz etkinlik türü.' }, { status: 400 })
  }

  // Fetch customer_id from parent order
  const { data: order } = await admin
    .from('orders')
    .select('customer_id')
    .eq('id', orderId)
    .maybeSingle()

  if (!order?.customer_id) {
    return NextResponse.json({ error: 'Sipariş bulunamadı.' }, { status: 404 })
  }
  if (!effectiveStoreId || !actorUserId) {
    return NextResponse.json({ error: 'Yetki doğrulaması başarısız.' }, { status: 403 })
  }

  const result = await recordDeliveryEvent(
    orderId,
    effectiveStoreId,      // server-resolved — never from client
    order.customer_id,
    eventType,
    actorUserId,
    body.notes
  )

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ ok: true, score: result.score })
}
