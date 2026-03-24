"use client"

import {
  useState, useMemo, useCallback, useEffect, useRef,
  Suspense,
} from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  SlidersHorizontal, X, Search, ChevronDown,
  AlertCircle, RefreshCw, Tag, Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { ProductGrid } from "@/components/product/product-grid"
import { cn } from "@/lib/utils"
import { parseSearchIntent, getSearchSuggestions, type SearchSuggestion } from "@/lib/smart-search"
import { getTagMeta, TAG_TAXONOMY } from "@/lib/tag-taxonomy"
import type { Product } from "@/lib/data/products"
import type { Category } from "@/lib/data/categories"
import type { Vendor } from "@/lib/data/vendors"

type SortOption = "newest" | "popular" | "price-low" | "price-high" | "rating"

export interface ProductsContentProps {
  initialProducts: Product[]
  initialCategories: Category[]
  initialVendors: Vendor[]
}

// ── Colour map for tag chips ─────────────────────────────────────────────────
const TAG_COLOR_CLASSES: Record<string, string> = {
  blue:   "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
  purple: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
  green:  "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  orange: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
  gray:   "bg-secondary text-muted-foreground border-border hover:bg-secondary/80",
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
export function ProductsContentSkeleton() {
  return (
    <div className="flex gap-8">
      <aside className="hidden lg:flex flex-col gap-4 w-64 flex-shrink-0">
        <Skeleton className="h-5 w-20" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
        <Skeleton className="h-px w-full" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-3/4" />
        ))}
      </aside>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-9 w-full max-w-md" />
          <Skeleton className="h-9 w-44 ml-4" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="aspect-square w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-5 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Error state ──────────────────────────────────────────────────────────────
export function ProductsContentError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <div className="space-y-1">
        <h2 className="font-semibold text-lg">Ürünler yüklenemedi</h2>
        <p className="text-sm text-muted-foreground max-w-xs text-pretty">
          Bir sorun oluştu. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Tekrar Dene
        </Button>
      )}
    </div>
  )
}

// ── Autocomplete dropdown ────────────────────────────────────────────────────
function AutocompleteDropdown({
  query,
  onSelect,
  visible,
}: {
  query: string
  onSelect: (suggestion: SearchSuggestion) => void
  visible: boolean
}) {
  const suggestions = useMemo(() => getSearchSuggestions(query), [query])
  if (!visible || !query || suggestions.length === 0) return null

  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-xl shadow-lg overflow-hidden">
      {suggestions.map((s, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(s)}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary transition-colors text-left"
        >
          {s.type === "query"       && <Search className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />}
          {s.type === "category"    && <Sparkles className="h-3.5 w-3.5 flex-shrink-0 text-blue-500" />}
          {s.type === "brand"       && <Tag className="h-3.5 w-3.5 flex-shrink-0 text-purple-500" />}
          {s.type === "subcategory" && <Tag className="h-3.5 w-3.5 flex-shrink-0 text-primary" />}
          <span className="flex-1 truncate text-foreground">{s.label}</span>
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

// ── Intent breadcrumb chips ──────────────────────────────────────────────────
function IntentBreadcrumb({
  category,
  subcategory,
  brand,
  onRemoveCategory,
  onRemoveSubcategory,
  onRemoveBrand,
}: {
  category?: string
  subcategory?: string
  brand?: string
  onRemoveCategory: () => void
  onRemoveSubcategory: () => void
  onRemoveBrand: () => void
}) {
  if (!category && !subcategory && !brand) return null

  return (
    <div className="flex items-center gap-1.5 flex-wrap text-sm text-muted-foreground mb-2">
      {category && (() => {
        const meta = getTagMeta(category)
        return (
          <span className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium",
            TAG_COLOR_CLASSES[meta.color]
          )}>
            {meta.label}
            <button onClick={onRemoveCategory} aria-label={`${meta.label} filtresini kaldır`}>
              <X className="h-3 w-3" />
            </button>
          </span>
        )
      })()}
      {subcategory && (() => {
        const meta = getTagMeta(subcategory)
        return (
          <>
            <ChevronDown className="h-3 w-3 rotate-[-90deg] text-muted-foreground/40" />
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium",
              TAG_COLOR_CLASSES[meta.color]
            )}>
              {meta.label}
              <button onClick={onRemoveSubcategory} aria-label={`${meta.label} filtresini kaldır`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          </>
        )
      })()}
      {brand && (() => {
        const meta = getTagMeta(brand)
        return (
          <>
            <ChevronDown className="h-3 w-3 rotate-[-90deg] text-muted-foreground/40" />
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium",
              TAG_COLOR_CLASSES.purple
            )}>
              {meta.label}
              <button onClick={onRemoveBrand} aria-label={`${meta.label} filtresini kaldır`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          </>
        )
      })()}
    </div>
  )
}

