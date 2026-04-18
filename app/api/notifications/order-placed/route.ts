import { NextRequest, NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { assertAdminAuth } from "@/lib/admin-auth"
import { sendOrderPlacedNotifications } from "@/lib/email/send-order-placed-notifications"
import { z } from "zod"

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

const payloadSchema = z.object({
  orderId: z.string().uuid("Geçersiz sipariş kimliği."),
})

export async function POST(req: NextRequest) {
  try {
    const payload = payloadSchema.safeParse(await req.json())
    if (!payload.success) {
      return NextResponse.json({ error: payload.error.issues[0]?.message ?? "Geçersiz istek." }, { status: 400 })
    }

    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const orderId = payload.data.orderId
    const admin = adminClient()
    const { data: order } = await admin
      .from("orders")
      .select("id, customer_id, customer_email")
      .eq("id", orderId)
      .maybeSingle()

    if (!order) {
      return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 })
    }

    const userEmail = user.email?.trim().toLowerCase() ?? null
    const orderEmail = order.customer_email?.trim().toLowerCase() ?? null
    const ownsOrder =
      order.customer_id === user.id ||
      (userEmail !== null && orderEmail !== null && userEmail === orderEmail)

    if (!ownsOrder) {
      const adminAuth = await assertAdminAuth()
      if (!adminAuth.ok) {
        return NextResponse.json({ error: "Bu sipariş için bildirim göndermeye yetkiniz yok." }, { status: 403 })
      }
    }

    const result = await sendOrderPlacedNotifications(orderId)
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "notification failed" }, { status: result.status ?? 500 })
    }
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: "notification failed" }, { status: 500 })
  }
}
