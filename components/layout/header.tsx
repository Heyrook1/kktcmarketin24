"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useRef, useEffect } from "react"
import { usePathname } from "next/navigation"
import {
  Search, ShoppingCart, ChevronDown, Heart,
  LayoutGrid, X, Tag, Store, UserCircle, LogIn,
  Smartphone, Shirt, Home, Sparkles, Dumbbell, Baby,
  Watch, ShoppingBasket, BookOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"
import { Badge } from "@/components/ui/badge"
import { useCartStore } from "@/lib/store/cart-store"
import { useWishlistStore } from "@/lib/store/wishlist-store"
import { categories } from "@/lib/data/categories"
import { SearchBar } from "@/components/shared/search-bar"
import { CartDrawer } from "@/components/cart/cart-drawer"
import { LanguageSelector } from "@/components/shared/language-selector"
import { CurrencySelector } from "@/components/shared/currency-selector"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { MegaMenu } from "@/components/layout/mega-menu"

const ICON_MAP: Record<string, React.ElementType> = {
  Smartphone, Shirt, Home, Sparkles, Dumbbell, Baby,
  Watch, ShoppingBasket, Heart, BookOpen,
}

// ---------------------------------------------------------------------------
// DynamicCartButton
// ---------------------------------------------------------------------------
function DynamicCartButton() {
  const { getTotalItems, items, openCart } = useCartStore()
  const totalItems = getTotalItems()
  const lastItem = items[items.length - 1] ?? null
  const prevCount = useRef(totalItems)
  const [bumping, setBumping] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (totalItems > prevCount.current) {
      setBumping(true)
      setShowPreview(true)
      const t1 = setTimeout(() => setBumping(false), 400)
      const t2 = setTimeout(() => setShowPreview(false), 2200)
      prevCount.current = totalItems
      return () => { clearTimeout(t1); clearTimeout(t2) }
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
      <span className={cn("relative flex items-center justify-center", bumping && "animate-bounce")}>
        <ShoppingCart style={{ width: 18, height: 18 }} />
        {totalItems > 0 && (
          <span className={cn(
            "absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 text-[10px] font-bold text-primary-foreground leading-none transition-transform",
            bumping && "scale-125"
          )}>
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        )}
      </span>

      {lastItem && showPreview ? (
        <span className="flex items-center gap-1.5 overflow-hidden">
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
      ) : totalItems > 0 ? (
        <span className="hidden sm:inline text-xs text-muted-foreground">Sepet</span>
      ) : null}
    </button>
  )
}

// ---------------------------------------------------------------------------
// AuthButton
// ---------------------------------------------------------------------------
function AuthButton() {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setReady(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

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

// ---------------------------------------------------------------------------
// Header (exported)
// ---------------------------------------------------------------------------
export function Header() {
  const pathname = usePathname()
  const { getTotalItems, openCart } = useCartStore()
  const { items: wishlistItems } = useWishlistStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [megaMenuOpen, setMegaMenuOpen] = useState(false)
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState<string | null>(null)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const megaWrapRef = useRef<HTMLDivElement>(null)

  // Close mega-menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (megaWrapRef.current && !megaWrapRef.current.contains(e.target as Node)) {
        setMegaMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // Close mega-menu on route change
  useEffect(() => {
    setMegaMenuOpen(false)
    setMobileMenuOpen(false)
  }, [pathname])

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-3">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/images/kktc-marketin24-logo.png"
              alt="KKTC Marketin24"
              width={140}
              height={140}
              className="h-11 w-auto"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5" ref={megaWrapRef}>
            {/* Kategoriler mega-menu trigger */}
            <button
              type="button"
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors",
                megaMenuOpen
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-secondary"
              )}
              onMouseEnter={() => setMegaMenuOpen(true)}
              onClick={() => setMegaMenuOpen((v) => !v)}
              aria-expanded={megaMenuOpen}
              aria-haspopup="true"
            >
              <LayoutGrid className="h-4 w-4" />
              Kategoriler
              <ChevronDown className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                megaMenuOpen && "rotate-180"
              )} />
            </button>

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

          {/* Desktop search */}
          <div className="hidden lg:flex flex-1 max-w-sm xl:max-w-md mx-2">
            <SearchBar />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-0.5">

            {/* Search — tablet only */}
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

            {/* Language + Currency */}
            <div className="flex items-center gap-1.5">
              <CurrencySelector />
              <LanguageSelector />
            </div>

            <AuthButton />

            {/* Wishlist */}
            <Link href="/wishlist" className="hidden md:inline-flex">
              <Button variant="ghost" size="icon" aria-label="Favorilerim" className="relative overflow-visible">
                <Heart className="h-5 w-5" />
                {wishlistItems.length > 0 && (
                  <Badge
                    variant="default"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs pointer-events-none"
                  >
                    {wishlistItems.length > 99 ? "99+" : wishlistItems.length}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Cart */}
            <div className="hidden md:flex">
              <DynamicCartButton />
            </div>

            {/* Mobile hamburger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
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
                    <Image
                      src="/images/kktc-marketin24-logo.png"
                      alt="KKTC Marketin24"
                      width={100}
                      height={100}
                      className="h-10 w-auto"
                    />
                    <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Quick nav */}
                  <div className="px-3 py-2 border-b flex gap-1">
                    {[
                      { href: "/products", label: "Tüm Ürünler", icon: Tag },
                      { href: "/vendors",  label: "Satıcılar",   icon: Store },
                      { href: "/wishlist", label: "Favoriler",   icon: Heart },
                      { href: "/compare",  label: "Karşılaştır", icon: LayoutGrid },
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

                  {/* Category list */}
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
                            type="button"
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-secondary transition-colors"
                            onClick={() => setMobileCategoryOpen(isOpen ? null : cat.id)}
                          >
                            <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="flex-1 text-left font-medium">{cat.name}</span>
                            {cat.subcategories && (
                              <ChevronDown className={cn(
                                "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                                isOpen && "rotate-180"
                              )} />
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

      {/* Mega menu — full width below header, z-index above header content */}
      {megaMenuOpen && (
        <div
          className="relative z-50"
          onMouseEnter={() => setMegaMenuOpen(true)}
        >
          <MegaMenu onClose={() => setMegaMenuOpen(false)} />
        </div>
      )}

      <CartDrawer />
    </header>
  )
}
