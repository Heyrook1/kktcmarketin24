"use client"

import Link from "next/link"
import Image from "next/image"
import { useRef, useState, useCallback, useEffect } from "react"
import { usePathname } from "next/navigation"
import {
  ChevronRight, ArrowRight, LayoutGrid,
  Flame, Zap, PackagePlus, TrendingUp,
  Smartphone, Shirt, Home, Sparkles, Dumbbell, Baby,
  Watch, ShoppingBasket, Heart, BookOpen, Star,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { categories, type Category } from "@/lib/data/categories"

// ── Icon + colour maps ───────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  Smartphone, Shirt, Home, Sparkles, Dumbbell,
  Baby, Watch, ShoppingBasket, Heart, BookOpen,
}

const CAT_COLORS: Record<string, { bg: string; text: string; pill: string; dot: string }> = {
  electronics:  { bg: "bg-blue-50 dark:bg-blue-950",   text: "text-blue-600 dark:text-blue-400",   pill: "bg-blue-500",   dot: "bg-blue-500"   },
  fashion:      { bg: "bg-rose-50 dark:bg-rose-950",   text: "text-rose-600 dark:text-rose-400",   pill: "bg-rose-500",   dot: "bg-rose-500"   },
  "home-garden":{ bg: "bg-amber-50 dark:bg-amber-950", text: "text-amber-600 dark:text-amber-400", pill: "bg-amber-500",  dot: "bg-amber-500"  },
  beauty:       { bg: "bg-purple-50 dark:bg-purple-950",text:"text-purple-600 dark:text-purple-400",pill:"bg-purple-500", dot: "bg-purple-500" },
  sports:       { bg: "bg-green-50 dark:bg-green-950", text: "text-green-600 dark:text-green-400", pill: "bg-green-500",  dot: "bg-green-500"  },
  "kids-baby":  { bg: "bg-sky-50 dark:bg-sky-950",     text: "text-sky-600 dark:text-sky-400",     pill: "bg-sky-500",    dot: "bg-sky-500"    },
  jewelry:      { bg: "bg-yellow-50 dark:bg-yellow-950",text:"text-yellow-600 dark:text-yellow-400",pill:"bg-yellow-500", dot: "bg-yellow-500" },
  groceries:    { bg: "bg-lime-50 dark:bg-lime-950",   text: "text-lime-700 dark:text-lime-400",   pill: "bg-lime-600",   dot: "bg-lime-600"   },
  health:       { bg: "bg-red-50 dark:bg-red-950",     text: "text-red-600 dark:text-red-400",     pill: "bg-red-500",    dot: "bg-red-500"    },
  books:        { bg: "bg-orange-50 dark:bg-orange-950",text:"text-orange-600 dark:text-orange-400",pill:"bg-orange-500", dot: "bg-orange-500" },
}

const DEFAULT_COLOR = { bg: "bg-secondary", text: "text-foreground", pill: "bg-primary", dot: "bg-primary" }

