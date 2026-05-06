"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Star, Minus, Plus, ShoppingCart, Check, ChevronRight, ChevronLeft,
  Package, Ruler, Palette, ShieldCheck, Truck, RotateCcw,
  AlertTriangle, BadgeCheck, MapPin, ExternalLink, Heart, Zap,
  X, CreditCard, Tag, ChevronDown, ZoomIn, Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VendorBadge } from "@/components/vendor/vendor-badge"
import { PriceDisplay } from "@/components/shared/price-display"
import { ShareButtons } from "@/components/shared/share-buttons"
import { ReviewsSection } from "@/components/shared/reviews-section"
import { useCartStore } from "@/lib/store/cart-store"
import { useWishlistStore } from "@/lib/store/wishlist-store"
import { getProductReviews } from "@/lib/data/reviews"
import { ProductDetailSocialProof } from "@/components/social-proof"
import type { Product } from "@/lib/data/products"
import type { Vendor } from "@/lib/data/vendors"
import type { Category } from "@/lib/data/categories"
import { cn } from "@/lib/utils"

interface ProductDetailProps {
  product: Product
  vendor?: Vendor
  category?: Category
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
function ImageLightbox({
  images, currentIndex, onClose, onChange,
}: {
  images: string[]
  currentIndex: number
  onClose: () => void
  onChange: (i: number) => void
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft")  onChange(Math.max(0, currentIndex - 1))
      if (e.key === "ArrowRight") onChange(Math.min(images.length - 1, currentIndex + 1))
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [currentIndex, images.length, onClose, onChange])

  const thumbRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = thumbRef.current?.children[currentIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" })
  }, [currentIndex])

