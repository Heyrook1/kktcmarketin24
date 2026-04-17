import type { Metadata } from "next"
import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { ProductsContent, ProductsContentSkeleton } from "@/app/products/products-content"
import { categories } from "@/lib/data/categories"
import { vendors } from "@/lib/data/vendors"
import { mapVendorProductRowToListProduct } from "@/lib/map-vendor-product-list"
import { isPublicCatalogProduct } from "@/lib/public-product-filter"

/** Always read fresh product rows from Supabase (new listings show without waiting on ISR). */
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Tüm Ürünler | Marketin24",
  description:
    "Marketin24'te onaylı satıcılardan tüm ürünleri keşfedin. Elektronik, giyim, ev & yaşam ve daha fazlası.",
  openGraph: {
    title: "Tüm Ürünler | Marketin24",
    description: "Onaylı satıcılarımızdan yüzlerce ürünü keşfedin.",
  },
}

export default async function UrunlerPage() {
  const supabase = await createClient()

  const [{ data: rawProducts, error: prodErr }, { data: rawStores }] =
    await Promise.all([
      supabase
        .from("vendor_products")
        .select(
          "id, name, description, price, compare_price, category, image_url, images, tags, is_active, stock, created_at, store_id, vendor_stores(id, name, slug)"
        )
        .eq("is_active", true)
        .gt("stock", 0)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("vendor_stores")
        .select("id, name, slug")
        .eq("is_active", true),
    ])

  if (prodErr) console.error("[urunler/page] DB error:", prodErr.message)

  const initialProducts = (rawProducts ?? [])
    .filter((row) =>
      isPublicCatalogProduct({ stock: row.stock, tags: row.tags, name: row.name })
    )
    .map((p) =>
      mapVendorProductRowToListProduct(p as Parameters<typeof mapVendorProductRowToListProduct>[0])
    )

  const usedCatIds = [...new Set(
    initialProducts.map((p) => p.categoryId).filter(Boolean),
  )]
  const initialCategories = usedCatIds.map((id) => {
    const matchedCategory = categories.find((category) => category.id === id || category.slug === id)

    if (matchedCategory) {
      return matchedCategory
    }

    return {
      id,
      slug: id,
      name: id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, " "),
      description: "",
      image: "",
      icon: "Smartphone",
    }
  })

  const initialVendors = (rawStores ?? []).map((s) => {
    const matchedVendor = vendors.find((vendor) => vendor.id === s.id || vendor.slug === s.slug)
    if (matchedVendor) {
      return matchedVendor
    }

    return {
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: "",
      logo: "",
      coverImage: "",
      rating: 0,
      joinedDate: "",
      location: "",
      categories: [],
      socialLinks: {},
      verified: true,
    }
  })

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
