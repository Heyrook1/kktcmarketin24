import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

const CITIES = ["Lefkoşa", "Girne", "Gazimağusa", "Güzelyurt", "İskele", "Lefke", "Diğer"] as const

// Admin (service-role) client — bypasses RLS so we can insert orders on behalf of any user
function getAdmin() {
  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!url || !secret) throw new Error("Missing Supabase service-role env vars")
  return createAdminClient(url, secret)
}

// Generates MKT-YYYYMMDD-NNN order number with a DB sequence per day
async function generateOrderNumber(admin: ReturnType<typeof getAdmin>): Promise<string> {
  const today = new Date()
  const datePart = today.toISOString().slice(0, 10).replace(/-/g, "")

  // Count today's orders to derive sequential number
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
  const { count } = await admin
    .from("orders")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfDay)

  const seq = String((count ?? 0) + 1).padStart(3, "0")
  return `MKT-${datePart}-${seq}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { fullName, phone, address, city, notes, items, cartId } = body as {
      fullName:  string
      phone:     string
      address:   string
      city:      string
      notes?:    string
      cartId?:   string
      items: Array<{
        product_id:   string
        product_name: string
        vendor_id:    string
        vendor_name:  string
        price:        number
        quantity:     number
        variant?:     string
        image_url?:   string
        store_id?:    string
      }>
    }

    // ── Validation ─────────────────────────────────────────────────────────
    if (!fullName?.trim())   return NextResponse.json({ error: "Ad Soyad zorunludur."          }, { status: 400 })
    if (!phone?.trim())      return NextResponse.json({ error: "Telefon numarası zorunludur."   }, { status: 400 })
    if (!address?.trim())    return NextResponse.json({ error: "Teslimat adresi zorunludur."    }, { status: 400 })
    if (!city?.trim())       return NextResponse.json({ error: "Şehir zorunludur."              }, { status: 400 })
    if (!items?.length)      return NextResponse.json({ error: "Sepet boş."                     }, { status: 400 })

    // ── Resolve authenticated user (optional — guests can order too) ────────
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const admin         = getAdmin()
    const orderNumber   = await generateOrderNumber(admin)
    const subtotal      = items.reduce((s, i) => s + i.price * i.quantity, 0)

    // ── Insert order ────────────────────────────────────────────────────────
    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        customer_id:    user?.id ?? null,
        customer_name:  fullName.trim(),
        customer_email: user?.email ?? null,
        customer_phone: phone.trim(),
        delivery_address: {
          fullName: fullName.trim(),
          phone:    phone.trim(),
          line1:    address.trim(),
          city:     city.trim(),
          notes:    notes?.trim() ?? "",
        },
        subtotal,
        shipping_fee:    0,
        discount_amount: 0,
        total:           subtotal,
        payment_status:  "pending",
        saga_status:     "pending",
        cart_id:         cartId ?? null,
      })
      .select("id")
      .single()

    if (orderError || !order) {
      console.error("[place-order] orders insert error:", orderError)
      return NextResponse.json({ error: "Sipariş oluşturulamadı. Lütfen tekrar deneyin." }, { status: 500 })
    }

    const orderId = order.id

    // ── Insert order_items ──────────────────────────────────────────────────
    const orderItems = items.map((item) => ({
      order_id:     orderId,
      product_id:   item.product_id,
      product_name: item.product_name,
      store_id:     item.store_id ?? item.vendor_id,
      quantity:     item.quantity,
      unit_price:   item.price,
      line_total:   item.price * item.quantity,
      image_url:    item.image_url ?? null,
    }))

    const { error: itemsError } = await admin.from("order_items").insert(orderItems)
    if (itemsError) {
      console.error("[place-order] order_items insert error:", itemsError)
      // Non-fatal — order is created; items can be back-filled
    }

    // ── Insert vendor sub-orders (grouped by vendor) ────────────────────────
    const byVendor: Record<string, typeof items> = {}
    for (const item of items) {
      const vid = item.store_id ?? item.vendor_id
      if (!byVendor[vid]) byVendor[vid] = []
      byVendor[vid].push(item)
    }

    const subOrders = Object.entries(byVendor).map(([storeId, vendorItems]) => ({
      order_id:    orderId,
      store_id:    storeId,
      store_name:  vendorItems[0].vendor_name,
      subtotal:    vendorItems.reduce((s, i) => s + i.price * i.quantity, 0),
      step_status: "pending",
      notes:       notes?.trim() ?? null,
      items:       vendorItems,
    }))

    await admin.from("order_vendor_sub_orders").insert(subOrders)

    // ── Insert initial status history ───────────────────────────────────────
    await admin.from("order_status_history").insert({
      order_id:   orderId,
      old_status: null,
      new_status: "pending",
      changed_by: "customer",
      notes:      `Sipariş alındı — ${orderNumber} (COD)`,
    })

    return NextResponse.json({ orderId, orderNumber })

  } catch (err) {
    console.error("[place-order] unexpected error:", err)
    return NextResponse.json({ error: "Beklenmeyen bir hata oluştu." }, { status: 500 })
  }
}
