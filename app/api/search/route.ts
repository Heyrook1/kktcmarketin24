import { createClient } from "@/lib/supabase/server"
import { parseSearchIntent } from "@/lib/smart-search"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

const PAGE_SIZE = 12

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)

  const q        = searchParams.get("q")?.trim() ?? ""
  const category = searchParams.get("category") ?? ""
  const sub      = searchParams.get("sub") ?? ""
  const vendor   = searchParams.get("vendor") ?? ""
  const sort     = searchParams.get("sort") ?? "newest"
  const minPrice = searchParams.get("min_price") ? Number(searchParams.get("min_price")) : null
  const maxPrice = searchParams.get("max_price") ? Number(searchParams.get("max_price")) : null
  const tagsParam = searchParams.get("tags") ?? ""
  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
  const offset   = (page - 1) * PAGE_SIZE

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

  // ── Full-text search via search_vector (tsvector column) ────────────────
  // Uses prefix matching (:*) so partial words resolve correctly.
  // Falls back to ilike when the query is a single character or has symbols.
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

  // ── Category filter ──────────────────────────────────────────────────────
  const resolvedCategory = category || intent?.categorySlug || ""
  if (resolvedCategory) {
    query = query.eq("category", resolvedCategory)
  }

  // ── Tag / subcategory filter ─────────────────────────────────────────────
  const tagsToFilter: string[] = tagsParam ? tagsParam.split(",").filter(Boolean) : []
  if (intent?.subcategory) tagsToFilter.push(intent.subcategory)
  if (intent?.brand)       tagsToFilter.push(intent.brand)
  intent?.attributes.forEach((a) => tagsToFilter.push(a))
  if (sub) tagsToFilter.push(sub)
  if (tagsToFilter.length > 0) {
    query = query.overlaps("tags", tagsToFilter)
  }

  // ── Vendor filter ────────────────────────────────────────────────────────
  if (vendor) {
    const { data: storeRow } = await supabase
      .from("vendor_stores")
      .select("id")
      .eq("slug", vendor)
      .single()
    if (storeRow) query = query.eq("store_id", storeRow.id)
  }

  // ── Price range ──────────────────────────────────────────────────────────
  if (minPrice !== null) query = query.gte("price", minPrice)
  if (maxPrice !== null) query = query.lte("price", maxPrice)

  // ── Sort ─────────────────────────────────────────────────────────────────
  switch (sort) {
    case "price_asc":  query = query.order("price", { ascending: true });  break
    case "price_desc": query = query.order("price", { ascending: false }); break
    case "popular":    query = query.order("stock",  { ascending: false }); break
    default:           query = query.order("created_at", { ascending: false })
  }

  query = query.range(offset, offset + PAGE_SIZE - 1)

  const { data, count, error } = await query

  if (error) {
    console.error("[v0] /api/search error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // ── Normalise to Product shape ───────────────────────────────────────────
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
}


const PAGE_SIZE = 24

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)

  const q          = searchParams.get("q")?.trim() || ""
  const category   = searchParams.get("category") || ""   // category slug (e.g. "electronics")
  const sub        = searchParams.get("sub") || ""        // subcategory slug
  const vendor     = searchParams.get("vendor") || ""
  const sort       = searchParams.get("sort") || "newest"
  const minPrice   = searchParams.get("min_price") ? Number(searchParams.get("min_price")) : null
  const maxPrice   = searchParams.get("max_price") ? Number(searchParams.get("max_price")) : null
  const tagsParam  = searchParams.get("tags") || ""       // comma-separated extra tags
  const page       = Math.max(1, parseInt(searchParams.get("page") || "1"))
  const offset     = (page - 1) * PAGE_SIZE

  // Parse smart intent from the free-text query
  const intent = q ? parseSearchIntent(q) : null

  // Resolve category slug → taxonomy key for tag filtering
  let categoryTag: string | undefined
  if (category) {
    for (const [key, meta] of Object.entries(TAG_TAXONOMY)) {
      if (meta.slug === category) { categoryTag = key; break }
    }
  } else if (intent?.categorySlug) {
    for (const [key, meta] of Object.entries(TAG_TAXONOMY)) {
      if (meta.slug === intent.categorySlug) { categoryTag = key; break }
    }
  }

  let query = supabase
    .from("vendor_products")
    .select(
      `id, name, slug, description, price, compare_price,
       images, tags, category, stock,
       store:vendor_stores(id, name, slug)`,
      { count: "exact" }
    )
    .eq("is_active", true)
    .gt("stock", 0)

  // Category filter — prefer DB category column, fall back to tag
  if (category) {
    query = query.eq("category", category)
  } else if (intent?.categorySlug) {
    query = query.eq("category", intent.categorySlug)
  }

  // Tag-based subcategory filter
  const tagsToFilter: string[] = [...(tagsParam ? tagsParam.split(",") : [])]
  if (intent?.subcategory) tagsToFilter.push(intent.subcategory)
  if (intent?.brand)       tagsToFilter.push(intent.brand)
  for (const attr of (intent?.attributes ?? [])) tagsToFilter.push(attr)
  if (sub) tagsToFilter.push(sub)

  if (tagsToFilter.length > 0) {
    query = query.overlaps("tags", tagsToFilter)
  }

  // Full-text search
  if (q && q.length > 1) {
    // Use search_vector if it exists; fall back to ilike on name
    query = query.or(`search_vector.fts.${encodeURIComponent(q)},name.ilike.%${q}%`)
  }

  // Vendor filter
  if (vendor) {
    // vendor_stores.slug can't be filtered in .eq on embedded relation; use subquery
    const { data: storeRow } = await supabase
      .from("vendor_stores")
      .select("id")
      .eq("slug", vendor)
      .single()
    if (storeRow) query = query.eq("store_id", storeRow.id)
  }

  // Price range
  if (minPrice !== null) query = query.gte("price", minPrice)
  if (maxPrice !== null) query = query.lte("price", maxPrice)

  // Sorting
  switch (sort) {
    case "price_asc":  query = query.order("price", { ascending: true });  break
    case "price_desc": query = query.order("price", { ascending: false }); break
    case "popular":    query = query.order("sales_count", { ascending: false }); break
    default:           query = query.order("created_at", { ascending: false })
  }

  query = query.range(offset, offset + PAGE_SIZE - 1)

  const { data, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    products: data ?? [],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
    intent,
  })
}
