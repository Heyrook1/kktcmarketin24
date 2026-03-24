"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useRef, useEffect } from "react"
import { usePathname } from "next/navigation"
import {
  Search, ShoppingCart, ChevronDown, ChevronRight,
  Smartphone, Shirt, Home, Sparkles, Dumbbell, Baby,
  Watch, ShoppingBasket, Heart, BookOpen, ArrowRight,
  LayoutGrid, X, Tag, Store, UserCircle, ShoppingBag, LogIn,
  Flame, Zap, PackagePlus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useCartStore } from "@/lib/store/cart-store"
import { useWishlistStore } from "@/lib/store/wishlist-store"
import { categories, type Category } from "@/lib/data/categories"
import { SearchBar } from "@/components/shared/search-bar"
import { CartDrawer } from "@/components/cart/cart-drawer"
import { LanguageSelector } from "@/components/shared/language-selector"
import { CurrencySelector } from "@/components/shared/currency-selector"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

const ICON_MAP: Record<string, React.ElementType> = {
  Smartphone, Shirt, Home, Sparkles, Dumbbell, Baby, Watch, ShoppingBasket, Heart, BookOpen,
}

import Link from "next/link"
import Image from "next/image"
import { useState, useRef, useEffect, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  Search, ShoppingCart, ChevronDown, ChevronRight,
  Smartphone, Shirt, Home, Sparkles, Dumbbell, Baby,
  Watch, ShoppingBasket, Heart, BookOpen, ArrowRight,
  LayoutGrid, X, Tag, Store, UserCircle, ShoppingBag, LogIn,
  Flame, Zap, PackagePlus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useCartStore } from "@/lib/store/cart-store"
import { useWishlistStore } from "@/lib/store/wishlist-store"
import { categories, type Category } from "@/lib/data/categories"
import { SearchBar } from "@/components/shared/search-bar"
import { CartDrawer } from "@/components/cart/cart-drawer"
import { LanguageSelector } from "@/components/shared/language-selector"
import { CurrencySelector } from "@/components/shared/currency-selector"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

const ICON_MAP: Record<string, React.ElementType> = {
  Smartphone, Shirt, Home, Sparkles, Dumbbell, Baby, Watch, ShoppingBasket, Heart, BookOpen,
}

const MEGA_MENU_CATEGORIES = categories

