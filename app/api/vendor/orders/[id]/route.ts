import { NextResponse } from "next/server"
import { createClient as createAdmin } from "@supabase/supabase-js"
import { assertVendorOrderOwnership } from "@/lib/vendor-auth"
import { assertAdminAuth } from "@/lib/admin-auth"
import { z } from "zod"

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

const vendorOrderRowSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid().nullable().optional(),
  store_id: z.string().uuid(),
  customer_name: z.string(),
  customer_email: z.string(),
  items_count: z.number(),
  total: z.number(),
  status: z.string(),
  tracking_number: z.string().nullable().optional(),
  created_at: z.string(),
})

const parentOrderSchema = z.object({
  id: z.string().uuid(),
  order_number: z.string().nullable(),
  payment_status: z.string().nullable(),
  customer_phone: z.string().nullable(),
  coupon_code: z.string().nullable(),
  subtotal: z.number().nullable(),
  shipping_fee: z.number().nullable(),
  discount_amount: z.number().nullable(),
  total: z.number().nullable(),
  created_at: z.string(),
  delivery_address: z.record(z.unknown()).nullable(),
})

const orderItemSchema = z.object({
  id: z.string().uuid(),
  product_name: z.string(),
  image_url: z.string().nullable(),
  quantity: z.number(),
  unit_price: z.number(),
  line_total: z.number(),
  store_id: z.string().uuid(),
})

const historyWideSchema = z.object({
  id: z.string().uuid(),
  old_status: z.string().nullable(),
  new_status: z.string(),
  notes: z.string().nullable(),
  created_at: z.string(),
  vendor_order_id: z.string().uuid().nullable().optional(),
})

const historyLegacySchema = z.object({
  id: z.string().uuid(),
  old_status: z.string().nullable(),
  new_status: z.string(),
  notes: z.string().nullable(),
  created_at: z.string(),
})

export async function GET(_: Request, { params }: RouteContext) {
  try {
    const { id } = await params

    const vendorAuth = await assertVendorOrderOwnership(id)
    if (!vendorAuth.ok) {
      const adminAuth = await assertAdminAuth()
      if (!adminAuth.ok) {
        return NextResponse.json({ error: vendorAuth.message }, { status: vendorAuth.status })
      }
    }

    const admin = adminClient()

    const selectWide =
      "id, order_id, store_id, customer_name, customer_email, items_count, total, status, tracking_number, created_at"
    const selectMid =
      "id, order_id, store_id, customer_name, customer_email, items_count, total, status, created_at"
    const selectMin =
      "id, store_id, customer_name, customer_email, items_count, total, status, created_at"

    let vendorOrder: z.infer<typeof vendorOrderRowSchema> | null = null
    for (const select of [selectWide, selectMid, selectMin]) {
      const { data, error } = await admin
        .from("vendor_orders")
        .select(select)
        .eq("id", id)
        .maybeSingle()
      const parsedVendorOrder = vendorOrderRowSchema.safeParse(data)
      if (!error && parsedVendorOrder.success) {
        vendorOrder = parsedVendorOrder.data
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

    let order: z.infer<typeof parentOrderSchema> | null = null
    let items: Array<z.infer<typeof orderItemSchema>> = []
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
      const parsedParentOrder = parentOrderSchema.safeParse(parentOrder)
      order = parsedParentOrder.success ? parsedParentOrder.data : null

      const { data: orderItems } = await admin
        .from("order_items")
        .select("id, product_name, image_url, quantity, unit_price, line_total, store_id")
        .eq("order_id", orderId)
        .eq("store_id", vendorOrder.store_id)
      items = (orderItems ?? [])
        .map((row) => orderItemSchema.safeParse(row))
        .filter((row): row is { success: true; data: z.infer<typeof orderItemSchema> } => row.success)
        .map((row) => row.data)

      const historyWide = await admin
        .from("order_status_history")
        .select("id, old_status, new_status, notes, created_at, vendor_order_id")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(40)
      if (!historyWide.error && historyWide.data) {
        history = (historyWide.data ?? [])
          .map((row) => historyWideSchema.safeParse(row))
          .filter((row): row is { success: true; data: z.infer<typeof historyWideSchema> } => row.success)
          .map((row) => row.data)
          .filter((row) => !row.vendor_order_id || row.vendor_order_id === id)
          .map((row) => ({
            id: row.id,
            old_status: row.old_status,
            new_status: row.new_status,
            notes: row.notes,
            created_at: row.created_at,
          }))
      } else {
        const historyLegacy = await admin
          .from("order_status_history")
          .select("id, old_status, new_status, notes, created_at")
          .eq("order_id", orderId)
          .order("created_at", { ascending: false })
          .limit(40)
        history = (historyLegacy.data ?? [])
          .map((row) => historyLegacySchema.safeParse(row))
          .filter((row): row is { success: true; data: z.infer<typeof historyLegacySchema> } => row.success)
          .map((row) => ({
            id: row.data.id,
            old_status: row.data.old_status,
            new_status: row.data.new_status,
            notes: row.data.notes,
            created_at: row.data.created_at,
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
        delivery_address: order?.delivery_address ?? null,
        items,
        history,
      },
    })
  } catch {
    return NextResponse.json({ error: "Sipariş detayları alınamadı." }, { status: 500 })
  }
}

