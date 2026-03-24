"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronRight, ArrowRight, LayoutGrid,
  Flame, Zap, PackagePlus,
  Smartphone, Shirt, Home, Sparkles, Dumbbell, Baby,
  Watch, ShoppingBasket, Heart, BookOpen,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { categories, type Category } from "@/lib/data/categories"

const ICON_MAP: Record<string, React.ElementType> = {
  Smartphone, Shirt, Home, Sparkles, Dumbbell, Baby,
  Watch, ShoppingBasket, Heart, BookOpen,
}

// ---------------------------------------------------------------------------
// DefaultPanel — shown when no category is hovered
// ---------------------------------------------------------------------------
function DefaultPanel({ onClose }: { onClose: () => void }) {
  const trending = [
    { label: "Cep Telefonları", href: "/category/electronics?sub=phones",   icon: Smartphone },
    { label: "Kadın Giyim",     href: "/category/fashion?sub=womens",       icon: Shirt },
    { label: "Cilt Bakımı",     href: "/category/beauty?sub=skincare",      icon: Sparkles },
    { label: "Fitness",         href: "/category/sports?sub=fitness",       icon: Dumbbell },
    { label: "Oyuncaklar",      href: "/category/kids-baby?sub=toys",       icon: Baby },
    { label: "Saatler",         href: "/category/jewelry?sub=watches",      icon: Watch },
  ]
  const flashDeals = [
    { label: "Kulaklıklar",   href: "/category/electronics?sub=audio",  badge: "%40", image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=80&h=80&fit=crop" },
    { label: "Spor Ayakkabı", href: "/category/sports?sub=running",     badge: "%30", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=80&h=80&fit=crop" },
    { label: "Parfüm",        href: "/category/beauty?sub=fragrance",   badge: "%25", image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=80&h=80&fit=crop" },
  ]
  const newArrivals = [
    { label: "Yeni Elektronik",  href: "/products?sort=newest&category=electronics", image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=80&h=80&fit=crop" },
    { label: "Yeni Moda",        href: "/products?sort=newest&category=fashion",     image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=80&h=80&fit=crop" },
    { label: "Yeni Ev Ürünleri", href: "/products?sort=newest&category=home-garden", image: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=80&h=80&fit=crop" },
  ]

  return (
    <div className="flex-1 py-6 px-6 grid grid-cols-3 gap-8 overflow-hidden">
      {/* Trending */}
      <div>
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
          <Flame className="h-4 w-4 text-orange-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">Trend Kategoriler</span>
        </div>
        <div className="space-y-0.5">
          {trending.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3 py-2 px-2 rounded-lg text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-150 group"
              >
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-secondary group-hover:bg-primary/10 transition-colors">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                </span>
                <span className="font-medium">{item.label}</span>
                <ArrowRight className="ml-auto h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150" />
              </Link>
            )
          })}
        </div>
      </div>

      {/* Flash Deals */}
      <div>
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
          <Zap className="h-4 w-4 text-yellow-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">Flaş İndirimler</span>
        </div>
        <div className="space-y-2">
          {flashDeals.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 p-2 rounded-xl border border-transparent hover:border-border hover:bg-secondary/60 transition-all duration-150 group"
            >
              <div className="relative h-11 w-11 flex-shrink-0 rounded-lg overflow-hidden ring-1 ring-border/40">
                <Image src={item.image} alt={item.label} fill className="object-cover" sizes="44px" />
              </div>
              <span className="flex-1 text-sm font-medium text-foreground/80 group-hover:text-foreground">{item.label}</span>
              <span className="text-xs font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-md">{item.badge}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* New Arrivals */}
      <div>
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
          <PackagePlus className="h-4 w-4 text-green-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">Yeni Ürünler</span>
        </div>
        <div className="space-y-2">
          {newArrivals.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 p-2 rounded-xl border border-transparent hover:border-border hover:bg-secondary/60 transition-all duration-150 group"
            >
              <div className="relative h-11 w-11 flex-shrink-0 rounded-lg overflow-hidden ring-1 ring-border/40">
                <Image src={item.image} alt={item.label} fill className="object-cover" sizes="44px" />
              </div>
              <span className="flex-1 text-sm font-medium text-foreground/80 group-hover:text-foreground">{item.label}</span>
              <span className="text-[10px] font-bold text-white bg-green-500 px-1.5 py-0.5 rounded-md">YENİ</span>
            </Link>
          ))}
        </div>
        <Link
          href="/products?sort=newest"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 mt-4 text-xs text-primary font-semibold hover:underline"
        >
          Tüm yeni ürünler <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// CategoryPanel — shown when a category is hovered
// ---------------------------------------------------------------------------
function CategoryPanel({ category, onClose }: { category: Category; onClose: () => void }) {
  return (
    <div className="flex-1 py-6 px-6 flex gap-8 overflow-hidden">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/50">
          <h3 className="font-semibold text-base text-foreground">{category.name}</h3>
          <Link
            href={`/category/${category.slug}`}
            onClick={onClose}
            className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
          >
            Tümünü gör <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {category.subcategories && category.subcategories.length > 0 ? (
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-0.5">
            {category.subcategories.map((sub) => (
              <Link
                key={sub.id}
                href={`/category/${category.slug}?sub=${sub.slug}`}
                onClick={onClose}
                className="flex items-center gap-2.5 py-2 px-2 rounded-lg text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-150 group"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-border group-hover:bg-primary transition-colors flex-shrink-0" />
                <span className="font-medium">{sub.name}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{category.description}</p>
        )}
      </div>

      {category.featured && (
        <div className="w-48 flex-shrink-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Öne Çıkan</p>
          <Link
            href={category.featured.href}
            onClick={onClose}
            className="block group rounded-xl overflow-hidden ring-1 ring-border/40 hover:ring-primary/40 transition-all duration-200"
          >
            <div className="relative aspect-[4/3] bg-secondary">
              <Image
                src={category.featured.image}
                alt={category.featured.label}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="192px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-xs font-semibold leading-snug">{category.featured.label}</p>
              </div>
            </div>
          </Link>
          <Link
            href={`/category/${category.slug}`}
            onClick={onClose}
            className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition-all duration-150"
          >
            Kategoriye git <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// MegaMenu — exported, used by Header
// ---------------------------------------------------------------------------
export function MegaMenu({ onClose }: { onClose: () => void }) {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  const handleCatEnter = useCallback((cat: Category) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => setActiveCategory(cat), 80)
  }, [])

  const handleLeave = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => setActiveCategory(null), 120)
  }, [])

  const handlePanelEnter = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
  }, [])

  const handleCatClick = useCallback((slug: string) => {
    onClose()
    router.push(`/category/${slug}`)
  }, [onClose, router])

  useEffect(() => {
    return () => { if (hoverTimer.current) clearTimeout(hoverTimer.current) }
  }, [])

  return (
    <div
      className="absolute top-full left-0 right-0 z-50 bg-background border-b shadow-2xl"
      style={{ animation: "megaMenuIn 0.15s ease-out both" }}
      onMouseLeave={onClose}
    >
      <div className="container mx-auto px-4">
        <div className="flex" style={{ minHeight: 360 }}>

          {/* Left: category list */}
          <nav
            className="w-56 border-r py-3 flex-shrink-0 bg-secondary/20"
            aria-label="Kategori listesi"
          >
            {categories.map((cat) => {
              const Icon = ICON_MAP[cat.icon] || Smartphone
              const isActive = activeCategory?.id === cat.id
              return (
                <div
                  key={cat.id}
                  role="menuitem"
                  tabIndex={0}
                  aria-label={`${cat.name} kategorisi`}
                  className={cn(
                    "relative flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg cursor-pointer select-none transition-all duration-100 group",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground hover:bg-secondary"
                  )}
                  onMouseEnter={() => handleCatEnter(cat)}
                  onMouseLeave={handleLeave}
                  onClick={() => handleCatClick(cat.slug)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      handleCatClick(cat.slug)
                    }
                  }}
                >
                  <Icon className={cn(
                    "h-4 w-4 flex-shrink-0 transition-colors",
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
                  )} />
                  <span className={cn(
                    "flex-1 text-sm font-medium truncate",
                    isActive ? "text-primary-foreground" : ""
                  )}>
                    {cat.name}
                  </span>
                  <ChevronRight className={cn(
                    "h-3.5 w-3.5 flex-shrink-0 transition-all duration-100",
                    isActive
                      ? "text-primary-foreground/80 translate-x-0.5"
                      : "text-muted-foreground/40 group-hover:text-muted-foreground"
                  )} />
                  {isActive && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-primary-foreground/60" />
                  )}
                </div>
              )
            })}

            <Separator className="my-2 mx-2" />

            <Link
              href="/categories"
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2.5 mx-2 text-sm text-primary font-semibold hover:bg-primary/5 rounded-lg transition-colors"
            >
              <LayoutGrid className="h-4 w-4" />
              Tüm Kategoriler
              <ArrowRight className="h-3.5 w-3.5 ml-auto" />
            </Link>
          </nav>

          {/* Right: default or category panel */}
          <div
            className="flex-1 overflow-hidden"
            onMouseEnter={handlePanelEnter}
            onMouseLeave={handleLeave}
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
