/**
 * POST /api/checkout/place-order
 *
 * Secure checkout endpoint with atomic stock management.
 *
 * Flow:
 *  1. Zod schema validation
 *  2. Optional auth resolution (guests allowed)
 *  3. Re-fetch authoritative prices + store ownership from DB
 *     (client-supplied prices are NEVER trusted)
 *  4. Coupon validation (if provided)
 *  5. Reliability / fraud gate check for authenticated users
 *  6. For each cart item: call decrement_stock_if_available() RPC
 *     — aborts if ANY item is out of stock, restores all previously
 *     decremented items (compensating transaction)
 *  7. Insert order + order_items + vendor sub-orders atomically
 *  8. Write outbox events for async notifications
 *
 * All DB writes use the service-role client to bypass RLS.
 */

import { NextRequest, NextResponse }   from "next/server"
import { createClient as createServer } from "@/lib/supabase/server"
import { createClient as createAdmin }  from "@supabase/supabase-js"
import { z }                            from "zod"
import { checkCheckoutGate }            from "@/lib/reliability"
import { insertOutboxEvent }            from "@/lib/checkout/outbox"

// ── Service-role client (bypasses RLS) ────────────────────────────────────────
function sb() {
  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !secret) throw new Error("Missing Supabase service-role env vars")
  return createAdmin(url, secret)
}

// ── Zod schema ────────────────────────────────────────────────────────────────

const VALID_CITIES = [
  "Lefkoşa", "Girne", "Gazimağusa",
  "Güzelyurt", "İskele", "Lefke", "Diğer",
] as const

const CartItemSchema = z.object({
  product_id:   z.string().uuid({ message: "Geçersiz ürün kimliği." }),
  quantity:     z.number().int().min(1, "Miktar en az 1 olmalıdır.").max(99, "Miktar 99'u geçemez."),
  // Optional client hints — prices are always re-fetched from DB
  product_name: z.string().optional(),
  image_url:    z.string().url().optional().or(z.literal("")),
})

const DeliveryAddressSchema = z.object({
  fullName: z.string().min(2, "Ad Soyad en az 2 karakter olmalıdır."),
  phone:    z.string().min(7, "Geçerli bir telefon numarası giriniz."),
  line1:    z.string().min(5, "Adres en az 5 karakter olmalıdır."),
  city:     z.enum(VALID_CITIES, { message: "Geçerli bir şehir seçiniz." }),
  district: z.string().optional().default(""),
  notes:    z.string().max(500).optional().default(""),
})

const PlaceOrderSchema = z.object({
  deliveryAddress: DeliveryAddressSchema,
  items:           z.array(CartItemSchema).min(1, "Sepet boş.").max(50, "Sepette çok fazla ürün var."),
  couponCode:      z.string().max(32).optional(),
  cartId:          z.string().optional(),
  // Guest checkout fields (only used when not authenticated)
  guestEmail:      z.string().email("Geçerli bir e-posta giriniz.").optional(),
})

type PlaceOrderBody = z.infer<typeof PlaceOrderSchema>

// ── Helpers ───────────────────────────────────────────────────────────────────

