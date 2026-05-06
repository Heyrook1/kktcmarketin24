"use client"

import {
  useState, useMemo, useCallback, useEffect, useRef, Suspense,
} from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  SlidersHorizontal, X, Search, ChevronDown, ChevronRight,
  AlertCircle, RefreshCw, Tag, Sparkles, Package, Percent,
  LayoutGrid, List, Star, Heart, Check, ShoppingCart,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { ProductGrid } from "@/components/product/product-grid"
import { EnhancedProductCard } from "@/components/product/enhanced-product-card"
import { PriceDisplay } from "@/components/shared/price-display"
import { useCartStore } from "@/lib/store/cart-store"
import { useWishlistStore } from "@/lib/store/wishlist-store"
import { cn } from "@/lib/utils"
import { parseSearchIntent, getSearchSuggestions, type SearchSuggestion } from "@/lib/smart-search"
import { getTagMeta, BRAND_TAGS, TR_COLOR_HEX } from "@/lib/tag-taxonomy"
import type { Product } from "@/lib/data/products"
import type { Category } from "@/lib/data/categories"
import type { Vendor } from "@/lib/data/vendors"

type SortOption = "newest" | "popular" | "price-low" | "price-high" | "rating"

export interface ProductsContentProps {
  initialProducts: Product[]
  initialCategories: Category[]
  initialVendors: Vendor[]
}

const PRICE_PRESETS = [
  { label: "0–500 ₺",    min: 0,    max: 500   },
  { label: "500–1.5K ₺", min: 500,  max: 1500  },
  { label: "1.5K–3K ₺",  min: 1500, max: 3000  },
  { label: "3K+ ₺",      min: 3000, max: null  },
] as const

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest",     label: "En Yeni"       },
  { value: "popular",    label: "Popüler"        },
  { value: "price-low",  label: "Ucuz → Pahalı" },
  { value: "price-high", label: "Pahalı → Ucuz" },
  { value: "rating",     label: "En İyi Puan"   },
]

const TAG_COLOR_CLASSES: Record<string, string> = {
  blue:   "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
  purple: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
  green:  "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  orange: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
  gray:   "bg-secondary text-muted-foreground border-border hover:bg-secondary/80",
}

const PAGE_SIZE = 24

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function ProductsContentSkeleton() {
  return (
    <div className="flex gap-8">
      <aside className="hidden lg:flex flex-col gap-3 w-[260px] flex-shrink-0">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-px w-full" />
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </aside>
      <div className="flex-1 min-w-0">
        <Skeleton className="h-12 w-full rounded-xl mb-4" />
        <div className="flex gap-2 mb-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-24 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="aspect-square w-full rounded-2xl" />
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-5 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ProductsContentError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <div>
        <h2 className="font-semibold text-lg">Ürünler yüklenemedi</h2>
        <p className="text-sm text-muted-foreground max-w-xs mt-1">
          Bir sorun oluştu. İnternet bağlantınızı kontrol edip tekrar deneyin.
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Tekrar Dene
        </Button>
      )}
    </div>
  )
}

