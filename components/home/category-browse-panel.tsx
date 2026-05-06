"use client"

import { Search } from "lucide-react"
import { Product } from "@/lib/data/products"
import { ProductCard } from "@/components/product/product-card"

interface CategoryBrowsePanelProps {
  products: Product[]
  title?: string
  hideTitle?: boolean
}

export function CategoryBrowsePanel({ products, title = "Ürünler", hideTitle = false }: CategoryBrowsePanelProps) {
  return (
    <div className="flex-1 min-w-0">
      {!hideTitle && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          <span className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{products.length}</span> ürün bulundu
          </span>
        </div>
      )}

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-2xl border-dashed gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <Search className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <p className="text-base font-medium text-foreground">Eşleşen ürün bulunamadı</p>
            <p className="text-sm text-muted-foreground mt-1">Filtrelerinizi değiştirip tekrar deneyin.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
