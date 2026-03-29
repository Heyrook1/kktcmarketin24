"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ChevronLeft, ChevronRight, Truck, ShieldCheck, Tag, Package } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Billboard slides (main large panel, auto-rotating) ──────────────────────
const SLIDES = [
  {
    tag:       "Bugüne Özel",
    headline:  "Elektronikte",
    accent:    "%30 İndirim",
    sub:       "TechZone — sınırlı stok, kaçırma!",
    cta:       "Fırsatı Gör",
    href:      "/products?category=electronics",
    gradient:  "from-blue-700 via-blue-600 to-cyan-500",
    img:       "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=900&h=500&fit=crop",
    badge:     "bg-cyan-400/20 text-cyan-100 border-cyan-400/30",
  },
  {
    tag:       "Yeni Sezon",
    headline:  "Moda'da",
    accent:    "Yeni Koleksiyon",
    sub:       "Kıbrıs Moda — kadın & erkek giyim",
    cta:       "Koleksiyonu Keşfet",
    href:      "/products?category=fashion",
    gradient:  "from-rose-600 via-pink-500 to-orange-400",
    img:       "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=900&h=500&fit=crop",
    badge:     "bg-rose-400/20 text-rose-100 border-rose-400/30",
  },
  {
    tag:       "Haftanın Kampanyası",
    headline:  "Spor & Outdoor'da",
    accent:    "Ücretsiz Kargo",
    sub:       "Spor Merkezi — tüm fitness ürünleri",
    cta:       "Spor Ürünlerine Bak",
    href:      "/products?category=sports",
    gradient:  "from-green-700 via-emerald-600 to-teal-500",
    img:       "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&h=500&fit=crop",
    badge:     "bg-emerald-400/20 text-emerald-100 border-emerald-400/30",
  },
  {
    tag:       "Güzellik Haftası",
    headline:  "Cilt Bakımında",
    accent:    "%20 İndirim",
    sub:       "Güzellik Evi — doğal & organik bakım",
    cta:       "Ürünleri İncele",
    href:      "/products?category=beauty",
    gradient:  "from-purple-700 via-violet-600 to-pink-500",
    img:       "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=900&h=500&fit=crop",
    badge:     "bg-purple-400/20 text-purple-100 border-purple-400/30",
  },
]

// ── Side ad panels (static, 2 always visible on desktop) ────────────────────
const SIDE_ADS = [
  {
    tag:      "Flash Fırsat",
    title:    "Kulaklık",
    sub:      "En iyi markalar",
    href:     "/products?category=electronics&sub=audio",
    gradient: "from-sky-600 to-indigo-600",
    img:      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&h=200&fit=crop",
  },
  {
    tag:      "Yeni Gelenler",
    title:    "Çanta & Aksesuar",
    sub:      "Son koleksiyonlar",
    href:     "/products?category=fashion&sub=bags",
    gradient: "from-amber-500 to-orange-600",
    img:      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&h=200&fit=crop",
  },
]

const TRUST = [
  { icon: ShieldCheck, label: "Onaylı Satıcılar" },
  { icon: Truck,       label: "KKTC Kargo"       },
  { icon: Package,     label: "Güvenli Paket"    },
  { icon: Tag,         label: "En İyi Fiyat"      },
]

