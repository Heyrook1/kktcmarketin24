"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  Search, X, SlidersHorizontal, AlertCircle,
  RefreshCw, ChevronDown, Tag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis,
} from "@/components/ui/pagination"
import { ProductGrid } from "@/components/product/product-grid"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { Product } from "@/lib/data/products"

// ── Types ─────────────────────────────────────────────────────────────────────

interface SearchResponse {
  products: Product[]
  total: number
  page: number
  totalPages: number
  pageSize: number
  error?: string
}

type SortOption = "newest" | "price_asc" | "price_desc" | "popular"

const SORT_LABELS: Record<SortOption, string> = {
  newest:     "En Yeni",
  price_asc:  "Fiyat: Düşükten Yükseğe",
  price_desc: "Fiyat: Yüksekten Düşüğe",
  popular:    "En Popüler",
}

const POPULAR_SEARCHES = [
  "Kulaklık", "Elbise", "Parfüm", "Spor Ayakkabı", "Tablet", "Samsung",
]

// ── Skeleton (exported for Suspense fallback in page.tsx) ─────────────────────

export function SearchSkeleton() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <Skeleton className="mb-2 h-8 w-52" />
      <Skeleton className="mb-8 h-5 w-36" />
      <Skeleton className="mb-8 h-12 w-full max-w-2xl rounded-xl" />
      <div className="mb-6 flex items-center gap-3">
        <Skeleton className="h-9 w-28 rounded-lg" />
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-5 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Card-level skeleton row ───────────────────────────────────────────────────

function ResultsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-5 w-1/3" />
        </div>
      ))}
    </div>
  )
}

// ── Main client component ─────────────────────────────────────────────────────