// ── Autocomplete ──────────────────────────────────────────────────────────────
function AutocompleteDropdown({
  query, onSelect, visible,
}: {
  query: string
  onSelect: (s: SearchSuggestion) => void
  visible: boolean
}) {
  const suggestions = useMemo(() => getSearchSuggestions(query), [query])
  if (!visible || !query || suggestions.length === 0) return null
  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-xl shadow-xl overflow-hidden">
      {suggestions.map((s, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(s)}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary transition-colors text-left"
        >
          {s.type === "query"       && <Search   className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />}
          {s.type === "category"    && <Sparkles  className="h-3.5 w-3.5 flex-shrink-0 text-blue-500" />}
          {s.type === "brand"       && <Tag       className="h-3.5 w-3.5 flex-shrink-0 text-purple-500" />}
          {s.type === "subcategory" && <Tag       className="h-3.5 w-3.5 flex-shrink-0 text-primary" />}
          <span className="flex-1 truncate">{s.label}</span>
          {s.type !== "query" && (
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
              {s.type === "category" ? "Kategori" : s.type === "brand" ? "Marka" : "Alt kategori"}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ── Intent breadcrumb ─────────────────────────────────────────────────────────
function IntentBreadcrumb({
  category, subcategory, brand,
  onRemoveCategory, onRemoveSubcategory, onRemoveBrand,
}: {
  category?: string; subcategory?: string; brand?: string
  onRemoveCategory: () => void; onRemoveSubcategory: () => void; onRemoveBrand: () => void
}) {
  if (!category && !subcategory && !brand) return null
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {category && (() => {
        const meta = getTagMeta(category)
        return (
          <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium", TAG_COLOR_CLASSES[meta.color])}>
            {meta.label}
            <button onClick={onRemoveCategory} aria-label={`${meta.label} filtresini kaldır`}><X className="h-3 w-3" /></button>
          </span>
        )
      })()}
      {subcategory && (() => {
        const meta = getTagMeta(subcategory)
        return (
          <>
            <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
            <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium", TAG_COLOR_CLASSES[meta.color])}>
              {meta.label}
              <button onClick={onRemoveSubcategory} aria-label={`${meta.label} filtresini kaldır`}><X className="h-3 w-3" /></button>
            </span>
          </>
        )
      })()}
      {brand && (() => {
        const meta = getTagMeta(brand)
        return (
          <>
            <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
            <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium", TAG_COLOR_CLASSES.purple)}>
              {meta.label}
              <button onClick={onRemoveBrand} aria-label={`${meta.label} filtresini kaldır`}><X className="h-3 w-3" /></button>
            </span>
          </>
        )
      })()}
    </div>
  )
}

// ── Collapsible sidebar section ───────────────────────────────────────────────
function SidebarSection({
  title, defaultOpen = true, children,
}: {
  title: string; defaultOpen?: boolean; children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="py-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-2 text-sm font-semibold hover:text-primary transition-colors"
      >
        {title}
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && <div className="pb-2">{children}</div>}
    </div>
  )
}

// ── List-view row card ────────────────────────────────────────────────────────
function ProductListRow({ product }: { product: Product }) {
  const { addItem, openCart } = useCartStore()
  const { toggleItem, isInWishlist } = useWishlistStore()
  const [isMounted, setIsMounted]   = useState(false)
  const [isAdded, setIsAdded]       = useState(false)

  useEffect(() => { setIsMounted(true) }, [])

  const isFavorite  = isMounted ? isInWishlist(product.id) : false
  const hasDiscount = !!(product.originalPrice && product.originalPrice > product.price)
  const discountPct = hasDiscount ? Math.round((1 - product.price / product.originalPrice!) * 100) : 0

  const productColors: Array<{ name: string; hex: string }> = (() => {
    const seen = new Set<string>()
    const out: Array<{ name: string; hex: string }> = []
    for (const c of (product as Product & { colors?: Array<{ name: string; hex: string }> }).colors ?? []) {
      if (!seen.has(c.name)) { seen.add(c.name); out.push({ name: c.name, hex: c.hex }) }
    }
    for (const tag of product.tags ?? []) {
      if (tag.startsWith("color:")) {
        const name = tag.slice(6)
        if (!seen.has(name)) { seen.add(name); out.push({ name, hex: TR_COLOR_HEX[name] ?? "#9ca3af" }) }
      }
    }
    return out
  })()

  const productSizes = (() => {
    const seen = new Set<string>()
    const out: string[] = []
    for (const s of (product as Product & { sizes?: Array<{ size: string }> }).sizes ?? []) {
      if (!seen.has(s.size)) { seen.add(s.size); out.push(s.size) }
    }
    for (const tag of product.tags ?? []) {
      if (tag.startsWith("size:")) {
        const sz = tag.slice(5).toUpperCase()
        if (!seen.has(sz)) { seen.add(sz); out.push(sz) }
      }
    }
    return out
  })()

  const keySpecs: Array<[string, string]> = (() => {
    const rows: Array<[string, string]> = []
    if ((product as Product & { material?: string }).material) rows.push(["Malzeme", (product as Product & { material?: string }).material!])
    if ((product as Product & { warranty?: string }).warranty) rows.push(["Garanti", (product as Product & { warranty?: string }).warranty!])
    for (const [k, v] of Object.entries((product as Product & { specifications?: Record<string, string> }).specifications ?? {})) {
      if (rows.length >= 3) break
      rows.push([k, v])
    }
    return rows.slice(0, 3)
  })()

  return (
    <div className="flex gap-4 rounded-2xl border bg-card p-3 hover:border-primary/30 hover:shadow-lg transition-all group">
      {/* Image */}
      <Link href={`/products/${product.id}`} className="relative h-36 w-36 flex-shrink-0 overflow-hidden rounded-xl bg-secondary/30 block">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="144px"
        />
        {hasDiscount && (
          <span className="absolute top-1.5 left-1.5 rounded-full bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 shadow">
            -%{discountPct}
          </span>
        )}
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href={`/products/${product.id}`}>
              <h3 className="font-semibold text-sm text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug">
                {product.name}
              </h3>
            </Link>
            {product.reviewCount > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className={cn("h-3 w-3", s <= Math.round(product.rating) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted")} />
                ))}
                <span className="text-[11px] text-muted-foreground">({product.reviewCount})</span>
              </div>
            )}
          </div>
          <button
            onClick={(e) => { e.preventDefault(); toggleItem(product) }}
            className={cn(
              "flex-shrink-0 h-7 w-7 flex items-center justify-center rounded-full border transition-all",
              isFavorite ? "bg-red-50 border-red-200 text-red-500" : "border-border text-muted-foreground hover:bg-red-50 hover:text-red-500 hover:border-red-200"
            )}
          >
            <Heart className={cn("h-3.5 w-3.5", isFavorite && "fill-red-500")} />
          </button>
        </div>

        {/* Description snippet */}
        {product.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{product.description}</p>
        )}

        {/* Specs */}
        {keySpecs.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-0.5">
            {keySpecs.map(([k, v]) => (
              <span key={k} className="text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground">{k}:</span> {v}
              </span>
            ))}
          </div>
        )}

        {/* Colors + Sizes */}
        <div className="flex items-center gap-3 flex-wrap">
          {productColors.length > 0 && (
            <div className="flex items-center gap-1">
              {productColors.slice(0, 6).map((c) => (
                <span
                  key={c.name}
                  title={c.name}
                  className={cn("h-4 w-4 rounded-full border flex-shrink-0", c.hex === "#ffffff" ? "border-border/60" : "border-transparent")}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
              {productColors.length > 6 && <span className="text-[10px] text-muted-foreground">+{productColors.length - 6}</span>}
            </div>
          )}
          {productSizes.length > 0 && (
            <div className="flex items-center gap-1">
              {productSizes.slice(0, 5).map((sz) => (
                <span key={sz} className="text-[10px] font-medium border border-border/60 rounded px-1 py-0.5 text-muted-foreground">{sz}</span>
              ))}
              {productSizes.length > 5 && <span className="text-[10px] text-muted-foreground">+{productSizes.length - 5}</span>}
            </div>
          )}
        </div>

        {/* Price + actions */}
        <div className="mt-auto flex items-center justify-between gap-3">
          <div>
            <PriceDisplay price={product.price} originalPrice={product.originalPrice} size="md" />
            {product.price >= 300 && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                12 x <span className="font-medium text-foreground">{(product.price / 12).toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺</span>
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 rounded-xl text-xs font-semibold border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              asChild
            >
              <Link href={`/products/${product.id}`}>İncele</Link>
            </Button>
            <Button
              size="sm"
              className={cn(
                "h-8 gap-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all",
                isAdded ? "bg-green-600 hover:bg-green-700" : "bg-primary hover:bg-primary/90"
              )}
              onClick={(e) => {
                e.preventDefault()
                if (!product.inStock) return
                addItem(product); openCart()
                setIsAdded(true)
                setTimeout(() => setIsAdded(false), 1400)
              }}
              disabled={!product.inStock}
            >
              {isAdded ? <><Check className="h-3.5 w-3.5" />Eklendi</> : <><ShoppingCart className="h-3.5 w-3.5" />Sepete Ekle</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductListView({ products }: { products: Product[] }) {
  return (
    <div className="flex flex-col gap-3">
      {products.map((p) => <ProductListRow key={p.id} product={p} />)}
    </div>
  )
}

// ── Main inner component ──────────────────────────────────────────────────────
function ProductsInner({
  initialProducts, initialCategories, initialVendors,
}: ProductsContentProps) {
  const searchParams = useSearchParams()
  const router       = useRouter()

  const urlQ        = searchParams.get("q") || ""
  const urlCategory = searchParams.get("category") || ""
  const urlSort     = (searchParams.get("sort") as SortOption) || "newest"

  const [searchInput, setSearchInput]          = useState(urlQ)
  const [selectedCategories, setSelectedCats]  = useState<string[]>(urlCategory ? [urlCategory] : [])
  const [sortBy, setSortBy]                    = useState<SortOption>(urlSort)
  const [autocompleteVisible, setAutocomplete] = useState(false)
  const [filterOpen, setFilterOpen]            = useState(false)
  const [visibleCount, setVisibleCount]        = useState(PAGE_SIZE)

  const [selectedVendors, setSelectedVendors] = useState<string[]>([])
  const [showFeaturedOnly, setShowFeatured]   = useState(false)
  const [inStock, setInStock]                 = useState(false)
  const [onSale, setOnSale]                   = useState(false)
  const [priceMin, setPriceMin]               = useState("")
  const [priceMax, setPriceMax]               = useState("")
  const [vendorSearch, setVendorSearch]       = useState("")
  const [selectedBrands, setSelectedBrands]   = useState<string[]>([])
  const [selectedColors, setSelectedColors]   = useState<string[]>([])
  const [selectedSizes, setSelectedSizes]     = useState<string[]>([])
  const [selectedGenders, setSelectedGenders] = useState<string[]>([])
  const [viewMode, setViewMode]               = useState<"grid" | "list">("grid")

  // Reset pagination when any filter changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [searchInput, selectedCategories, selectedVendors, showFeaturedOnly, inStock, onSale, priceMin, priceMax, sortBy, selectedBrands, selectedColors, selectedSizes, selectedGenders])

  const intent = useMemo(
    () => (searchInput ? parseSearchIntent(searchInput) : null),
    [searchInput]
  )

  const activePricePreset = useMemo(() => {
    const min = Number(priceMin) || 0
    const max = Number(priceMax) || 0
    return PRICE_PRESETS.find(
      (p) => p.min === min && (p.max === null ? max === 0 : p.max === max)
    ) ?? null
  }, [priceMin, priceMax])

  // Debounced URL sync
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams()
      if (searchInput) params.set("q", searchInput)
      if (selectedCategories.length === 1) params.set("category", selectedCategories[0])
      if (sortBy !== "newest") params.set("sort", sortBy)
      router.replace(
        `/urunler${params.toString() ? `?${params.toString()}` : ""}`,
        { scroll: false }
      )
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchInput, selectedCategories, sortBy, router])

  useEffect(() => {
    setSearchInput(urlQ)
    setSelectedCats(urlCategory ? [urlCategory] : [])
    setSortBy(urlSort)
  }, [urlQ, urlCategory, urlSort])

  // ── Derived filter options ───────────────────────────────────────────────────
  const availableBrands = useMemo(() => {
    const brands = new Map<string, number>()
    for (const p of initialProducts) {
      for (const tag of p.tags ?? []) {
        const lower = tag.toLowerCase()
        if (lower.startsWith("brand:")) {
          const b = lower.slice(6); brands.set(b, (brands.get(b) ?? 0) + 1)
        } else if (BRAND_TAGS[lower]) {
          brands.set(lower, (brands.get(lower) ?? 0) + 1)
        }
      }
    }
    return [...brands.entries()].sort((a, b) => b[1] - a[1])
  }, [initialProducts])

  const availableColors = useMemo(() => {
    const colors = new Map<string, { count: number; hex: string }>()
    for (const p of initialProducts) {
      for (const c of (p as Product & { colors?: Array<{ name: string; hex: string }> }).colors ?? []) {
        const key = c.name.toLowerCase()
        const prev = colors.get(key) ?? { count: 0, hex: c.hex }
        colors.set(key, { count: prev.count + 1, hex: prev.hex || c.hex })
      }
      for (const tag of p.tags ?? []) {
        const lower = tag.toLowerCase()
        if (lower.startsWith("color:")) {
          const name = lower.slice(6)
          const hex = TR_COLOR_HEX[name] ?? "#9ca3af"
          const prev = colors.get(name) ?? { count: 0, hex }
          colors.set(name, { count: prev.count + 1, hex: prev.hex || hex })
        }
      }
    }
    return [...colors.entries()].map(([name, d]) => ({ name, count: d.count, hex: d.hex })).sort((a, b) => b.count - a.count)
  }, [initialProducts])

  const availableSizes = useMemo(() => {
    const SIZE_ORDER = ["XS","S","M","L","XL","2XL","3XL","36","37","38","39","40","41","42","43","44","45","46"]
    const sizes = new Map<string, number>()
    for (const p of initialProducts) {
      for (const s of (p as Product & { sizes?: Array<{ size: string }> }).sizes ?? []) {
        const sz = s.size.toUpperCase()
        sizes.set(sz, (sizes.get(sz) ?? 0) + 1)
      }
      for (const tag of p.tags ?? []) {
        const lower = tag.toLowerCase()
        if (lower.startsWith("size:")) {
          const sz = lower.slice(5).toUpperCase()
          sizes.set(sz, (sizes.get(sz) ?? 0) + 1)
        }
      }
    }
    return [...sizes.entries()]
      .map(([size, count]) => ({ size, count }))
      .sort((a, b) => {
        const ai = SIZE_ORDER.indexOf(a.size); const bi = SIZE_ORDER.indexOf(b.size)
        if (ai !== -1 && bi !== -1) return ai - bi
        if (ai !== -1) return -1; if (bi !== -1) return 1
        return a.size.localeCompare(b.size)
      })
  }, [initialProducts])

  const availableGenders = useMemo(() => {
    const GENDER_LABELS: Record<string, string> = { kadin: "Kadın", erkek: "Erkek", unisex: "Unisex", cocuk: "Çocuk" }
    const genders = new Map<string, number>()
    for (const p of initialProducts) {
      for (const tag of p.tags ?? []) {
        const lower = tag.toLowerCase()
        if (lower.startsWith("gender:")) {
          const g = lower.slice(7)
          if (GENDER_LABELS[g]) genders.set(g, (genders.get(g) ?? 0) + 1)
        }
      }
    }
    return [...genders.entries()].map(([key, count]) => ({ key, label: GENDER_LABELS[key], count })).sort((a, b) => b.count - a.count)
  }, [initialProducts])

  // ── Filter logic ────────────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    let result = [...initialProducts]

    const activeCat = selectedCategories[0] || intent?.categorySlug || ""
    if (activeCat) result = result.filter((p) => (p.categoryId ?? "") === activeCat)
    if (selectedVendors.length > 0) result = result.filter((p) => selectedVendors.includes(p.vendorId))
    if (showFeaturedOnly) result = result.filter((p) => p.featured)
    if (inStock)          result = result.filter((p) => p.inStock)
    if (onSale)           result = result.filter((p) => !!p.originalPrice && p.originalPrice > p.price)

    const minP = Number(priceMin) || 0
    const maxP = Number(priceMax) || 0
    if (minP > 0) result = result.filter((p) => p.price >= minP)
    if (maxP > 0) result = result.filter((p) => p.price <= maxP)

    if (selectedBrands.length > 0) {
      result = result.filter((p) => {
        const tags = (p.tags ?? []).map((t: string) => t.toLowerCase())
        return selectedBrands.some((b) => tags.includes(`brand:${b}`) || tags.includes(b))
      })
    }

    if (selectedColors.length > 0) {
      result = result.filter((p) => {
        const tags = (p.tags ?? []).map((t: string) => t.toLowerCase())
        const pColors = (p as Product & { colors?: Array<{ name: string }> }).colors?.map((c) => c.name.toLowerCase()) ?? []
        return selectedColors.some((col) =>
          tags.includes(`color:${col}`) ||
          pColors.some((pc) => pc === col || pc.includes(col) || col.includes(pc))
        )
      })
    }

    if (selectedSizes.length > 0) {
      result = result.filter((p) => {
        const tags = (p.tags ?? []).map((t: string) => t.toLowerCase())
        const pSizes = (p as Product & { sizes?: Array<{ size: string }> }).sizes?.map((s) => s.size.toUpperCase()) ?? []
        return selectedSizes.some((sz) =>
          tags.includes(`size:${sz.toLowerCase()}`) || pSizes.includes(sz.toUpperCase())
        )
      })
    }

    if (selectedGenders.length > 0) {
      result = result.filter((p) => {
        const tags = (p.tags ?? []).map((t: string) => t.toLowerCase())
        return selectedGenders.some((g) => tags.includes(`gender:${g}`))
      })
    }

    if (intent?.subcategory || intent?.brand) {
      result = result.filter((p) => {
        const tags = (p.tags ?? []).map((t: string) => t.toLowerCase())
        if (intent?.subcategory && !tags.includes(intent.subcategory)) return false
        if (intent?.brand       && !tags.includes(intent.brand))       return false
        return true
      })
    }

    if (searchInput && !intent?.subcategory && !intent?.brand) {
      const tokens = searchInput.toLowerCase().trim().split(/\s+/).filter(Boolean)
      result = result.filter((p) => {
        const haystack = [
          p.name, p.description, ...(p.tags ?? []),
          (p as Product & { searchAliases?: string }).searchAliases ?? "",
          p.categoryId ?? "",
          (p as Product & { vendorName?: string }).vendorName ?? "",
        ].join(" ").toLowerCase()
        return tokens.every((tok) => haystack.includes(tok))
      })
    }

    switch (sortBy) {
      case "popular":    result.sort((a, b) => b.reviewCount - a.reviewCount); break
      case "price-low":  result.sort((a, b) => a.price - b.price);             break
      case "price-high": result.sort((a, b) => b.price - a.price);             break
      case "rating":     result.sort((a, b) => b.rating - a.rating);           break
      default:           result.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }

    return result
  }, [initialProducts, selectedCategories, selectedVendors, showFeaturedOnly, inStock, onSale, priceMin, priceMax, sortBy, searchInput, intent, selectedBrands, selectedColors, selectedSizes, selectedGenders])

  // ── Analytics ────────────────────────────────────────────────────────────────
  const analyticsTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (analyticsTimer.current) clearTimeout(analyticsTimer.current)
    if (searchInput.trim().length < 2) return
    analyticsTimer.current = setTimeout(() => {
      const parsedIntent = parseSearchIntent(searchInput)
      fetch("/api/search/analytics", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query:        searchInput.trim(),
          category:     parsedIntent.category ?? selectedCategories[0] ?? null,
          subcategory:  parsedIntent.subcategory ?? null,
          brand:        parsedIntent.brand ?? null,
          result_count: filteredProducts.length,
          source:       "products_page",
        }),
      }).catch(() => {})
    }, 800)
    return () => { if (analyticsTimer.current) clearTimeout(analyticsTimer.current) }
  }, [searchInput, selectedCategories, filteredProducts.length])

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const toggleCategory = useCallback((catId: string) => {
    setSelectedCats((prev) => prev.includes(catId) ? [] : [catId])
  }, [])

  const toggleVendor = useCallback((id: string) => {
    setSelectedVendors((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    )
  }, [])

  const toggleBrand = useCallback((b: string) => setSelectedBrands((p) => p.includes(b) ? p.filter((x) => x !== b) : [...p, b]), [])
  const toggleColor = useCallback((c: string) => setSelectedColors((p) => p.includes(c) ? p.filter((x) => x !== c) : [...p, c]), [])
  const toggleSize  = useCallback((s: string) => setSelectedSizes((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]), [])
  const toggleGender = useCallback((g: string) => setSelectedGenders((p) => p.includes(g) ? p.filter((x) => x !== g) : [...p, g]), [])

  const clearFilters = useCallback(() => {
    setSearchInput(""); setSelectedCats([]);   setSelectedVendors([])
    setShowFeatured(false); setInStock(false); setOnSale(false)
    setPriceMin(""); setPriceMax(""); setSortBy("newest")
    setSelectedBrands([]); setSelectedColors([]); setSelectedSizes([]); setSelectedGenders([])
  }, [])

  const applyPricePreset = useCallback((min: number, max: number | null) => {
    setPriceMin(String(min === 0 ? "" : min))
    setPriceMax(max === null ? "" : String(max))
  }, [])

  const handleSuggestionSelect = useCallback((s: SearchSuggestion) => {
    setAutocomplete(false)
    router.push(s.href)
  }, [router])

  const activeFilterCount =
    selectedCategories.length + selectedVendors.length +
    (showFeaturedOnly ? 1 : 0) + (inStock ? 1 : 0) + (onSale ? 1 : 0) +
    ((priceMin || priceMax) ? 1 : 0) +
    selectedBrands.length + selectedColors.length + selectedSizes.length + selectedGenders.length

  const filteredVendors = useMemo(() => {
    if (!vendorSearch.trim()) return initialVendors
    const lower = vendorSearch.toLowerCase()
    return initialVendors.filter((v) => v.name.toLowerCase().includes(lower))
  }, [initialVendors, vendorSearch])

  const vendorCounts = useMemo(() => {
    const base = initialProducts.filter((p) => {
      const activeCat = selectedCategories[0] || intent?.categorySlug || ""
      if (activeCat && (p.categoryId ?? "") !== activeCat) return false
      if (inStock && !p.inStock) return false
      if (onSale && !(!!p.originalPrice && p.originalPrice > p.price)) return false
      const minP = Number(priceMin) || 0
      const maxP = Number(priceMax) || 0
      if (minP > 0 && p.price < minP) return false
      if (maxP > 0 && p.price > maxP) return false
      return true
    })
    const counts: Record<string, number> = {}
    for (const p of base) counts[p.vendorId] = (counts[p.vendorId] ?? 0) + 1
    return counts
  }, [initialProducts, selectedCategories, inStock, onSale, priceMin, priceMax, intent])

  const visibleProducts = filteredProducts.slice(0, visibleCount)
  const hasMore         = visibleCount < filteredProducts.length

  // ── Filter panel (shared between sidebar + mobile sheet) ──────────────────
  const filterPanel = (
    <div className="divide-y divide-border/50">

      {/* Quick toggles */}
      <SidebarSection title="Hızlı Filtreler">
        <div className="space-y-1 pt-0.5">
          {([
            { active: inStock,          onToggle: () => setInStock((v) => !v),       icon: Package,  label: "Stokta Var" },
            { active: onSale,           onToggle: () => setOnSale((v) => !v),        icon: Percent,  label: "İndirimde"  },
            { active: showFeaturedOnly, onToggle: () => setShowFeatured((v) => !v),  icon: Sparkles, label: "Öne Çıkan"  },
          ] as const).map(({ active, onToggle, icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              onClick={onToggle}
              aria-pressed={active}
              className={cn(
                "flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm border transition-all",
                active
                  ? "bg-primary/10 border-primary/30 text-primary font-medium"
                  : "border-transparent hover:bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
            </button>
          ))}
        </div>
      </SidebarSection>

      {/* Category */}
      <SidebarSection title="Kategori">
        <div className="space-y-0.5 pt-0.5">
          {initialCategories.map((cat) => {
            const isActive = selectedCategories.includes(cat.id)
            const count    = initialProducts.filter((p) => p.categoryId === cat.id).length
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={cn(
                  "flex items-center justify-between w-full px-3 py-2 rounded-xl text-sm transition-all",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors",
                    isActive ? "bg-primary" : "bg-muted-foreground/30"
                  )} />
                  <span className="truncate">{cat.name}</span>
                </span>
                <span className={cn(
                  "text-[11px] tabular-nums flex-shrink-0 px-1.5 py-0.5 rounded-md",
                  isActive ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                )}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </SidebarSection>

      {/* Price */}
      <SidebarSection title="Fiyat Aralığı">
        <div className="space-y-3 pt-0.5">
          <div className="grid grid-cols-2 gap-1.5">
            {PRICE_PRESETS.map((preset) => {
              const isActive = activePricePreset?.label === preset.label
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() =>
                    isActive
                      ? (setPriceMin(""), setPriceMax(""))
                      : applyPricePreset(preset.min, preset.max)
                  }
                  className={cn(
                    "rounded-xl px-2 py-2 text-xs font-medium border transition-all text-center",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-secondary/50 text-muted-foreground border-transparent hover:border-border hover:text-foreground"
                  )}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">₺</span>
              <Input
                type="number"
                placeholder="Min"
                aria-label="Minimum fiyat"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                className="pl-6 h-8 text-xs"
              />
            </div>
            <span className="text-muted-foreground">–</span>
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">₺</span>
              <Input
                type="number"
                placeholder="Max"
                aria-label="Maksimum fiyat"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="pl-6 h-8 text-xs"
              />
            </div>
          </div>
        </div>
      </SidebarSection>

      {/* Vendors */}
      {initialVendors.length > 0 && (
        <SidebarSection title="Satıcı">
          <div className="space-y-2 pt-0.5">
            {initialVendors.length > 5 && (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                <Input
                  type="search"
                  placeholder="Satıcı ara..."
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  className="pl-7 h-8 text-xs"
                />
              </div>
            )}
            <div className="space-y-0.5 max-h-52 overflow-y-auto">
              {filteredVendors.map((vendor) => {
                const count   = vendorCounts[vendor.id] ?? 0
                const checked = selectedVendors.includes(vendor.id)
                return (
                  <label
                    key={vendor.id}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-xl px-3 py-2 cursor-pointer transition-colors",
                      checked
                        ? "bg-primary/5 text-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Checkbox
                        id={`vendor-${vendor.id}`}
                        checked={checked}
                        onCheckedChange={() => toggleVendor(vendor.id)}
                        className="flex-shrink-0 h-3.5 w-3.5"
                      />
                      <span className="text-xs truncate">{vendor.name}</span>
                    </div>
                    <span className={cn(
                      "text-[10px] tabular-nums flex-shrink-0 px-1.5 py-0.5 rounded-md",
                      checked ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                    )}>
                      {count}
                    </span>
                  </label>
                )
              })}
              {filteredVendors.length === 0 && (
                <p className="text-xs text-muted-foreground px-3 py-2">Satıcı bulunamadı</p>
              )}
            </div>
          </div>
        </SidebarSection>
      )}

      {/* Brand */}
      {availableBrands.length > 0 && (
        <SidebarSection title="Marka" defaultOpen={false}>
          <div className="space-y-0.5 pt-0.5 max-h-48 overflow-y-auto">
            {availableBrands.map(([brand, count]) => {
              const label = BRAND_TAGS[brand] ?? brand.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
              const checked = selectedBrands.includes(brand)
              return (
                <label
                  key={brand}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-xl px-3 py-2 cursor-pointer transition-colors",
                    checked ? "bg-primary/5 text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleBrand(brand)}
                      className="flex-shrink-0 h-3.5 w-3.5"
                    />
                    <span className="text-xs truncate">{label}</span>
                  </div>
                  <span className={cn(
                    "text-[10px] tabular-nums flex-shrink-0 px-1.5 py-0.5 rounded-md",
                    checked ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                  )}>
                    {count}
                  </span>
                </label>
              )
            })}
          </div>
        </SidebarSection>
      )}

      {/* Color */}
      {availableColors.length > 0 && (
        <SidebarSection title="Renk" defaultOpen={false}>
          <div className="flex flex-wrap gap-2.5 pt-1.5 pb-1">
            {availableColors.map(({ name, hex }) => {
              const isSelected = selectedColors.includes(name)
              const displayHex = hex || TR_COLOR_HEX[name] || "#9ca3af"
              const isLight = displayHex === "#ffffff" || displayHex === "#fef3c7" || displayHex === "#d4a574"
              return (
                <button
                  key={name}
                  type="button"
                  title={name.charAt(0).toUpperCase() + name.slice(1)}
                  onClick={() => toggleColor(name)}
                  className={cn(
                    "relative h-8 w-8 rounded-full border-2 transition-all hover:scale-110",
                    isSelected ? "border-primary ring-2 ring-primary/40 scale-110" : isLight ? "border-border hover:border-muted-foreground" : "border-transparent hover:border-muted-foreground/40"
                  )}
                  style={{ backgroundColor: displayHex }}
                  aria-pressed={isSelected}
                  aria-label={name}
                >
                  {isSelected && (
                    <span className={cn("absolute inset-0 flex items-center justify-center rounded-full text-[10px]", displayHex === "#ffffff" || isLight ? "text-foreground" : "text-white")}>
                      ✓
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </SidebarSection>
      )}

      {/* Size */}
      {availableSizes.length > 0 && (
        <SidebarSection title="Beden" defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5 pt-1.5 pb-1">
            {availableSizes.map(({ size }) => {
              const isSelected = selectedSizes.includes(size)
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  aria-pressed={isSelected}
                  className={cn(
                    "h-8 min-w-[2.25rem] rounded-lg px-2.5 text-xs font-medium border transition-all",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground hover:bg-secondary"
                  )}
                >
                  {size}
                </button>
              )
            })}
          </div>
        </SidebarSection>
      )}

      {/* Gender */}
      {availableGenders.length > 0 && (
        <SidebarSection title="Cinsiyet" defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5 pt-1.5 pb-1">
            {availableGenders.map(({ key, label }) => {
              const isSelected = selectedGenders.includes(key)
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleGender(key)}
                  aria-pressed={isSelected}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-medium border transition-all",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </SidebarSection>
      )}
    </div>
  )

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder='Ürün, marka veya kategori ara...'
          value={searchInput}
          onChange={(e) => { setSearchInput(e.target.value); setAutocomplete(true) }}
          onFocus={() => setAutocomplete(true)}
          onBlur={() => setTimeout(() => setAutocomplete(false), 200)}
          className="pl-10 h-12 text-sm rounded-xl bg-card shadow-sm focus:shadow-md transition-shadow"
          aria-label="Ürün arama"
          aria-autocomplete="list"
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => { setSearchInput(""); setAutocomplete(false) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
            aria-label="Aramayı temizle"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
        <AutocompleteDropdown
          query={searchInput}
          onSelect={handleSuggestionSelect}
          visible={autocompleteVisible}
        />
      </div>

      {/* Sort strip */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide mb-5 pb-0.5">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setSortBy(opt.value)}
            className={cn(
              "flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium border transition-all whitespace-nowrap",
              sortBy === opt.value
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Layout */}
      <div className="flex gap-8">

        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-[260px] flex-shrink-0">
          <div className="sticky top-24 rounded-2xl border bg-card/60 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-2 pb-2 border-b">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                Filtreler
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                    {activeFilterCount}
                  </Badge>
                )}
              </h2>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Temizle
                </button>
              )}
            </div>
            {filterPanel}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">

          {/* Toolbar row */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            {/* Mobile filter trigger */}
            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="outline" size="sm" className="gap-2 rounded-xl flex-shrink-0">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtrele
                  {activeFilterCount > 0 && (
                    <Badge variant="default" className="ml-0.5 h-4 w-4 p-0 text-[10px] flex items-center justify-center">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="overflow-y-auto w-[300px] p-4">
                <SheetHeader className="mb-4">
                  <SheetTitle className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filtreler
                  </SheetTitle>
                </SheetHeader>
                {filterPanel}
              </SheetContent>
            </Sheet>

            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{filteredProducts.length}</span> ürün
            </span>

            {/* View mode toggle */}
            <div className="ml-auto flex items-center gap-0.5 rounded-xl border bg-secondary/40 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="Izgara görünümü"
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg transition-all",
                  viewMode === "grid" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-label="Liste görünümü"
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg transition-all",
                  viewMode === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {selectedCategories.map((catId) => {
                const cat = initialCategories.find((c) => c.id === catId)
                return (
                  <Badge key={catId} variant="secondary" className="gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs">
                    {cat?.name}
                    <button aria-label={`${cat?.name} filtresini kaldır`} onClick={() => toggleCategory(catId)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )
              })}
              {inStock && (
                <Badge variant="secondary" className="gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs">
                  Stokta Var
                  <button aria-label="Stok filtresini kaldır" onClick={() => setInStock(false)}><X className="h-3 w-3" /></button>
                </Badge>
              )}
              {onSale && (
                <Badge variant="secondary" className="gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs">
                  İndirimde
                  <button aria-label="İndirim filtresini kaldır" onClick={() => setOnSale(false)}><X className="h-3 w-3" /></button>
                </Badge>
              )}
              {showFeaturedOnly && (
                <Badge variant="secondary" className="gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs">
                  Öne Çıkan
                  <button aria-label="Öne çıkan filtresini kaldır" onClick={() => setShowFeatured(false)}><X className="h-3 w-3" /></button>
                </Badge>
              )}
              {(priceMin || priceMax) && (
                <Badge variant="secondary" className="gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs">
                  {priceMin ? `₺${priceMin}` : "0"} – {priceMax ? `₺${priceMax}` : "∞"}
                  <button aria-label="Fiyat filtresini kaldır" onClick={() => { setPriceMin(""); setPriceMax("") }}><X className="h-3 w-3" /></button>
                </Badge>
              )}
              {selectedVendors.map((vendorId) => {
                const vendor = initialVendors.find((v) => v.id === vendorId)
                return (
                  <Badge key={vendorId} variant="secondary" className="gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs">
                    {vendor?.name}
                    <button aria-label={`${vendor?.name} filtresini kaldır`} onClick={() => toggleVendor(vendorId)}><X className="h-3 w-3" /></button>
                  </Badge>
                )
              })}
              {selectedBrands.map((b) => (
                <Badge key={b} variant="secondary" className="gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs">
                  {BRAND_TAGS[b] ?? b.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  <button aria-label="Marka filtresini kaldır" onClick={() => toggleBrand(b)}><X className="h-3 w-3" /></button>
                </Badge>
              ))}
              {selectedColors.map((c) => {
                const hex = TR_COLOR_HEX[c] ?? "#9ca3af"
                return (
                  <Badge key={c} variant="secondary" className="gap-1.5 pl-1.5 pr-1.5 py-1 rounded-full text-xs">
                    <span className="h-3 w-3 rounded-full border border-border/50 inline-block flex-shrink-0" style={{ backgroundColor: hex }} />
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                    <button aria-label="Renk filtresini kaldır" onClick={() => toggleColor(c)}><X className="h-3 w-3" /></button>
                  </Badge>
                )
              })}
              {selectedSizes.map((s) => (
                <Badge key={s} variant="secondary" className="gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs">
                  Beden: {s}
                  <button aria-label="Beden filtresini kaldır" onClick={() => toggleSize(s)}><X className="h-3 w-3" /></button>
                </Badge>
              ))}
              {selectedGenders.map((g) => {
                const GENDER_LABELS: Record<string, string> = { kadin: "Kadın", erkek: "Erkek", unisex: "Unisex", cocuk: "Çocuk" }
                return (
                  <Badge key={g} variant="secondary" className="gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs">
                    {GENDER_LABELS[g] ?? g}
                    <button aria-label="Cinsiyet filtresini kaldır" onClick={() => toggleGender(g)}><X className="h-3 w-3" /></button>
                  </Badge>
                )
              })}
              {activeFilterCount > 1 && (
                <button
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  onClick={clearFilters}
                >
                  Tümünü temizle
                </button>
              )}
            </div>
          )}

          {/* Intent breadcrumb */}
          {intent && (intent.category || intent.subcategory || intent.brand) && (
            <div className="mb-4">
              <IntentBreadcrumb
                category={intent.category}
                subcategory={intent.subcategory}
                brand={intent.brand}
                onRemoveCategory={() => setSearchInput((prev) => prev.replace(new RegExp(intent.category || "", "ig"), "").trim())}
                onRemoveSubcategory={() => setSearchInput((prev) => prev.replace(new RegExp(intent.subcategory?.replace("-", " ") || "", "ig"), "").trim())}
                onRemoveBrand={() => setSearchInput((prev) => prev.replace(new RegExp(intent.brand || "", "ig"), "").trim())}
              />
            </div>
          )}

          {/* Product grid or empty state */}
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary">
                <Search className="h-9 w-9 text-muted-foreground" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Ürün bulunamadı</h2>
                <p className="text-sm text-muted-foreground max-w-xs mt-1">
                  Arama kriterlerinizi değiştirmeyi veya filtreleri temizlemeyi deneyin.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={clearFilters} className="gap-2 rounded-xl">
                <X className="h-3.5 w-3.5" />
                Filtreleri Temizle
              </Button>
            </div>
          ) : (
            <>
              {viewMode === "grid" ? (
                <ProductGrid products={visibleProducts} />
              ) : (
                <ProductListView products={visibleProducts} />
              )}

              {hasMore && (
                <div className="flex flex-col items-center gap-2 mt-10">
                  <p className="text-xs text-muted-foreground">
                    {visibleCount} / {filteredProducts.length} ürün gösteriliyor
                  </p>
                  <Button
                    variant="outline"
                    className="gap-2 rounded-xl px-8 border-dashed hover:border-solid hover:bg-secondary/60 transition-all"
                    onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                  >
                    Daha Fazla Göster
                    <Badge variant="secondary" className="text-[10px] ml-1">
                      +{Math.min(PAGE_SIZE, filteredProducts.length - visibleCount)}
                    </Badge>
                  </Button>
                </div>
              )}

              {!hasMore && filteredProducts.length > PAGE_SIZE && (
                <p className="text-center text-xs text-muted-foreground mt-8">
                  Tüm {filteredProducts.length} ürün gösteriliyor
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Public export ─────────────────────────────────────────────────────────────
export function ProductsContent(props: ProductsContentProps) {
  return (
    <Suspense fallback={<ProductsContentSkeleton />}>
      <ProductsInner {...props} />
    </Suspense>
  )
}
