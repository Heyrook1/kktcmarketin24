"use client"

import Link from "next/link"
import Image from "next/image"
import { Heart, ShoppingCart, Trash2, ArrowRight, PackageOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useWishlistStore } from "@/lib/store/wishlist-store"
import { useCartStore } from "@/lib/store/cart-store"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"

export default function WishlistPage() {
  const { items, removeItem, clearWishlist } = useWishlistStore()
  const { addItem } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-secondary mb-6">
          <Heart className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Favori listesi boş</h1>
        <p className="text-muted-foreground mb-8">
          Beğendiğiniz ürünleri favorilere ekleyerek daha sonra kolayca bulabilirsiniz.
        </p>
        <Button asChild size="lg">
          <Link href="/urunler">
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl flex items-center gap-2">
            <Heart className="h-6 w-6 text-red-500 fill-red-500" />
            Favorilerim
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{items.length} ürün kaydedildi</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-muted-foreground hover:text-destructive hover:border-destructive"
          onClick={clearWishlist}
        >
          <Trash2 className="h-4 w-4 mr-1.5" />
          Listeyi Temizle
        </Button>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((product) => {
          const hasDiscount = product.originalPrice && product.originalPrice > product.price
          const discountPct = hasDiscount
            ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
            : 0

          return (
            <div
              key={product.id}
              className="group relative rounded-2xl border bg-card overflow-hidden flex flex-col hover:shadow-md transition-shadow"
            >
              {/* Image */}
              <div className="relative aspect-square overflow-hidden bg-secondary/40">
                <Link href={`/products/${product.id}`}>
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                </Link>

                {/* Discount badge */}
                {hasDiscount && (
                  <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold shadow">
                    -{discountPct}%
                  </Badge>
                )}

                {/* Remove from wishlist */}
                <button
                  onClick={() => removeItem(product.id)}
                  aria-label="Favorilerden kaldır"
                  className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 backdrop-blur border shadow-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Heart className="h-4 w-4 fill-red-500" />
                </button>
              </div>

              {/* Info */}
              <div className="flex flex-col gap-2 p-3 flex-1">
                <Link
                  href={`/products/${product.id}`}
                  className="text-sm font-medium line-clamp-2 hover:text-primary transition-colors leading-snug"
                >
                  {product.name}
                </Link>

                <div className="flex items-baseline gap-1.5 mt-auto">
                  <span className="font-bold text-base">{formatPrice(product.price)}</span>
                  {hasDiscount && (
                    <span className="text-xs text-muted-foreground line-through">
                      {formatPrice(product.originalPrice!)}
                    </span>
                  )}
                </div>

                {/* Stock indicator */}
                <p className={cn(
                  "text-xs font-medium",
                  product.inStock ? "text-green-600" : "text-red-500"
                )}>
                  {product.inStock
                    ? product.stockCount && product.stockCount <= 5
                      ? `Son ${product.stockCount} ürün`
                      : "Stokta mevcut"
                    : "Stokta yok"}
                </p>

                <Button
                  size="sm"
                  className="w-full gap-1.5 rounded-xl text-xs"
                  disabled={!product.inStock}
                  onClick={() => addItem(product)}
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  {product.inStock ? "Sepete Ekle" : "Tükendi"}
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Continue shopping */}
      <div className="mt-10 flex justify-center">
        <Button variant="outline" asChild>
          <Link href="/urunler">
            Alışverişe Devam Et
          </Link>
        </Button>
      </div>
    </div>
  )
}
