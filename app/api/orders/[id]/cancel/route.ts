import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdmin } from "@supabase/supabase-js"

export const runtime = "nodejs"

function admin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

function isMissingColumnErr(err: { code?: string; message?: string; details?: string } | null, col: string): boolean {
  if (!err) return false
  const t = [err.message, err.details].filter(Boolean).join(" ").toLowerCase()
  if (err.code === "42703") return true
  if (err.code === "PGRST204" && (t.includes(col) || t.includes("could not find"))) return true
  if (t.includes("vendor_orders") && t.includes(col) && t.includes("does not exist")) return true
  return t.includes(col) && (t.includes("does not exist") || t.includes("column") || t.includes("schema cache"))
}

/**
 * vendor_orders.order_id yoksa veya boşsa, order_vendor_sub_orders → sub_order_id ile bul.
 */
async function loadVendorOrderRowsForCancel(
  a: ReturnType<typeof admin>,
  orderId: string,
): Promise<{ id: string; status: string }[]> {
  const q1 = await a.from("vendor_orders").select("id, status").eq("order_id", orderId)

  if (q1.error) {
    if (!isMissingColumnErr(q1.error, "order_id")) {
      throw new Error(q1.error.message ?? "vendor_orders select failed")
    }
  } else if (q1.data && q1.data.length > 0) {
    return q1.data
  }

  const { data: subs, error: subErr } = await a
    .from("order_vendor_sub_orders")
    .select("id")
    .eq("order_id", orderId)

  if (!subErr && subs?.length) {
    const subIds = subs.map((s) => s.id)
    const q2 = await a.from("vendor_orders").select("id, status").in("sub_order_id", subIds)

    if (q2.error) {
      if (!isMissingColumnErr(q2.error, "sub_order_id")) {
        throw new Error(q2.error.message ?? "vendor_orders sub_order select failed")
      }
    } else if (q2.data && q2.data.length > 0) {
      return q2.data
    }
  }

  const { data: parent } = await a
    .from("orders")
    .select("customer_email, total, created_at")
    .eq("id", orderId)
    .maybeSingle()
  const { data: itemStores } = await a.from("order_items").select("store_id").eq("order_id", orderId)
  const uniqStores = [...new Set((itemStores ?? []).map((r) => r.store_id as string))]
  if (parent?.customer_email && uniqStores.length > 0) {
    const { data: loose, error: le } = await a
      .from("vendor_orders")
      .select("id, status, total, created_at")
      .eq("customer_email", parent.customer_email)
      .in("store_id", uniqStores)
      .in("status", ["pending", "confirmed"])
    if (!le && loose?.length) {
      const target = Number(parent.total)
      const parentTime = parent.created_at ? new Date(parent.created_at).getTime() : Number.NaN
      const matched = loose.filter((r) => {
        if (Math.abs(Number(r.total) - target) >= 0.01) return false
        if (Number.isNaN(parentTime)) return true
        const rowTime = r.created_at ? new Date(r.created_at).getTime() : Number.NaN
        if (Number.isNaN(rowTime)) return false
        return Math.abs(rowTime - parentTime) <= 1000 * 60 * 60 * 24
      })
      if (matched.length >= 1) {
        return matched.map(({ id, status }) => ({ id, status }))
      }
    }
  }

  return []
}

/**
 * Stok iadesi tamamlandıktan sonra satıcı panelinin "Bekliyor" göstermemesi için
 * bu siparişe bağlı tüm vendor_orders satırlarını cancelled yapar (idempotent).
 */
