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
import {
  CANONICAL_VENDOR_ORDER_STATUSES,
  normalizeVendorOrderStatus,
} from "@/lib/order-status/vendor-status"
import { z } from "zod"

interface RouteContext {
  params: Promise<{ id: string }>
}

const statusUpdateSchema = z.object({
  status: z.string().trim().min(1, '"status" alanı zorunludur.'),
  trackingNumber: z.string().trim().max(128).nullable().optional(),
})

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const requestBody = await req.json().catch(() => null)
    const parsedBody = statusUpdateSchema.safeParse(requestBody)
    if (!parsedBody.success) {
      const message = parsedBody.error.issues[0]?.message ?? "Geçersiz istek gövdesi."
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const newStatusRaw = parsedBody.data.status
    const newStatus = normalizeVendorOrderStatus(newStatusRaw)
    if (
      !(CANONICAL_VENDOR_ORDER_STATUSES as readonly string[]).includes(newStatusRaw) &&
      newStatus !== newStatusRaw
    ) {
      return NextResponse.json(
        { error: `Geçersiz durum. İzin verilenler: ${CANONICAL_VENDOR_ORDER_STATUSES.join(", ")}` },
        { status: 422 }
      )
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
    if (!effectiveStoreId) {
      return NextResponse.json({ error: "Magaza bulunamadi." }, { status: 404 })
    }

    const result = await updateVendorOrderStatus({
      vendorOrderId: id,
      vendorStoreId: effectiveStoreId,
      newStatus,
      trackingNumber: parsedBody.data.trackingNumber ?? null,
    })

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, ...(result.allowedNext ? { allowedNext: result.allowedNext } : {}) },
        { status: result.status }
      )
    }

    return NextResponse.json({ ok: true, status: result.status })
  } catch {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}
