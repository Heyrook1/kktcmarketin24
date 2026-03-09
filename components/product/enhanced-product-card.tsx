"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ShoppingCart, Star, Heart, Ruler,
  AlertTriangle, Check, Info, ChevronLeft, ChevronRight,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { VendorBadge } from "@/components/vendor/vendor-badge"
import { PriceDisplay } from "@/components/shared/price-display"
import { useCartStore } from "@/lib/store/cart-store"
import { useWishlistStore } from "@/lib/store/wishlist-store"
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
  const [isHovered, setIsHovered]         = useState(false)
  const [activeImg, setActiveImg]         = useState(0)
  const [imgVisible, setImgVisible]       = useState(true)
  const [selectedSize, setSelectedSize]   = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [isAdded, setIsAdded]             = useState(false)
  const [liveStock, setLiveStock]         = useState(product.stockCount)
  const { addItem, openCart } = useCartStore()
  const { toggleItem, isInWishlist } = useWishlistStore()
  const isFavorite = isInWishlist(product.id)
  const reviews = getProductReviews(product.id)

  const hasDiscount     = product.originalPrice && product.originalPrice > product.price
  const discountPercent = hasDiscount
    ? Math.round((1 - product.price / product.originalPrice!) * 100)
    : 0

  useEffect(() => {
    const t = setInterval(() => {
      if (Math.random() > 0.97 && liveStock > 0)
        setLiveStock((s) => Math.max(0, s - 1))
    }, 20000)
    return () => clearInterval(t)
  }, [liveStock])

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
    if (activeStock === 0) return { label: "Tükendi",             color: "text-red-500",    dot: "bg-red-500" }
    if (activeStock <= 3)  return { label: `Son ${activeStock}!`, color: "text-red-500",    dot: "bg-red-500 animate-pulse" }
    if (activeStock <= 10) return { label: `${activeStock} kaldı`, color: "text-amber-600", dot: "bg-amber-500 animate-pulse" }
    return                        { label: "Stokta var",           color: "text-green-600",  dot: "bg-green-500" }
  })()

  const images = product.images?.length ? product.images : ["/placeholder.jpg"]
  const hasMultiple = images.length > 1

  function switchImage(idx: number, e?: React.MouseEvent) {
    e?.preventDefault()
    e?.stopPropagation()
    if (idx === activeImg) return
    setImgVisible(false)
    setTimeout(() => { setActiveImg(idx); setImgVisible(true) }, 150)
  }

  function prevImage(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    switchImage((activeImg - 1 + images.length) % images.length)
  }

  function nextImage(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    switchImage((activeImg + 1) % images.length)
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (activeStock === 0) return
    addItem(product, 1)
    openCart()
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 1200)
  }

  const topReview = reviews[0]

  return (
    <TooltipProvider>
      <Card
        className={cn(
          "group relative overflow-hidden transition-all duration-300 border bg-card",
          isHovered ? "shadow-xl -translate-y-1 border-primary/30" : "shadow-sm",
          !product.inStock && liveStock === 0 && "opacity-70"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Wishlist — always visible */}
        <button
          className={cn(
            "absolute top-2.5 right-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full border shadow-sm transition-all duration-200",
            isFavorite
              ? "bg-red-50 border-red-200 hover:bg-red-100"
              : "bg-background/80 backdrop-blur border-border hover:bg-background"
          )}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleItem(product) }}
          aria-label={isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
        >
          <Heart className={cn("h-3.5 w-3.5 transition-all duration-200", isFavorite ? "fill-red-500 text-red-500 scale-110" : "text-muted-foreground")} />
        </button>

        <Link href={`/products/${product.id}`} className="block">
          {/* Image gallery */}
          <div className="relative aspect-square overflow-hidden bg-secondary/40">
            {/* Main image with crossfade */}
            <Image
              src={images[activeImg]}
              alt={`${product.name} — görsel ${activeImg + 1}`}
              fill
              className="object-cover transition-all duration-500"
              style={{
                transform: isHovered ? "scale(1.05)" : "scale(1)",
                opacity: imgVisible ? 1 : 0,
                transition: "opacity 150ms ease, transform 500ms ease",
              }}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />

            {/* Scrim */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent transition-opacity duration-300",
              isHovered ? "opacity-100" : "opacity-0"
            )} />

            {/* Badges */}
            <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
              {hasDiscount && (
                <Badge className="bg-red-500 text-white font-bold text-xs shadow">
                  -%{discountPercent}
                </Badge>
              )}
              {liveStock > 0 && liveStock <= 5 && (
                <Badge className="bg-amber-500 text-white text-xs shadow gap-1">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  Son {liveStock}!
                </Badge>
              )}
            </div>

            {/* Prev / Next arrows — only when multiple images */}
            {hasMultiple && isHovered && (
              <>
                <button
                  onClick={prevImage}
                  aria-label="Önceki görsel"
                  className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 backdrop-blur border border-border shadow-sm hover:bg-background transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={nextImage}
                  aria-label="Sonraki görsel"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 backdrop-blur border border-border shadow-sm hover:bg-background transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}

            {/* Thumbnail strip — visible on hover */}
            {hasMultiple && (
              <div className={cn(
                "absolute bottom-11 left-0 right-0 flex items-center justify-center gap-1 px-2 transition-all duration-300",
                isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
              )}>
                {images.map((src, i) => (
                  <button
                    key={i}
                    onMouseEnter={(e) => switchImage(i, e)}
                    onClick={(e) => switchImage(i, e)}
                    aria-label={`Görsel ${i + 1}`}
                    className={cn(
                      "relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-md border-2 transition-all duration-200",
                      i === activeImg
                        ? "border-white scale-110 shadow-md"
                        : "border-white/40 opacity-70 hover:opacity-100 hover:border-white/80"
                    )}
                  >
                    <Image
                      src={src}
                      alt={`Küçük görsel ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="36px"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Dot indicators (always visible when multiple) */}
            {hasMultiple && (
              <div className={cn(
                "absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1 transition-opacity duration-300",
                isHovered ? "opacity-0" : "opacity-100"
              )}>
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "rounded-full transition-all duration-300",
                      i === activeImg ? "w-3 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"
                    )}
                  />
                ))}
              </div>
            )}

            {/* Hover quick-add strip */}
            <div className={cn(
              "absolute bottom-0 left-0 right-0 p-2 transition-all duration-300",
              isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            )}>
              <Button
                size="sm"
                className={cn(
                  "w-full gap-2 rounded-xl shadow-lg font-semibold text-xs h-9 transition-all duration-200",
                  isAdded && "bg-green-600 hover:bg-green-700"
                )}
                onClick={handleAddToCart}
                disabled={activeStock === 0}
              >
                {isAdded ? (
                  <><Check className="h-4 w-4 animate-bounce" />Sepete Eklendi!</>
                ) : (
                  <><ShoppingCart className="h-4 w-4" />{activeStock === 0 ? "Tükendi" : "Sepete Ekle"}</>
                )}
              </Button>
            </div>
          </div>

          {/* Card body */}
          <CardContent className="p-3 space-y-2">
            <div className="pointer-events-none">
              <VendorBadge vendorId={product.vendorId} size="sm" />
            </div>

            <h3 className={cn(
              "font-semibold text-sm leading-snug line-clamp-2 transition-colors duration-200",
              isHovered && "text-primary"
            )}>
              {product.name}
            </h3>

            {/* Description — hover reveal */}
            <div className={cn(
              "overflow-hidden transition-all duration-300",
              isHovered ? "max-h-10 opacity-100" : "max-h-0 opacity-0"
            )}>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Rating */}
            {showReviews && (
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={cn("h-3 w-3",
                      s <= Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"
                    )} />
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

            {/* Sizes — hover-only reveal */}
            {showSizes && product.sizes && product.sizes.length > 0 && (
              <div className={cn(
                "overflow-hidden transition-all duration-300",
                isHovered ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
              )}>
                <div className="flex items-center gap-1 mb-1">
                  <Ruler className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Beden:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {product.sizes.slice(0, 6).map((sizeOption) => {
                    const unavail = !sizeOption.available || sizeOption.stock === 0
                    const low     = sizeOption.stock > 0 && sizeOption.stock <= 3
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
                        {low && !unavail && (
                          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-500" />
                        )}
                      </button>
                    )
                  })}
                  {product.sizes.length > 6 && (
                    <span className="text-xs text-muted-foreground px-1 py-0.5">+{product.sizes.length - 6}</span>
                  )}
                </div>
                {selectedSize && (() => {
                  const s = product.sizes!.find((x) => x.size === selectedSize)
                  if (!s) return null
                  if (s.stock === 0) return <p className="text-xs text-red-500 mt-1">Bu beden tükendi</p>
                  if (s.stock <= 3)  return <p className="text-xs text-amber-600 mt-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Son {s.stock} adet!</p>
                  return               <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><Check className="h-3 w-3" />{s.stock} adet stokta</p>
                })()}
              </div>
            )}

            {/* Colors — hover-only reveal */}
            {product.colors && product.colors.length > 0 && (
              <div className={cn(
                "overflow-hidden transition-all duration-200",
                isHovered ? "max-h-8 opacity-100" : "max-h-0 opacity-0"
              )}>
                <div className="flex items-center gap-1.5">
                  {product.colors.slice(0, 6).map((c) => (
                    <Tooltip key={c.name}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => { e.preventDefault(); setSelectedColor(c.name === selectedColor ? null : c.name) }}
                          className={cn(
                            "h-5 w-5 rounded-full border-2 shadow-sm transition-all duration-150",
                            selectedColor === c.name
                              ? "border-primary scale-125 shadow-md"
                              : "border-background hover:scale-110 ring-1 ring-border"
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
                  {product.colors.length > 6 && (
                    <span className="text-xs text-muted-foreground">+{product.colors.length - 6}</span>
                  )}
                </div>
              </div>
            )}

            {/* Price + cart icon */}
            <div className="flex items-end justify-between gap-2 pt-1">
              <div className="flex flex-col gap-0.5">
                <PriceDisplay price={product.price} originalPrice={product.originalPrice} size="md" />
                {showStock && (
                  <div className="flex items-center gap-1">
                    <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", stockStatus.dot)} />
                    <span className={cn("text-xs font-medium", stockStatus.color)}>{stockStatus.label}</span>
                  </div>
                )}
              </div>

              <Button
                size="icon"
                variant={isAdded ? "default" : "outline"}
                className={cn(
                  "h-9 w-9 rounded-full flex-shrink-0 transition-all duration-300",
                  isAdded
                    ? "bg-green-600 border-green-600 hover:bg-green-700 scale-110 shadow-lg shadow-green-200"
                    : "hover:bg-primary hover:text-primary-foreground hover:border-primary hover:scale-110"
                )}
                onClick={handleAddToCart}
                disabled={activeStock === 0}
                aria-label="Sepete ekle"
              >
                {isAdded
                  ? <Check className="h-4 w-4 animate-bounce" />
                  : <ShoppingCart className="h-4 w-4" />
                }
              </Button>
            </div>
          </CardContent>
        </Link>
      </Card>
    </TooltipProvider>
  )
}
