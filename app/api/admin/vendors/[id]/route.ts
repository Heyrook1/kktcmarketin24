import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { assertAdminAuth } from "@/lib/admin-auth"
import { revalidatePath } from "next/cache"

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

const ALLOWED_FIELDS = [
  "name",
  "slug",
  "description",
  "logo_url",
  "cover_url",
  "location",
  "is_active",
  "is_verified",
] as const

type AllowedField = (typeof ALLOWED_FIELDS)[number]

function pickAllowed(body: Record<string, unknown>): Partial<Record<AllowedField, unknown>> {
  return Object.fromEntries(
    ALLOWED_FIELDS.filter((k) => k in body).map((k) => [k, body[k]])
  ) as Partial<Record<AllowedField, unknown>>
}

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const auth = await assertAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

  const { id } = await params
  if (!isUuidLike(id)) return NextResponse.json({ error: "Geçersiz id." }, { status: 422 })

  const admin = adminClient()
  const { data, error } = await admin
    .from("vendor_stores")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error || !data) return NextResponse.json({ error: "Vendor bulunamadı." }, { status: 404 })
  return NextResponse.json({ vendor: data })
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const auth = await assertAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

  const { id } = await params
  if (!isUuidLike(id)) return NextResponse.json({ error: "Geçersiz id." }, { status: 422 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi." }, { status: 400 })
  }

  const updates = pickAllowed(body)
  if (updates.name == null && updates.slug == null && updates.description == null && updates.location == null && updates.logo_url == null && updates.cover_url == null && updates.is_active == null && updates.is_verified == null) {
    return NextResponse.json({ error: "Güncellenecek alan yok." }, { status: 422 })
  }

  const payload: Record<string, unknown> = {
    ...(updates.name != null ? { name: String(updates.name).trim() } : {}),
    ...(updates.slug != null ? { slug: String(updates.slug).trim() } : {}),
    ...(updates.description !== undefined ? { description: updates.description == null ? null : String(updates.description).trim() || null } : {}),
    ...(updates.logo_url !== undefined ? { logo_url: updates.logo_url == null ? null : String(updates.logo_url).trim() || null } : {}),
    ...(updates.cover_url !== undefined ? { cover_url: updates.cover_url == null ? null : String(updates.cover_url).trim() || null } : {}),
    ...(updates.location !== undefined ? { location: updates.location == null ? null : String(updates.location).trim() || null } : {}),
    ...(updates.is_active !== undefined ? { is_active: Boolean(updates.is_active) } : {}),
    ...(updates.is_verified !== undefined ? { is_verified: Boolean(updates.is_verified) } : {}),
    updated_at: new Date().toISOString(),
  }

  if ("name" in payload && String(payload.name).trim() === "") {
    return NextResponse.json({ error: "Mağaza adı boş olamaz." }, { status: 422 })
  }

  if ("slug" in payload && String(payload.slug).trim() === "") {
    return NextResponse.json({ error: "Slug boş olamaz." }, { status: 422 })
  }

  const admin = adminClient()
  const { data, error } = await admin
    .from("vendor_stores")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single()

  if (error || !data) return NextResponse.json({ error: "Vendor güncellenemedi." }, { status: 500 })
  revalidatePath("/admin/vendors")
  revalidatePath(`/admin/vendors/${id}`)
  return NextResponse.json({ ok: true, vendor: data })
}