// ── Component ────────────────────────────────────────────────────────────────
export function CyprusHero() {
  const [slide, setSlide]         = useState(0)
  const [animating, setAnimating] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = useCallback((idx: number) => {
    if (animating) return
    setAnimating(true)
    setTimeout(() => {
      setSlide(idx)
      setAnimating(false)
    }, 250)
  }, [animating])

  const prev = useCallback(() => goTo((slide - 1 + SLIDES.length) % SLIDES.length), [slide, goTo])
  const next = useCallback(() => goTo((slide + 1) % SLIDES.length), [slide, goTo])

  // Auto-advance every 5 s
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSlide((s) => (s + 1) % SLIDES.length)
    }, 5000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  // Pause on hover
  const pauseTimer = () => { if (timerRef.current) clearInterval(timerRef.current) }
  const resumeTimer = () => {
    timerRef.current = setInterval(() => {
      setSlide((s) => (s + 1) % SLIDES.length)
    }, 5000)
  }

  const current = SLIDES[slide]

  return (
    <section className="bg-background border-b py-3 md:py-4">
      <div className="container mx-auto px-3 md:px-4">

        {/* ── Billboard grid ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] xl:grid-cols-[1fr_240px] gap-3">

          {/* Main large slide */}
          <div
            className="relative overflow-hidden rounded-2xl min-h-[220px] md:min-h-[300px] lg:min-h-[340px] group cursor-pointer"
            onMouseEnter={pauseTimer}
            onMouseLeave={resumeTimer}
          >
            {/* Background image */}
            <div
              className={cn(
                "absolute inset-0 transition-opacity duration-500",
                animating ? "opacity-0" : "opacity-100"
              )}
            >
              <Image
                src={current.img}
                alt={current.headline}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 75vw"
                priority
              />
              {/* Gradient overlay */}
              <div className={cn("absolute inset-0 bg-gradient-to-r", current.gradient, "opacity-80")} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>

            {/* Content */}
            <div
              className={cn(
                "relative z-10 flex flex-col justify-end h-full p-5 md:p-8 transition-all duration-300",
                animating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
              )}
            >
              <span className={cn(
                "inline-flex items-center self-start text-xs font-semibold px-2.5 py-1 rounded-full border mb-3",
                current.badge
              )}>
                {current.tag}
              </span>
              <p className="text-white/80 text-sm md:text-base font-medium leading-none mb-1">
                {current.headline}
              </p>
              <h2 className="text-white text-3xl md:text-5xl font-black leading-none tracking-tight text-balance mb-2">
                {current.accent}
              </h2>
              <p className="text-white/70 text-xs md:text-sm mb-5">{current.sub}</p>

              <Link
                href={current.href}
                className="inline-flex items-center gap-2 self-start bg-white text-foreground font-semibold text-sm rounded-xl px-5 py-2.5 hover:bg-white/90 transition-colors shadow-lg"
              >
                {current.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Arrow controls */}
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-white/20 hover:bg-white/40 border border-white/20 backdrop-blur-sm flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
              aria-label="Önceki"
            >
              <ChevronLeft className="h-4 w-4 text-white" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-white/20 hover:bg-white/40 border border-white/20 backdrop-blur-sm flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
              aria-label="Sonraki"
            >
              <ChevronRight className="h-4 w-4 text-white" />
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Slayt ${i + 1}`}
                  className={cn(
                    "rounded-full transition-all duration-300",
                    i === slide
                      ? "w-6 h-2 bg-white"
                      : "w-2 h-2 bg-white/40 hover:bg-white/70"
                  )}
                />
              ))}
            </div>

            {/* Progress bar */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/20 z-20">
              <div
                key={slide}
                className="h-full bg-white/70 animate-progress-bar"
                style={{ animationDuration: "5s", animationTimingFunction: "linear" }}
              />
            </div>
          </div>

          {/* Side ad panels (desktop only) */}
          <div className="hidden lg:flex flex-col gap-3">
            {SIDE_ADS.map((ad) => (
              <Link
                key={ad.href}
                href={ad.href}
                className="relative overflow-hidden rounded-2xl flex-1 group min-h-[160px]"
              >
                <Image
                  src={ad.img}
                  alt={ad.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="240px"
                />
                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-80", ad.gradient)} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="relative z-10 flex flex-col justify-end h-full p-4">
                  <span className="text-white/70 text-[11px] font-medium tracking-wide uppercase mb-0.5">
                    {ad.tag}
                  </span>
                  <p className="text-white font-bold text-base leading-tight">{ad.title}</p>
                  <p className="text-white/60 text-xs mt-0.5">{ad.sub}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-white/90 text-xs font-semibold group-hover:gap-2 transition-all">
                    Gör <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Trust strip ────────────────────────────────────────── */}
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
          {TRUST.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-xl border bg-secondary/40 px-3 py-2 text-xs font-medium text-muted-foreground"
            >
              <Icon className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              {label}
            </div>
          ))}
        </div>

      </div>

      <style jsx>{`
        @keyframes progress-bar {
          from { width: 0% }
          to   { width: 100% }
        }
        .animate-progress-bar {
          animation-name: progress-bar;
        }
      `}</style>
    </section>
  )
}


const trustPills = [
  { icon: ShieldCheck, label: "SSL Güvenli" },
  { icon: Truck,       label: "KKTC Kargo"  },
  { icon: Package,     label: "8+ Satıcı"   },
  { icon: Tag,         label: "100+ Ürün"   },
]

const promoSlides = [
  { tag: "Bugüne Özel",   headline: "Teknoloji'de", accent: "%30 Fırsat",     sub: "TechZone — sınırlı stok",      href: "/vendor/techzone",   gradient: "from-blue-600 to-cyan-500",     img: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&h=200&fit=crop" },
  { tag: "Yeni Sezon",    headline: "Moda'da",      accent: "Yeni Geldi",     sub: "Kıbrıs Moda — kadın & erkek", href: "/vendor/modastyle",  gradient: "from-rose-500 to-pink-400",    img: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=200&fit=crop" },
  { tag: "Günün Fırsatı", headline: "Güzellik'te",  accent: "%20 İndirim",    sub: "Güzellik Evi — doğal bakım",   href: "/vendor/glowbeauty", gradient: "from-purple-600 to-pink-500",  img: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=300&h=200&fit=crop" },
  { tag: "Hafta Sonu",    headline: "Spor'da",      accent: "Ücretsiz Kargo", sub: "Spor Merkezi — fitness",        href: "/vendor/sportmax",   gradient: "from-green-600 to-emerald-500",img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=200&fit=crop"  },
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
  const inputRef  = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced suggestions
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
      const unique = [...new Set(names)]
      setSuggestions(unique)
      setShowSug(unique.length > 0)
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
      if (!(e.target as Node).closest?.("form"))
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
              <Image
                src="/images/marketin24-logo.png"
                alt="Marketin24"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
              <span className="text-sm font-medium text-muted-foreground">Kuzey Kıbrıs&apos;ın Pazaryeri</span>
              <Badge variant="secondary" className="text-xs gap-1 ml-auto">
                <Zap className="h-3 w-3 text-amber-500" />Test
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

            {/* Search with suggestions */}
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

              {/* Popular searches */}
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
                <Image src={current.img} alt={current.headline} fill className="object-cover opacity-60 mix-blend-overlay" sizes="240px" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
              </div>
              <div className="relative z-10 p-7 flex flex-col justify-between w-full">
                <div>
                  <Badge className="bg-white/20 text-white border-white/20 text-xs mb-3 inline-flex">{current.tag}</Badge>
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
                  onClick={() => { setVisible(false); setTimeout(() => { setSlide(i); setVisible(true) }, 300) }}
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
