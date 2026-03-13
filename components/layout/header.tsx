"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useRef, useEffect } from "react"
import { usePathname } from "next/navigation"
import {
  Search, ShoppingCart, ChevronDown, ChevronRight,
  Smartphone, Shirt, Home, Sparkles, Dumbbell, Baby,
  Watch, ShoppingBasket, Heart, BookOpen, ArrowRight,
  LayoutGrid, X, Tag, Store, UserCircle, ShoppingBag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
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

const ICON_MAP: Record<string, React.ElementType> = {
  Smartphone, Shirt, Home, Sparkles, Dumbbell, Baby, Watch, ShoppingBasket, Heart, BookOpen,
}

const MEGA_MENU_CATEGORIES = categories.slice(0, 6)

function MegaMenu({ onClose }: { onClose: () => void }) {
  const [activeCategory, setActiveCategory] = useState<Category>(MEGA_MENU_CATEGORIES[0])

  return (
    <div
      className="absolute top-full left-0 right-0 z-50 bg-background border-b shadow-2xl animate-mega-menu-in"
      onMouseLeave={onClose}
    >
      <div className="container mx-auto px-4">
        <div className="flex" style={{ minHeight: 340 }}>
          {/* Category list */}
          <div className="w-60 border-r py-3 flex-shrink-0">
            {MEGA_MENU_CATEGORIES.map((cat) => {
              const Icon = ICON_MAP[cat.icon] || Smartphone
              const isActive = activeCategory.id === cat.id
              return (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-all duration-150 group",
                    isActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-foreground hover:bg-secondary"
                  )}
                  onMouseEnter={() => setActiveCategory(cat)}
                  onClick={onClose}
                >
                  <Icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
                  <span className="flex-1 truncate">{cat.name}</span>
                  <span className={cn("text-xs tabular-nums", isActive ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    {cat.productCount}
                  </span>
                  <ChevronRight className={cn("h-3.5 w-3.5 flex-shrink-0", isActive ? "text-primary-foreground/70" : "text-muted-foreground/50")} />
                </Link>
              )
            })}
            <Separator className="my-2" />
            <Link
              href="/categories"
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-primary font-medium hover:underline"
              onClick={onClose}
            >
              Tüm Kategoriler
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Subcategory panel */}
          <div className="flex-1 py-5 px-6">
            <div className="flex gap-8">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">{activeCategory.name}</h3>
                  <Link
                    href={`/category/${activeCategory.slug}`}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                    onClick={onClose}
                  >
                    Tümünü gör <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                {activeCategory.subcategories && activeCategory.subcategories.length > 0 ? (
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                    {activeCategory.subcategories.map((sub) => (
                      <Link
                        key={sub.id}
                        href={sub.href}
                        onClick={onClose}
                        className="flex items-center gap-2 py-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
                      >
                        <span className="h-1 w-1 rounded-full bg-border group-hover:bg-primary transition-colors flex-shrink-0" />
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{activeCategory.description}</p>
                )}
              </div>

              {activeCategory.featured && (
                <div className="w-44 flex-shrink-0">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Öne Çıkan</p>
                  <Link href={activeCategory.featured.href} onClick={onClose} className="block group">
                    <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-secondary">
                      <Image
                        src={activeCategory.featured.image}
                        alt={activeCategory.featured.label}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-white text-xs font-medium leading-tight">{activeCategory.featured.label}</p>
                      </div>
                    </div>
                  </Link>
                </div>
              )}
            </div>
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
            <Image src="/images/marketin24-logo.png" alt="Marketin24" width={150} height={50} className="h-9 w-auto" priority />
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

            {/* Account — desktop only (bottom nav handles mobile + tablet) */}
            <Link href="/account" className="hidden lg:inline-flex">
              <Button variant="ghost" size="icon" aria-label="Hesabim">
                <UserCircle className="h-5 w-5" />
              </Button>
            </Link>

            {/* Favorites — desktop only (bottom nav handles mobile + tablet) */}
            <Link href="/wishlist" className="hidden lg:inline-flex">
              <Button variant="ghost" size="icon" aria-label="Favorilerim" className="relative overflow-visible">
                <Heart className="h-5 w-5" />
                {wishlistItems.length > 0 && (
                  <Badge variant="default" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs pointer-events-none">
                    {wishlistItems.length > 99 ? "99+" : wishlistItems.length}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Cart — desktop only (bottom nav handles mobile + tablet) */}
            <div className="hidden lg:flex">
              <DynamicCartButton />
            </div>

            {/* Hamburger — mobile + tablet, opens category/nav sheet */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <LayoutGrid className="h-5 w-5" />
                  <span className="sr-only">Menüyü aç</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[340px] p-0 overflow-y-auto">
                <div className="flex flex-col h-full">

                  {/* Sheet header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b bg-secondary/40">
                    <Image src="/images/marketin24-logo.png" alt="Marketin24" width={120} height={40} className="h-8 w-auto" />
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
                                  href={sub.href}
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