// ---------------------------------------------------------------------------
// DefaultPanel — shown when no category is hovered
// ---------------------------------------------------------------------------
function DefaultPanel({ onClose }: { onClose: () => void }) {
  const trending = [
    { label: "Cep Telefonları", href: "/category/electronics?sub=phones", icon: Smartphone },
    { label: "Kadın Giyim",     href: "/category/fashion?sub=womens",     icon: Shirt },
    { label: "Cilt Bakımı",     href: "/category/beauty?sub=skincare",    icon: Sparkles },
    { label: "Fitness",         href: "/category/sports?sub=fitness",     icon: Dumbbell },
    { label: "Oyuncaklar",      href: "/category/kids-baby?sub=toys",     icon: Baby },
    { label: "Saatler",         href: "/category/jewelry?sub=watches",    icon: Watch },
  ]
  const flashDeals = [
    { label: "Kulaklıklar",  href: "/category/electronics?sub=audio",    badge: "%40", image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=80&h=80&fit=crop" },
    { label: "Spor Ayakkabı",href: "/category/sports?sub=running",       badge: "%30", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=80&h=80&fit=crop" },
    { label: "Parfüm",       href: "/category/beauty?sub=fragrance",     badge: "%25", image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=80&h=80&fit=crop" },
  ]
  const newArrivals = [
    { label: "Yeni Elektronik",   href: "/products?sort=newest&category=electronics", image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=80&h=80&fit=crop" },
    { label: "Yeni Moda",         href: "/products?sort=newest&category=fashion",     image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=80&h=80&fit=crop" },
    { label: "Yeni Ev Ürünleri",  href: "/products?sort=newest&category=home-garden", image: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=80&h=80&fit=crop" },
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
              <Link key={item.href} href={item.href} onClick={onClose}
                className="flex items-center gap-3 py-2 px-2 rounded-lg text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-150 group">
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
            <Link key={item.href} href={item.href} onClick={onClose}
              className="flex items-center gap-3 p-2 rounded-xl border border-transparent hover:border-border hover:bg-secondary/60 transition-all duration-150 group">
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
            <Link key={item.href} href={item.href} onClick={onClose}
              className="flex items-center gap-3 p-2 rounded-xl border border-transparent hover:border-border hover:bg-secondary/60 transition-all duration-150 group">
              <div className="relative h-11 w-11 flex-shrink-0 rounded-lg overflow-hidden ring-1 ring-border/40">
                <Image src={item.image} alt={item.label} fill className="object-cover" sizes="44px" />
              </div>
              <span className="flex-1 text-sm font-medium text-foreground/80 group-hover:text-foreground">{item.label}</span>
              <span className="text-[10px] font-bold text-white bg-green-500 px-1.5 py-0.5 rounded-md">YENİ</span>
            </Link>
          ))}
        </div>
        <Link href="/products?sort=newest" onClick={onClose}
          className="inline-flex items-center gap-1.5 mt-4 text-xs text-primary font-semibold hover:underline">
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
    <div className="flex-1 py-6 px-6 flex gap-8 overflow-hidden animate-fade-in">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/50">
          <h3 className="font-semibold text-base text-foreground">{category.name}</h3>
          <Link href={`/category/${category.slug}`} onClick={onClose}
            className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
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
          <Link href={category.featured.href} onClick={onClose} className="block group rounded-xl overflow-hidden ring-1 ring-border/40 hover:ring-primary/40 transition-all duration-200">
            <div className="relative aspect-[4/3] bg-secondary">
              <Image src={category.featured.image} alt={category.featured.label} fill
                className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="192px" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-xs font-semibold leading-snug">{category.featured.label}</p>
              </div>
            </div>
          </Link>
          <Link href={`/category/${category.slug}`} onClick={onClose}
            className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition-all duration-150">
            Kategoriye git <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// MegaMenu
// ---------------------------------------------------------------------------
function MegaMenu({ onClose }: { onClose: () => void }) {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleCatEnter = useCallback((cat: Category) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => setActiveCategory(cat), 80)
  }, [])

  const handleCatLeaveAll = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => setActiveCategory(null), 120)
  }, [])

  const handlePanelEnter = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
  }, [])

  useEffect(() => () => { if (hoverTimer.current) clearTimeout(hoverTimer.current) }, [])

  return (
    <div
      className="absolute top-full left-0 right-0 z-50 bg-background border-b shadow-2xl"
      style={{ animation: "megaMenuIn 0.15s ease-out both" }}
      onMouseLeave={onClose}
    >
      <div className="container mx-auto px-4">
        <div className="flex" style={{ minHeight: 360 }}>
          {/* Left: category list */}
          <div className="w-56 border-r py-3 flex-shrink-0 bg-secondary/20">
            {MEGA_MENU_CATEGORIES.map((cat) => {
              const Icon = ICON_MAP[cat.icon] || Smartphone
              const isActive = activeCategory?.id === cat.id
              return (
                <div
                  key={cat.id}
                  className={cn(
                    "relative flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg cursor-pointer select-none transition-all duration-100 group",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground hover:bg-secondary"
                  )}
                  onMouseEnter={() => handleCatEnter(cat)}
                  onMouseLeave={handleCatLeaveAll}
                  onClick={() => onClose()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && onClose()}
                >
                  <Icon className={cn("h-4 w-4 flex-shrink-0 transition-colors", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
                  <span className={cn("flex-1 text-sm font-medium truncate", isActive ? "text-primary-foreground" : "")}>{cat.name}</span>
                  <ChevronRight className={cn("h-3.5 w-3.5 flex-shrink-0 transition-all duration-100",
                    isActive ? "text-primary-foreground/80 translate-x-0.5" : "text-muted-foreground/40 group-hover:text-muted-foreground")} />
                  {/* Active bar */}
                  {isActive && <span className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-primary-foreground/60" />}
                </div>
              )
            })}
            <Separator className="my-2 mx-2" />
            <Link href="/categories" onClick={onClose}
              className="flex items-center gap-2 px-4 py-2.5 mx-2 text-sm text-primary font-semibold hover:bg-primary/5 rounded-lg transition-colors">
              <LayoutGrid className="h-4 w-4" />
              Tüm Kategoriler
              <ArrowRight className="h-3.5 w-3.5 ml-auto" />
            </Link>
          </div>

          {/* Right: default or category panel */}
          <div className="flex-1 overflow-hidden" onMouseEnter={handlePanelEnter}>
            {activeCategory === null
              ? <DefaultPanel onClose={onClose} />
              : <CategoryPanel key={activeCategory.id} category={activeCategory} onClose={onClose} />
            }
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Dynamic cart button — shows item count, last-added thumbnail, bump on add
// ---------------------------------------------------------------------------
function DynamicCartButton() {
  const { getTotalItems, items, openCart } = useCartStore()
  const totalItems = getTotalItems()
  const lastItem = items[items.length - 1] ?? null
  const prevCount = useRef(totalItems)
  const [bumping, setBumping] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Trigger bump animation whenever an item is added
  useEffect(() => {
    if (totalItems > prevCount.current) {
      setBumping(true)
      setShowPreview(true)
      const bumpTimer = setTimeout(() => setBumping(false), 400)
      const previewTimer = setTimeout(() => setShowPreview(false), 2200)
      prevCount.current = totalItems
      return () => { clearTimeout(bumpTimer); clearTimeout(previewTimer) }
    }
    prevCount.current = totalItems
  }, [totalItems])

  return (
    <button
      onClick={openCart}
      aria-label={`Sepet${totalItems > 0 ? ` — ${totalItems} ürün` : ""}`}
      className={cn(
        "relative flex items-center gap-2 rounded-xl border border-border/60 bg-secondary/60 px-2.5 py-1.5 text-sm font-medium transition-all duration-200",
        "hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        bumping && "scale-110 border-primary/50 bg-primary/10",
      )}
    >
      {/* Icon */}
      <span className={cn("relative flex items-center justify-center", bumping && "animate-bounce")}>
        <ShoppingCart className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
        {totalItems > 0 && (
          <span className={cn(
            "absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 text-[10px] font-bold text-primary-foreground leading-none transition-transform",
            bumping && "scale-125"
          )}>
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        )}
      </span>

      {/* Last-added product preview — slides in on add */}
      {lastItem && showPreview && (
        <span className="flex items-center gap-1.5 animate-slide-in-up overflow-hidden">
          <span className="relative h-6 w-6 flex-shrink-0 overflow-hidden rounded-md border border-border/60">
            <Image
              src={lastItem.product.images?.[0] ?? "/placeholder.svg"}
              alt={lastItem.product.name}
              fill
              className="object-cover"
              sizes="24px"
            />
          </span>
          <span className="max-w-[80px] truncate text-xs text-foreground/80">
            {lastItem.product.name}
          </span>
        </span>
      )}

      {/* Static label when nothing animating */}
      {(!showPreview || !lastItem) && totalItems > 0 && (
        <span className="hidden sm:inline text-xs text-muted-foreground">
          Sepet
        </span>
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// AuthButton — shows "Giriş Yap" for guests, account icon for logged-in users
// ---------------------------------------------------------------------------
function AuthButton() {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    // Initial session check
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setReady(true)
    })
    // Keep in sync with sign-in / sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Render nothing until we know auth state to avoid flash
  if (!ready) return <div className="h-8 w-8" />

  if (user) {
    return (
      <Link href="/account" className="hidden md:inline-flex">
        <Button variant="ghost" size="icon" aria-label="Hesabım">
          <UserCircle className="h-5 w-5" />
        </Button>
      </Link>
    )
  }

  return (
    <Link href="/auth/login" className="hidden md:inline-flex">
      <Button variant="ghost" size="sm" aria-label="Giriş Yap" className="gap-1.5 text-sm font-medium">
        <LogIn className="h-4 w-4" />
        <span>Giriş Yap</span>
      </Button>
    </Link>
  )
}

export function Header() {
  const pathname = usePathname()
  const { getTotalItems, openCart } = useCartStore()
  const { items: wishlistItems } = useWishlistStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [megaMenuOpen, setMegaMenuOpen] = useState(false)
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState<string | null>(null)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const megaWrapRef = useRef<HTMLDivElement>(null)
  const totalItems = getTotalItems()

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (megaWrapRef.current && !megaWrapRef.current.contains(e.target as Node)) {
        setMegaMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-3">

          {/* ── Logo ── */}
          <Link href="/" className="flex-shrink-0">
            <Image src="/images/kktc-marketin24-logo.png" alt="KKTC Marketin24" width={140} height={140} className="h-11 w-auto" priority />
          </Link>

          {/* ── Desktop nav ── */}
          <nav className="hidden lg:flex items-center gap-0.5" ref={megaWrapRef}>

            {/* Kategoriler mega-menu trigger — Fix 3: keyboard accessible via onFocus */}
            <button
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors",
                megaMenuOpen
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-secondary"
              )}
              onMouseEnter={() => setMegaMenuOpen(true)}
              onFocus={() => setMegaMenuOpen(true)}
              onBlur={(e) => {
                // only close if focus leaves the mega-menu wrapper entirely
                if (!megaWrapRef.current?.contains(e.relatedTarget as Node)) {
                  setMegaMenuOpen(false)
                }
              }}
              onClick={() => setMegaMenuOpen((v) => !v)}
              aria-expanded={megaMenuOpen}
              aria-haspopup="true"
            >
              <LayoutGrid className="h-4 w-4" />
              Kategoriler
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", megaMenuOpen && "rotate-180")} />
            </button>

            {/* Fix 1: active-state classes driven by pathname for each nav link */}
            <Link
              href="/products"
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname === "/products" || pathname.startsWith("/products/")
                  ? "bg-secondary text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Tag className="h-4 w-4" />
              Ürünler
            </Link>
            <Link
              href="/vendors"
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname === "/vendors" || pathname.startsWith("/vendors/")
                  ? "bg-secondary text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Store className="h-4 w-4" />
              Satıcılar
            </Link>
            <Link
              href="/compare"
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname === "/compare"
                  ? "bg-secondary text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              Karşılaştır
            </Link>
          </nav>

          {/* ── Search bar — desktop ── */}
          <div className="hidden lg:flex flex-1 max-w-sm xl:max-w-md mx-2">
            <SearchBar />
          </div>

          {/* ── Right actions ── */}
          <div className="flex items-center gap-0.5">

            {/* Search icon — tablet only (md to lg) */}
            <Sheet open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden md:flex lg:hidden">
                  <Search className="h-5 w-5" />
                  <span className="sr-only">Ara</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="top" className="h-auto">
                <VisuallyHidden.Root>
                  <SheetTitle>Ara</SheetTitle>
                </VisuallyHidden.Root>
                <div className="pt-6 pb-4 px-2">
                  <SearchBar autoFocus />
                </div>
              </SheetContent>
            </Sheet>

            {/* Language + Currency — visible on all sizes */}
            <div className="flex items-center gap-1.5">
              <CurrencySelector />
              <LanguageSelector />
            </div>

            {/* Account — shows login button for guests, account icon for authenticated users */}
            <AuthButton />

            {/* Favorites — tablet + desktop (bottom nav handles mobile only) */}
            <Link href="/wishlist" className="hidden md:inline-flex">
              <Button variant="ghost" size="icon" aria-label="Favorilerim" className="relative overflow-visible">
                <Heart className="h-5 w-5" />
                {wishlistItems.length > 0 && (
                  <Badge variant="default" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs pointer-events-none">
                    {wishlistItems.length > 99 ? "99+" : wishlistItems.length}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Cart — tablet + desktop (bottom nav handles mobile only) */}
            <div className="hidden md:flex">
              <DynamicCartButton />
            </div>

            {/* Hamburger — mobile + tablet, opens category/nav sheet */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden md:flex lg:hidden">
                  <LayoutGrid className="h-5 w-5" />
                  <span className="sr-only">Menüyü aç</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[340px] p-0 overflow-y-auto">
                <VisuallyHidden.Root>
                  <SheetTitle>Menü</SheetTitle>
                </VisuallyHidden.Root>
                <div className="flex flex-col h-full">

                  {/* Sheet header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b bg-secondary/40">
                    <Image src="/images/kktc-marketin24-logo.png" alt="KKTC Marketin24" width={100} height={100} className="h-10 w-auto" />
                    <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Quick nav links */}
                  <div className="px-3 py-2 border-b flex gap-1">
                    {[
                      { href: "/products", label: "Tüm Ürünler", icon: Tag },
                      { href: "/vendors", label: "Satıcılar", icon: Store },
                      { href: "/wishlist", label: "Favoriler", icon: Heart },
                      { href: "/compare", label: "Karşılaştır", icon: LayoutGrid },
                    ].map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-primary hover:bg-secondary transition-colors text-center"
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </Link>
                    ))}
                  </div>

                  {/* Category list with collapsible subcats */}
                  <div className="flex-1 overflow-y-auto px-3 py-2">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest px-1 py-2">
                      Kategoriler
                    </p>
                    {categories.map((cat) => {
                      const Icon = ICON_MAP[cat.icon] || Smartphone
                      const isOpen = mobileCategoryOpen === cat.id
                      return (
                        <div key={cat.id} className="mb-0.5">
                          <button
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-secondary transition-colors"
                            onClick={() => setMobileCategoryOpen(isOpen ? null : cat.id)}
                          >
                            <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="flex-1 text-left font-medium">{cat.name}</span>
                            <span className="text-xs text-muted-foreground tabular-nums mr-1">{cat.productCount}</span>
                            {cat.subcategories && (
                              <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
                            )}
                          </button>
                          {isOpen && cat.subcategories && (
                            <div className="pl-10 pb-1 space-y-0.5">
                              <Link
                                href={`/category/${cat.slug}`}
                                className="block py-1.5 text-xs text-primary font-semibold hover:underline"
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                Tümünü gör →
                              </Link>
                              {cat.subcategories.map((sub) => (
                                <Link
                                  key={sub.id}
                                  href={`/category/${cat.slug}?sub=${sub.slug}`}
                                  className="block py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                  onClick={() => setMobileMenuOpen(false)}
                                >
                                  {sub.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Sheet footer */}
                  <div className="border-t px-4 py-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">Dil &amp; Para Birimi</p>
                    <div className="flex items-center gap-2">
                      <CurrencySelector />
                      <LanguageSelector />
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Mega menu panel — outside container so it's full-width */}
      {megaMenuOpen && (
        <div onMouseEnter={() => setMegaMenuOpen(true)}>
          <MegaMenu onClose={() => setMegaMenuOpen(false)} />
        </div>
      )}

      <CartDrawer />
    </header>
  )
}
