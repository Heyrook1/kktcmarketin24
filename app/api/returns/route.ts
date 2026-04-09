// POST /api/returns — customer creates a return request
import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { deriveCanonicalVendorOrderStatus } from "@/lib/order-status/vendor-status"

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

const VALID_REASONS = ["Hasar Var", "Yanlış Ürün", "Beklentiye Uymadı", "Diğer"] as const

function deriveOrderStatusFromVendorRows(rows: Array<{ status: string }>): string {
  return deriveCanonicalVendorOrderStatus(rows)
}

export async function POST(req: NextRequest) {
  try {
    // ── Auth ───────────────────────────────────────────────────────────────
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 })

    const body = await req.json()
    const { order_id, reason, description } = body as {
      order_id:    string
      reason:      string
      description?: string
    }

    // ── Validation ─────────────────────────────────────────────────────────
    if (!order_id?.trim())
      return NextResponse.json({ error: "Sipariş ID gereklidir." }, { status: 400 })
    if (!reason || !VALID_REASONS.includes(reason as typeof VALID_REASONS[number]))
      return NextResponse.json({ error: "Geçerli bir iade nedeni seçiniz." }, { status: 400 })

    const admin = getAdmin()

    // ── Verify order belongs to this customer and is delivered ─────────────
    const { data: order, error: orderErr } = await admin
      .from("orders")
      .select("id, customer_id, customer_email, created_at, saga_status, order_vendor_sub_orders(store_id)")
      .eq("id", order_id)
      .single()

    if (orderErr || !order)
      return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 })
    const belongsToUser =
      order.customer_id === user.id ||
      (!!user.email && !!order.customer_email && order.customer_email.toLowerCase() === user.email.toLowerCase())
    if (!belongsToUser)
      return NextResponse.json({ error: "Bu sipariş size ait değil." }, { status: 403 })

    const { data: vendorRows, error: vendorErr } = await admin
      .from("vendor_orders")
      .select("status")
      .eq("order_id", order_id)
    if (vendorErr) {
      return NextResponse.json({ error: "Sipariş durumu doğrulanamadı." }, { status: 500 })
    }
    const derived = deriveOrderStatusFromVendorRows(vendorRows ?? [])
    if (derived !== "delivered") {
      return NextResponse.json({ error: "İade talebi sadece teslim edilen siparişler için açılabilir." }, { status: 422 })
    }

    // ── 14-day window check ────────────────────────────────────────────────
    const orderDate = new Date(order.created_at)
    const daysDiff  = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24)
    if (daysDiff > 14)
      return NextResponse.json({ error: "İade süresi 14 gündür. Bu süre dolmuştur." }, { status: 422 })

    // ── Check no existing return for this order ────────────────────────────
    const { data: existing } = await admin
      .from("returns")
      .select("id")
      .eq("order_id", order_id)
      .maybeSingle()
    if (existing)
      return NextResponse.json({ error: "Bu sipariş için zaten bir iade talebi mevcut." }, { status: 409 })

    // ── Derive store_id from sub-order set (single-vendor only) ────────────
    const storeIds = [...new Set(
      ((order.order_vendor_sub_orders as Array<{ store_id: string }> | null) ?? [])
        .map((r) => r.store_id)
        .filter(Boolean),
    )]
    if (storeIds.length !== 1) {
      return NextResponse.json(
        { error: "Çoklu satıcılı siparişler için iade desteği yakında eklenecek. Lütfen destek ile iletişime geçin." },
        { status: 422 }
      )
    }
    const storeId = storeIds[0]

    // ── Insert return request ──────────────────────────────────────────────
    const { data: returnRow, error: insertErr } = await admin
      .from("returns")
      .insert({
        order_id,
        customer_id: user.id,
        store_id:    storeId,
        reason,
        description: description?.trim() || null,
        status:      "requested",
      })
      .select("id")
      .single()

    if (insertErr || !returnRow) {
      console.error("[returns/POST] insert error:", insertErr)
      return NextResponse.json({ error: "İade talebi oluşturulamadı." }, { status: 500 })
    }

    // ── Update order status to return_requested in status history ──────────
    await admin.from("order_status_history").insert({
      order_id,
      old_status: order.saga_status,
      new_status: "return_requested",
      changed_by: "customer",
      notes:      `İade talebi oluşturuldu. Neden: ${reason}`,
    })

    return NextResponse.json({ returnId: returnRow.id, success: true })
  } catch (err) {
    console.error("[returns/POST] unexpected error:", err)
    return NextResponse.json({ error: "Beklenmeyen bir hata oluştu." }, { status: 500 })
  }
}
