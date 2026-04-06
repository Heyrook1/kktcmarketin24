import { createClient as createAdmin } from "@supabase/supabase-js"

function adminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function sendOrderPlacedNotifications(orderId: string): Promise<{
  ok: boolean
  sent?: number
  failed?: number
  skipped?: boolean
  error?: string
  status?: number
}> {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    return { ok: true, skipped: true }
  }

  const admin = adminClient()

  const { data: alreadySent } = await admin
    .from("order_status_history")
    .select("id")
    .eq("order_id", orderId)
    .eq("changed_by", "system")
    .eq("new_status", "notification_sent")
    .eq("notes", "order_placed_email_sent")
    .maybeSingle()
  if (alreadySent) return { ok: true, skipped: true }

  const { data: order } = await admin
    .from("orders")
    .select(`
      id, order_number, created_at,
      customer_name, customer_email, customer_phone,
      delivery_address, total,
      order_items ( product_name, quantity, unit_price, line_total ),
      order_vendor_sub_orders ( store_id, store_name, subtotal )
    `)
    .eq("id", orderId)
    .single()

  if (!order) return { ok: false, error: "order not found", status: 404 }

  const orderNum = order.order_number ?? `MKT-${order.id.slice(0, 8).toUpperCase()}`
  const delivery = order.delivery_address as Record<string, string> | null
  const address = [delivery?.line1, delivery?.city].filter(Boolean).join(", ") || "Belirtilmedi"

  const itemsHtml = (order.order_items ?? [])
    .map((i: { product_name: string; quantity: number; line_total: number }) =>
      `<tr>
        <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0">${i.product_name}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;text-align:center">${i.quantity}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;text-align:right">₺${Number(i.line_total).toFixed(2)}</td>
      </tr>`
    )
    .join("")

  const customerHtml = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;color:#111">
      <div style="background:#0f172a;padding:24px 32px;border-radius:12px 12px 0 0">
        <h1 style="color:#fff;margin:0;font-size:20px">Siparişiniz Alındı!</h1>
        <p style="color:#94a3b8;margin:6px 0 0;font-size:14px">Sipariş No: <strong style="color:#fff">${orderNum}</strong></p>
      </div>
      <div style="background:#fff;padding:24px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        <p>Merhaba <strong>${order.customer_name}</strong>,</p>
        <p>Siparişiniz başarıyla alındı. Satıcı en kısa sürede siparişinizi hazırlayacak ve kargolayacaktır.</p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;margin:16px 0">
          <strong style="color:#15803d">Kapıda Ödeme</strong> — Teslimat sırasında nakit veya kart ile ödeme yapabilirsiniz.
        </div>
        <p style="margin:8px 0;color:#6b7280;font-size:14px"><strong>Teslimat Adresi:</strong> ${address}</p>
        <p style="margin:8px 0;color:#6b7280;font-size:14px"><strong>Tahmini Teslimat:</strong> 1–3 iş günü</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
          <thead>
            <tr style="background:#f8fafc">
              <th style="padding:8px;text-align:left">Ürün</th>
              <th style="padding:8px;text-align:center">Adet</th>
              <th style="padding:8px;text-align:right">Tutar</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding:10px 8px;text-align:right;font-weight:bold">Toplam</td>
              <td style="padding:10px 8px;text-align:right;font-weight:bold">₺${Number(order.total).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>`

  const emails: Promise<Response>[] = []

  if (order.customer_email) {
    emails.push(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Marketin24 <siparis@marketin24.com>",
          to: [order.customer_email],
          subject: `Siparişiniz Alındı — ${orderNum}`,
          html: customerHtml,
        }),
      })
    )
  }

  const subOrders = (order.order_vendor_sub_orders ?? []) as Array<{ store_id: string; store_name: string; subtotal: number }>
  if (subOrders.length > 0) {
    const storeIds = subOrders.map((s) => s.store_id)
    const { data: vendorStores } = await admin
      .from("vendor_stores")
      .select("id, owner_id, name")
      .in("id", storeIds)

    const ownerIds = (vendorStores ?? [])
      .map((s: { owner_id: string | null }) => s.owner_id)
      .filter(Boolean) as string[]

    if (ownerIds.length > 0) {
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, email, full_name")
        .in("id", ownerIds)

      for (const profile of (profiles ?? []) as Array<{ id: string; email: string | null; full_name: string | null }>) {
        if (!profile.email) continue
        const vendorStore = (vendorStores ?? []).find((s: { owner_id: string }) => s.owner_id === profile.id)
        const vendorHtml = `
          <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;color:#111">
            <div style="background:#0f172a;padding:24px 32px;border-radius:12px 12px 0 0">
              <h1 style="color:#fff;margin:0;font-size:20px">Yeni Sipariş Geldi!</h1>
              <p style="color:#94a3b8;margin:6px 0 0;font-size:14px">Sipariş No: <strong style="color:#fff">${orderNum}</strong></p>
            </div>
            <div style="background:#fff;padding:24px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
              <p>Merhaba <strong>${profile.full_name ?? vendorStore?.name ?? "Satıcı"}</strong>,</p>
              <p>Mağazanıza yeni bir sipariş geldi. En kısa sürede hazırlayıp kargolamanızı rica ederiz.</p>
              <p><strong>Müşteri:</strong> ${order.customer_name}</p>
              <p><strong>Teslimat:</strong> ${address}</p>
              <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
                <thead><tr style="background:#f8fafc">
                  <th style="padding:8px;text-align:left">Ürün</th>
                  <th style="padding:8px;text-align:center">Adet</th>
                  <th style="padding:8px;text-align:right">Tutar</th>
                </tr></thead>
                <tbody>${itemsHtml}</tbody>
              </table>
            </div>
          </div>`

        emails.push(
          fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "Marketin24 <siparis@marketin24.com>",
              to: [profile.email],
              subject: `Yeni Sipariş — ${orderNum}`,
              html: vendorHtml,
            }),
          })
        )
      }
    }
  }

  const settled = await Promise.allSettled(emails)
  const failed = settled.filter((r) => r.status === "rejected").length

  await admin.from("order_status_history").insert({
    order_id: orderId,
    old_status: null,
    new_status: "notification_sent",
    changed_by: "system",
    notes: "order_placed_email_sent",
  })

  return { ok: true, sent: emails.length, failed }
}
