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

// ── Icon map ────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  Smartphone, Shirt, Home, Sparkles, Dumbbell, Baby,
  Watch, ShoppingBasket, Heart, BookOpen,
}

// Category accent colours for the active indicator pill
const CAT_COLOR: Record<string, string> = {
  electronics: "bg-blue-500",
  fashion:     "bg-rose-500",
  "home-garden":"bg-amber-500",
  beauty:      "bg-purple-500",
  sports:      "bg-green-500",
  "kids-baby": "bg-sky-500",
  jewelry:     "bg-yellow-500",
  groceries:   "bg-lime-600",
  health:      "bg-red-500",
  books:       "bg-orange-500",
}

// ── DefaultPanel ─────────────────────────────────────────────────────────────
function DefaultPanel({ onClose }: { onClose: () => void }) {
  const trending = [
    { label: "Cep Telefonları", href: "/products?category=electronics&sub=phones",     icon: Smartphone, color: "text-blue-500" },
    { label: "Kadın Giyim",     href: "/products?category=fashion&sub=womens",         icon: Shirt,       color: "text-rose-500" },
    { label: "Cilt Bakımı",     href: "/products?category=beauty&sub=skincare",        icon: Sparkles,    color: "text-purple-500" },
    { label: "Fitness",         href: "/products?category=sports&sub=fitness",         icon: Dumbbell,    color: "text-green-500" },
    { label: "Oyuncaklar",      href: "/products?category=kids-baby&sub=toys",         icon: Baby,        color: "text-sky-500" },
    { label: "Saatler",         href: "/products?category=jewelry&sub=watches",        icon: Watch,       color: "text-yellow-600" },
    { label: "Taze Gıda",       href: "/products?category=groceries&sub=fresh",        icon: ShoppingBasket, color: "text-lime-600" },
    { label: "Vitaminler",      href: "/products?category=health&sub=vitamins",        icon: Heart,       color: "text-red-500" },
  ]

  const flashDeals = [
    { label: "Kulaklıklar",   href: "/products?category=electronics&sub=audio",    badge: "%40 İndirim", image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=80&h=80&fit=crop" },
    { label: "Spor Ayakkabı", href: "/products?category=sports&sub=running",       badge: "%30 İndirim", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=80&h=80&fit=crop" },
    { label: "Parfüm",        href: "/products?category=beauty&sub=fragrance",     badge: "%25 İndirim", image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=80&h=80&fit=crop" },
    { label: "Akıllı Saat",   href: "/products?category=electronics&sub=smart-home", badge: "%20 İndirim", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&h=80&fit=crop" },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center gap-6 px-6 pt-5 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold text-foreground">Popüler Kategoriler</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Star className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-bold text-foreground">Flaş İndirimler</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Trending grid */}
        <div className="flex-1 px-6 py-4">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-1">
            {trending.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center gap-2.5 py-2.5 px-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all duration-150 group"
                >
                  <Icon className={cn("h-4 w-4 flex-shrink-0 transition-colors", item.color, "group-hover:scale-110")} />
                  <span className="font-medium leading-tight">{item.label}</span>
                  <ChevronRight className="ml-auto h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                </Link>
              )
            })}
          </div>

          {/* Bottom promo strip */}
          <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-3 gap-3">
            {[
              { label: "Yeni Gelenler", href: "/products?sort=newest", icon: PackagePlus, desc: "Bu hafta eklendi" },
              { label: "Çok Satanlar",  href: "/products?sort=popular", icon: Flame,      desc: "En çok tercih edilen" },
              { label: "Fırsatlar",     href: "/products?sort=price-low", icon: Zap,      desc: "En uygun fiyatlar" },
            ].map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-start gap-3 p-3 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all duration-150 group"
                >
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-secondary group-hover:bg-primary/10 transition-colors">
                    <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Flash deals sidebar */}
        <div className="w-52 flex-shrink-0 border-l border-border/60 px-4 py-4 space-y-2">
          {flashDeals.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 p-2 rounded-xl border border-transparent hover:border-border hover:bg-secondary/60 transition-all duration-150 group"
            >
              <div className="relative h-10 w-10 flex-shrink-0 rounded-lg overflow-hidden ring-1 ring-border/40">
                <Image src={item.image} alt={item.label} fill className="object-cover" sizes="40px" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground/80 group-hover:text-foreground leading-tight truncate">{item.label}</p>
                <span className="text-[10px] font-bold text-red-500">{item.badge}</span>
              </div>
            </Link>
          ))}
          <Link
            href="/products?sort=price-low"
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 w-full mt-2 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors border border-red-200 dark:border-red-900"
          >
            <Zap className="h-3 w-3" />
            Tüm İndirimler
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── CategoryPanel ─────────────────────────────────────────────────────────────
function CategoryPanel({ category, onClose }: { category: Category; onClose: () => void }) {
  const accentColor = CAT_COLOR[category.id] ?? "bg-primary"
  const subs = category.subcategories ?? []

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <span className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0", accentColor)} />
          <h3 className="text-base font-bold text-foreground">{category.name}</h3>
          <span className="text-xs text-muted-foreground">{subs.length} alt kategori</span>
        </div>
        <Link
          href={`/products?category=${category.slug}`}
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
        >
          Tümünü gör <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Subcategory grid */}
        <div className="flex-1 px-6 py-4">
          {subs.length > 0 ? (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-0.5">
              {subs.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/products?category=${category.slug}&sub=${sub.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-2.5 py-2.5 px-3 rounded-xl text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-150 group"
                >
                  <span className={cn(
                    "h-1.5 w-1.5 rounded-full flex-shrink-0 transition-colors",
                    accentColor,
                    "group-hover:scale-125"
                  )} />
                  <span className="font-medium">{sub.name}</span>
                  <ChevronRight className="ml-auto h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-2">{category.description}</p>
          )}

          {/* View all CTA */}
          <div className="mt-5 pt-4 border-t border-border/50">
            <Link
              href={`/products?category=${category.slug}`}
              onClick={onClose}
              className={cn(
                "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150",
                "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              {category.name} kategorisinde tüm ürünleri gör
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </div>
        </div>

        {/* Featured card */}
        {category.featured && (
          <div className="w-52 flex-shrink-0 border-l border-border/60 px-4 py-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Editörün Seçimi</p>
            <Link
              href={category.featured.href}
              onClick={onClose}
              className="block group rounded-2xl overflow-hidden ring-1 ring-border/40 hover:ring-primary/50 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <div className="relative aspect-[4/3] bg-secondary">
                <Image
                  src={category.featured.image}
                  alt={category.featured.label}
                  fill
                  className="object-cover transition-transform duration-400 group-hover:scale-105"
                  sizes="192px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-xs font-semibold leading-snug">{category.featured.label}</p>
                </div>
              </div>
            </Link>
            <Link
              href={`/products?category=${category.slug}`}
              onClick={onClose}
              className={cn(
                "mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-bold transition-all duration-150",
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
  const [activeCategory, setActiveCategory] = useState<Category | null>(null)
  const pathname = usePathname()
  const prevPathRef = useRef(pathname)

  // Close on actual navigation
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname
      onClose()
    }
  }, [pathname, onClose])

  // ── Robust hover: track mouse position relative to the right panel.
  // The nav links set activeCategory immediately on enter, and the panel
  // keeps it alive while the mouse is over it. No fragile timers.
  const handleCatEnter = useCallback((cat: Category) => {
    setActiveCategory(cat)
  }, [])

  const handleNavLeave = useCallback((e: React.MouseEvent) => {
    // Only clear if mouse is NOT moving right into the panel
    const el = e.currentTarget as HTMLElement
    const rect = el.getBoundingClientRect()
    if (e.clientX < rect.right + 10) return  // still moving toward panel
    setActiveCategory(null)
  }, [])

  return (
    <div
      className="absolute top-full left-0 right-0 z-50 bg-background border-b shadow-2xl"
      style={{ animation: "megaMenuIn 0.18s cubic-bezier(0.16,1,0.3,1) both" }}
    >
      <div className="container mx-auto px-4">
        <div className="flex" style={{ minHeight: 380 }}>

          {/* ── Left nav ─────────────────────────────────────────── */}
          <nav
            className="w-60 flex-shrink-0 border-r border-border/60 py-3 bg-secondary/20"
            aria-label="Kategori listesi"
          >
            <p className="px-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Kategoriler
            </p>
            {categories.map((cat) => {
              const Icon = ICON_MAP[cat.icon] ?? Smartphone
              const isActive = activeCategory?.id === cat.id
              const accentBg = CAT_COLOR[cat.id] ?? "bg-primary"

              return (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className={cn(
                    "relative flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl select-none transition-all duration-100 group",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground hover:bg-secondary/80"
                  )}
                  onMouseEnter={() => handleCatEnter(cat)}
                  onClick={onClose}
                >
                  {/* Colour dot */}
                  <span className={cn(
                    "h-7 w-7 flex-shrink-0 flex items-center justify-center rounded-lg transition-all",
                    isActive
                      ? "bg-primary-foreground/20"
                      : cn("bg-secondary group-hover:opacity-90", accentBg.replace("bg-", "bg-opacity-10 bg-"))
                  )}>
                    <Icon className={cn(
                      "h-4 w-4 transition-colors",
                      isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                  </span>

                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      "block text-sm font-medium truncate",
                      isActive ? "text-primary-foreground" : ""
                    )}>
                      {cat.name}
                    </span>
                    {!isActive && (
                      <span className="block text-[10px] text-muted-foreground truncate leading-tight">
                        {(cat.subcategories?.length ?? 0)} alt kategori
                      </span>
                    )}
                  </div>

                  <ChevronRight className={cn(
                    "h-3.5 w-3.5 flex-shrink-0 transition-all duration-100",
                    isActive
                      ? "text-primary-foreground/70 translate-x-0.5"
                      : "text-muted-foreground/30 group-hover:text-muted-foreground group-hover:translate-x-0.5"
                  )} />

                  {/* Active left accent bar */}
                  {isActive && (
                    <span className={cn("absolute left-0 top-2 bottom-2 w-0.5 rounded-full", accentBg)} />
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
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <LayoutGrid className="h-4 w-4 text-primary" />
              </span>
              Tüm Ürünler
              <ArrowRight className="h-3.5 w-3.5 ml-auto group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </nav>

          {/* ── Right panel ──────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
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
