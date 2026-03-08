"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ShoppingCart, Star, Heart, Package,
  Ruler, AlertTriangle, Check, Info,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { VendorBadge } from "@/components/vendor/vendor-badge"
import { PriceDisplay } from "@/components/shared/price-display"
import { useCartStore } from "@/lib/store/cart-store"
import { Product } from "@/lib/data/products"
import { getProductReviews } from "@/lib/data/reviews"
import { cn } from "@/lib/utils"

interface EnhancedProductCardProps {
  product: Product
  showReviews?: boolean
  showSizes?: boolean
  showStock?: boolean
}

export function EnhancedProductCard({
  product,
  showReviews = true,
  showSizes = true,
  showStock = true,
}: EnhancedProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [liveStock, setLiveStock] = useState(product.stockCount)
  const { addItem, openCart } = useCartStore()
  const reviews = getProductReviews(product.id)

  const hasDiscount = product.originalPrice && product.originalPrice > product.price
  const discountPercent = hasDiscount
    ? Math.round((1 - product.price / product.originalPrice!) * 100)
    : 0

  // Simulate occasional stock decrements
  useEffect(() => {
    const t = setInterval(() => {
      if (Math.random() > 0.97 && liveStock > 0) {
        setLiveStock((s) => Math.max(0, s - 1))
      }
    }, 20000)
    return () => clearInterval(t)
  }, [liveStock])

  // Dynamic stock based on selected variant
  const activeStock = (() => {
    if (product.sizes && selectedSize) {
      const s = product.sizes.find((s) => s.size === selectedSize)
      if (s) return s.stock
    }
    if (product.colors && selectedColor) {
      const c = product.colors.find((c) => c.name === selectedColor)
      if (c) return c.stock
    }
    return liveStock
  })()

  const stockStatus = (() => {
    if (activeStock === 0) return { label: "Tükendi", color: "text-red-500", dot: "bg-red-500" }
    if (activeStock <= 3) return { label: `Son ${activeStock}!`, color: "text-red-500", dot: "bg-red-500 animate-pulse" }
    if (activeStock <= 10) return { label: `${activeStock} kaldı`, color: "text-amber-600", dot: "bg-amber-500 animate-pulse" }
    return { label: "Stokta var", color: "text-green-600", dot: "bg-green-500" }
  })()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product, 1)
    openCart()
  }

  const topReview = reviews[0]

  return (
    <TooltipProvider>
      <Card
        className={cn(
          "group relative overflow-hidden transition-all duration-300 border",
          isHovered && "shadow-xl border-primary/40",
          !product.inStock && liveStock === 0 && "opacity-70"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Link href={`/products/${product.id}`} className="block">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden bg-secondary/40">
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className={cn("object-cover transition-transform duration-500", isHovered && "scale-108")}
              style={{ transform: isHovered ? "scale(1.06)" : "scale(1)" }}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />

            {/* Dark overlay on hover */}
            <div className={cn("absolute inset-0 bg-black/15 transition-opacity duration-300", isHovered ? "opacity-100" : "opacity-0")} />

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {hasDiscount && (
                <Badge className="bg-red-500 text-white font-bold shadow-sm">-%{discountPercent}</Badge>
              )}
              {product.featured && (
                <Badge className="bg-primary text-primary-foreground shadow-sm">Öne Çıkan</Badge>
              )}
              {liveStock > 0 && liveStock <= 5 && (
                <Badge className="bg-amber-500 text-white shadow-sm gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Son {liveStock}!
                </Badge>
              )}
            </div>

            {/* Favorite button */}
            <button
              className={cn(
                "absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 backdrop-blur shadow-sm border transition-all duration-200",
                isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
              )}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsFavorite(!isFavorite) }}
              aria-label="Favorilere ekle"
            >
              <Heart className={cn("h-4 w-4 transition-colors", isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
            </button>

            {/* Hover quick-add button */}
            <div className={cn(
              "absolute bottom-0 left-0 right-0 p-3 transition-all duration-300",
              isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            )}>
              <Button
                size="sm"
                className="w-full gap-2 rounded-xl shadow-lg font-semibold"
                onClick={handleAddToCart}
                disabled={!product.inStock || activeStock === 0}
              >
                <ShoppingCart className="h-4 w-4" />
                {activeStock === 0 ? "Tükendi" : "Sepete Ekle"}
              </Button>
            </div>
          </div>

          <CardContent className="p-3 space-y-2">
            {/* Vendor */}
            <div className="pointer-events-none">
              <VendorBadge vendorId={product.vendorId} size="sm" />
            </div>

            {/* Name */}
            <h3 className={cn(
              "font-semibold text-sm leading-snug line-clamp-2 transition-colors",
              isHovered && "text-primary"
            )}>
              {product.name}
            </h3>

            {/* Description preview — visible on hover */}
            <div className={cn(
              "overflow-hidden transition-all duration-300",
              isHovered ? "max-h-12 opacity-100" : "max-h-0 opacity-0"
            )}>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{product.description}</p>
            </div>

            {/* Rating */}
            {showReviews && (
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={cn("h-3 w-3", s <= Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted")} />
                  ))}
                </div>
                <span className="text-xs font-medium">{product.rating}</span>
                <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
                {topReview && isHovered && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
                        onClick={(e) => e.preventDefault()}
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[220px] text-xs p-3">
                      <p className="font-medium mb-1">"{topReview.title}"</p>
                      <p className="text-muted-foreground line-clamp-3">{topReview.comment}</p>
                      <p className="text-muted-foreground mt-1">— {topReview.userName}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}

            {/* Sizes */}
            {showSizes && product.sizes && product.sizes.length > 0 && (
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Ruler className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Beden:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {product.sizes.slice(0, 5).map((sizeOption) => {
                    const unavail = !sizeOption.available || sizeOption.stock === 0
                    const lowStock = sizeOption.stock > 0 && sizeOption.stock <= 3
                    return (
                      <button
                        key={sizeOption.size}
                        onClick={(e) => { e.preventDefault(); setSelectedSize(sizeOption.size === selectedSize ? null : sizeOption.size) }}
                        disabled={unavail}
                        className={cn(
                          "relative text-xs px-2 py-0.5 rounded-md border transition-all",
                          selectedSize === sizeOption.size
                            ? "border-primary bg-primary text-primary-foreground font-medium"
                            : unavail
                            ? "border-border/40 text-muted-foreground/40 line-through cursor-not-allowed"
                            : "border-border hover:border-primary/60"
                        )}
                      >
                        {sizeOption.size}
                        {lowStock && !unavail && (
                          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-500 flex items-center justify-center">
                            <span className="sr-only">{sizeOption.stock} adet</span>
                          </span>
                        )}
                      </button>
                    )
                  })}
                  {product.sizes.length > 5 && (
                    <span className="text-xs text-muted-foreground px-1 py-0.5">+{product.sizes.length - 5}</span>
                  )}
                </div>
                {/* Dynamic stock feedback per size */}
                {selectedSize && (() => {
                  const s = product.sizes!.find((x) => x.size === selectedSize)
                  if (!s) return null
                  if (s.stock === 0) return <p className="text-xs text-red-500 mt-1">Bu beden tükendi</p>
                  if (s.stock <= 3) return <p className="text-xs text-amber-600 mt-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Son {s.stock} adet!</p>
                  return <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><Check className="h-3 w-3" />{s.stock} adet stokta</p>
                })()}
              </div>
            )}

            {/* Color swatches */}
            {product.colors && product.colors.length > 0 && (
              <div className="flex items-center gap-1.5">
                {product.colors.slice(0, 5).map((c) => (
                  <Tooltip key={c.name}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => { e.preventDefault(); setSelectedColor(c.name === selectedColor ? null : c.name) }}
                        className={cn(
                          "h-5 w-5 rounded-full border-2 shadow-sm transition-all",
                          selectedColor === c.name ? "border-primary scale-125 shadow-md" : "border-background hover:scale-110 ring-1 ring-border"
                        )}
                        style={{ backgroundColor: c.hex }}
                      >
                        <span className="sr-only">{c.name}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      {c.name} — {c.stock} adet
                    </TooltipContent>
                  </Tooltip>
                ))}
                {product.colors.length > 5 && (
                  <span className="text-xs text-muted-foreground">+{product.colors.length - 5}</span>
                )}
              </div>
            )}

            {/* Stock status + price row */}
            <div className="flex items-end justify-between gap-2 pt-1">
              <div className="flex flex-col gap-1">
                <PriceDisplay price={product.price} originalPrice={product.originalPrice} size="md" />
                {showStock && (
                  <div className="flex items-center gap-1">
                    <span className={cn("h-2 w-2 rounded-full flex-shrink-0", stockStatus.dot)} />
                    <span className={cn("text-xs font-medium", stockStatus.color)}>{stockStatus.label}</span>
                  </div>
                )}
              </div>
              <Button
                size="icon"
                variant="default"
                className="h-9 w-9 rounded-full shadow flex-shrink-0"
                onClick={handleAddToCart}
                disabled={!product.inStock || activeStock === 0}
                aria-label="Sepete ekle"
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Link>
      </Card>
    </TooltipProvider>
  )
}
