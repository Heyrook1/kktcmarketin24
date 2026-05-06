"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ShoppingCart, Star, Heart, Check, AlertTriangle,
  ChevronLeft, ChevronRight, Zap, Package, CreditCard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { VendorBadge } from "@/components/vendor/vendor-badge"
import { PriceDisplay } from "@/components/shared/price-display"
import { useCartStore } from "@/lib/store/cart-store"
import { useWishlistStore } from "@/lib/store/wishlist-store"
import { TR_COLOR_HEX } from "@/lib/tag-taxonomy"
import type { Product } from "@/lib/data/products"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface EnhancedProductCardProps {
  product: Product
  showReviews?: boolean
  showSizes?: boolean
  showStock?: boolean
}

export function EnhancedProductCard({
  product,
  showReviews = true,
  showSizes   = true,
  showStock   = true,
}: EnhancedProductCardProps) {
  const [activeImg, setActiveImg]         = useState(0)
  const [imgFading, setImgFading]         = useState(false)
  const [isHovered, setIsHovered]         = useState(false)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedSize, setSelectedSize]   = useState<string | null>(null)
  const [isAdded, setIsAdded]             = useState(false)
  const [isMounted, setIsMounted]         = useState(false)
  const [liveStock, setLiveStock]         = useState(product.stockCount)

  const { addItem, openCart } = useCartStore()
  const { toggleItem, isInWishlist } = useWishlistStore()
  const router = useRouter()

  useEffect(() => { setIsMounted(true) }, [])
  useEffect(() => {
    const t = setInterval(() => {
      if (Math.random() > 0.97 && liveStock > 0)
        setLiveStock((s) => Math.max(0, s - 1))
    }, 20000)
    return () => clearInterval(t)
  }, [liveStock])

  const isFavorite = isMounted ? isInWishlist(product.id) : false
  const images     = product.images?.length ? product.images : ["/placeholder.svg"]
  const hasMultiple = images.length > 1

  // ── Collect colors from product.colors + color: tags ─────────────────────
  const productColors = useMemo(() => {
    const seen   = new Set<string>()
    const result: Array<{ name: string; hex: string; stock: number }> = []
    for (const c of (product as Product & { colors?: Array<{ name: string; hex: string; stock: number }> }).colors ?? []) {
      const key = c.name.toLowerCase()
      if (!seen.has(key)) { seen.add(key); result.push({ name: c.name, hex: c.hex, stock: c.stock }) }
    }
    for (const tag of product.tags ?? []) {
      const lower = tag.toLowerCase()
      if (lower.startsWith("color:")) {
        const name = lower.slice(6)
        if (!seen.has(name)) {
          seen.add(name)
          result.push({ name, hex: TR_COLOR_HEX[name] ?? "#9ca3af", stock: liveStock })
        }
      }
    }
    return result
  }, [product, liveStock])

  // ── Collect sizes from product.sizes + size: tags ────────────────────────
  const productSizes = useMemo(() => {
    const seen   = new Set<string>()
    const result: Array<{ size: string; stock: number; available: boolean }> = []
    for (const s of (product as Product & { sizes?: Array<{ size: string; stock: number; available: boolean }> }).sizes ?? []) {
      if (!seen.has(s.size)) { seen.add(s.size); result.push(s) }
    }
    for (const tag of product.tags ?? []) {
      const lower = tag.toLowerCase()
      if (lower.startsWith("size:")) {
        const sz = lower.slice(5).toUpperCase()
        if (!seen.has(sz)) {
          seen.add(sz)
          result.push({ size: sz, stock: liveStock, available: liveStock > 0 })
        }
      }
    }
    return result
  }, [product, liveStock])

  // ── Key specs (first 2) ──────────────────────────────────────────────────
  const keySpecs = useMemo(() => {
    const entries: Array<[string, string]> = []
    if (product.material)  entries.push(["Malzeme", product.material])
    if (product.warranty)  entries.push(["Garanti", product.warranty])
    if (product.specifications) {
      for (const [k, v] of Object.entries(product.specifications)) {
        if (entries.length >= 2) break
        entries.push([k, v])
      }
    }
    return entries.slice(0, 2)
  }, [product])

  // ── Active stock based on selected variant ────────────────────────────────
  const activeStock = useMemo(() => {
    if (selectedColor) {
      const found = productColors.find((c) => c.name === selectedColor)
      if (found) return found.stock
    }
    if (selectedSize) {
      const found = productSizes.find((s) => s.size === selectedSize)
      if (found) return found.stock
    }
    return liveStock
  }, [selectedColor, selectedSize, productColors, productSizes, liveStock])

  const stockStatus = (() => {
    if (activeStock === 0)  return { label: "Tükendi",               color: "text-red-500",   dot: "bg-red-500",    bg: "bg-red-50"   }
    if (activeStock <= 3)   return { label: `Son ${activeStock} adet!`,   color: "text-red-500",   dot: "bg-red-500 animate-pulse", bg: "bg-red-50"   }
    if (activeStock <= 10)  return { label: `${activeStock} adet kaldı`,  color: "text-amber-600", dot: "bg-amber-500 animate-pulse", bg: "bg-amber-50" }
    return                         { label: "Stokta var",             color: "text-green-600", dot: "bg-green-500",  bg: "bg-green-50" }
  })()

  const hasDiscount     = !!(product.originalPrice && product.originalPrice > product.price)
  const discountPercent = hasDiscount
    ? Math.round((1 - product.price / product.originalPrice!) * 100)
    : 0
  const isBigDiscount = discountPercent >= 30

  // ── Image switching ──────────────────────────────────────────────────────
  function switchImage(idx: number, e?: React.MouseEvent) {
    e?.preventDefault(); e?.stopPropagation()
    if (idx === activeImg) return
    setImgFading(true)
    setTimeout(() => { setActiveImg(idx); setImgFading(false) }, 140)
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
    e.preventDefault(); e.stopPropagation()
    if (activeStock === 0) return
    addItem(product, 1)
    openCart()
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 1400)
  }

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (activeStock === 0) return
    addItem(product, 1)
    router.push("/checkout")
  }

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    toggleItem(product)
  }

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl bg-card border transition-all duration-300",
        isHovered
          ? "shadow-2xl shadow-primary/10 border-primary/30 -translate-y-1"
          : "shadow-sm border-border/60 hover:shadow-lg",
        activeStock === 0 && "opacity-80"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── Image section ─────────────────────────────────────────────── */}
      <div className="relative aspect-square overflow-hidden bg-secondary/30 flex-shrink-0">
        <Link href={`/products/${product.id}`} className="block w-full h-full">
          <Image
            src={images[activeImg]}
            alt={`${product.name} — görsel ${activeImg + 1}`}
            fill
            className="object-cover transition-all duration-500"
            style={{
              transform: isHovered ? "scale(1.06)" : "scale(1)",
              opacity: imgFading ? 0 : 1,
              transition: "opacity 140ms ease, transform 500ms ease",
            }}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Scrim gradient */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-0"
          )} />
        </Link>

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          aria-label={isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
          className={cn(
            "absolute top-2.5 right-2.5 z-20 flex h-8 w-8 items-center justify-center rounded-full border shadow-md transition-all duration-200",
            isFavorite
              ? "bg-red-50 border-red-200 text-red-500 opacity-100"
              : "bg-white/90 border-white/50 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
          )}
        >
          <Heart className={cn("h-3.5 w-3.5 transition-all", isFavorite && "fill-red-500")} />
        </button>

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 z-20 flex flex-col gap-1">
          {hasDiscount && (
            <span className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-black text-white shadow-md",
              isBigDiscount
                ? "bg-gradient-to-r from-red-500 to-orange-500"
                : "bg-red-500"
            )}>
              {isBigDiscount && <Zap className="h-2.5 w-2.5 fill-white" />}
              -%{discountPercent}
            </span>
          )}
          {activeStock > 0 && activeStock <= 5 && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-md">
              <AlertTriangle className="h-2.5 w-2.5" />
              Son {activeStock}!
            </span>
          )}
          {!product.reviewCount && !hasDiscount && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground shadow-md">Yeni</span>
          )}
        </div>

        {/* Prev/Next arrows */}
        {hasMultiple && isHovered && (
          <>
            <button
              onClick={prevImage}
              aria-label="Önceki"
              className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 backdrop-blur border border-white/60 shadow-md hover:bg-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextImage}
              aria-label="Sonraki"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 backdrop-blur border border-white/60 shadow-md hover:bg-white transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Thumbnail strip on hover */}
        {hasMultiple && (
          <div className={cn(
            "absolute bottom-11 left-0 right-0 flex items-center justify-center gap-1 px-2 z-10 transition-all duration-300",
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
          )}>
            {images.map((src, i) => (
              <button
                key={i}
                onMouseEnter={(e) => switchImage(i, e)}
                onClick={(e) => switchImage(i, e)}
                aria-label={`Görsel ${i + 1}`}
                className={cn(
                  "relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200",
                  i === activeImg
                    ? "border-white scale-110 shadow-lg"
                    : "border-white/40 opacity-70 hover:opacity-100 hover:border-white/70"
                )}
              >
                <Image src={src} alt="" fill className="object-cover" sizes="36px" />
              </button>
            ))}
          </div>
        )}

        {/* Dot indicators (idle) */}
        {hasMultiple && (
          <div className={cn(
            "absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10 transition-opacity duration-300 pointer-events-none",
            isHovered ? "opacity-0" : "opacity-100"
          )}>
            {images.map((_, i) => (
              <span key={i} className={cn(
                "rounded-full bg-white transition-all duration-300",
                i === activeImg ? "w-3 h-1.5" : "w-1.5 h-1.5 opacity-50"
              )} />
            ))}
          </div>
        )}

        {/* Tükendi overlay */}
        {activeStock === 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-[2px]">
            <span className="rounded-full bg-background/90 border px-3 py-1 text-xs font-semibold text-muted-foreground shadow">
              Tükendi
            </span>
          </div>
        )}

        {/* Hover quick-action strip */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 z-20 p-2 transition-all duration-300",
          isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
        )}>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              className={cn(
                "flex-1 gap-1.5 rounded-xl shadow-lg font-semibold text-xs h-8 transition-all",
                isAdded
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              onClick={handleAddToCart}
              disabled={activeStock === 0}
            >
              {isAdded
                ? <><Check className="h-3.5 w-3.5" />Eklendi</>
                : <><ShoppingCart className="h-3.5 w-3.5" />{activeStock === 0 ? "Tükendi" : "Sepete Ekle"}</>
              }
            </Button>
            {activeStock > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl shadow-lg font-semibold text-xs h-8 gap-1 bg-white/90 backdrop-blur border-white/60 hover:bg-white text-foreground px-2.5"
                onClick={handleBuyNow}
              >
                <Zap className="h-3.5 w-3.5 text-primary" />
                Hemen Al
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Card body ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 p-3 flex-1">
        {/* Vendor */}
        <VendorBadge vendorId={product.vendorId} size="sm" />

        {/* Name */}
        <Link href={`/products/${product.id}`}>
          <h3 className={cn(
            "text-sm font-semibold leading-snug line-clamp-2 transition-colors min-h-[2.6em]",
            isHovered ? "text-primary" : "text-foreground"
          )}>
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        {showReviews && product.reviewCount > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={cn(
                  "h-3 w-3",
                  s <= Math.round(product.rating ?? 0) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"
                )} />
              ))}
            </div>
            <span className="text-[11px] text-muted-foreground font-medium">{product.rating}</span>
            <span className="text-[11px] text-muted-foreground">({product.reviewCount})</span>
          </div>
        )}

        {/* ── Color selector ── */}
        {productColors.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              {productColors.map((c) => {
                const isLight    = c.hex === "#ffffff" || c.hex === "#fef3c7" || c.hex === "#d4a574"
                const isSelected = selectedColor === c.name
                const isOut      = c.stock === 0
                return (
                  <button
                    key={c.name}
                    onClick={(e) => {
                      e.preventDefault(); e.stopPropagation()
                      setSelectedColor(isSelected ? null : c.name)
                      setSelectedSize(null)
                    }}
                    title={`${c.name}${c.stock > 0 ? ` (${c.stock} adet)` : " — Tükendi"}`}
                    disabled={isOut}
                    className={cn(
                      "relative h-6 w-6 rounded-full border-2 transition-all duration-200 flex-shrink-0",
                      isSelected
                        ? "border-primary ring-2 ring-primary/30 ring-offset-1 scale-110 shadow-md"
                        : isLight
                        ? "border-border hover:border-primary/50 hover:scale-105"
                        : "border-transparent hover:border-primary/50 hover:scale-105",
                      isOut && "opacity-30 cursor-not-allowed"
                    )}
                    style={{ backgroundColor: c.hex }}
                    aria-pressed={isSelected}
                    aria-label={c.name}
                  >
                    {isSelected && (
                      <Check className={cn(
                        "absolute inset-0 m-auto h-3 w-3",
                        isLight ? "text-foreground" : "text-white"
                      )} />
                    )}
                    {isOut && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="block h-px w-5 bg-muted-foreground/60 rotate-45" />
                      </span>
                    )}
                  </button>
                )
              })}
              {productColors.length > 6 && (
                <span className="text-[10px] text-muted-foreground">+{productColors.length - 6}</span>
              )}
            </div>
            {selectedColor && (() => {
              const c = productColors.find((x) => x.name === selectedColor)
              return c ? (
                <p className="text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground">{c.name}</span>
                  {" · "}
                  {c.stock === 0
                    ? <span className="text-red-500 font-medium">Tükendi</span>
                    : c.stock <= 5
                    ? <span className="text-amber-600 font-medium">Son {c.stock} adet</span>
                    : <span className="text-green-600 font-medium">{c.stock} adet stokta</span>
                  }
                </p>
              ) : null
            })()}
          </div>
        )}

        {/* ── Size selector ── */}
        {showSizes && productSizes.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex flex-wrap gap-1">
              {productSizes.map((s) => {
                const isSelected  = selectedSize === s.size
                const unavailable = !s.available || s.stock === 0
                const lowStock    = s.stock > 0 && s.stock <= 3
                return (
                  <button
                    key={s.size}
                    onClick={(e) => {
                      e.preventDefault(); e.stopPropagation()
                      if (unavailable) return
                      setSelectedSize(isSelected ? null : s.size)
                      setSelectedColor(null)
                    }}
                    disabled={unavailable}
                    title={unavailable ? `${s.size} — Tükendi` : `${s.size}${lowStock ? ` (Son ${s.stock})` : ""}`}
                    className={cn(
                      "relative min-w-[28px] h-7 px-2 rounded-lg border text-[11px] font-semibold transition-all duration-150",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : unavailable
                        ? "border-border/30 text-muted-foreground/40 line-through cursor-not-allowed bg-secondary/20"
                        : "border-border hover:border-primary/60 hover:bg-secondary text-foreground"
                    )}
                  >
                    {s.size}
                    {lowStock && !unavailable && (
                      <span className="absolute -top-1 -right-1 h-3 w-3 flex items-center justify-center rounded-full bg-amber-500 text-white text-[8px] font-bold shadow">
                        {s.stock}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            {selectedSize && (() => {
              const s = productSizes.find((x) => x.size === selectedSize)
              return s && s.stock > 0 && s.stock <= 5 ? (
                <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Bu bedende son {s.stock} adet!
                </p>
              ) : null
            })()}
          </div>
        )}

        {/* ── Key specs ── */}
        {keySpecs.length > 0 && (
          <div className="space-y-1">
            {keySpecs.map(([k, v]) => (
              <div key={k} className="flex items-center gap-1.5 text-[11px]">
                <span className="h-1 w-1 rounded-full bg-primary/60 flex-shrink-0" />
                <span className="text-muted-foreground font-medium">{k}:</span>
                <span className="text-foreground font-semibold truncate">{v}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Stock indicator ── */}
        {showStock && (
          <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium", stockStatus.bg)}>
            <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", stockStatus.dot)} />
            <Package className={cn("h-3 w-3 flex-shrink-0", stockStatus.color)} />
            <span className={stockStatus.color}>{stockStatus.label}</span>
            {activeStock > 0 && activeStock <= 20 && (
              <div className="ml-auto h-1 w-12 bg-border/60 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (activeStock / 20) * 100)}%`,
                    background: activeStock <= 3 ? "#ef4444" : activeStock <= 10 ? "#f59e0b" : "#22c55e",
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* ── Price + installment + cart ── */}
        <div className="mt-auto pt-1 space-y-1.5">
          <div className="flex items-end justify-between gap-2">
            <PriceDisplay price={product.price} originalPrice={product.originalPrice} size="md" />
          </div>

          {product.price >= 300 && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <CreditCard className="h-3 w-3 text-primary flex-shrink-0" />
              <span>
                12 x{" "}
                <span className="font-semibold text-foreground">
                  {(product.price / 12).toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺
                </span>
              </span>
            </div>
          )}

          <Button
            size="sm"
            className={cn(
              "w-full h-8 gap-1.5 rounded-xl font-semibold text-xs transition-all shadow-sm",
              isAdded
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20 hover:shadow-md"
            )}
            onClick={handleAddToCart}
            disabled={activeStock === 0}
          >
            {isAdded
              ? <><Check className="h-3.5 w-3.5" />Sepete Eklendi</>
              : <><ShoppingCart className="h-3.5 w-3.5" />{activeStock === 0 ? "Tükendi" : "Sepete Ekle"}</>
            }
          </Button>
        </div>
      </div>
    </div>
  )
}
