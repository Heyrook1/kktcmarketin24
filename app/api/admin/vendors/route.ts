import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { assertAdminAuth } from "@/lib/admin-auth"
import { revalidatePath } from "next/cache"
import { randomUUID } from "crypto"

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET() {
  const auth = await assertAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

  const admin = adminClient()
  const { data, error } = await admin
    .from("vendor_stores")
    .select("id, owner_id, name, slug, description, logo_url, cover_url, location, is_active, is_verified, created_at, updated_at")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: "Vendor listesi alınamadı." }, { status: 500 })
  }

  return NextResponse.json({ vendors: data ?? [] })
}

export async function POST(req: NextRequest) {
  const auth = await assertAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi." }, { status: 400 })
  }

  const email = String(body.email ?? "").trim().toLowerCase()
  const password = String(body.password ?? "")
  const store = body.store as Record<string, unknown> | undefined

  const storeName = String(store?.name ?? "").trim()
  const slug = String(store?.slug ?? "").trim()
  if (!email || !email.includes("@")) return NextResponse.json({ error: "Geçerli e-posta girin." }, { status: 422 })
  if (!password || password.length < 6) return NextResponse.json({ error: "Şifre en az 6 karakter olmalıdır." }, { status: 422 })
  if (!storeName) return NextResponse.json({ error: "Mağaza adı zorunludur." }, { status: 422 })
  if (!slug) return NextResponse.json({ error: "Slug zorunludur." }, { status: 422 })

  const admin = adminClient()

  // 1) find vendor role_id
  const { data: vendorRole, error: roleErr } = await admin
    .from("roles")
    .select("id")
    .eq("name", "vendor")
    .maybeSingle()

  if (roleErr || !vendorRole?.id) {
    return NextResponse.json({ error: "Vendor role bulunamadı." }, { status: 500 })
  }

  const vendorUserId = randomUUID()
  const storeId = randomUUID()

  // 2) create auth user with service-role admin API
  const { error: createUserErr } = await admin.auth.admin.createUser({
    id: vendorUserId,
    email,
    password,
    email_confirm: true,
  })

  if (createUserErr) {
    return NextResponse.json({ error: "Vendor hesabı oluşturulamadı." }, { status: 500 })
  }

  // 3) upsert profile with vendor role
  const profilePayload = {
    id: vendorUserId,
    role_id: vendorRole.id as string,
    full_name: storeName,
    display_name: storeName,
    is_active: true,
    is_verified: Boolean(store?.is_verified ?? false),
  }

  const { error: profileErr } = await admin.from("profiles").upsert(profilePayload)
  if (profileErr) {
    return NextResponse.json({ error: "Vendor profili oluşturulamadı." }, { status: 500 })
  }

  // 4) create vendor store row
  const { error: storeErr } = await admin.from("vendor_stores").insert({
    id: storeId,
    owner_id: vendorUserId,
    name: storeName,
    slug,
    description: store?.description ? String(store.description) : null,
    logo_url: store?.logo_url ? String(store.logo_url) : null,
    cover_url: store?.cover_url ? String(store.cover_url) : null,
    location: store?.location ? String(store.location) : null,
    is_active: Boolean(store?.is_active ?? true),
    is_verified: Boolean(store?.is_verified ?? false),
  })

  if (storeErr) {
    // slug unique violation, etc.
    return NextResponse.json({ error: "Vendor mağazası oluşturulamadı." }, { status: 500 })
  }

  revalidatePath("/admin/vendors")
  return NextResponse.json({ ok: true, storeId })
}

