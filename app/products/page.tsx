import type { Metadata } from "next"
import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { ProductsContent, ProductsContentSkeleton } from "./products-content"
import { buildSearchAliases } from "@/lib/smart-search"
import { categories } from "@/lib/data/categories"

// ISR: re-render at most once every 10 minutes
export const revalidate = 600
export const metadata: Metadata = {
  title: "Tüm Ürünler | Marketin24",
  description:
    "Marketin24'te onaylı satıcılardan tüm ürünleri keşfedin. Elektronik, giyim, ev & yaşam ve daha fazlası.",
  openGraph: {
    title: "Tüm Ürünler | Marketin24",
    description: "Onaylı satıcılarımızdan yüzlerce ürünü keşfedin.",
  },
}

// ── Category normalization ────────────────────────────────────────────────────
// Maps every possible DB value (Turkish names, English names, slugs, mixed
// case, typos) to the canonical slug used by URL params and category data.
const CAT_NORMALIZE: Record<string, string> = {
  // Turkish names
  "elektronik":           "electronics",
  "moda":                 "fashion",
  "giyim":                "fashion",
  "ev":                   "home-garden",
  "ev & bahçe":           "home-garden",
  "ev ve bahçe":          "home-garden",
  "bahçe":                "home-garden",
  "güzellik":             "beauty",
  "kozmetik":             "beauty",
  "spor":                 "sports",
  "spor & outdoor":       "sports",
  "spor ve outdoor":      "sports",
  "çocuk":                "kids-baby",
  "çocuk & bebek":        "kids-baby",
  "bebek":                "kids-baby",
  "takı":                 "jewelry",
  "takı & aksesuar":      "jewelry",
  "aksesuar":             "jewelry",
  "market":               "groceries",
  "market & gıda":        "groceries",
  "gıda":                 "groceries",
  "sağlık":               "health",
  "sağlık & wellness":    "health",
  "wellness":             "health",
  "kitap":                "books",
  "kitap & kırtasiye":    "books",
  "kırtasiye":            "books",
  // Canonical slugs (identity)
  "electronics":          "electronics",
  "fashion":              "fashion",
  "home-garden":          "home-garden",
  "beauty":               "beauty",
  "sports":               "sports",
  "kids-baby":            "kids-baby",
  "jewelry":              "jewelry",
  "groceries":            "groceries",
  "health":               "health",
  "books":                "books",
}

function normalizeCategoryId(raw: string | null | undefined): string {
  if (!raw) return ""
  const lower = raw.toLowerCase().trim()
  if (CAT_NORMALIZE[lower]) return CAT_NORMALIZE[lower]
  const cat = categories.find(
    (c) => c.id === lower || c.slug === lower || c.name.toLowerCase() === lower
  )
  if (cat) return cat.id
  return lower
}

export default async function ProductsPage() {
  const supabase = await createClient()

  const { data: rawProducts } = await supabase
    .from("vendor_products")
    .select(`
      id, name, description, price, compare_price,
      category, image_url, tags, is_active, stock, created_at, store_id,
      vendor_stores ( id, name, slug )
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(200)

  const { data: rawStores } = await supabase
    .from("vendor_stores")
    .select("id, name, slug")
    .eq("is_active", true)

  const initialProducts = (rawProducts ?? []).map((p) => {
    const store = Array.isArray(p.vendor_stores)
      ? p.vendor_stores[0]
      : (p.vendor_stores as { id: string; name: string; slug: string } | null)
    const tags = (p.tags as string[]) ?? []
    const categoryId = normalizeCategoryId(p.category)
    const searchAliases = buildSearchAliases(categoryId, tags)
    return {
      id:           p.id,
      name:         p.name,
      description:  p.description ?? "",
      price:        Number(p.price),
      comparePrice: p.compare_price ? Number(p.compare_price) : undefined,
      categoryId,
      image:        p.image_url ?? "/placeholder.svg",
      images:       p.image_url ? [p.image_url] : [],
      tags,
      vendorId:     p.store_id,
      vendorName:   store?.name ?? "",
      stock:        p.stock ?? 0,
      featured:     false,
      rating:       0,
      reviewCount:  0,
      createdAt:    p.created_at,
      searchAliases,
    }
  })

  // Build sidebar category list using canonical names from categories data
  const usedCatIds = [...new Set(initialProducts.map((p) => p.categoryId).filter(Boolean))]
  const initialCategories = usedCatIds.map((id) => {
    const cat = categories.find((c) => c.id === id)
    return {
      id,
      slug:         cat?.slug ?? id,
      name:         cat?.name ?? id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, " "),
      description:  cat?.description ?? "",
      image:        cat?.image ?? "",
      productCount: initialProducts.filter((p) => p.categoryId === id).length,
    }
  })

  const initialVendors = (rawStores ?? []).map((s) => ({
    id:           s.id,
    name:         s.name,
    slug:         s.slug,
    description:  "",
    logo:         "",
    rating:       0,
    reviewCount:  0,
    productCount: initialProducts.filter((p) => p.vendorId === s.id).length,
    isVerified:   true,
    createdAt:    "",
  }))

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{"Tüm Ürünler"}</h1>
        <p className="text-muted-foreground mt-1">
          {initialProducts.length} ürün — Onaylı satıcılarımızdan keşfedin
        </p>
      </div>
      <Suspense fallback={<ProductsContentSkeleton />}>
        <ProductsContent
          initialProducts={initialProducts}
          initialCategories={initialCategories}
          initialVendors={initialVendors}
        />
      </Suspense>
    </div>
  )
}
