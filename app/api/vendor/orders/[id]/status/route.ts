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
import { createClient as createAdmin } from '@supabase/supabase-js'
import { assertVendorOrderOwnership } from '@/lib/vendor-auth'
import { assertAdminAuth } from '@/lib/admin-auth'
import { updateVendorOrderStatus } from '@/lib/order-status/update-vendor-order-status'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params

  let body: { status?: string; trackingNumber?: string | null }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON gövdesi.' }, { status: 400 })
  }

  const newStatus = body.status
  if (!newStatus || typeof newStatus !== 'string') {
    return NextResponse.json({ error: '"status" alanı zorunludur.' }, { status: 422 })
  }

  // Vendor owner path first; fallback to admin/super_admin override.
  const vendorAuth = await assertVendorOrderOwnership(id)
  let effectiveStoreId: string | null = vendorAuth.ok ? vendorAuth.session.storeId : null

  if (!effectiveStoreId) {
    const adminAuth = await assertAdminAuth()
    if (!adminAuth.ok) {
      return NextResponse.json({ error: vendorAuth.ok ? "Yetkiniz yok." : vendorAuth.message }, { status: vendorAuth.ok ? 403 : vendorAuth.status })
    }
    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: row } = await admin
      .from("vendor_orders")
      .select("store_id")
      .eq("id", id)
      .maybeSingle()
    if (!row?.store_id) {
      return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 })
    }
    effectiveStoreId = row.store_id
  }

  const result = await updateVendorOrderStatus({
    vendorOrderId: id,
    vendorStoreId: effectiveStoreId,
    newStatus,
    trackingNumber: body.trackingNumber ?? null,
  })

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, ...(result.allowedNext ? { allowedNext: result.allowedNext } : {}) },
      { status: result.status }
    )
  }

  return NextResponse.json({ ok: true, status: result.status })
}
