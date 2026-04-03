/**
 * GET  /api/vendor/products  — list all products for the authenticated vendor's store
 * POST /api/vendor/products  — create a new product for the authenticated vendor's store
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { resolveVendorSession } from "@/lib/vendor-auth"
import { revalidatePath } from "next/cache"

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Only columns that actually exist in vendor_products (schema-verified, no sku)
const ALLOWED_FIELDS = [
  "name", "description", "price", "compare_price",
  "category", "image_url", "images", "tags",
  "stock", "is_active",
] as const
type AllowedField = (typeof ALLOWED_FIELDS)[number]

function pickAllowed(body: Record<string, unknown>): Partial<Record<AllowedField, unknown>> {
  return Object.fromEntries(
    ALLOWED_FIELDS.filter((k) => k in body).map((k) => [k, body[k]])
  )
}

// ── GET ──────────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const auth = await resolveVendorSession()
    if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

    const admin = adminClient()
    const { data, error } = await admin
      .from("vendor_products")
      .select("*")
      .eq("store_id", auth.session.storeId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[vendor/products GET]", error)
      return NextResponse.json({ error: "Ürünler yüklenemedi." }, { status: 500 })
    }
    return NextResponse.json({ products: data })
  } catch (err) {
    console.error("[vendor/products GET] unexpected:", err)
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}

// ── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const auth = await resolveVendorSession()
    if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 })
    }

    if (!body.name || String(body.name).trim() === "") {
      return NextResponse.json({ error: "Ürün adı zorunludur." }, { status: 422 })
    }
    const price = Number(body.price)
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "Fiyat sıfırdan büyük olmalıdır." }, { status: 422 })
    }
    // Accept category_id OR category
    const category = String(body.category_id ?? body.category ?? "").trim()
    if (!category) {
      return NextResponse.json({ error: "Kategori zorunludur." }, { status: 422 })
    }

    // Build the allowed fields — use `category` column (text) only
    const picked = pickAllowed({ ...body, category })
    // Remove category_id if it sneaked in; the column is `category`
    const { category_id: _drop, ...safe } = { ...picked, category_id: undefined }

    const admin = adminClient()
    const { data, error } = await admin
      .from("vendor_products")
      .insert({
        ...safe,
        category, // canonical text slug
        store_id: auth.session.storeId, // always server-injected
        price,
      })
      .select("id")
      .single()

    if (error) {
      console.error("[vendor/products POST]", error)
      return NextResponse.json({ error: "Ürün oluşturulamadı." }, { status: 500 })
    }

    revalidatePath("/", "layout")

    return NextResponse.json({ ok: true, productId: data.id }, { status: 201 })
  } catch (err) {
    console.error("[vendor/products POST] unexpected:", err)
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}