  return (
    <div className="fixed inset-0 z-[100] bg-black/96 flex flex-col animate-in fade-in duration-200">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
        <span className="text-white/60 text-sm font-medium tabular-nums">
          {currentIndex + 1} / {images.length}
        </span>
        <button
          onClick={onClose}
          aria-label="Kapat"
          className="text-white/60 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Main image area */}
      <div className="flex-1 flex items-center justify-center relative px-4 md:px-20 min-h-0">
        {/* Prev */}
        <button
          onClick={() => onChange(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          aria-label="Önceki"
          className="absolute left-2 md:left-6 z-10 text-white/60 hover:text-white p-3 rounded-full hover:bg-white/10 transition-all disabled:opacity-0 disabled:pointer-events-none"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>

        {/* Image */}
        <div className="relative w-full max-w-2xl aspect-square md:aspect-[4/3]">
          <Image
            src={images[currentIndex]}
            alt={`Görsel ${currentIndex + 1}`}
            fill
            className="object-contain"
            priority
            sizes="100vw"
          />
        </div>

        {/* Next */}
        <button
          onClick={() => onChange(Math.min(images.length - 1, currentIndex + 1))}
          disabled={currentIndex === images.length - 1}
          aria-label="Sonraki"
          className="absolute right-2 md:right-6 z-10 text-white/60 hover:text-white p-3 rounded-full hover:bg-white/10 transition-all disabled:opacity-0 disabled:pointer-events-none"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div
          ref={thumbRef}
          className="flex-shrink-0 flex items-center gap-2 px-6 py-4 overflow-x-auto scrollbar-hide justify-center"
        >
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => onChange(i)}
              aria-label={`Görsel ${i + 1}`}
              className={cn(
                "relative h-14 w-14 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200",
                i === currentIndex
                  ? "border-white opacity-100 scale-110"
                  : "border-transparent opacity-40 hover:opacity-70 hover:scale-105"
              )}
            >
              <Image src={img} alt="" fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main gallery panel ────────────────────────────────────────────────────────
function ProductGallery({
  images, productName, hasDiscount, discountPercent, isWishlisted, onWishlist,
}: {
  images: string[]
  productName: string
  hasDiscount: boolean
  discountPercent: number
  isWishlisted: boolean
  onWishlist: () => void
}) {
  const [selected, setSelected] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPos({ x, y })
  }, [isZoomed])

  return (
    <>
      {lightboxOpen && (
        <ImageLightbox
          images={images}
          currentIndex={selected}
          onClose={() => setLightboxOpen(false)}
          onChange={setSelected}
        />
      )}

      <div className="flex flex-col gap-4 lg:sticky lg:top-24 h-fit">
        {/* Main image + thumbnails row */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Vertical thumbnail strip */}
          {images.length > 1 && (
            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto order-2 md:order-1 md:max-h-[520px] scrollbar-hide pb-1 md:pb-0 md:w-[72px] flex-shrink-0">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  className={cn(
                    "relative h-16 w-16 md:h-[68px] md:w-[68px] flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200",
                    selected === i
                      ? "border-primary ring-2 ring-primary/25 ring-offset-1 opacity-100 shadow-md"
                      : "border-border opacity-60 hover:opacity-100 hover:border-primary/50 hover:shadow-sm"
                  )}
                >
                  <Image src={img} alt={`${productName} ${i + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Main image */}
          <div className="relative order-1 md:order-2 flex-1">
            {/* Image counter badge */}
            {images.length > 1 && (
              <div className="absolute bottom-3 left-3 z-20 bg-black/60 text-white text-xs font-medium rounded-full px-2.5 py-1 backdrop-blur-sm pointer-events-none">
                {selected + 1} / {images.length}
              </div>
            )}

            {/* Discount badge */}
            {hasDiscount && (
              <Badge className="absolute top-4 left-4 z-20 bg-red-500 text-white font-black text-sm px-3 py-1 shadow-lg">
                -%{discountPercent}
              </Badge>
            )}

            {/* Wishlist button */}
            <button
              onClick={onWishlist}
              aria-label={isWishlisted ? "Favorilerden çıkar" : "Favorilere ekle"}
              className={cn(
                "absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border shadow-lg transition-all duration-300",
                isWishlisted
                  ? "bg-red-50 border-red-200 text-red-500"
                  : "bg-white/90 border-white/60 text-muted-foreground hover:bg-red-50 hover:text-red-500 hover:border-red-200"
              )}
            >
              <Heart className={cn("h-5 w-5 transition-transform duration-200 hover:scale-110", isWishlisted && "fill-red-500")} />
            </button>

            {/* Zoom hint */}
            <div className="absolute bottom-3 right-3 z-20 bg-black/60 text-white text-[10px] font-medium rounded-full px-2 py-1 backdrop-blur-sm flex items-center gap-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="h-3 w-3" />
              Yakınlaştır
            </div>

            {/* Prev / Next arrows over image */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setSelected((i) => Math.max(0, i - 1))}
                  disabled={selected === 0}
                  aria-label="Önceki görsel"
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm border shadow-md rounded-full p-1.5 disabled:opacity-0 hover:bg-white transition-all hover:scale-110"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setSelected((i) => Math.min(images.length - 1, i + 1))}
                  disabled={selected === images.length - 1}
                  aria-label="Sonraki görsel"
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm border shadow-md rounded-full p-1.5 disabled:opacity-0 hover:bg-white transition-all hover:scale-110"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}

            {/* Main image with hover zoom */}
            <div
              className="relative aspect-square rounded-2xl overflow-hidden bg-secondary/20 border shadow-sm cursor-zoom-in group"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
              onClick={() => setLightboxOpen(true)}
              role="button"
              aria-label="Büyütmek için tıklayın"
            >
              <Image
                src={images[selected]}
                alt={productName}
                fill
                className={cn(
                  "object-cover transition-transform duration-100 select-none",
                  isZoomed ? "scale-[1.8]" : "scale-100"
                )}
                style={isZoomed ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
                priority
                draggable={false}
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>

        {/* Trust badges row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Truck,       label: "Hızlı Teslimat",  sub: "1-3 iş günü" },
            { icon: ShieldCheck, label: "Güvenli Ödeme",   sub: "256-bit SSL" },
            { icon: RotateCcw,   label: "Kolay İade",      sub: "14 gün içinde" },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary/50 text-center border border-border/40">
              <Icon className="h-5 w-5 text-primary" />
              <span className="text-xs font-semibold text-foreground">{label}</span>
              <span className="text-[10px] text-muted-foreground">{sub}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// ── Installment table ─────────────────────────────────────────────────────────
function InstallmentTable({ price }: { price: number }) {
  const [open, setOpen] = useState(false)
  const plans = [3, 6, 9, 12].map((n) => ({
    months: n,
    monthly: price / n,
    total: price,
  }))
  if (price < 200) return null
  return (
    <div className="rounded-xl border border-border/60 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-secondary/30 hover:bg-secondary/50 transition-colors text-sm font-medium"
      >
        <span className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" />
          Taksit Seçenekleri
          <span className="text-muted-foreground font-normal text-xs">
            12 x {(price / 12).toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺
          </span>
        </span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-t">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/10">
                <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Taksit</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Aylık</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.months} className="border-b last:border-0 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-2.5 font-medium">{p.months} Taksit</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-primary">
                    {p.monthly.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground text-xs">
                    {p.total.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Spec table ────────────────────────────────────────────────────────────────
function SpecTable({ product }: { product: Product }) {
  const rows: Array<{ key: string; value: string }> = []
  if (product.material)   rows.push({ key: "Malzeme",     value: product.material })
  if (product.warranty)   rows.push({ key: "Garanti",     value: product.warranty })
  if (product.weight)     rows.push({ key: "Ağırlık",     value: product.weight })
  if (product.dimensions) rows.push({ key: "Boyutlar",    value: product.dimensions })
  if (product.specifications) {
    for (const [k, v] of Object.entries(product.specifications)) {
      rows.push({ key: k, value: v })
    }
  }
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">Bu ürün için teknik özellik bilgisi bulunmuyor.</p>
  }
  return (
    <div className="rounded-xl border overflow-hidden">
      <table className="w-full text-sm">
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.key} className={cn("border-b last:border-0 hover:bg-secondary/20 transition-colors", i % 2 === 0 ? "bg-secondary/5" : "bg-background")}>
              <td className="px-4 py-3 font-semibold text-foreground w-2/5 border-r border-border/40">{row.key}</td>
              <td className="px-4 py-3 text-muted-foreground">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function ProductDetail({ product, vendor, category }: ProductDetailProps) {
  const [quantity, setQuantity]           = useState(1)
  const [selectedSize, setSelectedSize]   = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedVolume, setSelectedVolume] = useState<string | null>(null)
  const [activePrice, setActivePrice]     = useState(product.price)
  const [liveStock, setLiveStock]         = useState(product.stockCount)
  const [isMounted, setIsMounted]         = useState(false)
  const [variantError, setVariantError]   = useState<string | null>(null)
  const { addItem, openCart }             = useCartStore()
  const { addItem: addWishlist, removeItem: removeWishlist, items: wishlistItems } = useWishlistStore()
  const router  = useRouter()
  const reviews = getProductReviews(product.id)

  useEffect(() => { setIsMounted(true) }, [])

  const isWishlisted = isMounted ? wishlistItems.some((i) => i.id === product.id) : false

  // When a volume with a different price is selected, update active price
  useEffect(() => {
    if (!product.volumes || !selectedVolume) { setActivePrice(product.price); return }
    const vol = product.volumes.find((v) => v.label === selectedVolume)
    setActivePrice(vol?.price ?? product.price)
  }, [selectedVolume, product.volumes, product.price])

  // Simulate live stock ticking
  useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() > 0.97 && liveStock > 0) setLiveStock((p) => Math.max(0, p - 1))
    }, 15000)
    return () => clearInterval(id)
  }, [liveStock])

  // Combined stock: color + size — pick the most specific one available
  const activeStock = (() => {
    if (product.sizes && selectedSize) {
      const s = product.sizes.find((s) => s.size === selectedSize)
      if (s) return s.stock
    }
    if (product.colors && selectedColor) {
      const c = product.colors.find((c) => c.name === selectedColor)
      if (c) return c.stock
    }
    if (product.volumes && selectedVolume) {
      const v = product.volumes.find((v) => v.label === selectedVolume)
      if (v) return v.stock
    }
    return liveStock
  })()

  // Dynamic stock label based on what's selected
  const stockLabel = (() => {
    const parts: string[] = []
    if (selectedColor) parts.push(`${selectedColor} renkte`)
    if (selectedSize)  parts.push(`${selectedSize} bedende`)
    if (selectedVolume) parts.push(`${selectedVolume}`)
    if (activeStock === 0) return `${parts.length ? parts.join(" ") + " — " : ""}Tükendi`
    if (activeStock <= 3)  return `${parts.length ? parts.join(" ") + " — " : ""}Son ${activeStock} adet!`
    if (activeStock <= 10) return `${parts.length ? parts.join(" ") + " — " : ""}${activeStock} adet kaldı`
    return parts.length ? `${parts.join(", ")} — Stokta var` : "Stokta var"
  })()

  const stockStatus = (() => {
    if (activeStock === 0)  return { color: "text-red-500",   bg: "bg-red-50 border-red-200",     dot: "bg-red-500" }
    if (activeStock <= 3)   return { color: "text-red-500",   bg: "bg-red-50 border-red-200",     dot: "bg-red-500 animate-pulse" }
    if (activeStock <= 10)  return { color: "text-amber-600", bg: "bg-amber-50 border-amber-200", dot: "bg-amber-500 animate-pulse" }
    return                         { color: "text-green-600", bg: "bg-green-50 border-green-200", dot: "bg-green-500" }
  })()

  const hasDiscount     = !!(product.originalPrice && product.originalPrice > activePrice)
  const discountPercent = hasDiscount ? Math.round((1 - activePrice / product.originalPrice!) * 100) : 0

  const validateVariants = (): boolean => {
    if (product.sizes?.length && !selectedSize) {
      setVariantError("Lütfen beden seçiniz")
      return false
    }
    if (product.colors?.length && !selectedColor) {
      setVariantError("Lütfen renk seçiniz")
      return false
    }
    if (product.volumes?.length && !selectedVolume) {
      setVariantError("Lütfen boyut seçiniz")
      return false
    }
    setVariantError(null)
    return true
  }

  const handleAddToCart = () => {
    if (!validateVariants()) return
    addItem(product, quantity)
    openCart()
  }
  const handleBuyNow = () => {
    if (!validateVariants()) return
    addItem(product, quantity)
    router.push("/checkout")
  }
  const handleWishlist = () => isWishlisted ? removeWishlist(product.id) : addWishlist(product)

  const visibleTags = product.tags.filter((t) =>
    !t.toLowerCase().match(/^(color|size|gender|brand|type|subtype):/)
  )

  const deliveryDate = (() => {
    const d = new Date()
    d.setDate(d.getDate() + (d.getHours() < 15 ? 1 : 2))
    if (d.getDay() === 0) d.setDate(d.getDate() + 1)
    if (d.getDay() === 6) d.setDate(d.getDate() + 2)
    return d.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })
  })()

  // Images: if selected color has its own images, use those
  const galleryImages = (() => {
    if (selectedColor && product.colors) {
      const c = product.colors.find((c) => c.name === selectedColor)
      if (c?.images?.length) return c.images
    }
    return product.images
  })()

  return (
    <div>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground mb-6 flex-wrap">
        <Link href="/" className="hover:text-foreground transition-colors">Ana Sayfa</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/urunler" className="hover:text-foreground transition-colors">Ürünler</Link>
        {category && (
          <>
            <ChevronRight className="h-3 w-3" />
            <Link href={`/category/${category.slug}`} className="hover:text-foreground transition-colors">{category.name}</Link>
          </>
        )}
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground truncate max-w-[220px]">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-14">
        {/* ── Left: Gallery ── */}
        <ProductGallery
          images={galleryImages}
          productName={product.name}
          hasDiscount={hasDiscount}
          discountPercent={discountPercent}
          isWishlisted={isWishlisted}
          onWishlist={handleWishlist}
        />

        {/* ── Right: Product info ── */}
        <div className="flex flex-col gap-0">
          {/* Brand / category row */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <VendorBadge vendorId={product.vendorId} size="sm" />
            {category && (
              <Link href={`/category/${category.slug}`}>
                <Badge variant="outline" className="text-xs">{category.name}</Badge>
              </Link>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-balance leading-tight">{product.name}</h1>

          {/* Rating row */}
          {product.reviewCount > 0 ? (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={cn("h-4 w-4", i < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted")} />
                ))}
              </div>
              <span className="text-sm font-semibold">{product.rating}</span>
              <a href="#reviews" className="text-sm text-muted-foreground hover:text-primary transition-colors hover:underline">
                {product.reviewCount} değerlendirme
              </a>
              <span className="text-border">|</span>
              <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Onaylı ürün
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 mt-2">
              <Badge variant="secondary" className="text-xs font-medium">Yeni Ürün</Badge>
              <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Onaylı ürün
              </span>
            </div>
          )}

          <Separator className="my-4" />

          {/* Price section */}
          <div className="rounded-2xl bg-secondary/30 border border-border/60 p-4 space-y-3">
            <div className="flex items-end gap-3 flex-wrap">
              <PriceDisplay price={activePrice} originalPrice={product.originalPrice} size="lg" />
              {hasDiscount && (
                <span className="text-sm text-green-600 font-semibold bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                  %{discountPercent} indirim
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Truck className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">Ücretsiz teslimat</span>
                {" "}— Tahmini {deliveryDate}
              </span>
            </div>

            <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium", stockStatus.bg)}>
              <span className={cn("h-2 w-2 rounded-full flex-shrink-0", stockStatus.dot)} />
              <Package className={cn("h-4 w-4", stockStatus.color)} />
              <span className={stockStatus.color}>{stockLabel}</span>
              {activeStock > 0 && activeStock <= 20 && (
                <div className="ml-auto">
                  <div className="h-1.5 w-20 bg-border/60 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, (activeStock / 20) * 100)}%`,
                        background: activeStock <= 3 ? "#ef4444" : activeStock <= 10 ? "#f59e0b" : "#22c55e",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Social proof */}
          <ProductDetailSocialProof
            productId={product.id}
            selectedVariant={selectedColor ?? selectedSize ?? selectedVolume ?? null}
            inStock={activeStock > 0}
          />

          {/* Description */}
          <p className="mt-4 text-muted-foreground leading-relaxed text-sm">{product.description}</p>

          {/* Feature highlights */}
          {(product.material || product.warranty || product.specifications) && (
            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-bold flex items-center gap-1.5 text-foreground">
                <Info className="h-4 w-4 text-primary" />
                Öne Çıkan Özellikler
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.material && (
                  <div className="flex items-center gap-2.5 rounded-xl bg-secondary/40 px-3 py-2.5 border border-border/40">
                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Tag className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Malzeme</p>
                      <p className="text-xs font-semibold text-foreground truncate">{product.material}</p>
                    </div>
                  </div>
                )}
                {product.warranty && (
                  <div className="flex items-center gap-2.5 rounded-xl bg-secondary/40 px-3 py-2.5 border border-border/40">
                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Garanti</p>
                      <p className="text-xs font-semibold text-foreground truncate">{product.warranty}</p>
                    </div>
                  </div>
                )}
                {product.specifications && Object.entries(product.specifications).slice(0, 4).map(([k, v]) => {
                  const iconMap: Record<string, React.ElementType> = {
                    "Batarya": Zap, "Bluetooth": Info, "Su": ShieldCheck,
                  }
                  const Icon = Object.entries(iconMap).find(([key]) => k.includes(key))?.[1] ?? Tag
                  return (
                    <div key={k} className="flex items-center gap-2.5 rounded-xl bg-secondary/40 px-3 py-2.5 border border-border/40">
                      <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{k}</p>
                        <p className="text-xs font-semibold text-foreground truncate">{v}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
              {product.specifications && Object.keys(product.specifications).length > 4 && (
                <button
                  onClick={() => document.querySelector<HTMLButtonElement>('[value="specs"]')?.click()}
                  className="text-xs text-primary font-semibold hover:underline mt-1 flex items-center gap-1"
                >
                  Tüm teknik özellikleri gör <ChevronRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          <Separator className="my-5" />

          {/* ── Variant selectors ── */}
          <div className="space-y-5">

            {/* Color selector */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-bold text-foreground">Renk:</span>
                    {selectedColor
                      ? <span className="text-sm font-semibold text-primary">{selectedColor}</span>
                      : <span className="text-sm text-muted-foreground">Seçiniz</span>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {product.colors.map((c) => {
                    const isLight = c.hex === "#ffffff" || c.hex === "#f3f4f6" || c.hex === "#fef3c7"
                    const isSelected = selectedColor === c.name
                    const outOfStock = c.stock === 0
                    return (
                      <button
                        key={c.name}
                        onClick={() => { setSelectedColor(c.name); setVariantError(null) }}
                        disabled={outOfStock}
                        title={`${c.name}${outOfStock ? " — Tükendi" : ` — ${c.stock} adet`}`}
                        className={cn(
                          "group/color flex flex-col items-center gap-1.5 transition-all duration-150",
                          outOfStock && "opacity-40 cursor-not-allowed"
                        )}
                      >
                        <span className={cn(
                          "relative flex h-11 w-11 items-center justify-center rounded-full border-2 shadow-sm transition-all duration-200",
                          isSelected
                            ? "border-primary ring-2 ring-primary/30 ring-offset-2 scale-110 shadow-md"
                            : isLight
                            ? "border-border hover:border-primary/60 hover:scale-105"
                            : "border-transparent hover:border-white/70 hover:scale-105"
                        )}
                          style={{ backgroundColor: c.hex }}
                        >
                          {isSelected && (
                            <Check className={cn("h-4 w-4 drop-shadow-sm", isLight ? "text-foreground" : "text-white")} />
                          )}
                          {outOfStock && !isSelected && (
                            <span className="absolute inset-0 rounded-full" style={{ background: "repeating-linear-gradient(45deg,transparent,transparent 3px,rgba(0,0,0,0.2) 3px,rgba(0,0,0,0.2) 4px)" }} />
                          )}
                        </span>
                        <span className={cn("text-[10px] font-medium leading-none", isSelected ? "text-primary" : "text-muted-foreground")}>
                          {c.name}
                        </span>
                      </button>
                    )
                  })}
                </div>
                {selectedColor && (() => {
                  const c = product.colors!.find((c) => c.name === selectedColor)!
                  if (!c) return null
                  if (c.stock === 0) return (
                    <p className="text-xs text-red-600 mt-2 flex items-center gap-1.5 font-medium">
                      <AlertTriangle className="h-3.5 w-3.5" /> Bu renk tükendi
                    </p>
                  )
                  if (c.stock <= 5) return (
                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5 font-medium">
                      <AlertTriangle className="h-3.5 w-3.5" /> {selectedColor} renkte son {c.stock} adet kaldı!
                    </p>
                  )
                  return null
                })()}
              </div>
            )}

            {/* Size selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-bold text-foreground">Beden:</span>
                    {selectedSize
                      ? <span className="text-sm font-semibold text-primary">{selectedSize}</span>
                      : <span className="text-sm text-muted-foreground">Seçiniz</span>}
                  </div>
                  <button className="text-xs text-primary hover:underline flex items-center gap-1">
                    Beden Rehberi <Info className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => {
                    const unavailable = !s.available || s.stock === 0
                    const lowStock = s.stock > 0 && s.stock <= 3
                    const isSelected = selectedSize === s.size
                    return (
                      <button
                        key={s.size}
                        onClick={() => { setSelectedSize(s.size); setVariantError(null) }}
                        disabled={unavailable}
                        title={unavailable ? `${s.size} — Tükendi` : `${s.size} — ${s.stock} adet`}
                        className={cn(
                          "relative min-w-[52px] px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-150",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground shadow-md"
                            : unavailable
                            ? "border-border/40 text-muted-foreground/40 line-through cursor-not-allowed bg-secondary/20"
                            : "border-border hover:border-primary/60 hover:bg-secondary/60 text-foreground"
                        )}
                      >
                        {s.size}
                        {lowStock && !unavailable && (
                          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white text-[9px] font-bold shadow-sm">
                            {s.stock}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
                {selectedSize && (() => {
                  const s = product.sizes!.find((s) => s.size === selectedSize)!
                  if (!s || s.stock > 5) return null
                  if (s.stock === 0) return (
                    <p className="text-xs text-red-600 mt-2 flex items-center gap-1.5 font-medium">
                      <AlertTriangle className="h-3.5 w-3.5" /> {selectedSize} beden tükendi
                    </p>
                  )
                  return (
                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5 font-medium">
                      <AlertTriangle className="h-3.5 w-3.5" /> {selectedSize} bedende son {s.stock} adet kaldı!
                    </p>
                  )
                })()}
              </div>
            )}

            {/* Volume / capacity selector */}
            {product.volumes && product.volumes.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-bold text-foreground">Boyut / Kapasite:</span>
                  {selectedVolume
                    ? <span className="text-sm font-semibold text-primary">{selectedVolume}</span>
                    : <span className="text-sm text-muted-foreground">Seçiniz</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.volumes.map((v) => {
                    const unavailable = !v.available || v.stock === 0
                    const isSelected  = selectedVolume === v.label
                    return (
                      <button
                        key={v.label}
                        onClick={() => { setSelectedVolume(v.label); setVariantError(null) }}
                        disabled={unavailable}
                        title={unavailable ? `${v.label} — Tükendi` : `${v.label} — ${v.stock} adet`}
                        className={cn(
                          "relative flex flex-col items-center px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-150",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground shadow-md"
                            : unavailable
                            ? "border-border/40 text-muted-foreground/40 cursor-not-allowed bg-secondary/20"
                            : "border-border hover:border-primary/60 hover:bg-secondary/60 text-foreground"
                        )}
                      >
                        <span>{v.label}</span>
                        {v.price && (
                          <span className={cn("text-[10px] font-normal mt-0.5", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                            {v.price.toLocaleString("tr-TR")} ₺
                          </span>
                        )}
                        {unavailable && (
                          <span className={cn("text-[9px] mt-0.5", isSelected ? "text-primary-foreground/60" : "text-red-400")}>Tükendi</span>
                        )}
                      </button>
                    )
                  })}
                </div>
                {selectedVolume && (() => {
                  const v = product.volumes!.find((v) => v.label === selectedVolume)!
                  if (!v || v.stock > 5) return null
                  if (v.stock === 0) return (
                    <p className="text-xs text-red-600 mt-2 flex items-center gap-1.5 font-medium">
                      <AlertTriangle className="h-3.5 w-3.5" /> {selectedVolume} boyutu tükendi
                    </p>
                  )
                  return (
                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5 font-medium">
                      <AlertTriangle className="h-3.5 w-3.5" /> {selectedVolume} için son {v.stock} adet kaldı!
                    </p>
                  )
                })()}
              </div>
            )}

            {/* Variant validation error */}
            {variantError && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 animate-in slide-in-from-top-1 duration-200">
                <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <span className="text-sm font-medium text-red-600">{variantError}</span>
              </div>
            )}

          </div>

          <Separator className="my-5" />

          {/* Quantity + Add to cart */}
          {activeStock > 0 ? (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center rounded-xl border overflow-hidden bg-secondary/20 self-start">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="h-11 w-11 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-40"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center font-bold text-sm">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(activeStock, q + 1))}
                    disabled={quantity >= activeStock}
                    className="h-11 w-11 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-40"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <Button
                  size="lg"
                  className="flex-1 gap-2 h-11 rounded-xl font-bold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="h-5 w-5" />
                  Sepete Ekle
                </Button>
              </div>
              <Button
                size="lg"
                variant="outline"
                className="w-full gap-2 h-11 rounded-xl font-bold border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                onClick={handleBuyNow}
              >
                <Zap className="h-4 w-4" />
                Hemen Al
              </Button>
              {activeStock > 0 && activeStock <= 5 && (
                <p className="text-xs font-semibold text-red-600 flex items-center gap-1.5 animate-pulse">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
                  Son {activeStock} adet kaldı — kaçırmayın!
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-200">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <span className="text-red-600 font-medium text-sm">Bu ürün şu an stokta bulunmuyor.</span>
            </div>
          )}

          <div className="mt-4">
            <InstallmentTable price={activePrice} />
          </div>

          <div className="mt-5 rounded-xl border border-border/60 bg-secondary/20 px-4 py-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">
              {vendor?.name?.slice(0, 1) ?? "M"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Satıcı</p>
              <p className="text-sm font-semibold text-foreground flex items-center gap-1 truncate">
                {vendor?.name ?? "Marketin24 Satıcısı"}
                {vendor?.verified && <BadgeCheck className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
              </p>
              {vendor && <p className="text-xs text-muted-foreground">{vendor.location}</p>}
            </div>
            {vendor && (
              <Link href={`/vendor/${vendor.slug}`} className="text-xs text-primary font-semibold hover:underline flex-shrink-0 flex items-center gap-0.5">
                Mağazayı Gör <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          <div className="mt-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Paylaş:</span>
              <ShareButtons url={`/products/${product.id}`} title={product.name} description={product.description} />
            </div>
            {visibleTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {visibleTags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-default">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom tabs ── */}
      <div className="mt-14" id="reviews">
        <Tabs defaultValue="specs">
          <TabsList className="w-full justify-start mb-6 flex-wrap h-auto gap-1 bg-secondary/50 p-1 rounded-xl">
            <TabsTrigger value="specs" className="gap-1.5 rounded-lg data-[state=active]:shadow-sm">
              <ShieldCheck className="h-4 w-4" />
              Teknik Özellikler
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-1.5 rounded-lg data-[state=active]:shadow-sm">
              <Star className="h-4 w-4" />
              Değerlendirmeler
              {reviews.length > 0 && (
                <Badge variant="secondary" className="ml-0.5 text-[10px] h-4 px-1">{reviews.length}</Badge>
              )}
            </TabsTrigger>
            {vendor && (
              <TabsTrigger value="vendor" className="gap-1.5 rounded-lg data-[state=active]:shadow-sm">
                <BadgeCheck className="h-4 w-4" />
                Satıcı Bilgileri
              </TabsTrigger>
            )}
          </TabsList>

          {/* Specs tab */}
          <TabsContent value="specs">
            <div className="max-w-2xl space-y-4">
              {/* Feature highlights grid */}
              {(product.material || product.warranty || product.specifications) && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-2">
                  {product.warranty && (
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-green-50 border border-green-200">
                      <ShieldCheck className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-green-700 font-medium uppercase">Garanti</p>
                        <p className="text-xs font-bold text-green-800">{product.warranty}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50 border border-blue-200">
                    <Truck className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-blue-700 font-medium uppercase">Kargo</p>
                      <p className="text-xs font-bold text-blue-800">Ücretsiz</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-purple-50 border border-purple-200">
                    <RotateCcw className="h-5 w-5 text-purple-600 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-purple-700 font-medium uppercase">İade</p>
                      <p className="text-xs font-bold text-purple-800">14 Gün</p>
                    </div>
                  </div>
                </div>
              )}
              <SpecTable product={product} />
            </div>
          </TabsContent>

          {/* Reviews tab */}
          <TabsContent value="reviews">
            <div className="max-w-3xl">
              {/* Rating summary card */}
              {product.reviewCount > 0 && (
                <div className="flex items-center gap-6 p-5 rounded-2xl bg-secondary/40 border border-border/60 mb-6">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <span className="text-5xl font-black text-foreground">{product.rating}</span>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn("h-4 w-4", i < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted")} />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">{product.reviewCount} değerlendirme</span>
                  </div>
                  <Separator orientation="vertical" className="h-20" />
                  <div className="flex-1 space-y-1.5 min-w-0">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const pct = star >= Math.round(product.rating) ? (star === 5 ? 70 : star === 4 ? 20 : 5) : 3
                      return (
                        <div key={star} className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground w-3 text-right">{star}</span>
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400 flex-shrink-0" />
                          <div className="flex-1 h-2 bg-border/60 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-muted-foreground w-6">{pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              <ReviewsSection
                reviews={reviews}
                averageRating={product.rating}
                totalReviews={product.reviewCount}
              />
            </div>
          </TabsContent>

          {/* Vendor tab */}
          {vendor && (
            <TabsContent value="vendor">
              <div className="max-w-2xl">
                <VendorProfileCard vendor={vendor} />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}

// ── Vendor profile card ────────────────────────────────────────────────────────
function VendorProfileCard({ vendor }: { vendor: NonNullable<ProductDetailProps["vendor"]> }) {
  const coverSrc = vendor.coverImage?.trim()
  const logoSrc  = vendor.logo?.trim()
  return (
    <div className="rounded-2xl border overflow-hidden">
      <div className="relative h-36 w-full">
        {coverSrc
          ? <Image src={coverSrc} alt={vendor.name} fill className="object-cover" />
          : <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5" />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
      </div>
      <div className="px-6 pb-6">
        <div className="flex items-end gap-4 -mt-12 relative z-10 mb-5">
          <div className="relative h-20 w-20 rounded-2xl overflow-hidden border-4 border-background bg-secondary flex-shrink-0 shadow-xl">
            {logoSrc
              ? <Image src={logoSrc} alt={vendor.name} fill className="object-cover" />
              : <div className="absolute inset-0 flex items-center justify-center text-2xl font-black text-muted-foreground">{vendor.name.slice(0, 1)}</div>
            }
          </div>
          <div className="pb-1">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-xl">{vendor.name}</h3>
              {vendor.verified && <BadgeCheck className="h-5 w-5 text-primary" />}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {vendor.location}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Puan", value: <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{vendor.rating}</span> },
            { label: "Yorum",  value: `${(vendor as Vendor & { reviewCount?: number }).reviewCount ?? 0}` },
            { label: "Ürün",   value: `${(vendor as Vendor & { productCount?: number }).productCount ?? 0}` },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center p-3 rounded-xl bg-secondary/50 text-center">
              <div className="font-bold text-sm">{value}</div>
              <span className="text-xs text-muted-foreground mt-0.5">{label}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-5">{vendor.description}</p>
        <Button asChild className="w-full gap-2 rounded-xl h-11 font-bold">
          <Link href={`/vendor/${vendor.slug}`}>
            <ExternalLink className="h-4 w-4" />
            Tüm Mağazayı Gör
          </Link>
        </Button>
      </div>
    </div>
  )
}
