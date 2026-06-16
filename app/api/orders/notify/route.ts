import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { sendOrderPlacedNotifications } from "@/lib/email/send-order-placed-notifications"
import { z } from "zod"

const notifyOrderSchema = z.object({
  order_id: z.string().trim().min(1, "order_id is required"),
})

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function canNotifyOrder(req: NextRequest, orderId: string) {
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
    const parsed = notifyOrderSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "order_id is required" }, { status: 400 })
    }

    const { order_id } = parsed.data
    if (!(await canNotifyOrder(req, order_id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await sendOrderPlacedNotifications(order_id)
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "internal server error" }, { status: result.status ?? 500 })
    }
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: "internal server error" }, { status: 500 })
  }
}
