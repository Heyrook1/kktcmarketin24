import { Suspense } from "react"
import type { Metadata } from "next"
import { ProductsContent } from "./products-content"

export const metadata: Metadata = {
  title: "All Products",
  description: "Browse all products from verified vendors on Marketin24",
}

export default function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">All Products</h1>
        <p className="text-muted-foreground mt-1">
          Browse products from all our verified vendors
        </p>
      </div>
      <Suspense fallback={<div className="py-12 text-center text-muted-foreground">Loading products...</div>}>
        <ProductsContent />
      </Suspense>
    </div>
  )
}
