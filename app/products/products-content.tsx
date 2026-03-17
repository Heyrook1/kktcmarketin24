"use client"

import { useState, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { SlidersHorizontal, X, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { ProductGrid } from "@/components/product/product-grid"
import type { Product } from "@/lib/data/products"
import type { Category } from "@/lib/data/categories"
import type { Vendor } from "@/lib/data/vendors"

type SortOption = "newest" | "popular" | "price-low" | "price-high" | "rating"

export interface ProductsContentProps {
  // All data passed from the RSC shell — never imported client-side.
  initialProducts: Product[]
  initialCategories: Category[]
  initialVendors: Vendor[]
}

// ── Skeleton loader ──────────────────────────────────────────────────────────
export function ProductsContentSkeleton() {
  return (
    <div className="flex gap-8">
      {/* Sidebar skeleton */}
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

      {/* Grid skeleton */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-24 lg:hidden" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-44" />
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

// ── Inner component (uses useSearchParams — must be inside Suspense) ─────────
function ProductsInner({
  initialProducts,
  initialCategories,
  initialVendors,
}: ProductsContentProps) {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get("category") || ""
  const initialFeatured = searchParams.get("featured") === "true"

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategory ? [initialCategory] : []
  )
  const [selectedVendors, setSelectedVendors] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(initialFeatured)
  const [filterOpen, setFilterOpen] = useState(false)

  const filteredProducts = useMemo(() => {
    let result = [...initialProducts]

    if (selectedCategories.length > 0) {
      result = result.filter((p) => selectedCategories.includes(p.categoryId))
    }
    if (selectedVendors.length > 0) {
      result = result.filter((p) => selectedVendors.includes(p.vendorId))
    }
    if (showFeaturedOnly) {
      result = result.filter((p) => p.featured)
    }

    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case "popular":
        result.sort((a, b) => b.reviewCount - a.reviewCount)
        break
      case "price-low":
        result.sort((a, b) => a.price - b.price)
        break
      case "price-high":
        result.sort((a, b) => b.price - a.price)
        break
      case "rating":
        result.sort((a, b) => b.rating - a.rating)
        break
    }

    return result
  }, [initialProducts, selectedCategories, selectedVendors, sortBy, showFeaturedOnly])

  const toggleCategory = (categoryId: string) =>
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    )

  const toggleVendor = (vendorId: string) =>
    setSelectedVendors((prev) =>
      prev.includes(vendorId) ? prev.filter((id) => id !== vendorId) : [...prev, vendorId]
    )

  const clearFilters = () => {
    setSelectedCategories([])
    setSelectedVendors([])
    setShowFeaturedOnly(false)
  }

  const activeFilterCount =
    selectedCategories.length + selectedVendors.length + (showFeaturedOnly ? 1 : 0)

  // Defined outside JSX to avoid re-mounting on every render
  const filterContent = (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Checkbox
          id="featured"
          checked={showFeaturedOnly}
          onCheckedChange={(checked) => setShowFeaturedOnly(checked === true)}
        />
        <Label htmlFor="featured" className="cursor-pointer">
          Sadece öne çıkan ürünler
        </Label>
      </div>

      <Separator />

      <div>
        <h3 className="font-medium mb-3">Kategoriler</h3>
        <div className="flex flex-col gap-2">
          {initialCategories.map((category) => (
            <div key={category.id} className="flex items-center gap-2">
              <Checkbox
                id={`cat-${category.id}`}
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={() => toggleCategory(category.id)}
              />
              <Label htmlFor={`cat-${category.id}`} className="cursor-pointer text-sm">
                {category.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-medium mb-3">Satıcılar</h3>
        <div className="flex flex-col gap-2">
          {initialVendors.map((vendor) => (
            <div key={vendor.id} className="flex items-center gap-2">
              <Checkbox
                id={`vendor-${vendor.id}`}
                checked={selectedVendors.includes(vendor.id)}
                onCheckedChange={() => toggleVendor(vendor.id)}
              />
              <Label htmlFor={`vendor-${vendor.id}`} className="cursor-pointer text-sm">
                {vendor.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <>
          <Separator />
          <Button variant="outline" onClick={clearFilters}>
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
          <h2 className="font-semibold mb-4">Filtreler</h2>
          {filterContent}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="outline" size="sm">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filtreler
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Filtreler</SheetTitle>
                </SheetHeader>
                <div className="mt-6">{filterContent}</div>
              </SheetContent>
            </Sheet>

            <span className="text-sm text-muted-foreground">
              {filteredProducts.length} ürün
            </span>
          </div>

          {activeFilterCount > 0 && (
            <div className="hidden sm:flex flex-wrap gap-2">
              {selectedCategories.map((catId) => {
                const category = initialCategories.find((c) => c.id === catId)
                return (
                  <Badge key={catId} variant="secondary" className="gap-1">
                    {category?.name}
                    <button aria-label={`${category?.name} filtresini kaldır`} onClick={() => toggleCategory(catId)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )
              })}
              {selectedVendors.map((vendorId) => {
                const vendor = initialVendors.find((v) => v.id === vendorId)
                return (
                  <Badge key={vendorId} variant="secondary" className="gap-1">
                    {vendor?.name}
                    <button aria-label={`${vendor?.name} filtresini kaldır`} onClick={() => toggleVendor(vendorId)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )
              })}
              {showFeaturedOnly && (
                <Badge variant="secondary" className="gap-1">
                  Öne Çıkanlar
                  <button aria-label="Öne çıkanlar filtresini kaldır" onClick={() => setShowFeaturedOnly(false)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-[180px]">
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

        <ProductGrid products={filteredProducts} />
      </div>
    </div>
  )
}

// ── Public export: wraps inner in Suspense so useSearchParams doesn't throw ──
export function ProductsContent(props: ProductsContentProps) {
  return (
    <Suspense fallback={<ProductsContentSkeleton />}>
      <ProductsInner {...props} />
    </Suspense>
  )
}