// ── Inner component ──────────────────────────────────────────────────────────
function ProductsInner({
  initialProducts,
  initialCategories,
  initialVendors,
}: ProductsContentProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Read URL params
  const urlQ        = searchParams.get("q") || ""
  const urlCategory = searchParams.get("category") || ""
  const urlSort     = (searchParams.get("sort") as SortOption) || "newest"

  // Local state
  const [searchInput, setSearchInput]         = useState(urlQ)
  const [selectedCategories, setSelectedCats] = useState<string[]>(urlCategory ? [urlCategory] : [])
  const [selectedVendors, setSelectedVendors] = useState<string[]>([])
  const [sortBy, setSortBy]                   = useState<SortOption>(urlSort)
  const [showFeaturedOnly, setShowFeatured]   = useState(false)
  const [filterOpen, setFilterOpen]           = useState(false)
  const [autocompleteVisible, setAutocomplete]= useState(false)

  // Parsed intent from search input
  const intent = useMemo(
    () => (searchInput ? parseSearchIntent(searchInput) : null),
    [searchInput]
  )

  // Debounce URL sync
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams()
      if (searchInput) params.set("q", searchInput)
      if (selectedCategories.length === 1) params.set("category", selectedCategories[0])
      if (sortBy !== "newest") params.set("sort", sortBy)
      router.replace(`/products${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false })
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchInput, selectedCategories, sortBy, router])

  // Sync URL → state when navigating from navbar
  useEffect(() => {
    setSearchInput(urlQ)
    if (urlCategory) setSelectedCats([urlCategory])
    setSortBy(urlSort)
  }, [urlQ, urlCategory, urlSort])

  // ── Filter logic ────────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    let result = [...initialProducts]

    // Category filter (URL category OR intent category)
    const activeCatSlug = selectedCategories[0] || intent?.categorySlug
    if (activeCatSlug) {
      result = result.filter((p) => p.categoryId === activeCatSlug)
    }

    // Vendor filter
    if (selectedVendors.length > 0) {
      result = result.filter((p) => selectedVendors.includes(p.vendorId))
    }

    // Featured filter
    if (showFeaturedOnly) {
      result = result.filter((p) => p.featured)
    }

    // Smart tag filters from intent
    if (intent?.subcategory || intent?.brand || intent?.attributes.length) {
      result = result.filter((p) => {
        const tags = (p.tags ?? []).map(t => t.toLowerCase())
        if (intent.subcategory && !tags.includes(intent.subcategory)) return false
        if (intent.brand       && !tags.includes(intent.brand))       return false
        return true
      })
    }

    // Text search fallback (client-side) on name / description
    if (searchInput && !intent?.subcategory && !intent?.brand) {
      const lower = searchInput.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.description.toLowerCase().includes(lower)
      )
    }

    // Sort
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
  }, [initialProducts, selectedCategories, selectedVendors, showFeaturedOnly, sortBy, searchInput, intent])

  // ── Handlers ─────────────────────────────────────────────────────────────
  const toggleCategory = useCallback((catId: string) => {
    setSelectedCats((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [catId]
    )
  }, [])

  const toggleVendor = useCallback((id: string) => {
    setSelectedVendors((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    )
  }, [])

  const clearFilters = useCallback(() => {
    setSearchInput("")
    setSelectedCats([])
    setSelectedVendors([])
    setShowFeatured(false)
    setSortBy("newest")
  }, [])

  const handleSuggestionSelect = useCallback((s: SearchSuggestion) => {
    setAutocomplete(false)
    router.push(s.href)
  }, [router])

  const activeFilterCount =
    selectedCategories.length + selectedVendors.length + (showFeaturedOnly ? 1 : 0)

  // ── Filter panel content (shared desktop + mobile) ────────────────────
  const filterContent = (
    <div className="flex flex-col gap-5">
      {/* Featured */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="featured"
          checked={showFeaturedOnly}
          onCheckedChange={(c) => setShowFeatured(c === true)}
        />
        <Label htmlFor="featured" className="cursor-pointer text-sm">
          Öne çıkan ürünler
        </Label>
      </div>

      <Separator />

      {/* Categories */}
      <div>
        <h3 className="font-semibold text-sm mb-3">Kategoriler</h3>
        <div className="flex flex-col gap-2">
          {initialCategories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2">
              <Checkbox
                id={`cat-${cat.id}`}
                checked={selectedCategories.includes(cat.id)}
                onCheckedChange={() => toggleCategory(cat.id)}
              />
              <Label htmlFor={`cat-${cat.id}`} className="cursor-pointer text-sm leading-relaxed">
                {cat.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Vendors */}
      <div>
        <h3 className="font-semibold text-sm mb-3">Satıcılar</h3>
        <div className="flex flex-col gap-2">
          {initialVendors.map((vendor) => (
            <div key={vendor.id} className="flex items-center gap-2">
              <Checkbox
                id={`vendor-${vendor.id}`}
                checked={selectedVendors.includes(vendor.id)}
                onCheckedChange={() => toggleVendor(vendor.id)}
              />
              <Label htmlFor={`vendor-${vendor.id}`} className="cursor-pointer text-sm leading-relaxed">
                {vendor.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <>
          <Separator />
          <Button variant="outline" size="sm" onClick={clearFilters} className="gap-2">
            <X className="h-3.5 w-3.5" />
            Filtreleri Temizle
          </Button>
        </>
      )}
    </div>
  )

  return (
    <div className="flex gap-8">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-24">
          <h2 className="font-semibold mb-5">Filtreler</h2>
          {filterContent}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">

        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder='Ürün, marka veya kategori ara... (örn. "samsung telefon")'
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              setAutocomplete(true)
            }}
            onFocus={() => setAutocomplete(true)}
            onBlur={() => setTimeout(() => setAutocomplete(false), 200)}
            className="pl-9 pr-4 h-10 text-sm"
            aria-label="Ürün arama"
            aria-autocomplete="list"
          />
          <AutocompleteDropdown
            query={searchInput}
            onSelect={handleSuggestionSelect}
            visible={autocompleteVisible}
          />
        </div>

        {/* Intent breadcrumb */}
        {intent && (intent.category || intent.subcategory || intent.brand) && (
          <IntentBreadcrumb
            category={intent.category}
            subcategory={intent.subcategory}
            brand={intent.brand}
            onRemoveCategory={() => setSearchInput((prev) => prev.replace(new RegExp(intent.category || "", "ig"), "").trim())}
            onRemoveSubcategory={() => setSearchInput((prev) => prev.replace(new RegExp(intent.subcategory?.replace("-", " ") || "", "ig"), "").trim())}
            onRemoveBrand={() => setSearchInput((prev) => prev.replace(new RegExp(intent.brand || "", "ig"), "").trim())}
          />
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Mobile filter trigger */}
            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="outline" size="sm" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtreler
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-1">{activeFilterCount}</Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filtreler</SheetTitle>
                </SheetHeader>
                <div className="mt-6">{filterContent}</div>
              </SheetContent>
            </Sheet>

            <span className="text-sm text-muted-foreground">
              {filteredProducts.length} ürün
            </span>

            {/* Active filter chips */}
            {selectedCategories.map((catId) => {
              const cat = initialCategories.find((c) => c.id === catId)
              return (
                <Badge key={catId} variant="secondary" className="gap-1 text-xs">
                  {cat?.name}
                  <button aria-label={`${cat?.name} filtresini kaldır`} onClick={() => toggleCategory(catId)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )
            })}
            {selectedVendors.map((vendorId) => {
              const vendor = initialVendors.find((v) => v.id === vendorId)
              return (
                <Badge key={vendorId} variant="secondary" className="gap-1 text-xs">
                  {vendor?.name}
                  <button aria-label={`${vendor?.name} filtresini kaldır`} onClick={() => toggleVendor(vendorId)}>
                    <X className="h-3 w-3" />
                  </button>
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

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[200px] h-9 text-sm">
              <SelectValue placeholder="Sırala" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">En Yeniler</SelectItem>
              <SelectItem value="popular">En Popüler</SelectItem>
              <SelectItem value="price-low">Fiyat: Düşükten Yükseğe</SelectItem>
              <SelectItem value="price-high">Fiyat: Yüksekten Düşüğe</SelectItem>
              <SelectItem value="rating">En Yüksek Puan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h2 className="font-semibold text-lg">Ürün bulunamadı</h2>
              <p className="text-sm text-muted-foreground max-w-xs text-pretty">
                Arama kriterlerinizi değiştirmeyi veya filtreleri temizlemeyi deneyin.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={clearFilters} className="gap-2">
              <X className="h-3.5 w-3.5" />
              Filtreleri Temizle
            </Button>
          </div>
        ) : (
          <ProductGrid products={filteredProducts} />
        )}
      </div>
    </div>
  )
}

// ── Public export ────────────────────────────────────────────────────────────
export function ProductsContent(props: ProductsContentProps) {
  return (
    <Suspense fallback={<ProductsContentSkeleton />}>
      <ProductsInner {...props} />
    </Suspense>
  )
}
