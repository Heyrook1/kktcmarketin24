/**
 * POST /api/checkout/place-order
 *
 * Secure checkout endpoint with atomic stock management.
 *
 * Flow:
 *  1. Zod schema validation
 *  2. Optional auth (guests allowed via guestEmail)
 *  3. Re-fetch authoritative prices from DB (client prices ignored)
 *  4. Coupon validation
 *  5. Reliability / fraud gate (auth users only)
 *  6. decrement_stock_if_available() RPC per item — compensates on failure
 *  7. Insert order + order_items + vendor sub-orders
 *  8. Outbox events for async notifications
 */

import { NextRequest, NextResponse }    from "next/server"
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
  product_name: z.string().optional(),
  image_url:    z.string().max(2048).optional().nullable(),
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
  guestEmail:      z.string().email("Geçerli bir e-posta giriniz.").optional(),
})

type PlaceOrderBody = z.infer<typeof PlaceOrderSchema>

/** İstanbul (TR/KKTC) — 24 saat */
const ORDER_NUMBER_TZ = "Europe/Istanbul"

// ── Helpers ───────────────────────────────────────────────────────────────────

function sanitizeVendorLabel(raw: string): string {
  const tr: Record<string, string> = {
    ç: "C", Ç: "C", ğ: "G", Ğ: "G", ı: "I", İ: "I", i: "I", ö: "O", Ö: "O", ş: "S", Ş: "S", ü: "U", Ü: "U",
  }
  let s = raw
    .trim()
    .split("")
    .map((ch) => tr[ch] ?? ch)
    .join("")
  s = s.replace(/[^a-zA-Z0-9]+/g, "")
  s = s.toUpperCase()
  return s.slice(0, 24) || "MAGAZA"
}

function istanbulDateTimeParts(d: Date): { ddmmyyyy: string; hhmm: string } {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: ORDER_NUMBER_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
  const parts = fmt.formatToParts(d)
  const get = (t: Intl.DateTimeFormatPartTypes) =>
    (parts.find((p) => p.type === t)?.value ?? "0").padStart(2, "0")
  const day = get("day")
  const month = get("month")
  const year = parts.find((p) => p.type === "year")?.value ?? "0000"
  const hour = get("hour")
  const minute = get("minute")
  return {
    ddmmyyyy: `${day}${month}${year}`,
    hhmm: `${hour}${minute}`,
  }
}

function vendorLabelFromVerifiedItems(
  items: { storeId: string; storeName: string }[],
): string {
  const byStore = new Map<string, string>()
  for (const i of items) {
    if (!byStore.has(i.storeId)) byStore.set(i.storeId, i.storeName)
  }
  if (byStore.size === 0) return "MAGAZA"
  if (byStore.size === 1) return sanitizeVendorLabel([...byStore.values()][0])
  return "COKLU"
}

/**
 * Format: SATICIADI-DDMMYYYY-HHmm-sırano (İstanbul, 24s).
 * Aynı önek (aynı dakika + aynı satıcı etiketi) için sıra 1, 2, 3…
 */
async function generateUniqueOrderNumber(
  admin: ReturnType<typeof sb>,
  items: { storeId: string; storeName: string }[],
): Promise<string> {
  const vendor = vendorLabelFromVerifiedItems(items)
  const { ddmmyyyy, hhmm } = istanbulDateTimeParts(new Date())
  const base = `${vendor}-${ddmmyyyy}-${hhmm}`

  const { data: rows } = await admin
    .from("orders")
    .select("order_number")
    .like("order_number", `${base}-%`)

  let maxSeq = 0
  for (const r of rows ?? []) {
    const on = r.order_number
    if (!on.startsWith(`${base}-`)) continue
    const tail = on.slice(base.length + 1)
    const n = parseInt(tail, 10)
    if (!Number.isNaN(n)) maxSeq = Math.max(maxSeq, n)
  }

  const nextSeq = maxSeq + 1
  return `${base}-${nextSeq}`
}

const MAX_ORDER_NUMBER_RETRIES = 15

function isUniqueViolation(err: { code?: string } | null | undefined): boolean {
  return err?.code === "23505"
}

/** Eski şema: order_number yok — Postgres metni çoğu zaman `details` içinde gelir */
function isOrderNumberColumnMissing(
  err: { code?: string; message?: string; details?: string; hint?: string } | null | undefined,
): boolean {
  if (!err) return false
  const text = [err.message, err.details, err.hint].filter(Boolean).join(" ").toLowerCase()
  if (err.code === "42703") return true
  if (err.code === "PGRST204" && text.includes("order_number")) return true
  if (text.includes("orders.order_number") && text.includes("does not exist")) return true
  if (text.includes("order_number") && (text.includes("column") || text.includes("does not exist"))) return true
  return false
}

