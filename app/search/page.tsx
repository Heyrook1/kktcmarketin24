import type { Metadata } from "next"
import { Suspense } from "react"
import { SearchPageClient } from "./search-client"
import { SearchSkeleton } from "./search-client"

export const metadata: Metadata = {
  title: "Ürün Ara | Marketin24",
  description:
    "Marketin24'te binlerce ürün arasında arama yapın. Elektronik, moda, güzellik ve daha fazlası.",
  openGraph: {
    title: "Ürün Ara | Marketin24",
    description: "Onaylı satıcılardan ürün arayın.",
  },
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchPageClient />
    </Suspense>
  )
}


function matchesQuery(product: (typeof products)[number], q: string): boolean {
  const s = q.toLowerCase()
  return (
    (product.name?.toLowerCase() ?? "").includes(s) ||
    (product.description?.toLowerCase() ?? "").includes(s) ||
    (product.categoryId?.toLowerCase() ?? "").includes(s) ||
    (product.vendorId?.toLowerCase() ?? "").includes(s)
  )
}

function SearchResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get("q") ?? ""

  const [inputValue, setInputValue] = useState(initialQuery)
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync when URL param changes (e.g. browser back/forward)
  useEffect(() => {
    setInputValue(initialQuery)
    setSubmittedQuery(initialQuery)
  }, [initialQuery])

  const filteredProducts = submittedQuery
    ? products.filter((p) => matchesQuery(p, submittedQuery))
    : []

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = inputValue.trim()
    setSubmittedQuery(trimmed)
    if (trimmed) router.push(`/search?q=${encodeURIComponent(trimmed)}`, { scroll: false })
  }

  function handleClear() {
    setInputValue("")
    setSubmittedQuery("")
    router.push("/search", { scroll: false })
    inputRef.current?.focus()
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">Arama Sonuçları</h1>
        {submittedQuery && (
          <p className="mt-1.5 text-muted-foreground text-sm">
            <span className="font-medium text-foreground">&ldquo;{submittedQuery}&rdquo;</span>
            {" "}için{" "}
            <span className="font-medium text-foreground">{filteredProducts.length}</span>
            {" "}sonuç bulundu
          </p>
        )}
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="mb-8 max-w-2xl" role="search">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ürün, marka veya kategori ara..."
              className="h-11 rounded-xl pl-9 pr-9"
              aria-label="Arama"
              autoFocus={!initialQuery}
            />
            {inputValue && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Aramayı temizle"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button type="submit" size="default" className="h-11 rounded-xl px-5">
            Ara
          </Button>
        </div>
      </form>

      {/* Results */}
      {!submittedQuery ? (
        <div className="py-16 text-center">
          <Search className="mx-auto mb-4 h-10 w-10 text-muted-foreground/30" />
          <p className="text-base text-muted-foreground">Ürün aramak için anahtar kelime girin</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {["Kulaklık", "Elbise", "Parfüm", "Spor Ayakkabı", "Tablet"].map((s) => (
              <button
                key={s}
                onClick={() => { setInputValue(s); setSubmittedQuery(s); router.push(`/search?q=${encodeURIComponent(s)}`, { scroll: false }) }}
                className="rounded-full border bg-secondary px-3.5 py-1.5 text-sm hover:border-primary hover:text-primary transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-16 text-center">
          <SlidersHorizontal className="mx-auto mb-4 h-10 w-10 text-muted-foreground/30" />
          <p className="text-base font-medium">Sonuç bulunamadı</p>
          <p className="mt-1 text-sm text-muted-foreground">
            &ldquo;{submittedQuery}&rdquo; için eşleşen ürün yok. Farklı bir kelime deneyin.
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={handleClear}>
            Aramayı Temizle
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{filteredProducts.length} ürün</Badge>
          </div>
          <ProductGrid products={filteredProducts} />
        </>
      )}
    </div>
  )
}

function SearchSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Skeleton className="mb-2 h-8 w-48" />
      <Skeleton className="mb-6 h-4 w-36" />
      <Skeleton className="mb-8 h-11 max-w-2xl rounded-xl" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
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

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchResults />
    </Suspense>
  )
}

