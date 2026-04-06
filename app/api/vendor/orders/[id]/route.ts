import { NextResponse } from "next/server"
import { createClient as createAdmin } from "@supabase/supabase-js"
import { assertVendorOrderOwnership } from "@/lib/vendor-auth"
import { assertAdminAuth } from "@/lib/admin-auth"

interface RouteContext {
  params: Promise<{ id: string }>
}

function adminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function GET(_: Request, { params }: RouteContext) {
  const { id } = await params

  const vendorAuth = await assertVendorOrderOwnership(id)
  if (!vendorAuth.ok) {
    const adminAuth = await assertAdminAuth()
    if (!adminAuth.ok) {
      return NextResponse.json({ error: vendorAuth.message }, { status: vendorAuth.status })
    }
  }

  const admin = adminClient()

  type VendorOrderRow = {
    id: string
    order_id?: string | null
    store_id: string
    customer_name: string
    customer_email: string
    items_count: number
    total: number
    status: string
    tracking_number?: string | null
    created_at: string
  }

  const selectWide =
    "id, order_id, store_id, customer_name, customer_email, items_count, total, status, tracking_number, created_at"
  const selectMid =
    "id, order_id, store_id, customer_name, customer_email, items_count, total, status, created_at"
  const selectMin =
    "id, store_id, customer_name, customer_email, items_count, total, status, created_at"

  let vendorOrder: VendorOrderRow | null = null
  for (const select of [selectWide, selectMid, selectMin]) {
    const { data, error } = await admin
      .from("vendor_orders")
      .select(select)
      .eq("id", id)
      .maybeSingle()
    if (!error && data) {
      vendorOrder = data as VendorOrderRow
      break
    }
  }

  if (!vendorOrder) {
    return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 })
  }

  const orderId = vendorOrder.order_id ?? null
  const { data: store } = await admin
    .from("vendor_stores")
    .select("name")
    .eq("id", vendorOrder.store_id)
    .maybeSingle()

  let order: {
    id: string
    order_number: string | null
    payment_status: string | null
    customer_phone: string | null
    coupon_code: string | null
    subtotal: number | null
    shipping_fee: number | null
    discount_amount: number | null
    total: number | null
    created_at: string
    delivery_address: Record<string, unknown> | null
  } | null = null
  let items: Array<{
    id: string
    product_name: string
    image_url: string | null
    quantity: number
    unit_price: number
    line_total: number
    store_id: string
  }> = []
  let history: Array<{
    id: string
    old_status: string | null
    new_status: string
    notes: string | null
    created_at: string
  }> = []

  if (orderId) {
    const { data: parentOrder } = await admin
      .from("orders")
      .select("id, order_number, payment_status, customer_phone, coupon_code, subtotal, shipping_fee, discount_amount, total, created_at, delivery_address")
      .eq("id", orderId)
      .maybeSingle()
    order = (parentOrder as typeof order) ?? null

    const { data: orderItems } = await admin
      .from("order_items")
      .select("id, product_name, image_url, quantity, unit_price, line_total, store_id")
      .eq("order_id", orderId)
      .eq("store_id", vendorOrder.store_id)
    items = (orderItems ?? []) as typeof items

    const historyWide = await admin
      .from("order_status_history")
      .select("id, old_status, new_status, notes, created_at, vendor_order_id")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(40)
    if (!historyWide.error && historyWide.data) {
      history = (historyWide.data ?? [])
        .filter((h) => !h.vendor_order_id || h.vendor_order_id === id)
        .map((h) => ({
          id: h.id,
          old_status: h.old_status ?? null,
          new_status: h.new_status,
          notes: h.notes ?? null,
          created_at: h.created_at,
        }))
    } else {
      const historyLegacy = await admin
        .from("order_status_history")
        .select("id, old_status, new_status, notes, created_at")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(40)
      history = (historyLegacy.data ?? []).map((h) => ({
        id: h.id,
        old_status: h.old_status ?? null,
        new_status: h.new_status,
        notes: h.notes ?? null,
        created_at: h.created_at,
      }))
    }
  }

  return NextResponse.json({
    order: {
      id: vendorOrder.id,
      order_id: orderId,
      order_number: order?.order_number ?? null,
      store_id: vendorOrder.store_id,
      store_name: store?.name ?? null,
      status: vendorOrder.status,
      tracking_number: vendorOrder.tracking_number ?? null,
      customer_name: vendorOrder.customer_name,
      customer_email: vendorOrder.customer_email,
      customer_phone: order?.customer_phone ?? null,
      payment_status: order?.payment_status ?? null,
      coupon_code: order?.coupon_code ?? null,
      subtotal: Number(order?.subtotal ?? vendorOrder.total ?? 0),
      shipping_fee: Number(order?.shipping_fee ?? 0),
      discount_amount: Number(order?.discount_amount ?? 0),
      total: Number(order?.total ?? vendorOrder.total ?? 0),
      created_at: order?.created_at ?? vendorOrder.created_at,
      delivery_address: (order?.delivery_address ?? null) as Record<string, unknown> | null,
      items,
      history,
    },
  })
}