/**
 * INSERT bazen order_number döndürmez (şema önbelleği / sessiz yok sayma). Satırda boşsa UPDATE ile tamamla.
 */
async function ensureOrderNumberOnRow(
  admin: ReturnType<typeof sb>,
  orderId: string,
  lastCandidate: string,
  items: { storeId: string; storeName: string }[],
): Promise<string> {
  const { data: row } = await admin.from("orders").select("order_number").eq("id", orderId).maybeSingle()
  if (row?.order_number) return row.order_number

  let candidate = lastCandidate
  for (let u = 0; u < MAX_ORDER_NUMBER_RETRIES; u++) {
    const { data: updated, error: upErr } = await admin
      .from("orders")
      .update({ order_number: candidate })
      .eq("id", orderId)
      .select("order_number")
      .single()
    if (!upErr && updated?.order_number) return updated.order_number
    if (upErr && isUniqueViolation(upErr)) {
      candidate = await generateUniqueOrderNumber(admin, items)
      continue
    }
    if (upErr && isOrderNumberColumnMissing(upErr)) {
      return lastCandidate
    }
    if (upErr) {
      console.warn("[place-order] ensureOrderNumberOnRow update failed:", upErr.message)
    }
    candidate = await generateUniqueOrderNumber(admin, items)
  }
  return lastCandidate
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Validate
  let body: PlaceOrderBody
  try {
    const raw    = await req.json()
    const parsed = PlaceOrderSchema.safeParse(raw)
    if (!parsed.success) {
      const messages = parsed.error.errors.map((e) => e.message)
      return NextResponse.json({ error: messages[0], details: messages }, { status: 400 })
    }
    body = parsed.data
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 })
  }

  const { deliveryAddress, items, couponCode, cartId, guestEmail } = body

  // 2. Auth
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !guestEmail) {
    return NextResponse.json(
      { error: "Misafir olarak sipariş vermek için e-posta adresinizi giriniz.", requiresEmail: true },
      { status: 400 }
    )
  }

  const admin = sb()

  // 3. Re-fetch authoritative product data
  const productIds = items.map((i) => i.product_id)
  const { data: dbProducts, error: fetchErr } = await admin
    .from("vendor_products")
    .select("id, name, price, store_id, stock, is_active, image_url, vendor_stores ( id, name, is_active )")
    .in("id", productIds)

  if (fetchErr || !dbProducts) {
    return NextResponse.json({ error: "Ürün bilgileri alınamadı." }, { status: 500 })
  }

  const productMap       = new Map(dbProducts.map((p) => [p.id, p]))
  const validationErrors: string[] = []

  interface VerifiedItem {
    productId: string; productName: string; quantity: number
    unitPrice: number; lineTotal: number
    storeId: string; storeName: string; imageUrl: string | null
  }
  const verifiedItems: VerifiedItem[] = []

  for (const item of items) {
    const p = productMap.get(item.product_id)
    if (!p) { validationErrors.push(`Ürün bulunamadı (ID: ${item.product_id}).`); continue }
    if (!p.is_active) { validationErrors.push(`"${p.name}" artık satışta değil.`); continue }
    const store = Array.isArray(p.vendor_stores)
      ? (p.vendor_stores as any)[0]
      : p.vendor_stores as { id: string; name: string; is_active: boolean } | null
    if (!store?.is_active) { validationErrors.push(`"${p.name}" ürününün satıcısı aktif değil.`); continue }
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
    return NextResponse.json({ error: validationErrors[0], details: validationErrors }, { status: 422 })
  }

  // 4. Coupon
  let discountAmount = 0
  if (couponCode) {
    const { data: coupon } = await admin
      .from("coupons")
      .select("*")
      .eq("code", couponCode.trim().toUpperCase())
      .eq("is_active", true)
      .maybeSingle()
    if (!coupon) return NextResponse.json({ error: "Kupon kodu geçersiz veya süresi dolmuş." }, { status: 422 })
    const subtotal   = verifiedItems.reduce((s, i) => s + i.lineTotal, 0)
    const notExpired = !coupon.expires_at || new Date(coupon.expires_at) > new Date()
    const hasUses    = !coupon.max_uses    || (coupon.current_uses ?? 0) < coupon.max_uses
    if (!notExpired) return NextResponse.json({ error: "Kupon süresinin dolmuş." }, { status: 422 })
    if (!hasUses)    return NextResponse.json({ error: "Kupon kullanım limiti dolmuş." }, { status: 422 })
    if (coupon.type === "percent") discountAmount = Math.round(subtotal * Number(coupon.value) / 100)
    else if (coupon.type === "fixed") discountAmount = Math.min(Number(coupon.value), subtotal)
  }

  const serverSubtotal = verifiedItems.reduce((s, i) => s + i.lineTotal, 0)
  const serverTotal    = Math.max(0, serverSubtotal - discountAmount)

  // 5. Fraud gate
  if (user) {
    const gate = await checkCheckoutGate(user.id)
    if (!gate.allowed) {
      return NextResponse.json(
        { error: gate.message, reason: gate.reason, flagged: gate.reason === "flagged" },
        { status: 403 }
      )
    }
  }

  // 6. Atomic stock decrement — compensate on any failure
  const decremented: { productId: string; quantity: number; name: string }[] = []
  const stockErrors: string[] = []

  for (const item of verifiedItems) {
    const { data: ok, error: rpcErr } = await admin.rpc(
      "decrement_stock_if_available",
      { p_product_id: item.productId, p_quantity: item.quantity }
    )
    if (rpcErr || ok !== true) {
      const { data: snap } = await admin
        .from("vendor_products").select("stock").eq("id", item.productId).single()
      const avail = snap?.stock ?? 0
      stockErrors.push(
        avail === 0
          ? `"${item.productName}" stokta kalmadı.`
          : `"${item.productName}" için yeterli stok yok. Mevcut: ${avail}, İstenen: ${item.quantity}.`
      )
    } else {
      decremented.push({ productId: item.productId, quantity: item.quantity, name: item.productName })
    }
  }

  if (stockErrors.length > 0) {
    await Promise.all(
      decremented.map((d) => admin.rpc("restore_stock", { p_product_id: d.productId, p_quantity: d.quantity }))
    )
    return NextResponse.json({ error: stockErrors[0], details: stockErrors, outOfStock: true }, { status: 409 })
  }

  // 7. Insert order — order_number tek INSERT ile (idx_orders_order_number_unique, 021); 23505 → yeniden dene
  const customerEmail =
    user?.email?.trim() || guestEmail?.trim() || "noemail@marketin24.local"

  const orderInsertBase = {
    customer_id:      user?.id ?? null,
    customer_name:    deliveryAddress.fullName,
    customer_email:   customerEmail,
    customer_phone:   deliveryAddress.phone,
    delivery_address: deliveryAddress,
    subtotal:         serverSubtotal,
    discount_amount:  discountAmount,
    shipping_fee:     0,
    total:            serverTotal,
    coupon_code:      couponCode?.toUpperCase() ?? null,
    payment_status:   "pending",
    saga_status:      "completed",
    cart_id:          cartId ?? null,
  }

  let order: { id: string; order_number: string | null } | null = null
  let orderNumber = ""

  for (let attempt = 0; attempt < MAX_ORDER_NUMBER_RETRIES; attempt++) {
    orderNumber = await generateUniqueOrderNumber(admin, verifiedItems)
    const { data: inserted, error: orderErr } = await admin
      .from("orders")
      .insert({ ...orderInsertBase, order_number: orderNumber })
      .select("id, order_number")
      .single()

    if (!orderErr && inserted) {
      order = inserted
      break
    }

    if (orderErr && isUniqueViolation(orderErr)) {
      continue
    }

    if (orderErr && isOrderNumberColumnMissing(orderErr)) {
      // Sütun yokken .select("order_number") tüm isteği düşürür; yalnızca id dön.
      const { data: legacyOrder, error: legacyErr } = await admin
        .from("orders")
        .insert(orderInsertBase)
        .select("id")
        .single()
      if (legacyErr || !legacyOrder) {
        await Promise.all(
          verifiedItems.map((i) => admin.rpc("restore_stock", { p_product_id: i.productId, p_quantity: i.quantity }))
        )
        console.error("[place-order] orders insert (legacy) failed:", legacyErr)
        const devHint =
          process.env.NODE_ENV === "development" && legacyErr?.message
            ? ` (${legacyErr.message})`
            : ""
        return NextResponse.json(
          { error: `Sipariş oluşturulamadı. Lütfen tekrar deneyin.${devHint}` },
          { status: 500 }
        )
      }
      order = { id: legacyOrder.id, order_number: null }
      for (let u = 0; u < MAX_ORDER_NUMBER_RETRIES; u++) {
        orderNumber = await generateUniqueOrderNumber(admin, verifiedItems)
        const { error: upErr } = await admin
          .from("orders")
          .update({ order_number: orderNumber })
          .eq("id", order.id)
        if (!upErr) break
        if (isUniqueViolation(upErr)) continue
        console.warn("[place-order] order_number update skipped:", upErr.message)
        break
      }
      break
    }

    await Promise.all(
      verifiedItems.map((i) => admin.rpc("restore_stock", { p_product_id: i.productId, p_quantity: i.quantity }))
    )
    console.error("[place-order] orders insert failed:", orderErr)
    const devHint =
      process.env.NODE_ENV === "development" && orderErr?.message
        ? ` (${orderErr.message})`
        : ""
    return NextResponse.json(
      { error: `Sipariş oluşturulamadı. Lütfen tekrar deneyin.${devHint}` },
      { status: 500 }
    )
  }

  if (!order) {
    await Promise.all(
      verifiedItems.map((i) => admin.rpc("restore_stock", { p_product_id: i.productId, p_quantity: i.quantity }))
    )
    return NextResponse.json(
      { error: "Sipariş numarası atanamadı (çok sayıda çakışma). Lütfen tekrar deneyin." },
      { status: 409 }
    )
  }

  if (!order.order_number) {
    orderNumber = await ensureOrderNumberOnRow(admin, order.id, orderNumber, verifiedItems)
  } else {
    orderNumber = order.order_number
  }

  const orderId = order.id

  const vendorMap = new Map<string, typeof verifiedItems>()
  for (const item of verifiedItems) {
    if (!vendorMap.has(item.storeId)) vendorMap.set(item.storeId, [])
    vendorMap.get(item.storeId)!.push(item)
  }

  const subOrderRows: { id: string; store_id: string; subtotal: number }[] = []

  try {
    for (const [, grpItems] of vendorMap) {
      const grpSubtotal = grpItems.reduce((s, i) => s + i.lineTotal, 0)
      const storeId = grpItems[0].storeId
      const storeName = grpItems[0].storeName

      const { data: subOrder, error: subErr } = await admin
        .from("order_vendor_sub_orders")
        .insert({
          order_id:    orderId,
          store_id:    storeId,
          store_name:  storeName,
          step_status: "completed",
          subtotal:    grpSubtotal,
          items:       grpItems.map((i) => ({
            productId: i.productId,
            productName: i.productName,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            lineTotal: i.lineTotal,
          })),
          notes: deliveryAddress.notes ?? null,
        })
        .select("id, store_id, subtotal")
        .single()

      if (subErr || !subOrder) {
        throw new Error(subErr?.message ?? "sub_order insert failed")
      }

      const { error: itemsErr } = await admin.from("order_items").insert(
        grpItems.map((item) => ({
          order_id:     orderId,
          sub_order_id: subOrder.id,
          product_id:   item.productId,
          product_name: item.productName,
          store_id:     item.storeId,
          quantity:     item.quantity,
          unit_price:   item.unitPrice,
          line_total:   item.lineTotal,
          image_url:    item.imageUrl,
        }))
      )
      if (itemsErr) throw new Error(itemsErr.message)

      const itemsCount = grpItems.reduce((n, i) => n + i.quantity, 0)
      const voFull = {
        store_id:       storeId,
        order_id:       orderId,
        sub_order_id:   subOrder.id,
        customer_name:  deliveryAddress.fullName,
        customer_email: customerEmail,
        status:         "pending",
        total:          grpSubtotal,
        items_count:    itemsCount,
        notes:          deliveryAddress.notes ?? null,
      }
      let voErr = (await admin.from("vendor_orders").insert(voFull)).error
      if (voErr) {
        console.warn("[place-order] vendor_orders full insert failed, retrying minimal row:", voErr.message)
        voErr = (
          await admin.from("vendor_orders").insert({
            store_id:       storeId,
            customer_name:  deliveryAddress.fullName,
            customer_email: customerEmail,
            status:         "pending",
            total:          grpSubtotal,
            items_count:    itemsCount,
            notes:          deliveryAddress.notes ?? null,
          })
        ).error
      }
      if (voErr) throw new Error(voErr.message)

      subOrderRows.push({ id: subOrder.id, store_id: subOrder.store_id, subtotal: subOrder.subtotal })
    }
  } catch (e) {
    console.error("[place-order] sub-order / items / vendor_orders failed:", e)
    await Promise.all(
      verifiedItems.map((i) => admin.rpc("restore_stock", { p_product_id: i.productId, p_quantity: i.quantity }))
    )
    await admin.from("orders").delete().eq("id", orderId)
    return NextResponse.json(
      { error: "Sipariş kaydedilirken bir hata oluştu. Lütfen tekrar deneyin." },
      { status: 500 }
    )
  }

  await admin.from("order_status_history").insert({
    order_id:   orderId,
    old_status: null,
    new_status: "pending",
    changed_by: "customer",
    notes:      `Sipariş alındı — ${orderNumber}`,
  })

  // 8. Outbox events
  for (const sub of subOrderRows) {
    await insertOutboxEvent("sub_order", sub.id, "vendor.order.created", {
      orderId,
      subOrderId: sub.id,
      storeId: sub.store_id,
      subtotal: sub.subtotal,
      customerName: deliveryAddress.fullName,
    })
  }

  return NextResponse.json({ ok: true, orderId, orderNumber, serverTotal, discountAmount }, { status: 201 })
}
