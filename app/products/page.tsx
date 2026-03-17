import type { Metadata } from "next"
import { ProductsContent } from "./products-content"
import { products } from "@/lib/data/products"
import { categories } from "@/lib/data/categories"
import { vendors } from "@/lib/data/vendors"
import { ProductGrid } from "@/components/product/product-grid"

// ISR: regenerate at most once per hour. Replace the data source with a
// Supabase query when products are migrated to the DB; the page contract
// stays identical.
export const revalidate = 3600

export const metadata: Metadata = {
  title: "Tüm Ürünler | Marketin24",
  description:
    "Marketin24'te onaylı satıcılardan tüm ürünleri keşfedin. Elektronik, giyim, ev & yaşam ve daha fazlası.",
  openGraph: {
    title: "Tüm Ürünler | Marketin24",
    description: "Onaylı satıcılarımızdan yüzlerce ürünü keşfedin.",
  },
}

export default function ProductsPage() {
  // Data is fetched at build/revalidation time on the server.
  // The client component receives a plain serialisable snapshot —
  // no bundle import, no client-side data fetch required.
  const initialProducts = products
  const initialCategories = categories
  const initialVendors = vendors

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Tüm Ürünler</h1>
        <p className="text-muted-foreground mt-1">
          Onaylı satıcılarımızdan ürünleri keşfedin
        </p>
      </div>

      {/*
        SSR-visible fallback grid: rendered as plain HTML for crawlers and
        users with slow/no JS. The interactive ProductsContent below
        replaces this once hydrated.
      */}
      <noscript>
        <ProductGrid products={initialProducts.slice(0, 24)} />
      </noscript>

      <ProductsContent
        initialProducts={initialProducts}
        initialCategories={initialCategories}
        initialVendors={initialVendors}
      />
    </div>
  )
}
