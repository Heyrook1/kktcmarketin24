// app/products/page.tsx — v16
import type { Metadata } from "next"
import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { ProductsContent, ProductsContentSkeleton } from "./products-content"
import { buildSearchAliases } from "@/lib/smart-search"
import { categories } from "@/lib/data/categories"

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

// Canonical slugs that match URL params, category data IDs, and DB values
// after the 016_normalize_product_categories migration.
const VALID_SLUGS = new Set([
  "electronics","fashion","home-garden","beauty","sports",
  "kids-baby","jewelry","groceries","health","books",
])

/** Last-resort normalizer — handles any values the DB migration didn't catch */
function normalizeCategoryId(raw: string | null | undefined): string {
  if (!raw) return ""
  const v = raw.toLowerCase().trim()
  if (VALID_SLUGS.has(v)) return v
  // Try matching against category list by name
  const cat = categories.find(
    (c) => c.id === v || c.slug === v || c.name.toLowerCase() === v
  )
  return cat?.id ?? v
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
    const tags       = (p.tags as string[]) ?? []
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

  // Sidebar category list — only categories that have at least one product
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
