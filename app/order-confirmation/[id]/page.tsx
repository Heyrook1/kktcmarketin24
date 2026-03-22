import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { formatPrice, formatDate } from "@/lib/format"
import { OrderConfirmationClient } from "./order-confirmation-client"

export const metadata: Metadata = {
  title: "Sipariş Onaylandı | Marketin24",
  description: "Siparişiniz başarıyla alındı",
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OrderConfirmationPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: order } = await supabase
    .from("orders")
    .select(`
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
    `)
    .eq("id", id)
    .single()

  if (!order) notFound()

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
      formatPrice={formatPrice}
      formatDate={formatDate}
    />
  )
}
