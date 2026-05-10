"use client"

import Link from "next/link"
import Image from "next/image"
import { ShoppingCart, Heart, Star, Zap, Eye, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VendorBadge } from "@/components/vendor/vendor-badge"
import { PriceDisplay } from "@/components/shared/price-display"
import { useCartStore } from "@/lib/store/cart-store"
import { useWishlistStore } from "@/lib/store/wishlist-store"
import type { Product } from "@/lib/data/products"
import { getProductReviews } from "@/lib/data/reviews"
import { TR_COLOR_HEX } from "@/lib/tag-taxonomy"
import { cn } from "@/lib/utils"
import { useState, useEffect, useMemo } from "react"

interface ProductCardProps {
  product: Product
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addItem, openCart } = useCartStore()
  const { addItem: addWishlist, removeItem: removeWishlist, items: wishlistItems } = useWishlistStore()
  const [addedToCart, setAddedToCart] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [imgIndex, setImgIndex] = useState(0)

  useEffect(() => { setIsMounted(true) }, [])

  const galleryImgs = product.images.slice(0, 3).filter(Boolean)

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
    isWishlisted ? removeWishlist(product.id) : addWishlist(product)
  }

  // Colors: from product.colors + color: tags
  const productColors = useMemo(() => {
    const seen = new Set<string>()
    const result: Array<{ name: string; hex: string }> = []
    for (const c of product.colors ?? []) {
      const key = c.name.toLowerCase()
      if (!seen.has(key)) { seen.add(key); result.push({ name: c.name, hex: c.hex }) }
    }
    for (const tag of product.tags ?? []) {
      const lower = tag.toLowerCase()
      if (lower.startsWith("color:")) {
        const raw = lower.slice(6).split(":")[0]
        if (!seen.has(raw)) {
          seen.add(raw)
          result.push({ name: raw.charAt(0).toUpperCase() + raw.slice(1), hex: TR_COLOR_HEX[raw] ?? "#9ca3af" })
        }
      }
    }
    return result
  }, [product.colors, product.tags])

  // Sizes: from product.sizes + size: tags
  const productSizes = useMemo(() => {
    if (product.sizes?.length) return product.sizes.map((s) => ({ label: s.size, available: s.available && s.stock > 0 }))
    const result: Array<{ label: string; available: boolean }> = []
    for (const tag of product.tags ?? []) {
      const lower = tag.toLowerCase()
      if (lower.startsWith("size:")) {
        const parts = lower.slice(5).split(":")
        const label = parts[0].toUpperCase()
        const stock = parts[1] ? Number(parts[1]) : 1
        result.push({ label, available: stock > 0 })
      }
    }
    return result
  }, [product.sizes, product.tags])

  // Latest review (static data only — DB products have reviewCount 0 anyway)
  const latestReview = useMemo(() => {
    if (!product.reviewCount) return null
    const all = getProductReviews(product.id)
    if (!all.length) return null
    const sorted = [...all].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return sorted[0]
  }, [product.id, product.reviewCount])

  const hasDiscount = product.originalPrice && product.originalPrice > product.price
  const discountPct = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0
  const isBigDiscount = discountPct >= 30

  const ratingFull  = Math.floor(product.rating ?? 0)
  const ratingHalf  = (product.rating ?? 0) - ratingFull >= 0.5

  return (
    <div className={cn(
      "group relative flex flex-col overflow-hidden rounded-2xl bg-card border border-border/60",
      "transition-all duration-300 hover:shadow-xl hover:shadow-primary/8 hover:-translate-y-1 hover:border-primary/20",
      className
    )}>
      {/* ── Image area ── */}
      <div className="relative block overflow-hidden bg-secondary/30">
        <Link href={`/products/${product.id}`} className="block aspect-square overflow-hidden relative">
          {galleryImgs.map((src, i) => (
            <Image
              key={i}
              src={src}
              alt={`${product.name} ${i + 1}`}
              fill
              className={cn(
                "object-cover transition-all duration-500",
                i === imgIndex ? "opacity-100 scale-100" : "opacity-0 scale-105"
              )}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={i === 0}
            />
          ))}
        </Link>

        {/* Dot indicators */}
        {galleryImgs.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1">
            {galleryImgs.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImgIndex(i) }}
                onMouseEnter={(e) => { e.preventDefault(); e.stopPropagation(); setImgIndex(i) }}
                aria-label={`Resim ${i + 1}`}
                className={cn(
                  "rounded-full transition-all duration-300 border border-white/40",
                  i === imgIndex ? "w-5 h-1.5 bg-white shadow" : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
                )}
              />
            ))}
          </div>
        )}

        {/* Out of stock overlay */}
        {!isInStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/75 backdrop-blur-[2px] z-10">
            <span className="rounded-full bg-background/90 border px-3 py-1 text-xs font-semibold text-muted-foreground shadow">
              Tükendi
            </span>
          </div>
        )}

        {/* Discount / New badge */}
        {hasDiscount ? (
          <div className={cn(
            "absolute top-2.5 left-2.5 z-10 flex items-center gap-0.5 rounded-full px-2.5 py-1 text-[11px] font-black shadow-md animate-badge-pop",
            isBigDiscount ? "bg-gradient-to-r from-red-500 to-orange-500 text-white" : "bg-red-500 text-white"
          )}>
            {isBigDiscount && <Zap className="h-3 w-3 fill-white" />}
            -%{discountPct}
          </div>
        ) : !product.reviewCount ? (
          <div className="absolute top-2.5 left-2.5 z-10 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground shadow-md">
            Yeni
          </div>
        ) : null}

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          aria-label={isWishlisted ? "Favorilerden çıkar" : "Favorilere ekle"}
          className={cn(
            "absolute top-2.5 right-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full border shadow-md transition-all duration-200",
            isWishlisted
              ? "bg-red-50 border-red-200 text-red-500 opacity-100"
              : "bg-white/90 border-white/60 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
          )}
        >
          <Heart className={cn("h-4 w-4 transition-transform duration-200 hover:scale-110", isWishlisted && "fill-red-500")} />
        </button>

        {/* Quick actions overlay */}
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
              addedToCart ? "bg-green-500 text-white scale-95" : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
            )}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {addedToCart ? "Eklendi ✓" : "Sepete Ekle"}
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex flex-col gap-1.5 p-3 flex-1">
        <VendorBadge vendorId={product.vendorId} size="sm" />

        <Link href={`/products/${product.id}`}>
          <h3 className="mt-0.5 text-sm font-medium leading-snug line-clamp-2 text-foreground hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating row */}
        {product.reviewCount ? (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3 w-3",
                    i < ratingFull
                      ? "fill-amber-400 text-amber-400"
                      : i === ratingFull && ratingHalf
                      ? "fill-amber-200 text-amber-400"
                      : "fill-muted text-muted"
                  )}
                />
              ))}
            </div>
            <span className="text-[11px] font-semibold text-amber-600">{(product.rating ?? 0).toFixed(1)}</span>
            <span className="text-[11px] text-muted-foreground">({product.reviewCount})</span>
          </div>
        ) : null}

        {/* Color swatches */}
        {productColors.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {productColors.slice(0, 6).map((c) => {
              const isLight = c.hex === "#ffffff" || c.hex === "#fef3c7" || c.hex === "#d4a574" || c.hex === "#f3f4f6"
              return (
                <span
                  key={c.name}
                  title={c.name}
                  className={cn("h-3.5 w-3.5 rounded-full border flex-shrink-0 shadow-sm", isLight ? "border-border/80" : "border-transparent")}
                  style={{ backgroundColor: c.hex }}
                />
              )
            })}
            {productColors.length > 6 && (
              <span className="text-[10px] text-muted-foreground font-medium">+{productColors.length - 6}</span>
            )}
          </div>
        )}

        {/* Size chips */}
        {productSizes.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {productSizes.slice(0, 6).map((s) => (
              <span
                key={s.label}
                className={cn(
                  "inline-flex items-center justify-center rounded-md border text-[10px] font-semibold px-1.5 py-0.5 leading-none",
                  s.available
                    ? "border-border text-foreground bg-secondary/50"
                    : "border-border/30 text-muted-foreground/40 line-through bg-transparent"
                )}
              >
                {s.label}
              </span>
            ))}
            {productSizes.length > 6 && (
              <span className="text-[10px] text-muted-foreground">+{productSizes.length - 6}</span>
            )}
          </div>
        )}

        {/* Latest review snippet */}
        {latestReview && (
          <div className="mt-0.5 rounded-lg bg-secondary/40 border border-border/40 px-2.5 py-2 flex gap-1.5 items-start">
            <Quote className="h-3 w-3 text-primary/50 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2 italic">
                {latestReview.comment}
              </p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5 font-medium">
                — {latestReview.userName}
              </p>
            </div>
          </div>
        )}

        {/* Price + cart */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1.5">
          <PriceDisplay price={product.price} originalPrice={product.originalPrice} size="sm" />
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
