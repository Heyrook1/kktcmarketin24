/**
 * Customer + vendor emails when a vendor_order status changes (Resend).
 */

const STATUS_LABEL_TR: Record<string, string> = {
  pending: "Beklemede",
  confirmed: "Sipariş onaylandı",
  preparing: "Hazırlanıyor",
  shipped: "Kargoya teslim edildi",
  exchange_requested: "Değişim talep edildi",
  delivered: "Teslim alındı",
  cancelled: "İptal edildi",
  refunded: "İade edildi",
}

export async function sendOrderStatusUpdateEmails(params: {
  orderNumber: string
  customerEmail: string | null
  customerName: string
  storeName: string
  newStatus: string
  trackingNumber?: string | null
}): Promise<void> {
  const key = process.env.RESEND_API_KEY
  if (!key || !params.customerEmail?.includes("@")) return

  const label = STATUS_LABEL_TR[params.newStatus] ?? params.newStatus
  const trackingBlock =
    params.newStatus === "shipped" && params.trackingNumber?.trim()
      ? `<p style="margin:12px 0"><strong>Takip numarası:</strong> ${escapeHtml(params.trackingNumber.trim())}</p>`
      : ""

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;color:#111">
      <div style="background:#0f172a;padding:24px 32px;border-radius:12px 12px 0 0">
        <h1 style="color:#fff;margin:0;font-size:18px">Sipariş durumu güncellendi</h1>
        <p style="color:#94a3b8;margin:8px 0 0;font-size:14px">
          Sipariş: <strong style="color:#fff">${escapeHtml(params.orderNumber)}</strong>
        </p>
      </div>
      <div style="background:#fff;padding:24px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        <p>Merhaba <strong>${escapeHtml(params.customerName)}</strong>,</p>
        <p><strong>${escapeHtml(params.storeName)}</strong> mağazası siparişinizi şu duruma getirdi: <strong>${escapeHtml(label)}</strong>.</p>
        ${trackingBlock}
        <p style="color:#6b7280;font-size:13px;margin-top:20px">
          Siparişlerinizi hesabınızdan takip edebilirsiniz.
        </p>
      </div>
    </div>`

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Marketin24 <siparis@marketin24.com>",
      to: [params.customerEmail],
      subject: `Sipariş ${params.orderNumber} — ${label}`,
      html,
    }),
  })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
