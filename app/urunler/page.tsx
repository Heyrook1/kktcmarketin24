import type { Metadata } from "next"
import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { ProductsContent, ProductsContentSkeleton } from "@/app/products/products-content"
import { buildSearchAliases } from "@/lib/smart-search"
import { categories } from "@/lib/data/categories"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Tüm Ürünler | Marketin24",
  description:
    "Marketin24'te onaylı satıcılardan tüm ürünleri keşfedin. Elektronik, giyim, ev & yaşam ve daha fazlası.",
  openGraph: {
    title: "Tüm Ürünler | Marketin24",
    description: "Onaylı satıcılarımızdan yüzlerce ürünü keşfedin.",
  },
}

/** Maps any possible DB category value → canonical slug */
const CAT_MAP: Record<string, string> = {
  elektronik: "electronics",        electronics: "electronics",
  moda: "fashion",                  fashion: "fashion",
  giyim: "fashion",                 "ev & bahçe": "home-garden",
  "ev ve bahçe": "home-garden",     "home-garden": "home-garden",
  ev: "home-garden",                bahçe: "home-garden",
  güzellik: "beauty",               beauty: "beauty",
  kozmetik: "beauty",               spor: "sports",
  sports: "sports",                 "spor & outdoor": "sports",
  "çocuk & bebek": "kids-baby",     "kids-baby": "kids-baby",
  bebek: "kids-baby",               çocuk: "kids-baby",
  "takı & aksesuar": "jewelry",     jewelry: "jewelry",
  takı: "jewelry",                  aksesuar: "jewelry",
  "market & gıda": "groceries",     groceries: "groceries",
  market: "groceries",              gıda: "groceries",
  "sağlık & wellness": "health",    health: "health",
  sağlık: "health",                 wellness: "health",
  "kitap & kırtasiye": "books",     books: "books",
  kitap: "books",                   kırtasiye: "books",
}

function normalizeCat(raw: string | null | undefined): string {
  if (!raw) return ""
  const lower = raw.toLowerCase().trim()
  if (CAT_MAP[lower]) return CAT_MAP[lower]
  const match = categories.find(
    (c) => c.id === lower || c.slug === lower || c.name.toLowerCase() === lower
  )
  return match?.id ?? lower
}

export default async function UrunlerPage() {
  const supabase = await createClient()

  const [{ data: rawProducts, error: prodErr }, { data: rawStores }] =
    await Promise.all([
      supabase
        .from("vendor_products")
        .select(
          "id, name, description, price, compare_price, category, image_url, tags, is_active, stock, created_at, store_id, vendor_stores(id, name, slug)"
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("vendor_stores")
        .select("id, name, slug")
        .eq("is_active", true),
    ])

  if (prodErr) console.error("[urunler/page] DB error:", prodErr.message)

  const initialProducts = (rawProducts ?? []).map((p) => {
    const store = Array.isArray(p.vendor_stores)
      ? p.vendor_stores[0]
      : (p.vendor_stores as { id: string; name: string; slug: string } | null)
    const tags       = (p.tags as string[]) ?? []
    const categoryId = normalizeCat(p.category)
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
      searchAliases: buildSearchAliases(categoryId, tags),
    }
  })

  const usedCatIds = [...new Set(
    initialProducts.map((p) => p.categoryId).filter(Boolean),
  )]
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
          {initialProducts.length} ürün &mdash; Onaylı satıcılarımızdan keşfedin
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
