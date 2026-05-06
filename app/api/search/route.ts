import { createClient } from "@/lib/supabase/server"
import { parseSearchIntent } from "@/lib/smart-search"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "edge"

const PAGE_SIZE = 12

const optionalPriceFilterSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => value ? Number(value) : null)
  .pipe(z.number().finite().min(1).nullable())

const searchParamsSchema = z.object({
  q: z.string().trim().optional().default(""),
  category: z.string().optional().default(""),
  sub: z.string().optional().default(""),
  vendor: z.string().optional().default(""),
  sort: z.enum(["newest", "price_asc", "price_desc", "popular"]).optional().default("newest"),
  min_price: optionalPriceFilterSchema,
  max_price: optionalPriceFilterSchema,
  tags: z.string().optional().default(""),
  page: z
    .string()
    .optional()
    .transform((value) => {
      const page = Number.parseInt(value ?? "1", 10)
      return Number.isFinite(page) ? Math.max(1, page) : 1
    }),
})

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const parsedParams = searchParamsSchema.safeParse(Object.fromEntries(searchParams))

    if (!parsedParams.success) {
      return NextResponse.json({ error: "Geçersiz arama parametreleri." }, { status: 400 })
    }

    const {
      q,
      category,
      sub,
      vendor,
      sort,
      min_price: minPrice,
      max_price: maxPrice,
      tags: tagsParam,
      page,
    } = parsedParams.data
    const offset = (page - 1) * PAGE_SIZE

    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      return NextResponse.json({ error: "Minimum fiyat maksimum fiyattan büyük olamaz." }, { status: 400 })
    }

    // Parse multilingual (TR/EN/CY) search intent from free-text query
    const intent = q ? parseSearchIntent(q) : null

    let query = supabase
      .from("vendor_products")
      .select(
        `id, name, description, price, compare_price,
         image_url, tags, category, stock, is_active, created_at, store_id,
         vendor_stores ( id, name, slug )`,
        { count: "exact" }
      )
      .eq("is_active", true)

  // ── Full-text search via search_vector (tsvector) ─────────────────────────
    if (q.length >= 2) {
      const sanitised = q
        .replace(/['\\:&|!()]/g, " ")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => `${w}:*`)
        .join(" & ")

      if (sanitised) {
        query = (query as any).textSearch("search_vector", sanitised, {
          type: "plain",
          config: "simple",
        })
      } else {
        query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`)
      }
    }

    // ── Category filter ───────────────────────────────────────────────────────
    const resolvedCategory = category || intent?.categorySlug || ""
    if (resolvedCategory) {
      query = query.eq("category", resolvedCategory)
    }

    // ── Tag / subcategory filter ──────────────────────────────────────────────
    const tagsToFilter: string[] = tagsParam ? tagsParam.split(",").filter(Boolean) : []
    if (intent?.subcategory) tagsToFilter.push(intent.subcategory)
    if (intent?.brand)       tagsToFilter.push(intent.brand)
    intent?.attributes.forEach((a) => tagsToFilter.push(a))
    if (sub) tagsToFilter.push(sub)
    if (tagsToFilter.length > 0) {
      query = query.overlaps("tags", tagsToFilter)
    }

    // ── Vendor filter ─────────────────────────────────────────────────────────
    if (vendor) {
      const { data: storeRow } = await supabase
        .from("vendor_stores")
        .select("id")
        .eq("slug", vendor)
        .single()
      if (storeRow) query = query.eq("store_id", storeRow.id)
    }

    // ── Price range ───────────────────────────────────────────────────────────
    if (minPrice !== null) query = query.gte("price", minPrice)
    if (maxPrice !== null) query = query.lte("price", maxPrice)

    // ── Sort ──────────────────────────────────────────────────────────────────
    switch (sort) {
      case "price_asc":  query = query.order("price",      { ascending: true  }); break
      case "price_desc": query = query.order("price",      { ascending: false }); break
      case "popular":    query = query.order("stock",      { ascending: false }); break
      default:           query = query.order("created_at", { ascending: false })
    }

    query = query.range(offset, offset + PAGE_SIZE - 1)

    const { data, count, error } = await query

    if (error) {
      return NextResponse.json({ error: "Arama şu anda tamamlanamadı." }, { status: 500 })
    }

  // ── Normalise to Product shape ────────────────────────────────────────────
    const products = (data ?? []).map((p) => {
      const store = Array.isArray(p.vendor_stores)
        ? (p.vendor_stores as any)[0]
        : (p.vendor_stores as { id: string; name: string; slug: string } | null)
      return {
        id:            p.id,
        name:          p.name,
        slug:          p.id,
        description:   p.description ?? "",
        price:         Number(p.price),
        originalPrice: p.compare_price ? Number(p.compare_price) : undefined,
        images:        p.image_url ? [p.image_url] : ["/placeholder.svg"],
        categoryId:    p.category ?? "",
        vendorId:      p.store_id ?? "",
        vendorName:    store?.name ?? "",
        vendorSlug:    store?.slug ?? "",
        rating:        0,
        reviewCount:   0,
        inStock:       (p.stock ?? 0) > 0,
        stockCount:    p.stock ?? 0,
        tags:          (p.tags as string[]) ?? [],
        featured:      false,
        createdAt:     p.created_at,
      }
    })

    return NextResponse.json({
      products,
      total:      count ?? 0,
      page,
      totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
      pageSize:   PAGE_SIZE,
      intent,
    })
  } catch {
    return NextResponse.json({ error: "Arama şu anda tamamlanamadı." }, { status: 500 })
  }

  // Note: analytics for this route are handled client-side by products-content.tsx
  // to avoid edge-function latency. The /api/search/analytics POST endpoint handles
  // the analytics writes via service role.
}