// ── DefaultPanel ─────────────────────────────────────────────────────────────
function DefaultPanel({ onClose }: { onClose: () => void }) {
  const quickLinks = [
    { label: "Cep Telefonları",  href: "/products?category=electronics&sub=phones",    icon: Smartphone,     color: "text-blue-500"   },
    { label: "Kadın Giyim",      href: "/products?category=fashion&sub=womens",        icon: Shirt,          color: "text-rose-500"   },
    { label: "Cilt Bakımı",      href: "/products?category=beauty&sub=skincare",       icon: Sparkles,       color: "text-purple-500" },
    { label: "Fitness",          href: "/products?category=sports&sub=fitness",        icon: Dumbbell,       color: "text-green-500"  },
    { label: "Oyuncaklar",       href: "/products?category=kids-baby&sub=toys",        icon: Baby,           color: "text-sky-500"    },
    { label: "Saatler",          href: "/products?category=jewelry&sub=watches",       icon: Watch,          color: "text-yellow-600" },
    { label: "Taze Gıda",        href: "/products?category=groceries&sub=fresh",       icon: ShoppingBasket, color: "text-lime-600"   },
    { label: "Vitaminler",       href: "/products?category=health&sub=vitamins",       icon: Heart,          color: "text-red-500"    },
  ]

  const deals = [
    { label: "Kulaklıklar",   href: "/products?category=electronics&sub=audio",     badge: "%40 İndirim", image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=80&h=80&fit=crop" },
    { label: "Spor Ayakkabı", href: "/products?category=sports&sub=running",        badge: "%30 İndirim", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=80&h=80&fit=crop" },
    { label: "Parfüm",        href: "/products?category=beauty&sub=fragrance",      badge: "%25 İndirim", image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=80&h=80&fit=crop" },
    { label: "Akıllı Saat",   href: "/products?category=electronics&sub=wearables", badge: "%20 İndirim", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&h=80&fit=crop" },
  ]

  return (
    <div className="flex h-full">
      {/* Popular links grid */}
      <div className="flex-1 px-6 py-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Popüler Kategoriler</span>
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-1 mb-6">
          {quickLinks.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all group"
              >
                <Icon className={cn("h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform", item.color)} />
                <span>{item.label}</span>
                <ChevronRight className="ml-auto h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
              </Link>
            )
          })}
        </div>

        <div className="border-t border-border/50 pt-4 grid grid-cols-3 gap-3">
          {[
            { label: "Yeni Gelenler", desc: "Bu hafta eklendi",     href: "/products?sort=newest",    icon: PackagePlus },
            { label: "Çok Satanlar",  desc: "En çok tercih edilen", href: "/products?sort=popular",   icon: Flame       },
            { label: "En Uygun",      desc: "Fırsatları keşfet",    href: "/products?sort=price-low", icon: Zap         },
          ].map(({ label, desc, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="flex items-start gap-3 rounded-xl border border-border/60 p-3 hover:border-primary/40 hover:bg-primary/5 transition-all group"
            >
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-secondary group-hover:bg-primary/10 transition-colors">
                <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Flash deals */}
      <div className="w-52 flex-shrink-0 border-l border-border/60 px-4 py-5">
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-4 w-4 text-yellow-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Flaş İndirimler</span>
        </div>
        <div className="space-y-2">
          {deals.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl border border-transparent p-2 hover:border-border hover:bg-secondary/60 transition-all group"
            >
              <div className="relative h-10 w-10 flex-shrink-0 rounded-lg overflow-hidden ring-1 ring-border/40">
                <Image src={item.image} alt={item.label} fill className="object-cover" sizes="40px" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground/80 group-hover:text-foreground truncate">{item.label}</p>
                <span className="text-[10px] font-bold text-red-500">{item.badge}</span>
              </div>
            </Link>
          ))}
        </div>
        <Link
          href="/products?sort=price-low"
          onClick={onClose}
          className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-bold border border-red-200 dark:border-red-900 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
        >
          <Zap className="h-3 w-3" />
          Tüm İndirimler
        </Link>
      </div>
    </div>
  )
}

// ── CategoryPanel ─────────────────────────────────────────────────────────────
function CategoryPanel({ category, onClose }: { category: Category; onClose: () => void }) {
  const color  = CAT_COLORS[category.id] ?? DEFAULT_COLOR
  const subs   = category.subcategories ?? []

  return (
    <div className="flex flex-col h-full">
      {/* Header row */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <span className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0", color.dot)} />
          <h3 className="text-base font-bold text-foreground">{category.name}</h3>
          {subs.length > 0 && (
            <span className="text-xs text-muted-foreground">· {subs.length} alt kategori</span>
          )}
        </div>
        <Link
          href={`/products?category=${category.slug}`}
          onClick={onClose}
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          Tümünü gör <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Body */}
      <div className="flex flex-1">
        {/* Subcategory grid */}
        <div className="flex-1 px-6 py-5 overflow-y-auto">
          {subs.length > 0 ? (
            <>
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-x-2 gap-y-1">
                {subs.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/products?category=${category.slug}&sub=${sub.slug}`}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all group",
                      "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                    )}
                  >
                    <span className={cn(
                      "h-1.5 w-1.5 rounded-full flex-shrink-0 transition-transform group-hover:scale-150",
                      color.dot
                    )} />
                    <span className="leading-tight">{sub.name}</span>
                    <ChevronRight className="ml-auto h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-70 group-hover:translate-x-0 transition-all duration-150" />
                  </Link>
                ))}
              </div>

              {/* View all CTA */}
              <div className="mt-5 pt-4 border-t border-border/50">
                <Link
                  href={`/products?category=${category.slug}`}
                  onClick={onClose}
                  className={cn(
                    "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all",
                    "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                  {category.name} — tüm ürünleri gör
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </div>
            </>
          ) : (
            <div className="py-4">
              <p className="text-sm text-muted-foreground">{category.description}</p>
              <Link
                href={`/products?category=${category.slug}`}
                onClick={onClose}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <LayoutGrid className="h-4 w-4" />
                Tüm ürünleri gör
              </Link>
            </div>
          )}
        </div>

        {/* Featured card (optional) */}
        {category.featured && (
          <div className="w-52 flex-shrink-0 border-l border-border/60 px-4 py-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Editörün Seçimi
            </p>
            <Link
              href={category.featured.href}
              onClick={onClose}
              className="block group rounded-2xl overflow-hidden ring-1 ring-border/40 hover:ring-primary/50 transition-all shadow-sm hover:shadow-md"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={category.featured.image}
                  alt={category.featured.label}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="192px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <p className="absolute bottom-0 left-0 right-0 p-3 text-white text-xs font-semibold leading-snug">
                  {category.featured.label}
                </p>
              </div>
            </Link>
            <Link
              href={`/products?category=${category.slug}`}
              onClick={onClose}
              className={cn(
                "mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-bold transition-all",
                "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
              )}
            >
              Kategoriye git <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

// ── MegaMenu ──────────────────────────────────────────────────────────────────
export function MegaMenu({ onClose }: { onClose: () => void }) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const pathname    = usePathname()
  const prevPathRef = useRef(pathname)
  const resetTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeCategory = categories.find((c) => c.id === activeId) ?? null

  // Close on actual navigation only
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname
      onClose()
    }
  }, [pathname, onClose])

  // Set active instantly on nav hover
  const handleCatEnter = useCallback((id: string) => {
    if (resetTimer.current) clearTimeout(resetTimer.current)
    setActiveId(id)
  }, [])

  // When mouse leaves the nav column, reset to default after 200ms
  // ONLY if it's not heading toward the right panel (which would
  // re-trigger via the panel's onMouseEnter doing nothing — we just
  // keep the last hovered category alive while the panel is visible)
  const handleNavAreaLeave = useCallback(() => {
    resetTimer.current = setTimeout(() => setActiveId(null), 200)
  }, [])

  // Panel keeps the active category alive — cancel any pending reset
  const handlePanelEnter = useCallback(() => {
    if (resetTimer.current) clearTimeout(resetTimer.current)
  }, [])

  useEffect(() => {
    return () => { if (resetTimer.current) clearTimeout(resetTimer.current) }
  }, [])

  return (
    <div
      className="absolute top-full left-0 right-0 z-50 bg-background border-b shadow-2xl"
      style={{ animation: "megaMenuIn 0.18s cubic-bezier(0.16,1,0.3,1) both" }}
    >
      <style>{`
        @keyframes megaMenuIn {
          from { opacity: 0; transform: translateY(-6px) }
          to   { opacity: 1; transform: translateY(0) }
        }
      `}</style>

      <div className="container mx-auto px-4">
        <div className="flex" style={{ minHeight: 400 }}>

          {/* ── Left category nav ──────────────────────────────── */}
          <nav
            className="w-60 flex-shrink-0 border-r border-border/60 py-3 bg-secondary/20"
            aria-label="Kategori listesi"
            onMouseLeave={handleNavAreaLeave}
          >
            <p className="px-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Kategoriler
            </p>

            {categories.map((cat) => {
              const Icon   = ICON_MAP[cat.icon] ?? Smartphone
              const color  = CAT_COLORS[cat.id] ?? DEFAULT_COLOR
              const isActive = activeId === cat.id

              return (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  onClick={onClose}
                  onMouseEnter={() => handleCatEnter(cat.id)}
                  className={cn(
                    "relative flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl select-none transition-all duration-100 group",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground hover:bg-secondary/80"
                  )}
                >
                  {/* Colour icon chip */}
                  <span className={cn(
                    "h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-lg transition-all duration-100",
                    isActive ? "bg-white/20" : cn(color.bg)
                  )}>
                    <Icon className={cn(
                      "h-4 w-4 transition-colors",
                      isActive ? "text-white" : color.text
                    )} />
                  </span>

                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      "block text-sm font-semibold truncate",
                      isActive ? "text-primary-foreground" : "text-foreground"
                    )}>
                      {cat.name}
                    </span>
                    <span className={cn(
                      "block text-[10px] truncate leading-tight",
                      isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {(cat.subcategories?.length ?? 0)} alt kategori
                    </span>
                  </div>

                  <ChevronRight className={cn(
                    "h-3.5 w-3.5 flex-shrink-0 transition-all duration-100",
                    isActive
                      ? "text-primary-foreground/70 translate-x-0.5"
                      : "text-muted-foreground/30 group-hover:text-muted-foreground/60 group-hover:translate-x-0.5"
                  )} />

                  {/* Active left accent */}
                  {isActive && (
                    <span className={cn("absolute left-0 top-2.5 bottom-2.5 w-0.5 rounded-full", color.dot)} />
                  )}
                </Link>
              )
            })}

            <div className="mx-4 my-2 border-t border-border/50" />

            <Link
              href="/products"
              onClick={onClose}
              className="flex items-center gap-2.5 px-3 py-2.5 mx-2 text-sm font-semibold text-primary hover:bg-primary/5 rounded-xl transition-colors group"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <LayoutGrid className="h-4 w-4 text-primary" />
              </span>
              Tüm Ürünler
              <ArrowRight className="h-3.5 w-3.5 ml-auto group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </nav>

          {/* ── Right panel ───────────────────────────────────── */}
          <div
            className="flex-1 min-w-0 overflow-hidden"
            onMouseEnter={handlePanelEnter}
          >
            {activeCategory === null ? (
              <DefaultPanel onClose={onClose} />
            ) : (
              <CategoryPanel
                key={activeCategory.id}
                category={activeCategory}
                onClose={onClose}
              />
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
