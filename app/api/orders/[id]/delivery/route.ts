import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdmin } from "@supabase/supabase-js"

export const runtime = "nodejs"

const VALID_CITIES = [
  "Lefkoşa",
  "Girne",
  "Gazimağusa",
  "Güzelyurt",
  "İskele",
  "Lefke",
  "Diğer",
] as const

const DeliverySchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(7),
  line1: z.string().min(5),
  city: z.enum(VALID_CITIES),
  district: z.string().optional().default(""),
  notes: z.string().max(500).optional().default(""),
})

function admin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
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
  return { ok: true as const }
}

/**
 * PATCH — Teslimat adresini günceller (yalnızca satıcı onayı beklenirken).
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 })
    }

    const parsed = DeliverySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Geçersiz adres." }, { status: 400 })
    }

    const a = admin()
    const { data: vos } = await a.from("vendor_orders").select("id, status").eq("order_id", orderId)
    const rows = vos ?? []
    if (rows.length > 0) {
      const blocked = rows.some((r) => r.status !== "pending")
      if (blocked) {
        return NextResponse.json(
          { error: "Satıcı siparişi onayladığı için adres değiştirilemez." },
          { status: 403 },
        )
      }
    }

    const delivery_address = parsed.data
    const { error: upErr } = await a
      .from("orders")
      .update({
        delivery_address,
        customer_name: delivery_address.fullName,
        customer_phone: delivery_address.phone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, delivery_address })
  } catch {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}
