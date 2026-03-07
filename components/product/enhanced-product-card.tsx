"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ShoppingCart, Star, Heart, Eye, Package, Ruler, Clock } from "lucide-react"
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
  showStock = true 
}: EnhancedProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [stockDisplay, setStockDisplay] = useState(product.stockCount)
  const { addItem, openCart } = useCartStore()
  const reviews = getProductReviews(product.id)
  const hasDiscount = product.originalPrice && product.originalPrice > product.price
  const discountPercent = hasDiscount 
    ? Math.round((1 - product.price / product.originalPrice!) * 100) 
    : 0

  // Simulate real-time stock updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly decrease stock occasionally to simulate purchases
      if (Math.random() > 0.95 && stockDisplay > 0) {
        setStockDisplay(prev => Math.max(0, prev - 1))
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [stockDisplay])

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product, 1)
    openCart()
  }

  const getStockStatus = () => {
    if (stockDisplay === 0) return { text: "Tükendi", color: "text-red-500", bg: "bg-red-50" }
    if (stockDisplay <= 5) return { text: `Son ${stockDisplay} adet!`, color: "text-orange-500", bg: "bg-orange-50" }
    if (stockDisplay <= 20) return { text: `${stockDisplay} adet kaldı`, color: "text-yellow-600", bg: "bg-yellow-50" }
    return { text: "Stokta var", color: "text-green-600", bg: "bg-green-50" }
  }

  const stockStatus = getStockStatus()

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        isHovered && "shadow-xl scale-[1.02] border-primary/50",
        !product.inStock && "opacity-75"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/products/${product.id}`}>
        {/* Image container */}
        <div className="relative aspect-square overflow-hidden bg-secondary/50">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className={cn(
              "object-cover transition-transform duration-500",
              isHovered && "scale-110"
            )}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          
          {/* Overlay on hover */}
          <div className={cn(
            "absolute inset-0 bg-black/20 transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-0"
          )} />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {hasDiscount && (
              <Badge className="bg-red-500 text-white font-bold">
                -%{discountPercent}
              </Badge>
            )}
            {product.featured && (
              <Badge className="bg-primary text-primary-foreground">
                Öne Çıkan
              </Badge>
            )}
          </div>

          {/* Quick actions */}
          <div className={cn(
            "absolute top-3 right-3 flex flex-col gap-2 transition-all duration-300",
            isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
          )}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-9 w-9 rounded-full shadow-lg"
                    onClick={(e) => {
                      e.preventDefault()
                      setIsFavorite(!isFavorite)
                    }}
                  >
                    <Heart className={cn("h-4 w-4", isFavorite && "fill-red-500 text-red-500")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Favorilere ekle</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-9 w-9 rounded-full shadow-lg"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Hızlı bakış</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Stock status badge */}
          {showStock && (
            <div className={cn(
              "absolute bottom-3 left-3 right-3 transition-all duration-300",
              isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}>
              <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium", stockStatus.bg)}>
                <Package className={cn("h-3 w-3", stockStatus.color)} />
                <span className={stockStatus.color}>{stockStatus.text}</span>
                {stockDisplay > 0 && stockDisplay <= 10 && (
                  <Clock className="h-3 w-3 text-orange-500 animate-pulse ml-auto" />
                )}
              </div>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          {/* Vendor */}
          <div className="mb-2">
            <VendorBadge vendorId={product.vendorId} size="sm" />
          </div>

          {/* Product name */}
          <h3 className="font-semibold text-foreground line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          {/* Rating with review preview */}
          {showReviews && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium text-sm">{product.rating}</span>
              </div>
              <span className="text-muted-foreground text-sm">
                ({product.reviewCount} değerlendirme)
              </span>
            </div>
          )}

          {/* Mini review preview */}
          {showReviews && reviews.length > 0 && isHovered && (
            <div className="mt-2 p-2 bg-secondary/50 rounded-lg animate-in fade-in duration-300">
              <div className="flex items-start gap-2">
                {reviews[0].userAvatar && (
                  <div className="relative h-6 w-6 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={reviews[0].userAvatar}
                      alt={reviews[0].userName}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{reviews[0].userName}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    "{reviews[0].comment}"
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sizes */}
          {showSizes && product.sizes && product.sizes.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center gap-1 mb-1.5">
                <Ruler className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Bedenler:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {product.sizes.slice(0, 5).map((sizeOption) => (
                  <button
                    key={sizeOption.size}
                    onClick={(e) => {
                      e.preventDefault()
                      setSelectedSize(sizeOption.size)
                    }}
                    disabled={!sizeOption.available || sizeOption.stock === 0}
                    className={cn(
                      "text-xs px-2 py-1 rounded border transition-all",
                      selectedSize === sizeOption.size
                        ? "border-primary bg-primary text-primary-foreground"
                        : sizeOption.available && sizeOption.stock > 0
                        ? "border-border hover:border-primary"
                        : "border-border/50 text-muted-foreground/50 line-through cursor-not-allowed"
                    )}
                  >
                    {sizeOption.size}
                    {sizeOption.stock <= 3 && sizeOption.stock > 0 && (
                      <span className="ml-1 text-orange-500">!</span>
                    )}
                  </button>
                ))}
                {product.sizes.length > 5 && (
                  <span className="text-xs text-muted-foreground px-2 py-1">
                    +{product.sizes.length - 5}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Colors */}
          {product.colors && product.colors.length > 0 && (
            <div className="mt-2 flex items-center gap-1">
              {product.colors.slice(0, 4).map((color) => (
                <TooltipProvider key={color.name}>
                  <Tooltip>
                    <TooltipTrigger>
                      <div 
                        className="h-5 w-5 rounded-full border-2 border-background shadow-sm ring-1 ring-border"
                        style={{ backgroundColor: color.hex }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      {color.name} ({color.stock} adet)
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
              {product.colors.length > 4 && (
                <span className="text-xs text-muted-foreground ml-1">
                  +{product.colors.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Price and Add to Cart */}
          <div className="mt-4 flex items-end justify-between gap-2">
            <PriceDisplay
              price={product.price}
              originalPrice={product.originalPrice}
              size="lg"
            />
            <Button
              size="icon"
              variant="default"
              className="h-10 w-10 rounded-full shadow-lg"
              onClick={handleAddToCart}
              disabled={!product.inStock || stockDisplay === 0}
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="sr-only">Sepete ekle</span>
            </Button>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}