async function sweepVendorOrdersCancelled(a: ReturnType<typeof admin>, orderId: string): Promise<void> {
  const upd = { status: "cancelled" as const, updated_at: new Date().toISOString() }

  const u1 = await a.from("vendor_orders").update(upd).eq("order_id", orderId).in("status", ["pending", "confirmed"])
  if (u1.error && !isMissingColumnErr(u1.error, "order_id")) {
    console.warn("[cancel] sweep order_id:", u1.error.message)
  }

  const { data: subs } = await a.from("order_vendor_sub_orders").select("id").eq("order_id", orderId)
  const subIds = subs?.map((s) => s.id) ?? []
  if (subIds.length > 0) {
    const u2 = await a.from("vendor_orders").update(upd).in("sub_order_id", subIds).in("status", ["pending", "confirmed"])
    if (u2.error && !isMissingColumnErr(u2.error, "sub_order_id")) {
      console.warn("[cancel] sweep sub_order_id:", u2.error.message)
    }
  }

  const { data: o } = await a
    .from("orders")
    .select("total, customer_email, created_at")
    .eq("id", orderId)
    .maybeSingle()
  const { data: itemStores } = await a.from("order_items").select("store_id").eq("order_id", orderId)
  const uniqStores = [...new Set((itemStores ?? []).map((r) => r.store_id as string))]
  if (!o?.customer_email || uniqStores.length === 0) return

  const { data: loose } = await a
    .from("vendor_orders")
    .select("id, total, created_at")
    .eq("customer_email", o.customer_email)
    .in("store_id", uniqStores)
    .in("status", ["pending", "confirmed"])

  const target = Number(o.total)
  const parentTime = o.created_at ? new Date(o.created_at).getTime() : Number.NaN
  for (const row of loose ?? []) {
    if (Math.abs(Number(row.total) - target) >= 0.01) continue
    if (!Number.isNaN(parentTime)) {
      const rowTime = row.created_at ? new Date(row.created_at).getTime() : Number.NaN
      if (Number.isNaN(rowTime) || Math.abs(rowTime - parentTime) > 1000 * 60 * 60 * 24) continue
    }
    const { error } = await a.from("vendor_orders").update(upd).eq("id", row.id)
    if (error) console.warn("[cancel] sweep loose id", row.id, error.message)
  }
}

async function assertCustomerOwnsOrder(orderId: string, userId: string, email: string | undefined) {
  const a = admin()
  const { data: order, error } = await a
    .from("orders")
    .select("id, customer_id, customer_email")
    .eq("id", orderId)
    .maybeSingle()
  if (error || !order) return { ok: false as const, status: 404, message: "Sipariş bulunamadı." }
  const own =
    order.customer_id === userId ||
    (!!email && order.customer_email?.toLowerCase() === email.toLowerCase())
  if (!own) return { ok: false as const, status: 403, message: "Bu siparişe erişim yetkiniz yok." }
  return { ok: true as const, order }
}

/**
 * POST — Müşteri siparişi iptal eder (yalnızca tüm satıcı satırları hâlâ pending iken).
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 })
    }

    const auth = await assertCustomerOwnsOrder(orderId, user.id, user.email ?? undefined)
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status })
    }

    const a = admin()

    let rows: { id: string; status: string }[] = []
    try {
      rows = await loadVendorOrderRowsForCancel(a, orderId)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Satıcı satırları okunamadı."
      return NextResponse.json({ error: msg }, { status: 500 })
    }
    if (rows.length > 0) {
      const allCancelled = rows.every((r) => r.status === "cancelled")
      if (allCancelled) {
        return NextResponse.json({ ok: true, alreadyCancelled: true })
      }
      if (rows.some((r) => !["pending", "confirmed"].includes(r.status))) {
        return NextResponse.json(
          { error: "Satıcı siparişi onayladığı için iptal edilemez." },
          { status: 403 },
        )
      }
    }

    const { data: lineItems, error: itemsErr } = await a
      .from("order_items")
      .select("product_id, quantity")
      .eq("order_id", orderId)

    if (itemsErr) {
      return NextResponse.json({ error: "Sipariş kalemleri okunamadı." }, { status: 500 })
    }

    const byProduct = new Map<string, number>()
    for (const row of lineItems ?? []) {
      const q = Number(row.quantity) || 0
      if (q <= 0) continue
      const pid = row.product_id as string
      byProduct.set(pid, (byProduct.get(pid) ?? 0) + q)
    }

    for (const [productId, qty] of byProduct) {
      const { error: rpcErr } = await a.rpc("restore_stock", {
        p_product_id: productId,
        p_quantity: qty,
      })
      if (rpcErr) {
        return NextResponse.json(
          { error: "Stok iadesi yapılamadı. Lütfen tekrar deneyin." },
          { status: 500 },
        )
      }
    }

    await sweepVendorOrdersCancelled(a, orderId)

    const { error: histErr } = await a.from("order_status_history").insert({
      order_id: orderId,
      old_status: null,
      new_status: "cancelled",
      changed_by: "customer",
      notes: "Müşteri siparişi iptal etti",
    })

    if (histErr) {
      return NextResponse.json({ error: histErr.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}
