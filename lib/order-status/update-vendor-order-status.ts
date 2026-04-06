import { createClient } from "@supabase/supabase-js"
import { sendOrderStatusUpdateEmails } from "@/lib/email/order-status-notify"

export const VENDOR_ORDER_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "shipped", "cancelled"],
  preparing: ["shipped", "cancelled"],
  shipped: ["exchange_requested", "delivered", "cancelled"],
  exchange_requested: ["preparing", "delivered", "cancelled"],
  delivered: [],
  cancelled: [],
  refunded: [],
}

export interface UpdateVendorOrderStatusInput {
  vendorOrderId: string
  vendorStoreId: string
  newStatus: string
  trackingNumber?: string | null
  notes?: string | null
}

export type UpdateVendorOrderStatusResult =
  | { ok: true; status: string }
  | { ok: false; status: 403 | 404 | 422 | 500; error: string; allowedNext?: string[] }

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function isMissingColumnErr(
  err: { code?: string; message?: string; details?: string; hint?: string } | null | undefined,
  column: string
): boolean {
  if (!err) return false
  const text = [err.message, err.details, err.hint].filter(Boolean).join(" ").toLowerCase()
  if (err.code === "42703") return true
  if (err.code === "PGRST204" && text.includes(column)) return true
  return text.includes(column) && (text.includes("does not exist") || text.includes("column"))
}

export async function updateVendorOrderStatus(
  input: UpdateVendorOrderStatusInput
): Promise<UpdateVendorOrderStatusResult> {
  const admin = adminClient()
  const { vendorOrderId, vendorStoreId, newStatus, notes } = input

  const { data: fullRow, error: fullErr } = await admin
    .from("vendor_orders")
    .select("status, order_id, customer_name, customer_email, store_id")
    .eq("id", vendorOrderId)
    .maybeSingle()

  type VendorStatusRow = {
    status: string
    order_id?: string | null
    customer_name?: string | null
    customer_email?: string | null
    store_id: string
  }

  let row: VendorStatusRow | null = fullRow as VendorStatusRow | null
  if (fullErr && isMissingColumnErr(fullErr, "order_id")) {
    const { data: fallbackRow, error: fallbackErr } = await admin
      .from("vendor_orders")
      .select("status, customer_name, customer_email, store_id")
      .eq("id", vendorOrderId)
      .maybeSingle()
    if (fallbackErr || !fallbackRow) {
      return { ok: false, status: 404, error: "Sipariş bulunamadı." }
    }
    row = fallbackRow as VendorStatusRow
  } else if (fullErr) {
    return { ok: false, status: 500, error: "Sipariş okunamadı. Lütfen tekrar deneyin." }
  }

  if (!row) {
    return { ok: false, status: 404, error: "Sipariş bulunamadı." }
  }

  if (row.store_id !== vendorStoreId) {
    return { ok: false, status: 403, error: "Bu siparişi güncelleme yetkiniz yok." }
  }

  const currentStatus = row.status as string
  const allowed = VENDOR_ORDER_TRANSITIONS[currentStatus] ?? []
  if (!allowed.includes(newStatus)) {
    return {
      ok: false,
      status: 422,
      error: `"${currentStatus}" durumundan "${newStatus}" durumuna geçiş yapılamaz.`,
      allowedNext: allowed,
    }
  }

  const tracking =
    newStatus === "shipped" && typeof input.trackingNumber === "string"
      ? input.trackingNumber.trim()
      : null

  let { error: updateErr } = await admin
    .from("vendor_orders")
    .update({
      status: newStatus,
      ...(newStatus === "shipped" && tracking ? { tracking_number: tracking } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", vendorOrderId)
    .eq("store_id", vendorStoreId)

  if (updateErr && isMissingColumnErr(updateErr, "tracking_number")) {
    const retry = await admin
      .from("vendor_orders")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", vendorOrderId)
      .eq("store_id", vendorStoreId)
    updateErr = retry.error
  }

  if (updateErr) {
    return { ok: false, status: 500, error: "Durum güncellenemedi." }
  }

  const parentOrderId = (row.order_id ?? null) as string | null
  if (parentOrderId) {
    await admin.from("order_status_history").insert({
      order_id: parentOrderId,
      old_status: currentStatus,
      new_status: newStatus,
      changed_by: "vendor",
      notes: notes ?? (tracking ? `Kargo takip: ${tracking}` : null),
    })
  }

  let orderNumber: string | null = null
  if (parentOrderId) {
    const { data: ord } = await admin
      .from("orders")
      .select("order_number")
      .eq("id", parentOrderId)
      .maybeSingle()
    orderNumber = ord?.order_number ?? null
  }

  const { data: storeRow } = await admin
    .from("vendor_stores")
    .select("name")
    .eq("id", row.store_id as string)
    .maybeSingle()

  await sendOrderStatusUpdateEmails({
    orderNumber: orderNumber ?? `SIP-${(parentOrderId ?? vendorOrderId).slice(0, 8).toUpperCase()}`,
    customerEmail: row.customer_email ?? null,
    customerName: row.customer_name ?? "Müşteri",
    storeName: storeRow?.name ?? "Mağaza",
    newStatus,
    trackingNumber: tracking,
  })

  return { ok: true, status: newStatus }
}
