"use client"

import { useState, useMemo, useRef, useCallback } from "react"
import { ChevronUp, Tv2 } from "lucide-react"
import { Product } from "@/lib/data/products"
import { Category } from "@/lib/data/categories"
import { CategoryGrid } from "./category-grid"
import { InlineFilterPanel, FilterState } from "./inline-filter-panel"
import { CategoryBrowsePanel } from "./category-browse-panel"

interface HomeBrowseProps {
  initialProducts: Product[]
  categories: Category[]
  children?: React.ReactNode
}

const DEFAULT_FILTERS: FilterState = {
  priceRange: [0, 0],
  brands: [],
  inStock: false,
  gender: [],
  size: [],
  sort: "newest",
}

export function HomeBrowse({ initialProducts, categories, children }: HomeBrowseProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)

  const vitrinRef   = useRef<HTMLDivElement>(null)
  const productsRef = useRef<HTMLDivElement>(null)

  const scrollToVitrin = useCallback(() => {
    vitrinRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  const scrollToProducts = useCallback(() => {
    setTimeout(() => {
      productsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 80)
  }, [])

  const handleSelectCategory = useCallback((id: string | null) => {
    if (id === null && selectedCategory === null) {
      scrollToVitrin()
      return
    }
    setSelectedCategory(id)
    scrollToProducts()
  }, [selectedCategory, scrollToVitrin, scrollToProducts])

  const handleFilterClick = useCallback(() => {
    setIsFilterOpen((v) => {
      if (!v) scrollToProducts()
      return !v
    })
  }, [scrollToProducts])

  const filteredProducts = useMemo(() => {
    const result = initialProducts.filter((product) => {
      if (selectedCategory && product.categoryId !== selectedCategory) return false
      if (filters.inStock && !product.inStock) return false
      if (filters.priceRange[0] > 0 && product.price < filters.priceRange[0]) return false
      if (filters.priceRange[1] > 0 && product.price > filters.priceRange[1]) return false
      if (filters.gender.length > 0) {
        const ok = filters.gender.some(
          (g) => product.tags?.includes(g) || product.name.includes(g)
        )
        if (!ok) return false
      }
      if (filters.size.length > 0) {
        if (!filters.size.some((s) => product.tags?.includes(s))) return false
      }
      return true
    })

    switch (filters.sort) {
      case "price_asc":  result.sort((a, b) => a.price - b.price); break
      case "price_desc": result.sort((a, b) => b.price - a.price); break
      case "popular":    result.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0)); break
      default:           result.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
    }

    return result
  }, [initialProducts, selectedCategory, filters])

  const selectedCategoryObj = categories.find((c) => c.id === selectedCategory)

  const sectionTitle = selectedCategoryObj
    ? selectedCategoryObj.name
    : "Tüm Ürünler"

  return (
    <section className="flex flex-col bg-muted/10 pb-12">
      {/* Sticky category + filter strip */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b shadow-sm">
        <CategoryGrid
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          onFilterClick={handleFilterClick}
          isFilterOpen={isFilterOpen}
        />
      </div>

      {/* Vitrin (hero banners) */}
      <div ref={vitrinRef}>{children}</div>

      {/* Products section — always visible */}
      <div ref={productsRef} className="container mx-auto px-4 pt-8 scroll-mt-32">
        {isFilterOpen && (
          <InlineFilterPanel
            filters={filters}
            setFilters={setFilters}
            onClose={() => setIsFilterOpen(false)}
          />
        )}

        {/* Section header with back-to-vitrin button */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">{sectionTitle}</h2>
          <button
            type="button"
            onClick={scrollToVitrin}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors group"
          >
            <Tv2 className="h-3.5 w-3.5 group-hover:text-primary" />
            Vitrine Dön
            <ChevronUp className="h-3.5 w-3.5 group-hover:text-primary" />
          </button>
        </div>

        <CategoryBrowsePanel
          products={filteredProducts}
          title={sectionTitle}
          hideTitle
        />
      </div>
    </section>
  )
}
