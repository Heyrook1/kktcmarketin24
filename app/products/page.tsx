import type { Metadata } from "next"
import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { ProductsContent, ProductsContentSkeleton } from "./products-content"

// ISR: re-render at most once every 10 minutes so Google always sees
// fresh product data while keeping response times fast.
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

export default async function ProductsPage() {
  const supabase = await createClient()

  // Fetch active products with store name for SEO-rendered HTML
  const { data: rawProducts } = await supabase
    .from("vendor_products")
    .select(`
      id,
      name,
      description,
      price,
      compare_price,
      category,
      image_url,
      tags,
      is_active,
      stock,
      created_at,
      store_id,
      vendor_stores ( id, name, slug )
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(200)

  // Fetch distinct categories from active products
  const { data: rawStores } = await supabase
    .from("vendor_stores")
    .select("id, name, slug")
    .eq("is_active", true)

  // Normalise to the shape ProductsContent already expects
  const initialProducts = (rawProducts ?? []).map((p) => {
    const store = Array.isArray(p.vendor_stores)
      ? p.vendor_stores[0]
      : (p.vendor_stores as { id: string; name: string; slug: string } | null)
    return {
      id:           p.id,
      name:         p.name,
      description:  p.description ?? "",
      price:        Number(p.price),
      comparePrice: p.compare_price ? Number(p.compare_price) : undefined,
      categoryId:   p.category ?? "",
      image:        p.image_url ?? "/placeholder.svg",
      images:       p.image_url ? [p.image_url] : [],
      tags:         (p.tags as string[]) ?? [],
      vendorId:     p.store_id,
      vendorName:   store?.name ?? "",
      stock:        p.stock ?? 0,
      featured:     false,
      rating:       0,
      reviewCount:  0,
      createdAt:    p.created_at,
    }
  })

  // Build unique category list from product data
  const categorySet = new Map<string, string>()
  initialProducts.forEach((p) => {
    if (p.categoryId) categorySet.set(p.categoryId, p.categoryId)
  })
  const initialCategories = Array.from(categorySet.entries()).map(([id]) => ({
    id,
    slug: id,
    name: id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, " "),
    description: "",
    image: "",
    productCount: initialProducts.filter((p) => p.categoryId === id).length,
  }))

  const initialVendors = (rawStores ?? []).map((s) => ({
    id:          s.id,
    name:        s.name,
    slug:        s.slug,
    description: "",
    logo:        "",
    rating:      0,
    reviewCount: 0,
    productCount: initialProducts.filter((p) => p.vendorId === s.id).length,
    isVerified:  true,
    createdAt:   "",
  }))

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Tüm Ürünler</h1>
        <p className="text-muted-foreground mt-1">
          {initialProducts.length} ürün — Onaylı satıcılarımızdan keşfedin
        </p>
      </div>

      {/*
        The RSC shell renders the full product list as static HTML for crawlers.
        useSearchParams inside ProductsContent requires a Suspense boundary.
      */}
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


