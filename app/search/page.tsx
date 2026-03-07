"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { products } from "@/lib/data/products"
import { ProductGrid } from "@/components/product/product-grid"
import { SearchBar } from "@/components/shared/search-bar"
import { Skeleton } from "@/components/ui/skeleton"

function SearchResults() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""
  
  const filteredProducts = query
    ? products.filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase())
      )
    : []

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Search Results
        </h1>
        {query && (
          <p className="mt-2 text-muted-foreground">
            {filteredProducts.length} results for &quot;{query}&quot;
          </p>
        )}
      </div>

      <div className="mb-8 max-w-xl">
        <SearchBar />
      </div>

      {!query ? (
        <div className="py-12 text-center">
          <p className="text-lg text-muted-foreground">
            Enter a search term to find products
          </p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-lg text-muted-foreground">
            No products found for &quot;{query}&quot;
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try searching with different keywords
          </p>
        </div>
      ) : (
        <ProductGrid products={filteredProducts} />
      )}
    </div>
  )
}

function SearchSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="mb-2 h-8 w-48" />
      <Skeleton className="mb-8 h-5 w-32" />
      <Skeleton className="mb-8 h-10 max-w-xl" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchResults />
    </Suspense>
  )
}
