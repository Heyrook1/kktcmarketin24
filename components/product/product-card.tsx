"use client"

import Link from "next/link"
import Image from "next/image"
import { ShoppingCart, Heart, Star, Zap, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VendorBadge } from "@/components/vendor/vendor-badge"
import { PriceDisplay } from "@/components/shared/price-display"
import { useCartStore } from "@/lib/store/cart-store"
import { useWishlistStore } from "@/lib/store/wishlist-store"
import type { Product } from "@/lib/data/products"
import { TR_COLOR_HEX } from "@/lib/tag-taxonomy"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

interface ProductCardProps {
  product: Product
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addItem, openCart } = useCartStore()
  const { addItem: addWishlist, removeItem: removeWishlist, items: wishlistItems } = useWishlistStore()
  const [addedToCart, setAddedToCart] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])


  const isInStock = typeof product.inStock === "boolean"
    ? product.inStock
    : (typeof (product as { stock?: number }).stock === "number"
        ? (product as unknown as { stock: number }).stock > 0
        : true)

  const isWishlisted = isMounted ? wishlistItems.some((i) => i.id === product.id) : false

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isInStock) return
    addItem(product)
    openCart()
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 1500)
  }

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isWishlisted) {
      removeWishlist(product.id)
    } else {
      addWishlist(product)
    }
  }

  // Collect unique colors from product.colors array + color: tags
  const productColors: Array<{ name: string; hex: string }> = (() => {
    const seen = new Set<string>()
    const result: Array<{ name: string; hex: string }> = []
    for (const c of (product as Product & { colors?: Array<{ name: string; hex: string }> }).colors ?? []) {
      const key = c.name.toLowerCase()
      if (!seen.has(key)) { seen.add(key); result.push({ name: c.name, hex: c.hex }) }
    }
    for (const tag of product.tags ?? []) {
      const lower = tag.toLowerCase()
      if (lower.startsWith("color:")) {
        const name = lower.slice(6)
        if (!seen.has(name)) {
          seen.add(name)
          result.push({ name, hex: TR_COLOR_HEX[name] ?? "#9ca3af" })
        }
      }
    }
    return result
  })()

  const hasDiscount = product.originalPrice && product.originalPrice > product.price
  const discountPct = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0
  const isBigDiscount = discountPct >= 30

  return (
    <div className={cn(
      "group relative flex flex-col overflow-hidden rounded-2xl bg-card border border-border/60",
      "transition-all duration-300 hover:shadow-xl hover:shadow-primary/8 hover:-translate-y-1 hover:border-primary/20",
      className
    )}>
      {/* Image container */}
      <div className="relative block overflow-hidden bg-secondary/30">
        <Link href={`/products/${product.id}`} className="block aspect-square overflow-hidden">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </Link>

        {/* Out of stock overlay */}
        {!isInStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/75 backdrop-blur-[2px] z-10">
            <span className="rounded-full bg-background/90 border px-3 py-1 text-xs font-semibold text-muted-foreground shadow">
              Tükendi
            </span>
          </div>
        )}

        {/* Discount badge — takes priority; fallback to "Yeni" when no reviews */}
        {hasDiscount ? (
          <div className={cn(
            "absolute top-2.5 left-2.5 z-10 flex items-center gap-0.5 rounded-full px-2.5 py-1 text-[11px] font-black shadow-md animate-badge-pop",
            isBigDiscount
              ? "bg-gradient-to-r from-red-500 to-orange-500 text-white"
              : "bg-red-500 text-white"
          )}>
            {isBigDiscount && <Zap className="h-3 w-3 fill-white" />}
            -%{discountPct}
          </div>
        ) : !product.reviewCount ? (
          <div className="absolute top-2.5 left-2.5 z-10 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground shadow-md">
            Yeni
          </div>
        ) : null}

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          aria-label={isWishlisted ? "Favorilerden çıkar" : "Favorilere ekle"}
          className={cn(
            "absolute top-2.5 right-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full border shadow-md",
            "transition-all duration-200",
            isWishlisted
              ? "bg-red-50 border-red-200 text-red-500 opacity-100"
              : "bg-white/90 border-white/60 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
          )}
        >
          <Heart className={cn("h-4 w-4 transition-transform duration-200 hover:scale-110", isWishlisted && "fill-red-500")} />
        </button>

        {/* Quick view overlay */}
        <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-2 bg-gradient-to-t from-black/60 to-transparent pb-3 pt-8 transition-transform duration-300 sm:translate-y-full sm:group-hover:translate-y-0">
          <Link
            href={`/products/${product.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-3 py-1.5 text-xs font-semibold text-foreground shadow hover:bg-white transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            İncele
          </Link>
          <button
            onClick={handleAddToCart}
            disabled={!isInStock || addedToCart}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow transition-all duration-200",
              addedToCart
                ? "bg-green-500 text-white scale-95"
                : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
            )}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {addedToCart ? "Eklendi ✓" : "Sepete Ekle"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5 p-3 flex-1">
        <VendorBadge vendorId={product.vendorId} size="sm" />

        <Link href={`/products/${product.id}`}>
          <h3 className="mt-1 text-sm font-medium leading-snug line-clamp-2 text-foreground hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Stars — only shown when there are actual reviews */}
        {product.reviewCount ? (
          <div className="flex items-center gap-1">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3 w-3",
                    i < Math.round(product.rating ?? 0)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-muted text-muted"
                  )}
                />
              ))}
            </div>
            <span className="text-[11px] text-muted-foreground">
              ({product.reviewCount})
            </span>
          </div>
        ) : null}

        {/* Color swatches */}
        {productColors.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {productColors.slice(0, 5).map((c) => {
              const isLight = c.hex === "#ffffff" || c.hex === "#fef3c7" || c.hex === "#d4a574"
              return (
                <span
                  key={c.name}
                  title={c.name.charAt(0).toUpperCase() + c.name.slice(1)}
                  className={cn("h-4 w-4 rounded-full border flex-shrink-0", isLight ? "border-border/80" : "border-transparent")}
                  style={{ backgroundColor: c.hex }}
                />
              )
            })}
            {productColors.length > 5 && (
              <span className="text-[10px] text-muted-foreground">+{productColors.length - 5}</span>
            )}
          </div>
        )}

        {/* Installment info for high-value items */}
        {product.price >= 500 && (
          <p className="text-[11px] text-muted-foreground">
            12 x <span className="font-medium text-foreground">{(product.price / 12).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ₺</span>
          </p>
        )}

        {/* Price + cart button */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1.5">
          <PriceDisplay
            price={product.price}
            originalPrice={product.originalPrice}
            size="sm"
          />
          <Button
            size="icon"
            className={cn(
              "h-8 w-8 flex-shrink-0 rounded-xl transition-all duration-200",
              addedToCart
                ? "bg-green-500 text-white scale-95"
                : "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95 shadow-sm shadow-primary/30"
            )}
            onClick={handleAddToCart}
            disabled={!isInStock}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span className="sr-only">Sepete ekle</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
