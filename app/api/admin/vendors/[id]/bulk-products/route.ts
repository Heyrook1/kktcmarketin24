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

const MAX_PRODUCTS = 200

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await assertAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

  const { id } = await params
  if (!isUuidLike(id)) return NextResponse.json({ error: "Geçersiz vendor id." }, { status: 422 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi." }, { status: 400 })
  }

  const rawProducts = Array.isArray(body)
    ? body
    : (body && typeof body === "object" && Array.isArray((body as any).products))
      ? (body as any).products
      : null

  if (!rawProducts) return NextResponse.json({ error: "products dizisi gerekli." }, { status: 400 })
  if (rawProducts.length === 0) return NextResponse.json({ error: "Hiç ürün verilmedi." }, { status: 422 })
  if (rawProducts.length > MAX_PRODUCTS) return NextResponse.json({ error: `En fazla ${MAX_PRODUCTS} ürün eklenebilir.` }, { status: 422 })

  const productsToInsert: Array<Record<string, unknown>> = []

  for (let i = 0; i < rawProducts.length; i++) {
    const item = rawProducts[i] as Record<string, unknown> | null
    if (!item) return NextResponse.json({ error: `Ürün ${i + 1} geçersiz.` }, { status: 422 })

    const name = String(item.name ?? "").trim()
    const description = item.description == null ? null : String(item.description).trim() || null

    const price = Number(item.price)
    if (!name) return NextResponse.json({ error: `Ürün ${i + 1}: name zorunludur.` }, { status: 422 })
    if (!Number.isFinite(price) || price <= 0) return NextResponse.json({ error: `Ürün ${i + 1}: price > 0 olmalıdır.` }, { status: 422 })

    const comparePriceRaw = item.compare_price ?? item.comparePrice
    const comparePrice =
      comparePriceRaw == null || comparePriceRaw === ""
        ? null
        : (() => {
            const n = Number(comparePriceRaw)
            return Number.isFinite(n) ? n : null
          })()

    const category = String(item.category_id ?? item.category ?? "").trim()
    if (!category) return NextResponse.json({ error: `Ürün ${i + 1}: category/category_id zorunludur.` }, { status: 422 })

    const stock = item.stock == null || item.stock === ""
      ? 0
      : (() => {
          const n = Number(item.stock)
          return Number.isFinite(n) ? Math.trunc(n) : 0
        })()

    const isActive = item.is_active == null ? true : Boolean(item.is_active)

    const imageUrl = item.image_url == null || item.image_url === "" ? null : String(item.image_url).trim()

    const imagesFromBody = Array.isArray(item.images)
      ? (item.images as unknown[]).map((x) => (x == null ? "" : String(x).trim())).filter(Boolean)
      : null

    const images = (imagesFromBody && imagesFromBody.length > 0)
      ? imagesFromBody
      : imageUrl
        ? [imageUrl]
        : []

    const tags = Array.isArray(item.tags)
      ? (item.tags as unknown[]).map((x) => (x == null ? "" : String(x).trim())).filter(Boolean)
      : typeof item.tags === "string"
        ? item.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : []

    productsToInsert.push({
      name,
      description,
      price,
      compare_price: comparePrice,
      category,
      image_url: images[0] ?? null,
      images,
      tags,
      stock,
      is_active: isActive,
      store_id: id,
    })
  }

  const admin = adminClient()
  const { error } = await admin.from("vendor_products").insert(productsToInsert)
  if (error) return NextResponse.json({ error: "Toplu ekleme başarısız." }, { status: 500 })

  revalidatePath(`/admin/vendors/${id}`)
  revalidatePath("/vendor-panel/products")

  return NextResponse.json({ ok: true, inserted: productsToInsert.length })
}

