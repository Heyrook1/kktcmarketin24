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
  return (text.includes("support_thread_messages") || text.includes("support_threads")) && text.includes("does not exist")
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

  return {
    userId: user.id,
    role: (extractRoleName(profile?.roles) ?? "customer") as AppRole,
    fullName: profile?.full_name ?? null,
  }
}

async function assertVendorAdminThreadAccess(threadId: string, actor: NonNullable<Awaited<ReturnType<typeof getActor>>>) {
  const admin = adminClient()
  const { data: thread } = await admin
    .from("support_threads")
    .select("id, thread_type, store_id")
    .eq("id", threadId)
    .maybeSingle()
  if (!thread || thread.thread_type !== "vendor_admin") {
    return { ok: false as const, status: 404, error: "Destek thread'i bulunamadi." }
  }

  if (actor.role === "admin" || actor.role === "super_admin") {
    return { ok: true as const, threadId: thread.id as string }
  }
  if (actor.role !== "vendor") {
    return { ok: false as const, status: 403, error: "Bu mesaja erisim yetkiniz yok." }
  }

  const { data: store } = await admin
    .from("vendor_stores")
    .select("id")
    .eq("id", thread.store_id)
    .eq("owner_id", actor.userId)
    .maybeSingle()
  if (!store) {
    return { ok: false as const, status: 403, error: "Bu mesaja erisim yetkiniz yok." }
  }

  return { ok: true as const, threadId: thread.id as string }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const actor = await getActor()
  if (!actor) {
    return NextResponse.json({ error: "Kimlik dogrulamasi gerekli." }, { status: 401 })
  }
  const { threadId } = await params

  const access = await assertVendorAdminThreadAccess(threadId, actor)
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const admin = adminClient()
  const { data: messages, error } = await admin
    .from("support_thread_messages")
    .select("id, sender_role, sender_user_id, body, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(300)
  if (error) {
    if (isMessagingSchemaMissing(error)) {
      return NextResponse.json(
        { error: "Mesajlasma tablolari hazir degil. scripts/029_support_threads_and_messages.sql calistirin." },
        { status: 503 },
      )
    }
    return NextResponse.json({ error: "Mesajlar alinamadi." }, { status: 500 })
  }

  const userIds = [...new Set((messages ?? []).map((message) => message.sender_user_id).filter(Boolean))]
  let profileNameById = new Map<string, string>()
  if (userIds.length > 0) {
    const { data: profiles } = await admin.from("profiles").select("id, full_name").in("id", userIds)
    profileNameById = new Map((profiles ?? []).map((profile) => [profile.id as string, (profile.full_name as string) ?? "Kullanici"]))
  }

  return NextResponse.json({
    threadId,
    messages: (messages ?? []).map((message) => ({
      id: message.id,
      senderRole: message.sender_role,
      senderName: profileNameById.get(message.sender_user_id as string) ?? "Kullanici",
      body: message.body,
      createdAt: message.created_at,
    })),
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const actor = await getActor()
  if (!actor) {
    return NextResponse.json({ error: "Kimlik dogrulamasi gerekli." }, { status: 401 })
  }
  const { threadId } = await params
  const access = await assertVendorAdminThreadAccess(threadId, actor)
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

  const admin = adminClient()
  const senderRole: AppRole =
    actor.role === "super_admin" ? "super_admin" : actor.role === "admin" ? "admin" : "vendor"
  const { error } = await admin.from("support_thread_messages").insert({
    thread_id: threadId,
    sender_user_id: actor.userId,
    sender_role: senderRole,
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
