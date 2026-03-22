import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"

// ---------------------------------------------------------------------------
// Types matching the live DB schema
// ---------------------------------------------------------------------------
interface OrderItem {
  product_name: string
  quantity: number
  unit_price: number
  line_total: number
  image_url: string | null
}

interface SubOrder {
  store_id: string
  store_name: string
  subtotal: number
  items: OrderItem[] | null
}

interface Order {
  id: string
  created_at: string
  customer_name: string
  customer_email: string
  customer_phone: string
  delivery_address: Record<string, string> | null
  subtotal: number
  discount_amount: number
  shipping_fee: number
  total: number
  coupon_code: string | null
  order_items: OrderItem[]
  order_vendor_sub_orders: SubOrder[]
}

interface VendorStore {
  id: string
  owner_id: string
  name: string
}

interface Profile {
  id: string
  email: string | null
  full_name: string | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/** Derive a human-readable order number from the UUID + created_at */
function orderNumber(order: Pick<Order, "id" | "created_at">): string {
  const d = new Date(order.created_at)
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`
  const short = order.id.replace(/-/g, "").slice(0, 4).toUpperCase()
  return `MKT-${date}-${short}`
}

/** Format a delivery_address jsonb to a readable string */
function fmtAddress(addr: Record<string, string> | null): string {
  if (!addr) return "Belirtilmedi"
  return [addr.line1, addr.line2, addr.district, addr.city, addr.postal_code]
    .filter(Boolean)
    .join(", ")
}

/** Shared item rows HTML for both customer + vendor emails */
function itemsTableRows(items: OrderItem[]): string {
  return items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:14px">${i.product_name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:center;font-size:14px">${i.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-size:14px;white-space:nowrap">
          ₺${Number(i.line_total).toFixed(2)}
        </td>
      </tr>`
    )
    .join("")
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://marketin24.com"
const FROM     = "Marketin24 <siparisler@marketin24.com>"

// ---------------------------------------------------------------------------
// Customer email HTML
// ---------------------------------------------------------------------------
function customerEmail(order: Order, orderNum: string): string {
  const address  = fmtAddress(order.delivery_address)
  const rows     = itemsTableRows(order.order_items)
  const discount = Number(order.discount_amount) > 0
    ? `<tr>
        <td colspan="2" style="padding:6px 12px;text-align:right;color:#16a34a;font-size:13px">
          İndirim (${order.coupon_code ?? ""})
        </td>
        <td style="padding:6px 12px;text-align:right;color:#16a34a;font-size:13px">
          -₺${Number(order.discount_amount).toFixed(2)}
        </td>
       </tr>`
    : ""

  return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding:32px 16px">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

      <!-- Header -->
      <tr>
        <td style="background:#0f172a;padding:28px 32px;border-radius:12px 12px 0 0">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700">Siparişiniz Alındı!</h1>
          <p style="margin:6px 0 0;color:#94a3b8;font-size:14px">
            Sipariş No: <strong style="color:#e2e8f0;font-family:monospace">${orderNum}</strong>
          </p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="background:#ffffff;padding:28px 32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0">
          <p style="margin:0 0 16px;font-size:15px">
            Merhaba <strong>${order.customer_name}</strong>,
          </p>
          <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.6">
            Siparişiniz başarıyla alındı. Satıcı en kısa sürede siparişinizi hazırlayacak ve
            kargolayacaktır.
          </p>

          <!-- COD badge -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
            <tr>
              <td style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px">
                <strong style="color:#15803d;font-size:14px">Kapıda Ödeme</strong>
                <p style="margin:4px 0 0;color:#166534;font-size:13px">
                  Teslimat sırasında nakit veya kart ile ödeme yapabilirsiniz.
                </p>
              </td>
            </tr>
          </table>

          <!-- Delivery info -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;font-size:13px;color:#64748b">
            <tr>
              <td style="padding:4px 0"><strong style="color:#0f172a">Teslimat Adresi:</strong> ${address}</td>
            </tr>
            <tr>
              <td style="padding:4px 0">
                <strong style="color:#0f172a">Tahmini Teslimat:</strong>
                <span style="color:#0284c7">1–3 iş günü içinde teslim edilecektir</span>
              </td>
            </tr>
          </table>

          <!-- Items table -->
          <table width="100%" cellpadding="0" cellspacing="0"
            style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:8px">
            <thead>
              <tr style="background:#f8fafc">
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.5px">Ürün</th>
                <th style="padding:10px 12px;text-align:center;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.5px">Adet</th>
                <th style="padding:10px 12px;text-align:right;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.5px">Tutar</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
            <tfoot>
              ${discount}
              <tr style="background:#f8fafc">
                <td colspan="2" style="padding:10px 12px;text-align:right;font-weight:700;font-size:15px">Toplam</td>
                <td style="padding:10px 12px;text-align:right;font-weight:700;font-size:15px;color:#0f172a">
                  ₺${Number(order.total).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f1f5f9;padding:16px 32px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none">
          <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center">
            Sorularınız için:
            <a href="mailto:info@marketin24.com" style="color:#2563eb;text-decoration:none">info@marketin24.com</a>
            &nbsp;|&nbsp;
            <a href="${BASE_URL}" style="color:#2563eb;text-decoration:none">marketin24.com</a>
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// Vendor email HTML
// ---------------------------------------------------------------------------
function vendorEmail(
  order: Order,
  orderNum: string,
  vendorName: string,
  subOrder: SubOrder
): string {
  const address  = fmtAddress(order.delivery_address)
  const items    = subOrder.items ?? order.order_items
  const rows     = itemsTableRows(items)
  const dashLink = `${BASE_URL}/vendor-panel`

  return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding:32px 16px">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

      <!-- Header -->
      <tr>
        <td style="background:#0f172a;padding:28px 32px;border-radius:12px 12px 0 0">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700">Yeni Sipariş!</h1>
          <p style="margin:6px 0 0;color:#94a3b8;font-size:14px">
            Sipariş No: <strong style="color:#e2e8f0;font-family:monospace">${orderNum}</strong>
          </p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="background:#ffffff;padding:28px 32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0">
          <p style="margin:0 0 16px;font-size:15px">
            Merhaba <strong>${vendorName}</strong>,
          </p>
          <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.6">
            Mağazanıza yeni bir sipariş geldi. En kısa sürede hazırlayıp kargolamanızı rica ederiz.
          </p>

          <!-- Customer info -->
          <table width="100%" cellpadding="0" cellspacing="0"
            style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:0;margin-bottom:20px">
            <tr>
              <td style="padding:14px 16px">
                <p style="margin:0 0 6px;font-size:13px;color:#64748b">
                  <strong style="color:#0f172a">Müşteri:</strong> ${order.customer_name}
                </p>
                <p style="margin:0 0 6px;font-size:13px;color:#64748b">
                  <strong style="color:#0f172a">Telefon:</strong>
                  <a href="tel:${order.customer_phone}" style="color:#2563eb;text-decoration:none">
                    ${order.customer_phone}
                  </a>
                </p>
                <p style="margin:0;font-size:13px;color:#64748b">
                  <strong style="color:#0f172a">Adres:</strong> ${address}
                </p>
              </td>
            </tr>
          </table>

          <!-- Items -->
          <table width="100%" cellpadding="0" cellspacing="0"
            style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:20px">
            <thead>
              <tr style="background:#f8fafc">
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.5px">Ürün</th>
                <th style="padding:10px 12px;text-align:center;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.5px">Adet</th>
                <th style="padding:10px 12px;text-align:right;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.5px">Tutar</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
            <tfoot>
              <tr style="background:#f8fafc">
                <td colspan="2" style="padding:10px 12px;text-align:right;font-weight:700;font-size:14px">Sizin Payınız</td>
                <td style="padding:10px 12px;text-align:right;font-weight:700;font-size:14px;color:#0f172a">
                  ₺${Number(subOrder.subtotal).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="border-radius:8px;background:#0f172a">
                <a href="${dashLink}"
                  style="display:inline-block;padding:12px 24px;color:#fff;text-decoration:none;font-size:14px;font-weight:600;border-radius:8px">
                  Siparişi Görüntüle →
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f1f5f9;padding:16px 32px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none">
          <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center">
            Marketin24 Satıcı Platformu &nbsp;|&nbsp;
            <a href="mailto:info@marketin24.com" style="color:#2563eb;text-decoration:none">info@marketin24.com</a>
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const { order_id } = (await req.json()) as { order_id?: string }
    if (!order_id) {
      return NextResponse.json({ error: "order_id is required" }, { status: 400 })
    }

    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      // Gracefully skip — caller is fire-and-forget; log for observability
      console.warn("[notify] RESEND_API_KEY not set — skipping email notifications")
      return NextResponse.json({ ok: true, skipped: true })
    }

    const resend = new Resend(resendKey)
    const db     = adminClient()

    // Fetch order + items + sub-orders in one query
    const { data: order, error: orderErr } = await db
      .from("orders")
      .select(`
        id, created_at,
        customer_name, customer_email, customer_phone,
        delivery_address, subtotal, discount_amount, shipping_fee, total, coupon_code,
        order_items ( product_name, quantity, unit_price, line_total, image_url ),
        order_vendor_sub_orders ( store_id, store_name, subtotal, items )
      `)
      .eq("id", order_id)
      .single()

    if (orderErr || !order) {
      console.error("[notify] order fetch error:", orderErr)
      return NextResponse.json({ error: "order not found" }, { status: 404 })
    }

    const typedOrder = order as unknown as Order
    const num = orderNumber(typedOrder)
    const sends: Promise<unknown>[] = []

    // 1. Customer email
    if (typedOrder.customer_email) {
      sends.push(
        resend.emails.send({
          from:    FROM,
          to:      [typedOrder.customer_email],
          subject: `Siparişiniz Alındı — ${num}`,
          html:    customerEmail(typedOrder, num),
        })
      )
    }

    // 2. Vendor emails — look up owner_id → profiles.email for each sub-order
    const subOrders = typedOrder.order_vendor_sub_orders ?? []
    if (subOrders.length > 0) {
      const storeIds = subOrders.map((s) => s.store_id)

      const { data: stores } = await db
        .from("vendor_stores")
        .select("id, owner_id, name")
        .in("id", storeIds)

      const ownerIds = ((stores ?? []) as VendorStore[])
        .map((s) => s.owner_id)
        .filter(Boolean)

      if (ownerIds.length > 0) {
        const { data: profiles } = await db
          .from("profiles")
          .select("id, email, full_name")
          .in("id", ownerIds)

        for (const sub of subOrders) {
          const store   = (stores as VendorStore[] | null)?.find((s) => s.id === sub.store_id)
          const profile = (profiles as Profile[] | null)?.find(
            (p) => p.id === store?.owner_id
          )
          if (!profile?.email) continue

          sends.push(
            resend.emails.send({
              from:    FROM,
              to:      [profile.email],
              subject: `Yeni Sipariş! — ${num}`,
              html:    vendorEmail(
                typedOrder,
                num,
                profile.full_name ?? store?.name ?? "Satıcı",
                sub
              ),
            })
          )
        }
      }
    }

    const results = await Promise.allSettled(sends)
    const failures = results.filter((r) => r.status === "rejected")
    if (failures.length > 0) {
      console.error("[notify] some emails failed:", failures)
    }

    return NextResponse.json({ ok: true, sent: sends.length, failed: failures.length })
  } catch (err) {
    console.error("[notify] unexpected error:", err)
    return NextResponse.json({ error: "internal server error" }, { status: 500 })
  }
}
