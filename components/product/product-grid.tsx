import { EnhancedProductCard } from "./enhanced-product-card"
import type { Product } from "@/lib/data/products"
import { cn } from "@/lib/utils"

interface ProductGridProps {
  products: Product[]
  className?: string
  columns?: 2 | 3 | 4
  showReviews?: boolean
  showSizes?: boolean
  showStock?: boolean
}

export function ProductGrid({ 
  products, 
  className, 
  columns = 4,
  showReviews = true,
  showSizes = true,
  showStock = true
}: ProductGridProps) {
  const gridClasses = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">Ürün bulunamadı</p>
      </div>
    )
  }

  return (
    <div className={cn("grid gap-4 md:gap-6", gridClasses[columns], className)}>
      {products.map((product) => (
        <EnhancedProductCard 
          key={product.id} 
          product={product}
          showReviews={showReviews}
          showSizes={showSizes}
          showStock={showStock}
        />
      ))}
    </div>
  )
}
