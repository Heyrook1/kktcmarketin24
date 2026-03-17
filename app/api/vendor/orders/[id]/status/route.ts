/**
 * PATCH /api/vendor/orders/[id]/status
 *
 * Vendor updates the delivery status of one of their vendor_orders rows.
 * Allowed transitions are enforced: a vendor can only progress the status
 * forward through the defined state machine — never backward, and never to
 * a state reserved for the system (e.g. refunded, failed).
 *
 * Ownership: assertVendorOrderOwnership(id) verifies the row belongs to
 * the authenticated vendor's store before any write occurs.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { assertVendorOrderOwnership } from '@/lib/vendor-auth'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Vendor-permitted statuses and their allowed next states.
// System-only states (pending_otp, failed, refunded) are excluded.
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending:    ['confirmed', 'cancelled'],
  confirmed:  ['shipped'],
  shipped:    ['delivered'],
  // cancelled and delivered are terminal — no further transitions
}

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params

  // Verify caller owns this vendor_order
  const auth = await assertVendorOrderOwnership(id)
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

  let body: { status?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON gövdesi.' }, { status: 400 })
  }

  const newStatus = body.status
  if (!newStatus || typeof newStatus !== 'string') {
    return NextResponse.json({ error: '"status" alanı zorunludur.' }, { status: 422 })
  }

  const admin = adminClient()

  // Fetch current status to validate the transition
  const { data: current, error: fetchErr } = await admin
    .from('vendor_orders')
    .select('status')
    .eq('id', id)
    .single()

  if (fetchErr || !current) {
    return NextResponse.json({ error: 'Sipariş bulunamadı.' }, { status: 404 })
  }

  const allowed = ALLOWED_TRANSITIONS[current.status] ?? []
  if (!allowed.includes(newStatus)) {
    return NextResponse.json(
      {
        error: `"${current.status}" durumundan "${newStatus}" durumuna geçiş yapılamaz.`,
        allowedNext: allowed,
      },
      { status: 422 }
    )
  }

  const { error: updateErr } = await admin
    .from('vendor_orders')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('store_id', auth.session.storeId)  // second ownership guard in the query itself

  if (updateErr) {
    console.error('[vendor/orders status PATCH]', updateErr)
    return NextResponse.json({ error: 'Durum güncellenemedi.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, status: newStatus })
}
