import { NextRequest, NextResponse } from "next/server"
import { sendOrderPlacedNotifications } from "@/lib/email/send-order-placed-notifications"

export async function POST(req: NextRequest) {
  try {
    const { order_id } = (await req.json()) as { order_id?: string }
    if (!order_id) {
      return NextResponse.json({ error: "order_id is required" }, { status: 400 })
    }
    const result = await sendOrderPlacedNotifications(order_id)
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "internal server error" }, { status: result.status ?? 500 })
    }
    return NextResponse.json(result)
  } catch (err) {
    console.error("[notify] unexpected error:", err)
    return NextResponse.json({ error: "internal server error" }, { status: 500 })
  }
}