export function SearchPageClient() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const inputRef     = useRef<HTMLInputElement>(null)
  const abortRef     = useRef<AbortController | null>(null)
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── URL-driven state ───────────────────────────────────────────────────────
  const urlQ        = searchParams.get("q") ?? ""
  const urlCategory = searchParams.get("category") ?? ""
  const urlSort     = (searchParams.get("sort") as SortOption) ?? "newest"
  const urlPage     = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))

  const [inputValue, setInputValue] = useState(urlQ)
  const [results,    setResults]    = useState<SearchResponse | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  // Sync input when URL changes (browser back/forward)
  useEffect(() => { setInputValue(urlQ) }, [urlQ])

  // ── URL builder ────────────────────────────────────────────────────────────
  const buildUrl = useCallback(
    (overrides: Record<string, string | number | null>) => {
      const params = new URLSearchParams()
      const merged = { q: urlQ, category: urlCategory, sort: urlSort, page: urlPage, ...overrides }
      if (merged.q)        params.set("q",        String(merged.q))
      if (merged.category) params.set("category", String(merged.category))
      if (merged.sort && merged.sort !== "newest") params.set("sort", String(merged.sort))
      if (merged.page && Number(merged.page) > 1)  params.set("page", String(merged.page))
      return `/search?${params.toString()}`
    },
    [urlQ, urlCategory, urlSort, urlPage]
  )

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchResults = useCallback(async (params: URLSearchParams) => {
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/search?${params.toString()}`, {
        signal: abortRef.current.signal,
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: SearchResponse = await res.json()
      if (data.error) throw new Error(data.error)
      setResults(data)

      // Index search event for analytics (fire-and-forget)
      if (params.get("q") && (params.get("q")?.length ?? 0) >= 2) {
        fetch("/api/search/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query:        params.get("q")!.trim(),
            category:     params.get("category") ?? null,
            result_count: data.total,
            source:       "search_page",
            page:         Number(params.get("page") ?? 1),
          }),
        }).catch(() => {/* non-critical */})
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message ?? "Arama sırasında bir hata oluştu.")
        setResults(null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Trigger fetch whenever URL search params change
  useEffect(() => {
    const params = new URLSearchParams()
    if (urlQ)        params.set("q",        urlQ)
    if (urlCategory) params.set("category", urlCategory)
    if (urlSort !== "newest") params.set("sort", urlSort)
    if (urlPage > 1) params.set("page",     String(urlPage))

    // Don't fetch on empty query unless there's a category filter
    if (!urlQ && !urlCategory) {
      setResults(null)
      setLoading(false)
      return
    }

    fetchResults(params)
    return () => { abortRef.current?.abort() }
  }, [urlQ, urlCategory, urlSort, urlPage, fetchResults])

  // ── Debounced input → URL update ───────────────────────────────────────────
  function handleInputChange(value: string) {
    setInputValue(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      router.push(buildUrl({ q: value.trim(), page: 1 }), { scroll: false })
    }, 300)
  }

  function handleClear() {
    setInputValue("")
    setResults(null)
    router.push("/search", { scroll: false })
    inputRef.current?.focus()
  }

  function handleSort(value: string) {
    router.push(buildUrl({ sort: value, page: 1 }), { scroll: false })
  }

  function handlePage(p: number) {
    router.push(buildUrl({ page: p }), { scroll: false })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function handlePopularSearch(term: string) {
    setInputValue(term)
    router.push(buildUrl({ q: term, page: 1 }), { scroll: false })
  }

  const hasQuery  = urlQ.length > 0 || urlCategory.length > 0
  const showEmpty = !loading && !error && results !== null && results.products.length === 0

  // ── Pagination helper ──────────────────────────────────────────────────────
  function buildPageItems(current: number, total: number) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    const pages: (number | "…")[] = [1]
    if (current > 3)        pages.push("…")
    for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p)
    if (current < total - 2) pages.push("…")
    pages.push(total)
    return pages
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="container mx-auto max-w-7xl px-4 py-8">

      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">
          {urlQ ? `"${urlQ}" için sonuçlar` : "Ürün Ara"}
        </h1>
        {results && !loading && (
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{results.total.toLocaleString("tr-TR")}</span>
            {" "}ürün bulundu
            {urlCategory && (
              <> — <span className="font-medium text-foreground capitalize">{urlCategory}</span> kategorisinde</>
            )}
          </p>
        )}
      </div>

      {/* Search bar */}
      <div className="mb-6 max-w-2xl">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Ürün, marka veya kategori ara… (TR / EN / CY)"
              className="h-12 rounded-xl pl-10 pr-10 text-sm"
              aria-label="Ürün arama"
              autoFocus={!urlQ}
            />
            {inputValue && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Aramayı temizle"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar: active filters + sort */}
      {hasQuery && (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {urlCategory && (
            <Badge
              variant="secondary"
              className="gap-1.5 pr-1.5 capitalize"
            >
              <Tag className="h-3 w-3" />
              {urlCategory}
              <button
                onClick={() => router.push(buildUrl({ category: null, page: 1 }), { scroll: false })}
                className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10"
                aria-label="Kategori filtresini kaldır"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          <div className="ml-auto">
            <Select value={urlSort} onValueChange={handleSort}>
              <SelectTrigger className="h-9 w-52 rounded-lg text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                  <SelectItem key={key} value={key} className="text-sm">
                    {SORT_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <Separator className="mb-6" />

      {/* ── States ── */}

      {/* 1. No query yet — show popular searches */}
      {!hasQuery && (
        <div className="py-20 text-center">
          <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground/20" />
          <p className="text-base font-medium text-muted-foreground">
            Aramak istediğiniz ürünü yazın
          </p>
          <p className="mt-1 text-sm text-muted-foreground/60">
            TR, EN veya Ελληνικά dilinde arama yapabilirsiniz
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {POPULAR_SEARCHES.map((term) => (
              <button
                key={term}
                onClick={() => handlePopularSearch(term)}
                className="rounded-full border bg-secondary px-4 py-1.5 text-sm font-medium transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. Loading skeleton */}
      {loading && <ResultsSkeleton />}

      {/* 3. Error state */}
      {!loading && error && (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-7 w-7 text-destructive" />
          </div>
          <div>
            <p className="font-medium">Bir hata oluştu</p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              const params = new URLSearchParams()
              if (urlQ) params.set("q", urlQ)
              fetchResults(params)
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Tekrar Dene
          </Button>
        </div>
      )}

      {/* 4. Empty state */}
      {showEmpty && (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <SlidersHorizontal className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">Sonuç bulunamadı</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {urlQ && <>&ldquo;{urlQ}&rdquo; için eşleşen ürün yok. </>}
              Farklı bir kelime veya kategori deneyin.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleClear}>
            Aramayı Temizle
          </Button>
        </div>
      )}

      {/* 5. Results grid */}
      {!loading && !error && results && results.products.length > 0 && (
        <>
          <ProductGrid products={results.products} columns={4} />

          {/* Pagination */}
          {results.totalPages > 1 && (
            <div className="mt-10">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => { e.preventDefault(); if (urlPage > 1) handlePage(urlPage - 1) }}
                      className={cn(urlPage <= 1 && "pointer-events-none opacity-40")}
                    />
                  </PaginationItem>

                  {buildPageItems(urlPage, results.totalPages).map((item, i) =>
                    item === "…" ? (
                      <PaginationItem key={`ellipsis-${i}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={item}>
                        <PaginationLink
                          href="#"
                          isActive={item === urlPage}
                          onClick={(e) => { e.preventDefault(); handlePage(item as number) }}
                        >
                          {item}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => { e.preventDefault(); if (urlPage < results.totalPages) handlePage(urlPage + 1) }}
                      className={cn(urlPage >= results.totalPages && "pointer-events-none opacity-40")}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>

              <p className="mt-3 text-center text-xs text-muted-foreground">
                Sayfa {urlPage} / {results.totalPages}
                {" · "}{results.total.toLocaleString("tr-TR")} ürün
              </p>
            </div>
          )}
        </>
      )}
    </main>
  )
}
