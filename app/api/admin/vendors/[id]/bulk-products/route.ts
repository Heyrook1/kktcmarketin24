import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { assertAdminAuth } from "@/lib/admin-auth"
import { revalidatePath } from "next/cache"
import { productCreateSchema } from "@/lib/validations/product"

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

    const category = String(item.category_id ?? item.category ?? "").trim()
    if (!category) return NextResponse.json({ error: `Ürün ${i + 1}: category/category_id zorunludur.` }, { status: 422 })

    const comparePriceRaw = item.compare_price ?? (item as any).comparePrice
    const compare_price = comparePriceRaw == null || comparePriceRaw === "" ? null : comparePriceRaw

    const parsed = productCreateSchema.safeParse({
      ...item,
      category,
      compare_price,
    })

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Geçersiz ürün verisi."
      return NextResponse.json({ error: `Ürün ${i + 1}: ${message}` }, { status: 422 })
    }

    const images = parsed.data.images ?? (parsed.data.image_url ? [parsed.data.image_url] : [])
    const image_url = images[0] ?? parsed.data.image_url ?? null

    productsToInsert.push({
      ...parsed.data,
      image_url,
      images,
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

