import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { assertVendorOrderOwnership } from "@/lib/vendor-auth"
import { assertAdminAuth } from "@/lib/admin-auth"
import { recordDeliveryEvent, type DeliveryEventType } from "@/lib/reliability"

interface RouteContext {
  params: Promise<{ id: string }>
}

const VALID_EVENT_TYPES: DeliveryEventType[] = [
  "confirmed",
  "delivered",
  "cancelled_after_dispatch",
  "door_refused",
]

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

type VendorOrderLookup = {
  id: string
  order_id?: string | null
  store_id: string
  customer_email: string
  total: number
  created_at: string
}

function toVendorOrderLookup(value: unknown): VendorOrderLookup | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  const row = value as Record<string, unknown>
  const id = typeof row.id === "string" ? row.id : null
  const storeId = typeof row.store_id === "string" ? row.store_id : null
  const customerEmail = typeof row.customer_email === "string" ? row.customer_email : null
  const createdAt = typeof row.created_at === "string" ? row.created_at : null

  if (!id || !storeId || !customerEmail || !createdAt) {
    return null
  }

  return {
    id,
    order_id: typeof row.order_id === "string" ? row.order_id : null,
    store_id: storeId,
    customer_email: customerEmail,
    total: Number(row.total ?? 0),
    created_at: createdAt,
  }
}

function pickBestParentOrder(
  orders: Array<{ id: string; total: number; created_at: string; customer_id: string | null }>,
  targetTotal: number,
  vendorOrderCreatedAt: string
) {
  const parentTime = new Date(vendorOrderCreatedAt).getTime()
  const scored = orders
    .filter((o) => Math.abs(Number(o.total) - Number(targetTotal)) < 0.01)
    .map((o) => {
      const orderTime = new Date(o.created_at).getTime()
      const diffMs = Math.abs(orderTime - parentTime)
      return { row: o, diffMs }
    })
    .filter((x) => Number.isFinite(x.diffMs) && x.diffMs <= 1000 * 60 * 60 * 24)
    .sort((a, b) => a.diffMs - b.diffMs)
  return scored[0]?.row ?? null
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id: vendorOrderId } = await params

    let body: { eventType?: string; notes?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Geçersiz JSON gövdesi." }, { status: 400 })
    }

    const eventType = body.eventType as DeliveryEventType
    if (!VALID_EVENT_TYPES.includes(eventType)) {
      return NextResponse.json({ error: "Geçersiz etkinlik türü." }, { status: 400 })
    }

    const vendorAuth = await assertVendorOrderOwnership(vendorOrderId)
    let actorUserId: string | null = null

    if (vendorAuth.ok) {
      actorUserId = vendorAuth.session.userId
    } else {
      const adminAuth = await assertAdminAuth()
      if (!adminAuth.ok) {
        return NextResponse.json({ error: vendorAuth.message }, { status: vendorAuth.status })
      }
      actorUserId = adminAuth.userId
    }

    const admin = adminClient()

    const selectWide = "id, order_id, store_id, customer_email, total, created_at"
    const selectLegacy = "id, store_id, customer_email, total, created_at"
    let vendorOrder: VendorOrderLookup | null = null

    for (const sel of [selectWide, selectLegacy]) {
      const { data, error } = await admin
        .from("vendor_orders")
        .select(sel)
        .eq("id", vendorOrderId)
        .maybeSingle()
      const candidate = toVendorOrderLookup(data)
      if (!error && candidate) {
        vendorOrder = candidate
        break
      }
    }

    if (!vendorOrder) {
      return NextResponse.json({ error: "Sipariş satırı bulunamadı." }, { status: 404 })
    }

    let parentOrderId = vendorOrder.order_id ?? null
    let customerId: string | null = null

    if (parentOrderId) {
      const { data: parent } = await admin
        .from("orders")
        .select("id, customer_id")
        .eq("id", parentOrderId)
        .maybeSingle()
      customerId = parent?.customer_id ?? null
    }

    // Legacy fallback: resolve parent order by email + total + close created_at window.
    if (!parentOrderId || !customerId) {
      const { data: candidates } = await admin
        .from("orders")
        .select("id, customer_id, total, created_at")
        .eq("customer_email", vendorOrder.customer_email)
        .order("created_at", { ascending: false })
        .limit(50)

      const best = pickBestParentOrder(
        (candidates ?? []).map((o) => ({
          id: o.id,
          total: Number(o.total),
          created_at: o.created_at,
          customer_id: o.customer_id ?? null,
        })),
        Number(vendorOrder.total),
        vendorOrder.created_at
      )

      parentOrderId = best?.id ?? null
      customerId = best?.customer_id ?? null
    }

    if (!parentOrderId || !customerId) {
      return NextResponse.json(
        { error: "Bu sipariş satırı için ana sipariş eşleştirilemedi. Lütfen durum güncelleme menüsünü kullanın." },
        { status: 422 }
      )
    }

    if (!actorUserId) {
      return NextResponse.json({ error: "Yetki doğrulaması başarısız." }, { status: 403 })
    }

    const result = await recordDeliveryEvent(
      parentOrderId,
      vendorOrder.store_id,
      customerId,
      eventType,
      actorUserId,
      body.notes
    )

    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "İşlem başarısız." }, { status: 500 })
    }

    return NextResponse.json({ ok: true, score: result.score, parentOrderId })
  } catch {
    return NextResponse.json({ error: "Teslimat olayı kaydedilemedi." }, { status: 500 })
  }
}

