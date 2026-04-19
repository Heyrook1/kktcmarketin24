import { NextRequest, NextResponse } from "next/server"
import { sendOrderPlacedNotifications } from "@/lib/email/send-order-placed-notifications"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { z } from "zod"

const orderPlacedNotificationSchema = z.object({
  orderId: z.string().uuid("Geçersiz sipariş kimliği."),
})

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Kimlik doğrulaması gerekli." }, { status: 401 })
    }

    const payload = await req.json().catch(() => null)
    const parsedPayload = orderPlacedNotificationSchema.safeParse(payload)
    if (!parsedPayload.success) {
      const message = parsedPayload.error.issues[0]?.message ?? "Geçersiz istek gövdesi."
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const { orderId } = parsedPayload.data
    const admin = adminClient()
    const { data: order } = await admin
      .from("orders")
      .select("id, customer_id, customer_email")
      .eq("id", orderId)
      .maybeSingle()
    if (!order) {
      return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 })
    }

    const canAccessOrder =
      order.customer_id === user.id ||
      (!!user.email && order.customer_email?.toLowerCase() === user.email.toLowerCase())
    if (!canAccessOrder) {
      return NextResponse.json({ error: "Bu siparişe erişim yetkiniz yok." }, { status: 403 })
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
