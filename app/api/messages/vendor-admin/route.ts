import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { extractRoleName } from "@/lib/extract-role-name"

export const runtime = "nodejs"

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

type AppRole = "customer" | "vendor" | "admin" | "super_admin"

function isMessagingSchemaMissing(error: { code?: string; message?: string; details?: string } | null | undefined): boolean {
  if (!error) return false
  const text = [error.message, error.details].filter(Boolean).join(" ").toLowerCase()
  if (error.code === "42P01") return true
  if (error.code === "PGRST205") return true
  return text.includes("support_threads") && text.includes("does not exist")
}

async function getActor() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const admin = adminClient()
  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, roles(name)")
    .eq("id", user.id)
    .maybeSingle()
  const role = (extractRoleName(profile?.roles) ?? "customer") as AppRole
  return {
    userId: user.id,
    role,
    fullName: profile?.full_name ?? null,
  }
}

export async function GET() {
  try {
    const actor = await getActor()
    if (!actor) {
      return NextResponse.json({ error: "Kimlik dogrulamasi gerekli." }, { status: 401 })
    }
    const admin = adminClient()

    let threadQuery = admin
      .from("support_threads")
      .select("id, subject, store_id, vendor_order_id, updated_at, last_message_at")
      .eq("thread_type", "vendor_admin")
      .order("last_message_at", { ascending: false })
      .limit(100)

    if (actor.role === "vendor") {
      const { data: stores } = await admin
        .from("vendor_stores")
        .select("id")
        .eq("owner_id", actor.userId)
      const storeIds = (stores ?? []).map((store) => store.id as string)
      if (storeIds.length === 0) {
        return NextResponse.json({ threads: [] })
      }
      threadQuery = threadQuery.in("store_id", storeIds)
    } else if (actor.role !== "admin" && actor.role !== "super_admin") {
      return NextResponse.json({ error: "Bu alana erisim yetkiniz yok." }, { status: 403 })
    }

    const { data: threads, error } = await threadQuery
    if (error) {
      if (isMessagingSchemaMissing(error)) {
        return NextResponse.json(
          { error: "Mesajlasma tablolari hazir degil. scripts/029_support_threads_and_messages.sql calistirin." },
          { status: 503 },
        )
      }
      return NextResponse.json({ error: "Mesajlasma listesi alinamadi." }, { status: 500 })
    }

    const storeIds = [...new Set((threads ?? []).map((thread) => thread.store_id).filter(Boolean))]
    let storeNameById = new Map<string, string>()
    if (storeIds.length > 0) {
      const { data: stores } = await admin.from("vendor_stores").select("id, name").in("id", storeIds)
      storeNameById = new Map((stores ?? []).map((store) => [store.id as string, (store.name as string) ?? "Magaza"]))
    }

    return NextResponse.json({
      threads: (threads ?? []).map((thread) => ({
        id: thread.id,
        subject: thread.subject ?? "Destek talebi",
        storeId: thread.store_id,
        storeName: thread.store_id ? (storeNameById.get(thread.store_id as string) ?? "Magaza") : "Magaza",
        vendorOrderId: thread.vendor_order_id,
        updatedAt: thread.updated_at,
        lastMessageAt: thread.last_message_at,
      })),
    })
  } catch {
    return NextResponse.json({ error: "Mesajlasma listesi alinamadi." }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await getActor()
    if (!actor) {
      return NextResponse.json({ error: "Kimlik dogrulamasi gerekli." }, { status: 401 })
    }
    if (actor.role !== "vendor") {
      return NextResponse.json({ error: "Sadece vendor hesaplari talep olusturabilir." }, { status: 403 })
    }

    const payload = (await req.json().catch(() => ({}))) as {
      subject?: string
      message?: string
      vendorOrderId?: string | null
    }
    const subject = payload.subject?.trim() ?? "Destek talebi"
    const message = payload.message?.trim()
    if (!message) {
      return NextResponse.json({ error: "Mesaj bos olamaz." }, { status: 400 })
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: "Mesaj 2000 karakteri gecemez." }, { status: 422 })
    }

    const admin = adminClient()
    const { data: stores } = await admin
      .from("vendor_stores")
      .select("id")
      .eq("owner_id", actor.userId)
      .limit(1)
    const storeId = stores?.[0]?.id as string | undefined
    if (!storeId) {
      return NextResponse.json({ error: "Vendor magazasi bulunamadi." }, { status: 403 })
    }

    let orderId: string | null = null
    let vendorOrderId: string | null = null
    if (payload.vendorOrderId) {
      const { data: vendorOrder } = await admin
        .from("vendor_orders")
        .select("id, store_id, order_id")
        .eq("id", payload.vendorOrderId)
        .maybeSingle()
      if (!vendorOrder || vendorOrder.store_id !== storeId) {
        return NextResponse.json({ error: "Secilen siparis satirina erisim yetkiniz yok." }, { status: 403 })
      }
      vendorOrderId = vendorOrder.id as string
      orderId = (vendorOrder.order_id as string | null) ?? null
    }

    const { data: thread, error: threadErr } = await admin
      .from("support_threads")
      .insert({
        thread_type: "vendor_admin",
        subject,
        vendor_order_id: vendorOrderId,
        order_id: orderId,
        store_id: storeId,
        vendor_user_id: actor.userId,
        created_by: actor.userId,
      })
      .select("id")
      .single()

    if (threadErr || !thread?.id) {
      if (isMessagingSchemaMissing(threadErr ?? null)) {
        return NextResponse.json(
          { error: "Mesajlasma tablolari hazir degil. scripts/029_support_threads_and_messages.sql calistirin." },
          { status: 503 },
        )
      }
      return NextResponse.json({ error: "Talep olusturulamadi." }, { status: 500 })
    }

    const { error: msgErr } = await admin.from("support_thread_messages").insert({
      thread_id: thread.id,
      sender_user_id: actor.userId,
      sender_role: "vendor",
      body: message,
    })
    if (msgErr) {
      if (isMessagingSchemaMissing(msgErr)) {
        return NextResponse.json(
          { error: "Mesajlasma tablolari hazir degil. scripts/029_support_threads_and_messages.sql calistirin." },
          { status: 503 },
        )
      }
      return NextResponse.json({ error: "Ilk mesaj kaydedilemedi." }, { status: 500 })
    }

    await admin.from("support_threads").update({
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", thread.id)

    return NextResponse.json({ ok: true, threadId: thread.id })
  } catch {
    return NextResponse.json({ error: "Talep olusturulamadi." }, { status: 500 })
  }
}
