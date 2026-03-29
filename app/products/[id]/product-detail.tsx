"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Star, Minus, Plus, ShoppingCart, Check, ChevronRight,
  Package, Ruler, Palette, ShieldCheck, Truck, RotateCcw,
  AlertTriangle, BadgeCheck, MapPin, ExternalLink, MessageSquare,
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

export function ProductDetail({ product, vendor, category }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [liveStock, setLiveStock] = useState(product.stockCount)
  const { addItem, openCart } = useCartStore()
  const reviews = getProductReviews(product.id)

  // Simulate live stock ticking down occasionally
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.97 && liveStock > 0) {
        setLiveStock((prev) => Math.max(0, prev - 1))
      }
    }, 15000)
    return () => clearInterval(interval)
  }, [liveStock])

  // Derive available stock from selected size if product has sizes
  const activeStock = (() => {
    if (product.sizes && selectedSize) {
      const s = product.sizes.find((s) => s.size === selectedSize)
      return s?.stock ?? liveStock
    }
    if (product.colors && selectedColor) {
      const c = product.colors.find((c) => c.name === selectedColor)
      return c?.stock ?? liveStock
    }
    return liveStock
  })()

  const stockStatus = (() => {
    if (activeStock === 0) return { label: "Tükendi", color: "text-red-500", bg: "bg-red-50 border-red-200", dot: "bg-red-500" }
    if (activeStock <= 3) return { label: `Son ${activeStock} adet!`, color: "text-red-500", bg: "bg-red-50 border-red-200", dot: "bg-red-500 animate-pulse" }
    if (activeStock <= 10) return { label: `${activeStock} adet kaldı`, color: "text-amber-600", bg: "bg-amber-50 border-amber-200", dot: "bg-amber-500 animate-pulse" }
    return { label: "Stokta var", color: "text-green-600", bg: "bg-green-50 border-green-200", dot: "bg-green-500" }
  })()

  const hasDiscount = product.originalPrice && product.originalPrice > product.price
  const discountPercent = hasDiscount ? Math.round((1 - product.price / product.originalPrice!) * 100) : 0

  const handleAddToCart = () => {
    addItem(product, quantity)
    openCart()
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 flex-wrap">
        <Link href="/" className="hover:text-foreground transition-colors">Ana Sayfa</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/urunler" className="hover:text-foreground transition-colors">Ürünler</Link>
        {category && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href={`/category/${category.slug}`} className="hover:text-foreground transition-colors">{category.name}</Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-14">
        {/* ── Left: Image gallery ── */}
        <div className="flex flex-col gap-3">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-secondary">
            <Image
              src={product.images[selectedImage]}
              alt={product.name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {hasDiscount && (
              <Badge className="absolute top-4 left-4 bg-red-500 text-white font-bold text-sm">
                -%{discountPercent}
              </Badge>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={cn(
                    "relative h-18 w-18 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all",
                    selectedImage === i ? "border-primary shadow-md" : "border-transparent hover:border-border"
                  )}
                  style={{ height: 72, width: 72 }}
                >
                  <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            {[
              { icon: Truck, label: "Hızlı Teslimat" },
              { icon: ShieldCheck, label: "Güvenli Ödeme" },
              { icon: RotateCcw, label: "Kolay İade" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary/50 text-center">
                <Icon className="h-5 w-5 text-primary" />
                <span className="text-xs text-muted-foreground font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Product info ── */}
        <div className="flex flex-col gap-0">
          {/* Vendor */}
          <VendorBadge vendorId={product.vendorId} size="md" />

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold mt-3 text-balance leading-tight">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={cn("h-4 w-4", i < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted")} />
              ))}
            </div>
            <span className="text-sm font-medium">{product.rating}</span>
            <span className="text-sm text-muted-foreground">({product.reviewCount} değerlendirme)</span>
            {reviews.length > 0 && (
              <a href="#reviews" className="text-xs text-primary hover:underline ml-1">Yorumları gör</a>
            )}
          </div>

          {/* Social proof — viewers, variant urgency, sold today, purchase toast */}
          <ProductDetailSocialProof
            productId={product.id}
            selectedVariant={selectedColor ?? selectedSize ?? null}
            inStock={activeStock > 0}
          />

          {/* Price */}
          <div className="mt-4">
            <PriceDisplay price={product.price} originalPrice={product.originalPrice} size="lg" />
          </div>

          {/* Description */}
          <p className="mt-4 text-muted-foreground leading-relaxed text-sm">{product.description}</p>

          <Separator className="my-5" />

          {/* Live stock indicator */}
          <div className={cn("flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-medium", stockStatus.bg)}>
            <span className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0", stockStatus.dot)} />
            <Package className={cn("h-4 w-4", stockStatus.color)} />
            <span className={stockStatus.color}>{stockStatus.label}</span>
          </div>

          {/* Size selector */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center gap-2 mb-2">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Beden Seçin</span>
                {selectedSize && <span className="text-sm text-muted-foreground ml-auto">Seçili: {selectedSize}</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => {
                  const unavailable = !s.available || s.stock === 0
                  const lowStock = s.stock > 0 && s.stock <= 3
                  return (
                    <button
                      key={s.size}
                      onClick={() => setSelectedSize(s.size)}
                      disabled={unavailable}
                      className={cn(
                        "relative px-3.5 py-2 rounded-lg border text-sm font-medium transition-all",
                        selectedSize === s.size
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : unavailable
                          ? "border-border/50 text-muted-foreground/40 line-through cursor-not-allowed bg-secondary/30"
                          : "border-border hover:border-primary/60 hover:bg-secondary"
                      )}
                    >
                      {s.size}
                      {lowStock && !unavailable && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-amber-500 text-white text-[8px] font-bold">{s.stock}</span>
                      )}
                    </button>
                  )
                })}
              </div>
              {selectedSize && (() => {
                const s = product.sizes!.find((s) => s.size === selectedSize)
                return s && s.stock <= 5 && s.stock > 0 ? (
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> Bu bedende son {s.stock} adet kaldı!
                  </p>
                ) : null
              })()}
            </div>
          )}

          {/* Color selector */}
          {product.colors && product.colors.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center gap-2 mb-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Renk Seçin</span>
                {selectedColor && <span className="text-sm text-muted-foreground ml-auto">{selectedColor}</span>}
              </div>
              <div className="flex flex-wrap gap-2.5">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedColor(c.name)}
                    title={`${c.name} (${c.stock} adet)`}
                    className={cn(
                      "relative h-9 w-9 rounded-full border-2 transition-all shadow-sm",
                      selectedColor === c.name ? "border-primary scale-110 shadow-md" : "border-background hover:scale-105"
                    )}
                    style={{ backgroundColor: c.hex, boxShadow: selectedColor === c.name ? `0 0 0 2px var(--color-primary)` : undefined }}
                  >
                    {selectedColor === c.name && (
                      <Check className={cn("absolute inset-0 m-auto h-4 w-4", c.hex === "#ffffff" || c.hex.toLowerCase() === "#fff" ? "text-foreground" : "text-white")} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & Add to cart */}
          {liveStock > 0 ? (
            <div className="flex flex-col gap-3 mt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center border rounded-xl overflow-hidden">
                  <Button variant="ghost" size="icon" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1} className="rounded-none h-11 w-11">
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-semibold text-sm">{quantity}</span>
                  <Button variant="ghost" size="icon" onClick={() => setQuantity((q) => Math.min(activeStock, q + 1))} disabled={quantity >= activeStock} className="rounded-none h-11 w-11">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button size="lg" className="flex-1 gap-2 h-11 rounded-xl font-semibold" onClick={handleAddToCart}>
                  <ShoppingCart className="h-5 w-5" />
                  Sepete Ekle
                </Button>
              </div>
              {/* Urgency signals */}
              <div className="flex flex-col gap-1.5">
                {activeStock > 0 && activeStock <= 5 && (
                  <p className="text-xs font-semibold text-red-600 flex items-center gap-1.5">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                    Son {activeStock} adet kaldı — kaçırmayın!
                  </p>
                )}
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                  <span>
                    <span className="font-semibold text-foreground">Bugün sipariş ver,</span> yarın kargoda!
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-6 flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-200">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <span className="text-red-600 font-medium text-sm">Bu ürün şu an stokta bulunmuyor.</span>
            </div>
          )}

          {/* Share + category */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-5">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Paylaş:</span>
              <ShareButtons url={`/products/${product.id}`} title={product.name} description={product.description} />
            </div>
            {category && (
              <Link href={`/category/${category.slug}`}>
                <Badge variant="secondary">{category.name}</Badge>
              </Link>
            )}
          </div>

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {product.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs: Specifications, Reviews, Vendor ── */}
      <div className="mt-14" id="reviews">
        <Tabs defaultValue="reviews">
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="reviews" className="gap-1.5">
              <Star className="h-4 w-4" />
              Değerlendirmeler ({reviews.length})
            </TabsTrigger>
            {(product.specifications || product.material || product.warranty) && (
              <TabsTrigger value="specs" className="gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                Özellikler
              </TabsTrigger>
            )}
            {vendor && (
              <TabsTrigger value="vendor" className="gap-1.5">
                <BadgeCheck className="h-4 w-4" />
                Satıcı
              </TabsTrigger>
            )}
          </TabsList>

          {/* Reviews tab */}
          <TabsContent value="reviews" className="max-w-3xl">
            <ReviewsSection
              reviews={reviews}
              averageRating={product.rating}
              totalReviews={product.reviewCount}
            />
          </TabsContent>

          {/* Specs tab */}
          <TabsContent value="specs" className="max-w-2xl">
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {product.material && (
                    <tr className="border-b">
                      <td className="px-4 py-3 font-medium bg-secondary/30 w-40">Malzeme</td>
                      <td className="px-4 py-3 text-muted-foreground">{product.material}</td>
                    </tr>
                  )}
                  {product.weight && (
                    <tr className="border-b">
                      <td className="px-4 py-3 font-medium bg-secondary/30">Ağırlık</td>
                      <td className="px-4 py-3 text-muted-foreground">{product.weight}</td>
                    </tr>
                  )}
                  {product.warranty && (
                    <tr className="border-b">
                      <td className="px-4 py-3 font-medium bg-secondary/30">Garanti</td>
                      <td className="px-4 py-3 text-muted-foreground">{product.warranty}</td>
                    </tr>
                  )}
                  {product.specifications && Object.entries(product.specifications).map(([key, val]) => (
                    <tr key={key} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium bg-secondary/30">{key}</td>
                      <td className="px-4 py-3 text-muted-foreground">{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Vendor tab */}
          {vendor && (
            <TabsContent value="vendor" className="max-w-2xl">
              <VendorProfileCard vendor={vendor} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}

// ── Inline vendor profile card ──────────────────────────────────────────────
function VendorProfileCard({ vendor }: { vendor: NonNullable<ProductDetailProps["vendor"]> }) {
  return (
    <div className="rounded-2xl border overflow-hidden">
      {/* Cover */}
      <div className="relative h-32 w-full">
        <Image src={vendor.coverImage} alt={vendor.name} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      <div className="px-6 pb-6">
        {/* Logo + name */}
        <div className="flex items-end gap-4 -mt-10 relative z-10 mb-4">
          <div className="relative h-20 w-20 rounded-2xl overflow-hidden border-4 border-background bg-secondary flex-shrink-0 shadow-lg">
            <Image src={vendor.logo} alt={vendor.name} fill className="object-cover" />
          </div>
          <div className="pb-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xl">{vendor.name}</h3>
              {vendor.verified && <BadgeCheck className="h-5 w-5 text-primary" />}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {vendor.location}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="flex flex-col items-center p-3 rounded-xl bg-secondary/50 text-center">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-bold">{vendor.rating}</span>
            </div>
            <span className="text-xs text-muted-foreground mt-0.5">{vendor.reviewCount} yorum</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl bg-secondary/50 text-center">
            <span className="font-bold">{vendor.productCount}</span>
            <span className="text-xs text-muted-foreground mt-0.5">Ürün</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl bg-secondary/50 text-center">
            <span className="font-bold text-sm">{vendor.joinedDate.slice(0, 7)}</span>
            <span className="text-xs text-muted-foreground mt-0.5">Katılım</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{vendor.description}</p>

        <Button asChild className="w-full gap-2 rounded-xl">
          <Link href={`/vendor/${vendor.slug}`}>
            <ExternalLink className="h-4 w-4" />
            Tüm Mağazayı Gör
          </Link>
        </Button>
      </div>
    </div>
  )
}
