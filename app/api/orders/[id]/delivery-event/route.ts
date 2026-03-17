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

  // Single ownership check — replaces the duplicated auth + store lookup
  const auth = await assertDeliveryEventOwnership(orderId)
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

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

  const admin = adminClient()

  // Fetch customer_id from parent order
  const { data: order } = await admin
    .from('orders')
    .select('customer_id')
    .eq('id', orderId)
    .maybeSingle()

  if (!order?.customer_id) {
    return NextResponse.json({ error: 'Sipariş bulunamadı.' }, { status: 404 })
  }

  const result = await recordDeliveryEvent(
    orderId,
    auth.session.storeId,      // server-resolved — never from client
    order.customer_id,
    eventType,
    auth.session.userId,
    body.notes
  )

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ ok: true, score: result.score })
}
