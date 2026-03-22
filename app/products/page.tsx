import type { Metadata } from "next"
import { Suspense } from "react"
import { ProductsContent, ProductsContentSkeleton } from "./products-content"
import { products } from "@/lib/data/products"
import { categories } from "@/lib/data/categories"
import { vendors } from "@/lib/data/vendors"

// ISR: regenerate at most once per hour. Swap data sources for Supabase
// queries when products are migrated to the DB — the page contract stays identical.
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
  // Data is resolved at build/revalidation time on the server and passed as
  // plain serialisable props — no client-side fetch, no bundle import.
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
        The RSC shell renders the full product list as static HTML for
        crawlers and social sharing previews. The Suspense boundary shows
        the skeleton while the client component hydrates and reads
        searchParams — useSearchParams requires Suspense in Next.js App Router.
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

