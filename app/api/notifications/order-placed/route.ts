import { NextRequest, NextResponse } from "next/server"
import { sendOrderPlacedNotifications } from "@/lib/email/send-order-placed-notifications"

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json() as { orderId?: string }
    if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 })
    const result = await sendOrderPlacedNotifications(orderId)
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "notification failed" }, { status: result.status ?? 500 })
    }
    return NextResponse.json(result)
  } catch (err) {
    console.error("[order-placed notification]", err)
    return NextResponse.json({ error: "notification failed" }, { status: 500 })
  }
}
