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
  return (text.includes("support_threads") || text.includes("support_thread_messages")) && text.includes("does not exist")
}

type ThreadMessage = {
  id: string
  senderRole: AppRole
  senderName: string
  body: string
  createdAt: string
}

async function getCurrentUser() {
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
    email: user.email?.toLowerCase() ?? null,
    fullName: profile?.full_name ?? null,
    role,
  }
}

async function assertCustomerVendorThreadAccess(vendorOrderId: string, actor: Awaited<ReturnType<typeof getCurrentUser>>) {
  const admin = adminClient()
  const { data: vo } = await admin
    .from("vendor_orders")
    .select("id, order_id, store_id, customer_email")
    .eq("id", vendorOrderId)
    .maybeSingle()
  if (!vo) return { ok: false as const, status: 404, error: "Siparis satiri bulunamadi." }

  const { data: store } = await admin
    .from("vendor_stores")
    .select("id, owner_id")
    .eq("id", vo.store_id)
    .maybeSingle()
  const vendorOwnerId = store?.owner_id ?? null

  let orderCustomerId: string | null = null
  let orderCustomerEmail: string | null = null
  if (vo.order_id) {
    const { data: parentOrder } = await admin
      .from("orders")
      .select("id, customer_id, customer_email")
      .eq("id", vo.order_id)
      .maybeSingle()
    orderCustomerId = parentOrder?.customer_id ?? null
    orderCustomerEmail = parentOrder?.customer_email?.toLowerCase() ?? null
  }

  const canAsAdmin = actor?.role === "admin" || actor?.role === "super_admin"
  const canAsVendor = actor?.userId && vendorOwnerId && actor.userId === vendorOwnerId
  const canAsCustomer =
    !!actor?.userId &&
    (actor.userId === orderCustomerId ||
      (actor.email && (actor.email === orderCustomerEmail || actor.email === vo.customer_email?.toLowerCase())))

  if (!canAsAdmin && !canAsVendor && !canAsCustomer) {
    return { ok: false as const, status: 403, error: "Bu mesajlasma kanalina erisim yetkiniz yok." }
  }

  return {
    ok: true as const,
    vendorOrderId: vo.id,
    orderId: vo.order_id ?? null,
    storeId: vo.store_id as string,
    customerId: orderCustomerId,
    vendorUserId: vendorOwnerId,
  }
}

async function getOrCreateThread(vendorOrderId: string, actorUserId: string, meta: {
  orderId: string | null
  storeId: string
  customerId: string | null
  vendorUserId: string | null
}) {
  const admin = adminClient()
  const { data: existing, error: existingErr } = await admin
    .from("support_threads")
    .select("id")
    .eq("thread_type", "customer_vendor")
    .eq("vendor_order_id", vendorOrderId)
    .maybeSingle()
  if (existingErr && isMessagingSchemaMissing(existingErr)) {
    throw new Error("MISSING_MESSAGING_SCHEMA")
  }
  if (existing?.id) return existing.id

  const { data: created, error } = await admin
    .from("support_threads")
    .insert({
      thread_type: "customer_vendor",
      vendor_order_id: vendorOrderId,
      order_id: meta.orderId,
      store_id: meta.storeId,
      customer_id: meta.customerId,
      vendor_user_id: meta.vendorUserId,
      created_by: actorUserId,
      subject: "Siparis ile ilgili mesajlasma",
    })
    .select("id")
    .single()

  if (error || !created?.id) {
    if (isMessagingSchemaMissing(error ?? null)) {
      throw new Error("MISSING_MESSAGING_SCHEMA")
    }
    throw new Error(error?.message ?? "Mesajlasma thread olusturulamadi.")
  }
  return created.id
}

