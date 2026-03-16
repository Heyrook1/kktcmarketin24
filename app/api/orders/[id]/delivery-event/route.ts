/**
 * POST /api/orders/[id]/delivery-event
 *
 * Vendor records a delivery outcome for a specific order.
 * Validates that the caller owns a sub-order for this order, then
 * calls recordDeliveryEvent() which updates reliability score + may
 * set secondary_verification_required on the customer profile.
 *
 * Body: { eventType: 'confirmed'|'delivered'|'cancelled_after_dispatch'|'door_refused', notes?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { recordDeliveryEvent, type DeliveryEventType } from '@/lib/reliability'

const VALID_EVENT_TYPES: DeliveryEventType[] = [
  'confirmed', 'delivered', 'cancelled_after_dispatch', 'door_refused',
]

function sb() {
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

  const supabaseUser = await createServerClient()
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 })

  const body = await request.json()
  const eventType = body.eventType as DeliveryEventType
  const notes: string | undefined = body.notes

  if (!VALID_EVENT_TYPES.includes(eventType)) {
    return NextResponse.json({ error: 'Geçersiz etkinlik türü.' }, { status: 400 })
  }

  const admin = sb()

  // Verify vendor owns the store for this sub-order
  const { data: store } = await admin
    .from('vendor_stores')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!store) return NextResponse.json({ error: 'Mağaza bulunamadı.' }, { status: 403 })

  const { data: subOrder } = await admin
    .from('order_vendor_sub_orders')
    .select('id')
    .eq('order_id', orderId)
    .eq('store_id', store.id)
    .maybeSingle()

  if (!subOrder) return NextResponse.json({ error: 'Bu sipariş üzerinde yetkiniz yok.' }, { status: 403 })

  // Fetch customer_id from parent order
  const { data: order } = await admin
    .from('orders')
    .select('customer_id')
    .eq('id', orderId)
    .maybeSingle()

  if (!order?.customer_id) return NextResponse.json({ error: 'Sipariş bulunamadı.' }, { status: 404 })

  const result = await recordDeliveryEvent(
    orderId, store.id, order.customer_id, eventType, user.id, notes
  )

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ ok: true, score: result.score })
}
