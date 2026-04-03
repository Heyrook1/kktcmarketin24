import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { resolveVendorSession } from "@/lib/vendor-auth"
import { revalidatePath } from "next/cache"

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

const ALLOWED_FIELDS = [
  "name",
  "description",
  "logo_url",
  "cover_url",
  "location",
  "is_active",
] as const

type AllowedField = (typeof ALLOWED_FIELDS)[number]

function pickAllowed(body: Record<string, unknown>): Partial<Record<AllowedField, unknown>> {
  return Object.fromEntries(
    ALLOWED_FIELDS.filter((k) => k in body).map((k) => [k, body[k]])
  ) as Partial<Record<AllowedField, unknown>>
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await resolveVendorSession()
    if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Geçersiz JSON gövdesi." }, { status: 400 })
    }

    const updates = pickAllowed(body)

    const name = updates.name != null ? String(updates.name).trim() : ""
    if (!name) return NextResponse.json({ error: "Mağaza adı zorunludur." }, { status: 422 })

    // Normalize optional fields to null (Postgres-friendly)
    const description = updates.description == null ? null : String(updates.description).trim() || null
    const logoUrl = updates.logo_url == null ? null : String(updates.logo_url).trim() || null
    const coverUrl = updates.cover_url == null ? null : String(updates.cover_url).trim() || null
    const location = updates.location == null ? null : String(updates.location).trim() || null

    const isActive =
      typeof updates.is_active === "boolean"
        ? updates.is_active
        : updates.is_active != null
          ? Boolean(updates.is_active)
          : undefined

    const admin = adminClient()
    const { data, error } = await admin
      .from("vendor_stores")
      .update({
        name,
        description,
        logo_url: logoUrl,
        cover_url: coverUrl,
        location,
        ...(typeof isActive === "boolean" ? { is_active: isActive } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", auth.session.storeId)
      .select("*")
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "Mağaza güncellenemedi." }, { status: 500 })
    }

    revalidatePath("/vendor-panel/settings")
    return NextResponse.json({ ok: true, store: data })
  } catch (err) {
    // Never leak details to client
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}

