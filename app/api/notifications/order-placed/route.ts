import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { sendOrderPlacedNotifications } from "@/lib/email/send-order-placed-notifications"
import { z } from "zod"

const orderNotificationSchema = z.object({
  orderId: z.string().trim().min(1, "orderId required"),
})

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function canSendOrderNotification(req: NextRequest, orderId: string) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get("authorization")
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return false
  }

  const { data: order } = await adminClient()
    .from("orders")
    .select("id")
    .eq("id", orderId)
    .eq("customer_id", user.id)
    .maybeSingle()

  return Boolean(order)
}

export async function POST(req: NextRequest) {
  try {
    const parsed = orderNotificationSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "orderId required" }, { status: 400 })
    }

    const { orderId } = parsed.data
    if (!(await canSendOrderNotification(req, orderId))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
