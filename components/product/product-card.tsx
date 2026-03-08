"use client"

import Link from "next/link"
import Image from "next/image"
import { ShoppingCart, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { VendorBadge } from "@/components/vendor/vendor-badge"
import { PriceDisplay } from "@/components/shared/price-display"
import { useCartStore } from "@/lib/store/cart-store"
import type { Product } from "@/lib/data/products"
import { cn } from "@/lib/utils"

interface ProductCardProps {
  product: Product
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addItem, openCart } = useCartStore()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product)
    openCart()
  }

  const hasDiscount = product.originalPrice && product.originalPrice > product.price

  return (
    <Card className={cn("group overflow-hidden transition-shadow hover:shadow-md", className)}>
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-square overflow-hidden bg-secondary">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          {hasDiscount && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded">
              İndirim
            </div>
          )}
          {!product.inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <span className="text-sm font-medium text-muted-foreground">Stokta Yok</span>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-3 sm:p-4">
        {/* Vendor Badge */}
        <VendorBadge vendorId={product.vendorId} size="sm" />

        {/* Product Name */}
        <Link href={`/products/${product.id}`}>
          <h3 className="mt-2 font-medium text-sm leading-tight line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-1.5">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="text-xs text-muted-foreground">
            {product.rating} ({product.reviewCount})
          </span>
        </div>

        {/* Price and Add to Cart */}
        <div className="flex items-end justify-between gap-2 mt-3">
          <PriceDisplay
            price={product.price}
            originalPrice={product.originalPrice}
            size="sm"
          />
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 flex-shrink-0"
            onClick={handleAddToCart}
            disabled={!product.inStock}
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="sr-only">Sepete ekle</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
