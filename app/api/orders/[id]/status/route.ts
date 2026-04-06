import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { assertVendorOrderOwnership } from '@/lib/vendor-auth'
import { assertAdminAuth } from '@/lib/admin-auth'
import { updateVendorOrderStatus } from '@/lib/order-status/update-vendor-order-status'

export const runtime = 'nodejs'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
    const { status: newStatus, notes, trackingNumber } = await req.json() as {
      status: string
      notes?: string
      trackingNumber?: string | null
    }

    if (!orderId || !newStatus) {
      return NextResponse.json({ error: 'orderId ve status zorunludur.' }, { status: 400 })
    }

    // Legacy alias endpoint: keep behavior fully aligned with vendor endpoint.
    const vendorAuth = await assertVendorOrderOwnership(orderId)
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
        .eq("id", orderId)
        .maybeSingle()
      if (!row?.store_id) {
        return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 })
      }
      effectiveStoreId = row.store_id
    }

    const result = await updateVendorOrderStatus({
      vendorOrderId: orderId,
      vendorStoreId: effectiveStoreId,
      newStatus,
      trackingNumber: trackingNumber ?? null,
      notes: notes ?? null,
    })

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, ...(result.allowedNext ? { allowedNext: result.allowedNext } : {}) },
        { status: result.status }
      )
    }

    return NextResponse.json({ ok: true, status: result.status })
  } catch (err) {
    console.error('[api/orders/[id]/status]', err)
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}
