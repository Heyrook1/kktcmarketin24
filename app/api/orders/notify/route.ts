import { NextRequest, NextResponse } from "next/server"
import { sendOrderPlacedNotifications } from "@/lib/email/send-order-placed-notifications"
import { z } from "zod"

const NotifySchema = z.object({
  order_id: z.string().uuid("order_id must be a valid UUID"),
})

function authorizeInternalRequest(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return process.env.NODE_ENV === "production"
      ? NextResponse.json({ error: "Notification secret is not configured" }, { status: 500 })
      : null
  }

  if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return null
}

export async function POST(req: NextRequest) {
  try {
    const unauthorized = authorizeInternalRequest(req)
    if (unauthorized) return unauthorized

    const parsed = NotifySchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request body" }, { status: 400 })
    }

    const result = await sendOrderPlacedNotifications(parsed.data.order_id)
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "internal server error" }, { status: result.status ?? 500 })
    }
    return NextResponse.json(result)
  } catch (err) {
    console.error("[notify] unexpected error:", err)
    return NextResponse.json({ error: "internal server error" }, { status: 500 })
  }
}
