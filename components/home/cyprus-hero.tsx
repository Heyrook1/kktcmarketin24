"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import {
  ArrowRight, Search, Truck, ShieldCheck,
  Tag, Zap, Package, ChevronRight, X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { products } from "@/lib/data/products"
import { cn } from "@/lib/utils"
import Image from "next/image"

const trustPills = [
  { icon: ShieldCheck, label: "SSL Güvenli" },
  { icon: Truck,       label: "KKTC Kargo" },
  { icon: Package,     label: "8+ Satıcı"  },
  { icon: Tag,         label: "100+ Ürün"  },
]

const promoSlides = [
  { tag: "Bugüne Özel",   headline: "Teknoloji'de", accent: "%30 Fırsat",     sub: "TechZone — sınırlı stok",      href: "/vendor/techzone",   gradient: "from-blue-600 to-cyan-500",     img: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&h=200&fit=crop" },
  { tag: "Yeni Sezon",    headline: "Moda'da",      accent: "Yeni Geldi",     sub: "Kıbrıs Moda — kadın & erkek", href: "/vendor/modastyle", gradient: "from-rose-500 to-pink-400",    img: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=200&fit=crop" },
  { tag: "Günün Fırsatı", headline: "Güzellik'te",  accent: "%20 İndirim",    sub: "Güzellik Evi — doğal bakım",   href: "/vendor/glowbeauty", gradient: "from-purple-600 to-pink-500",  img: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=300&h=200&fit=crop" },
  { tag: "Hafta Sonu",    headline: "Spor'da",      accent: "Ücretsiz Kargo", sub: "Spor Merkezi — fitness",        href: "/vendor/sportmax",  gradient: "from-green-600 to-emerald-500", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=200&fit=crop" },
]

const POPULAR = ["Kulaklık", "Elbise", "Parfüm", "Spor Ayakkabı", "Tablet"]

export function CyprusHero() {
  const router = useRouter()
  const [query, setQuery]             = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSug, setShowSug]         = useState(false)
  const [activeSug, setActiveSug]     = useState(-1)
  const [slide, setSlide]             = useState(0)
  const [visible, setVisible]         = useState(true)
  const inputRef    = useRef<HTMLInputElement>(null)
  const sugRef      = useRef<HTMLUListElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced suggestion generation
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) { setSuggestions([]); setShowSug(false); return }
    debounceRef.current = setTimeout(() => {
      const q = query.toLowerCase()
      const names = products
        .filter((p) =>
          (p.name?.toLowerCase() ?? "").includes(q) ||
          (p.categoryId?.toLowerCase() ?? "").includes(q)
        )
        .slice(0, 6)
        .map((p) => p.name)
      setSuggestions([...new Set(names)])
      setShowSug(names.length > 0)
      setActiveSug(-1)
    }, 220)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  // Auto-advance promo card
  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false)
      setTimeout(() => { setSlide((s) => (s + 1) % promoSlides.length); setVisible(true) }, 300)
    }, 4000)
    return () => clearInterval(id)
  }, [])

  // Close suggestions on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!inputRef.current?.closest("form")?.contains(e.target as Node))
        setShowSug(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [])

  const navigate = useCallback((term: string) => {
    setQuery(term)
    setShowSug(false)
    router.push(`/search?q=${encodeURIComponent(term.trim())}`)
  }, [router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) navigate(query.trim())
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSug || suggestions.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveSug((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveSug((i) => Math.max(i - 1, -1))
    } else if (e.key === "Enter" && activeSug >= 0) {
      e.preventDefault()
      navigate(suggestions[activeSug])
    } else if (e.key === "Escape") {
      setShowSug(false)
      setActiveSug(-1)
    }
  }

  const current = promoSlides[slide]

  return (
    <section className="bg-background border-b">
      <div className="container mx-auto px-4 py-10 md:py-14">
        <div className="grid lg:grid-cols-2 gap-10 items-center">

          {/* Left: search + info */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden>🇨🇾</span>
              <span className="text-sm font-medium text-muted-foreground">Kuzey Kıbrıs&apos;ın Pazaryeri</span>
              <Badge variant="secondary" className="text-xs gap-1 ml-auto">
                <Zap className="h-3 w-3 text-amber-500" />Canlı
              </Badge>
            </div>

            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-balance">
                KKTC&apos;de alışveriş<br />
                <span className="text-primary">çok daha kolay.</span>
              </h1>
              <p className="mt-3 text-base text-muted-foreground max-w-md leading-relaxed">
                Yerel satıcılar, gerçek ürünler — tek sepette öde, kapına gelsin.
              </p>
            </div>

            {/* Search with autocomplete */}
            <form onSubmit={handleSubmit} className="relative max-w-lg" role="search" aria-label="Ürün ara">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => { if (suggestions.length) setShowSug(true) }}
                    placeholder="Ürün, marka veya kategori ara..."
                    className="h-11 rounded-xl pl-9 pr-9"
                    aria-label="Arama kutusu"
                    aria-autocomplete="list"
                    aria-controls={showSug ? "hero-suggestions" : undefined}
                    aria-activedescendant={activeSug >= 0 ? `sug-${activeSug}` : undefined}
                    autoComplete="off"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => { setQuery(""); setSuggestions([]); setShowSug(false); inputRef.current?.focus() }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Temizle"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <Button type="submit" size="lg" className="h-11 px-5 rounded-xl shrink-0">
                  Ara
                </Button>
              </div>

              {/* Suggestions dropdown */}
              {showSug && suggestions.length > 0 && (
                <ul
                  ref={sugRef}
                  id="hero-suggestions"
                  role="listbox"
                  aria-label="Öneriler"
                  className="absolute top-full left-0 right-0 z-50 mt-1.5 rounded-xl border bg-background shadow-lg overflow-hidden"
                >
                  {suggestions.map((s, i) => (
                    <li
                      key={s}
                      id={`sug-${i}`}
                      role="option"
                      aria-selected={i === activeSug}
                      onMouseDown={(e) => { e.preventDefault(); navigate(s) }}
                      onMouseEnter={() => setActiveSug(i)}
                      className={cn(
                        "flex items-center gap-2.5 px-4 py-2.5 cursor-pointer text-sm transition-colors",
                        i === activeSug ? "bg-secondary text-foreground" : "hover:bg-secondary/60"
                      )}
                    >
                      <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Popular searches — shown when input is empty */}
              {!query && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {POPULAR.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => navigate(s)}
                      className="rounded-full border bg-secondary px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </form>

            {/* Trust pills */}
            <div className="flex flex-wrap gap-2">
              {trustPills.map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-1.5 text-xs font-medium bg-secondary border rounded-full px-3 py-1.5 text-muted-foreground">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  {label}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-3 flex-wrap">
              <Button asChild size="default" className="rounded-xl">
                <Link href="/products">Ürünleri Keşfet <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="ghost" size="default" className="text-muted-foreground">
                <Link href="/vendors">Tüm Satıcılar <ChevronRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>

          {/* Right: animated promo card */}
          <div className="relative hidden md:block">
            <div className={cn("absolute top-3 left-3 right-3 bottom-0 rounded-2xl bg-gradient-to-br opacity-30", promoSlides[(slide + 1) % promoSlides.length].gradient)} />
            <div className={cn("absolute top-1.5 left-1.5 right-1.5 bottom-0.5 rounded-2xl bg-gradient-to-br opacity-50", promoSlides[(slide + 1) % promoSlides.length].gradient)} />

            <Link
              href={current.href}
              className={cn(
                "relative flex rounded-2xl overflow-hidden shadow-2xl transition-opacity duration-300 min-h-[220px]",
                visible ? "opacity-100" : "opacity-0"
              )}
            >
              <div className={cn("absolute inset-0 bg-gradient-to-br", current.gradient)} />
              <div className="absolute right-0 top-0 bottom-0 w-1/2 overflow-hidden">
                <Image
                  src={current.img}
                  alt={current.headline}
                  fill
                  className="object-cover opacity-60 mix-blend-overlay"
                  sizes="240px"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
              </div>
              <div className="relative z-10 p-7 flex flex-col justify-between w-full">
                <div>
                  <Badge className="bg-white/20 text-white border-white/20 text-xs mb-3 inline-flex">
                    {current.tag}
                  </Badge>
                  <p className="text-white/80 text-sm font-medium">{current.headline}</p>
                  <p className="text-white text-4xl font-black leading-tight mt-0.5">{current.accent}</p>
                  <p className="text-white/70 text-xs mt-2">{current.sub}</p>
                </div>
                <div className="flex items-center gap-1.5 mt-4">
                  <span className="text-white font-semibold text-sm">Hemen Gör</span>
                  <ArrowRight className="h-4 w-4 text-white" />
                </div>
              </div>
            </Link>

            <div className="flex items-center justify-center gap-1.5 mt-3">
              {promoSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setVisible(false)
                    setTimeout(() => { setSlide(i); setVisible(true) }, 300)
                  }}
                  aria-label={`Slayt ${i + 1}`}
                  className={cn(
                    "rounded-full transition-all duration-300",
                    i === slide ? "w-5 h-2 bg-primary" : "w-2 h-2 bg-border hover:bg-muted-foreground"
                  )}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
