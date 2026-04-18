import { createClient } from "@/lib/supabase/server"
import { parseSearchIntent } from "@/lib/smart-search"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "edge"

const PAGE_SIZE = 12

const searchQuerySchema = z.object({
  q: z.string().trim().default(""),
  category: z.string().trim().default(""),
  sub: z.string().trim().default(""),
  vendor: z.string().trim().default(""),
  sort: z.enum(["newest", "price_asc", "price_desc", "popular"]).default("newest"),
  min_price: z.coerce.number().finite().min(1).optional(),
  max_price: z.coerce.number().finite().min(1).optional(),
  tags: z.string().trim().default(""),
  page: z.coerce.number().int().min(1).default(1),
}).refine((value) => {
  if (value.min_price === undefined || value.max_price === undefined) {
    return true
  }
  return value.max_price >= value.min_price
}, {
  message: "max_price, min_price değerinden küçük olamaz.",
  path: ["max_price"],
})

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const parsedQuery = searchQuerySchema.safeParse({
      q: searchParams.get("q") ?? "",
      category: searchParams.get("category") ?? "",
      sub: searchParams.get("sub") ?? "",
      vendor: searchParams.get("vendor") ?? "",
      sort: searchParams.get("sort") ?? "newest",
      min_price: searchParams.get("min_price") ?? undefined,
      max_price: searchParams.get("max_price") ?? undefined,
      tags: searchParams.get("tags") ?? "",
      page: searchParams.get("page") ?? "1",
    })
    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: parsedQuery.error.issues[0]?.message ?? "Geçersiz arama parametreleri." },
        { status: 400 },
      )
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
    } = parsedQuery.data
    const offset = (page - 1) * PAGE_SIZE

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
    if (intent?.brand) tagsToFilter.push(intent.brand)
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
    if (minPrice !== undefined) query = query.gte("price", minPrice)
    if (maxPrice !== undefined) query = query.lte("price", maxPrice)

  // ── Sort ──────────────────────────────────────────────────────────────────
    switch (sort) {
      case "price_asc": query = query.order("price", { ascending: true }); break
      case "price_desc": query = query.order("price", { ascending: false }); break
      case "popular": query = query.order("stock", { ascending: false }); break
      default: query = query.order("created_at", { ascending: false })
    }

    query = query.range(offset, offset + PAGE_SIZE - 1)

    const { data, count, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

  // ── Normalise to Product shape ────────────────────────────────────────────
    const products = (data ?? []).map((p) => {
      const store = Array.isArray(p.vendor_stores)
        ? (p.vendor_stores as any)[0]
        : (p.vendor_stores as { id: string; name: string; slug: string } | null)
      return {
        id: p.id,
        name: p.name,
        slug: p.id,
        description: p.description ?? "",
        price: Number(p.price),
        originalPrice: p.compare_price ? Number(p.compare_price) : undefined,
        images: p.image_url ? [p.image_url] : ["/placeholder.svg"],
        categoryId: p.category ?? "",
        vendorId: p.store_id ?? "",
        vendorName: store?.name ?? "",
        vendorSlug: store?.slug ?? "",
        rating: 0,
        reviewCount: 0,
        inStock: (p.stock ?? 0) > 0,
        stockCount: p.stock ?? 0,
        tags: (p.tags as string[]) ?? [],
        featured: false,
        createdAt: p.created_at,
      }
    })

    return NextResponse.json({
      products,
      total: count ?? 0,
      page,
      totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
      pageSize: PAGE_SIZE,
      intent,
    })

    // Note: analytics for this route are handled client-side by products-content.tsx
    // to avoid edge-function latency. The /api/search/analytics POST endpoint handles
    // the analytics writes via service role.
  } catch {
    return NextResponse.json({ error: "Arama sırasında beklenmeyen bir hata oluştu." }, { status: 500 })
  }
}
