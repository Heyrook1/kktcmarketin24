import { NextRequest, NextResponse } from "next/server"
import { sendOrderPlacedNotifications } from "@/lib/email/send-order-placed-notifications"
import { z } from "zod"

const notifyOrderPlacedSchema = z.object({
  orderId: z.string().uuid("orderId must be a valid UUID."),
})

function isAuthorizedInternalRequest(req: NextRequest): boolean {
  const notificationSecret = process.env.NOTIFICATION_WEBHOOK_SECRET ?? process.env.CRON_SECRET
  return Boolean(notificationSecret && req.headers.get("authorization") === `Bearer ${notificationSecret}`)
}

export async function POST(req: NextRequest) {
  try {
    if (!isAuthorizedInternalRequest(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const parsed = notifyOrderPlacedSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request body." }, { status: 400 })
    }

    const result = await sendOrderPlacedNotifications(parsed.data.orderId)
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "notification failed" }, { status: result.status ?? 500 })
    }
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: "notification failed" }, { status: 500 })
  }
}