async function loadMessages(threadId: string): Promise<ThreadMessage[]> {
  const admin = adminClient()
  const { data, error } = await admin
    .from("support_thread_messages")
    .select("id, sender_role, sender_user_id, body, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(200)
  if (error) {
    if (isMessagingSchemaMissing(error)) {
      throw new Error("MISSING_MESSAGING_SCHEMA")
    }
    throw new Error("Mesajlar alinamadi.")
  }

  const userIds = [...new Set((data ?? []).map((row) => row.sender_user_id).filter(Boolean))]
  let nameByUserId = new Map<string, string>()
  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds)
    nameByUserId = new Map((profiles ?? []).map((profile) => [profile.id as string, (profile.full_name as string) ?? "Kullanici"]))
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    senderRole: (row.sender_role as AppRole) ?? "customer",
    senderName: nameByUserId.get(row.sender_user_id as string) ?? "Kullanici",
    body: row.body as string,
    createdAt: row.created_at as string,
  }))
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ vendorOrderId: string }> },
) {
  const actor = await getCurrentUser()
  if (!actor) {
    return NextResponse.json({ error: "Kimlik dogrulamasi gerekli." }, { status: 401 })
  }

  const { vendorOrderId } = await params
  const access = await assertCustomerVendorThreadAccess(vendorOrderId, actor)
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  let threadId: string
  let messages: ThreadMessage[]
  try {
    threadId = await getOrCreateThread(vendorOrderId, actor.userId, {
      orderId: access.orderId,
      storeId: access.storeId,
      customerId: access.customerId ?? null,
      vendorUserId: access.vendorUserId ?? null,
    })
    messages = await loadMessages(threadId)
  } catch (error) {
    if (error instanceof Error && error.message === "MISSING_MESSAGING_SCHEMA") {
      return NextResponse.json(
        { error: "Mesajlasma tablolari hazir degil. scripts/029_support_threads_and_messages.sql calistirin." },
        { status: 503 },
      )
    }
    return NextResponse.json({ error: "Mesajlar alinamadi." }, { status: 500 })
  }

  return NextResponse.json({ threadId, messages })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ vendorOrderId: string }> },
) {
  const actor = await getCurrentUser()
  if (!actor) {
    return NextResponse.json({ error: "Kimlik dogrulamasi gerekli." }, { status: 401 })
  }
  const { vendorOrderId } = await params
  const access = await assertCustomerVendorThreadAccess(vendorOrderId, actor)
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const payload = (await req.json().catch(() => ({}))) as { message?: string }
  const message = payload.message?.trim()
  if (!message) {
    return NextResponse.json({ error: "Mesaj bos olamaz." }, { status: 400 })
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: "Mesaj 2000 karakteri gecemez." }, { status: 422 })
  }

  let threadId: string
  try {
    threadId = await getOrCreateThread(vendorOrderId, actor.userId, {
      orderId: access.orderId,
      storeId: access.storeId,
      customerId: access.customerId ?? null,
      vendorUserId: access.vendorUserId ?? null,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "MISSING_MESSAGING_SCHEMA") {
      return NextResponse.json(
        { error: "Mesajlasma tablolari hazir degil. scripts/029_support_threads_and_messages.sql calistirin." },
        { status: 503 },
      )
    }
    return NextResponse.json({ error: "Mesajlasma thread'i olusturulamadi." }, { status: 500 })
  }

  const admin = adminClient()
  const { error } = await admin.from("support_thread_messages").insert({
    thread_id: threadId,
    sender_user_id: actor.userId,
    sender_role: actor.role,
    body: message,
  })
  if (error) {
    if (isMessagingSchemaMissing(error)) {
      return NextResponse.json(
        { error: "Mesajlasma tablolari hazir degil. scripts/029_support_threads_and_messages.sql calistirin." },
        { status: 503 },
      )
    }
    return NextResponse.json({ error: "Mesaj gonderilemedi." }, { status: 500 })
  }
  await admin.from("support_threads").update({
    last_message_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", threadId)

  return NextResponse.json({ ok: true, threadId })
}