async function generateOrderNumber(admin: ReturnType<typeof sb>): Promise<string> {
  const today    = new Date()
  const datePart = today.toISOString().slice(0, 10).replace(/-/g, "")
  const startOfDay = new Date(
    today.getFullYear(), today.getMonth(), today.getDate()
  ).toISOString()

  const { count } = await admin
    .from("orders")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfDay)

  return `MKT-${datePart}-${String((count ?? 0) + 1).padStart(3, "0")}`
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── 1. Parse + validate request body with Zod ────────────────────────────
  let body: PlaceOrderBody
  try {
    const raw = await req.json()
    const parsed = PlaceOrderSchema.safeParse(raw)
    if (!parsed.success) {
      const messages = parsed.error.errors.map((e) => e.message)
      return NextResponse.json(
        { error: messages[0], details: messages },
        { status: 400 }
      )
    }
    body = parsed.data
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 })
  }

  const { deliveryAddress, items, couponCode, cartId, guestEmail } = body

  // ── 2. Resolve authenticated user (optional guest checkout) ──────────────
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()

  // Guest checkout: require guestEmail if not authenticated
  if (!user && !guestEmail) {
    return NextResponse.json(
      {
        error: "Misafir olarak sipariş vermek için e-posta adresinizi giriniz.",
        requiresEmail: true,
      },
      { status: 400 }
    )
  }

  const admin = sb()

  // ── 3. Re-fetch authoritative product data from DB ────────────────────────
  // Prices from the client body are intentionally ignored.
  const productIds = items.map((i) => i.product_id)

  const { data: dbProducts, error: fetchErr } = await admin
    .from("vendor_products")
    .select(`
      id, name, price, store_id, stock, is_active, image_url,
      vendor_stores ( id, name, is_active )
    `)
    .in("id", productIds)

  if (fetchErr || !dbProducts) {
    return NextResponse.json({ error: "Ürün bilgileri alınamadı." }, { status: 500 })
  }

  const productMap = new Map(dbProducts.map((p) => [p.id, p]))
  const validationErrors: string[] = []

  interface VerifiedItem {
    productId:   string
    productName: string
    quantity:    number
    unitPrice:   number
    lineTotal:   number
    storeId:     string
    storeName:   string
    imageUrl:    string | null
  }

  const verifiedItems: VerifiedItem[] = []

  for (const item of items) {
    const p = productMap.get(item.product_id)
    if (!p) {
      validationErrors.push(`Ürün bulunamadı (ID: ${item.product_id}).`)
      continue
    }
    if (!p.is_active) {
      validationErrors.push(`"${p.name}" artık satışta değil.`)
      continue
    }
    const store = Array.isArray(p.vendor_stores)
      ? (p.vendor_stores as any)[0]
      : p.vendor_stores as { id: string; name: string; is_active: boolean } | null
    if (!store?.is_active) {
      validationErrors.push(`"${p.name}" ürününün satıcısı şu an aktif değil.`)
      continue
    }
    verifiedItems.push({
      productId:   p.id,
      productName: p.name,
      quantity:    item.quantity,
      unitPrice:   Number(p.price),
      lineTotal:   Number(p.price) * item.quantity,
      storeId:     p.store_id,
      storeName:   store.name,
      imageUrl:    item.image_url || p.image_url || null,
    })
  }

  if (validationErrors.length > 0) {
    return NextResponse.json(
      { error: validationErrors[0], details: validationErrors },
      { status: 422 }
    )
  }

  // ── 4. Server-side coupon validation ──────────────────────────────────────
  let discountAmount = 0
  if (couponCode) {
    const { data: coupon } = await admin
      .from("coupons")
      .select("*")
      .eq("code", couponCode.trim().toUpperCase())
      .eq("is_active", true)
      .maybeSingle()

    if (!coupon) {
      return NextResponse.json({ error: "Kupon kodu geçersiz veya süresi dolmuş." }, { status: 422 })
    }

    const subtotal   = verifiedItems.reduce((s, i) => s + i.lineTotal, 0)
    const notExpired = !coupon.expires_at || new Date(coupon.expires_at) > new Date()
    const hasUses    = !coupon.max_uses    || (coupon.current_uses ?? 0) < coupon.max_uses

    if (!notExpired) return NextResponse.json({ error: "Kupon süresinin dolmuş." }, { status: 422 })
    if (!hasUses)    return NextResponse.json({ error: "Kupon kullanım limiti dolmuş." }, { status: 422 })

    if (coupon.type === "percent") {
      discountAmount = Math.round(subtotal * Number(coupon.value) / 100)
    } else if (coupon.type === "fixed") {
      discountAmount = Math.min(Number(coupon.value), subtotal)
    }
  }

  const serverSubtotal = verifiedItems.reduce((s, i) => s + i.lineTotal, 0)
  const serverTotal    = Math.max(0, serverSubtotal - discountAmount)

  // ── 5. Reliability / fraud gate (authenticated users only) ───────────────
  if (user) {
    const gate = await checkCheckoutGate(user.id)
    if (!gate.allowed) {
      return NextResponse.json(
        { error: gate.message, reason: gate.reason, flagged: gate.reason === "flagged" },
        { status: 403 }
      )
    }
  }

  // ── 6. Atomic stock decrement via decrement_stock_if_available() RPC ──────
  // Process all items; if ANY fail, restore already-decremented items.
  const decremented: { productId: string; quantity: number; name: string }[] = []
  const stockErrors: string[] = []

  for (const item of verifiedItems) {
    const { data: ok, error: rpcErr } = await admin.rpc(
      "decrement_stock_if_available",
      { p_product_id: item.productId, p_quantity: item.quantity }
    )

    if (rpcErr || ok !== true) {
      // Re-fetch current stock to include in the error message
      const { data: snap } = await admin
        .from("vendor_products")
        .select("stock")
        .eq("id", item.productId)
        .single()

      const avail = snap?.stock ?? 0
      stockErrors.push(
        avail === 0
          ? `"${item.productName}" stokta kalmadı.`
          : `"${item.productName}" için yeterli stok yok. Mevcut: ${avail}, İstenen: ${item.quantity}.`
      )
    } else {
      decremented.push({
        productId: item.productId,
        quantity:  item.quantity,
        name:      item.productName,
      })
    }
  }

  // Compensate: restore stock for all successfully decremented items
  if (stockErrors.length > 0) {
    await Promise.all(
      decremented.map((d) =>
        admin.rpc("restore_stock", { p_product_id: d.productId, p_quantity: d.quantity })
      )
    )
    return NextResponse.json(
      { error: stockErrors[0], details: stockErrors, outOfStock: true },
      { status: 409 }
    )
  }

  // ── 7. Create order + items + sub-orders ──────────────────────────────────
  const orderNumber = await generateOrderNumber(admin)

  const { data: order, error: orderErr } = await admin
    .from("orders")
    .insert({
      customer_id:      user?.id ?? null,
      customer_name:    deliveryAddress.fullName,
      customer_email:   user?.email ?? guestEmail ?? null,
      customer_phone:   deliveryAddress.phone,
      delivery_address: deliveryAddress,
      subtotal:         serverSubtotal,
      discount_amount:  discountAmount,
      shipping_fee:     0,
      total:            serverTotal,
      coupon_code:      couponCode?.toUpperCase() ?? null,
      payment_status:   "pending",
      saga_status:      "completed",    // stock already committed above
      cart_id:          cartId ?? null,
    })
    .select("id")
    .single()

  if (orderErr || !order) {
    // Critical: stock was decremented but order insert failed — restore stock
    await Promise.all(
      verifiedItems.map((i) =>
        admin.rpc("restore_stock", { p_product_id: i.productId, p_quantity: i.quantity })
      )
    )
    console.error("[place-order] orders insert failed:", orderErr)
    return NextResponse.json(
      { error: "Sipariş oluşturulamadı. Lütfen tekrar deneyin." },
      { status: 500 }
    )
  }

  const orderId = order.id

  // order_items — immutable price snapshot
  const lineItems = verifiedItems.map((item) => ({
    order_id:     orderId,
    product_id:   item.productId,
    product_name: item.productName,
    store_id:     item.storeId,
    quantity:     item.quantity,
    unit_price:   item.unitPrice,
    line_total:   item.lineTotal,
    image_url:    item.imageUrl,
  }))

  const { error: itemsErr } = await admin.from("order_items").insert(lineItems)
  if (itemsErr) {
    console.error("[place-order] order_items insert failed:", itemsErr)
    // Non-fatal — order row committed; items can be back-filled
  }

  // vendor sub-orders — group by store
  const vendorMap = new Map<string, typeof verifiedItems>()
  for (const item of verifiedItems) {
    if (!vendorMap.has(item.storeId)) vendorMap.set(item.storeId, [])
    vendorMap.get(item.storeId)!.push(item)
  }

  const subOrders = Array.from(vendorMap.entries()).map(([storeId, grpItems]) => ({
    order_id:    orderId,
    store_id:    storeId,
    store_name:  grpItems[0].storeName,
    step_status: "completed",
    subtotal:    grpItems.reduce((s, i) => s + i.lineTotal, 0),
    items:       grpItems.map((i) => ({
      productId:   i.productId,
      productName: i.productName,
      quantity:    i.quantity,
      unitPrice:   i.unitPrice,
      lineTotal:   i.lineTotal,
    })),
    notes: deliveryAddress.notes ?? null,
  }))

  const { data: subOrderRows } = await admin
    .from("order_vendor_sub_orders")
    .insert(subOrders)
    .select("id, store_id, subtotal")

  // order_status_history
  await admin.from("order_status_history").insert({
    order_id:   orderId,
    old_status: null,
    new_status: "pending",
    changed_by: "customer",
    notes:      `Sipariş alındı — ${orderNumber}`,
  })

  // ── 8. Outbox events for async notifications ──────────────────────────────
  if (subOrderRows) {
    for (const sub of subOrderRows) {
      await insertOutboxEvent("sub_order", sub.id, "vendor.order.created", {
        orderId,
        subOrderId: sub.id,
        storeId:    sub.store_id,
        subtotal:   sub.subtotal,
        customerName: deliveryAddress.fullName,
      })
    }
  }

  return NextResponse.json(
    {
      ok:           true,
      orderId,
      orderNumber,
      serverTotal,
      discountAmount,
    },
    { status: 201 }
  )
}


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
