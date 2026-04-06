import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdmin } from "@supabase/supabase-js"
import { OrderConfirmationClient } from "./order-confirmation-client"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Sipariş Onaylandı | Marketin24",
  description: "Siparişiniz başarıyla alındı",
}

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ orderNumber?: string | string[] }>
}

/** URL’den gelen sipariş no (checkout yönlendirmesi); yalnızca güvenli karakterler */
function sanitizeOrderNumberFromSearch(raw: string | string[] | undefined): string | undefined {
  const v = Array.isArray(raw) ? raw[0] : raw
  if (!v) return undefined
  try {
    const s = decodeURIComponent(v).trim()
    if (s.length > 80 || s.length < 4) return undefined
    if (!/^[A-Za-z0-9-]+$/.test(s)) return undefined
    return s
  } catch {
    return undefined
  }
}

export default async function OrderConfirmationPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const sp = await searchParams
  const orderNumberFromCheckout = sanitizeOrderNumberFromSearch(sp.orderNumber)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const orderSelect = `
      id,
      created_at,
      customer_name,
      customer_phone,
      customer_email,
      delivery_address,
      subtotal,
      shipping_fee,
      discount_amount,
      total,
      order_number,
      saga_status,
      payment_status,
      order_items (
        id,
        product_name,
        quantity,
        unit_price,
        line_total,
        image_url,
        store_id
      ),
      order_vendor_sub_orders (
        id,
        store_id,
        store_name,
        subtotal,
        step_status
      )
    `
  const legacyOrderSelect = `
      id,
      created_at,
      customer_name,
      customer_phone,
      customer_email,
      delivery_address,
      subtotal,
      shipping_fee,
      discount_amount,
      total,
      saga_status,
      payment_status,
      order_items (
        id,
        product_name,
        quantity,
        unit_price,
        line_total,
        image_url,
        store_id
      ),
      order_vendor_sub_orders (
        id,
        store_id,
        store_name,
        subtotal,
        step_status
      )
    `

  const { data: ownOrder, error: ownErr } = await supabase
    .from("orders")
    .select(orderSelect)
    .eq("id", id)
    .maybeSingle()

  let order = ownOrder
  if (!order && ownErr?.message?.includes("order_number")) {
    const { data: legacyOrder } = await supabase
      .from("orders")
      .select(legacyOrderSelect)
      .eq("id", id)
      .maybeSingle()
    order = legacyOrder ? { ...legacyOrder, order_number: null } : null
  }

  // Fallback: RLS cache / hydration race durumlarında, yalnızca aynı kullanıcıya ait siparişi
  // service-role ile doğrulayıp göster.
  if (!order && user) {
    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: adminOrder, error: adminErr } = await admin
      .from("orders")
      .select(orderSelect)
      .eq("id", id)
      .eq("customer_id", user.id)
      .maybeSingle()

    order = adminOrder ?? null
    if (!order && adminErr?.message?.includes("order_number")) {
      const { data: legacyAdminOrder } = await admin
        .from("orders")
        .select(legacyOrderSelect)
        .eq("id", id)
        .eq("customer_id", user.id)
        .maybeSingle()
      order = legacyAdminOrder ? { ...legacyAdminOrder, order_number: null } : null
    }

    // Legacy kayıtlar: customer_id null olabilir, aynı user email'i ile kontrol et.
    if (!order && user.email) {
      const { data: emailMatchedOrder } = await admin
        .from("orders")
        .select(legacyOrderSelect)
        .eq("id", id)
        .eq("customer_email", user.email)
        .maybeSingle()
      order = emailMatchedOrder ? { ...emailMatchedOrder, order_number: null } : null
    }
  }

  if (!order) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-xl border bg-card p-6 text-center">
          <h1 className="text-xl font-semibold">Sipariş bilgisi hazırlanıyor</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Siparişiniz alındı, ancak onay sayfası henüz yüklenemedi.
            Birkaç saniye sonra tekrar deneyin.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Link href="/" className="text-sm underline underline-offset-4">
              Ana sayfaya dön
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Fetch vendor whatsapp numbers from vendor_stores
  const storeIds = (order.order_vendor_sub_orders ?? []).map(
    (s: { store_id: string }) => s.store_id
  )
  const { data: stores } = storeIds.length > 0
    ? await supabase
        .from("vendor_stores")
        .select("id, name, phone, whatsapp")
        .in("id", storeIds)
    : { data: [] }

  const storeMap = Object.fromEntries(
    (stores ?? []).map((s: { id: string; name: string; phone: string | null; whatsapp: string | null }) => [
      s.id,
      s,
    ])
  )

  return (
    <OrderConfirmationClient
      order={order as any}
      storeMap={storeMap}
      orderNumberHint={orderNumberFromCheckout}
    />
  )
}
