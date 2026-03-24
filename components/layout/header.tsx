"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useRef, useEffect } from "react"
import { usePathname } from "next/navigation"
import {
  Search, ShoppingCart, ChevronDown,
  LayoutGrid, X, Store, UserCircle, LogIn, Heart,
  Smartphone, Shirt, Home, Sparkles, Dumbbell, Baby,
  Watch, ShoppingBasket, BookOpen, ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className={cn("relative transition-transform", bumping && "scale-125")}
        onClick={openCart}
        aria-label={`Sepet (${totalItems} ürün)`}
      >
        <ShoppingCart className="h-5 w-5" />
        {totalItems > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1.5 -right-1.5 h-5 w-5 p-0 flex items-center justify-center text-[10px] font-bold"
          >
            {totalItems > 99 ? "99+" : totalItems}
          </Badge>
        )}
      </Button>

      {showPreview && lastItem && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-background rounded-xl shadow-xl border p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Sepete eklendi</p>
          <div className="flex items-center gap-3">
            {lastItem.image && (
              <div className="relative h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-secondary">
                <Image src={lastItem.image} alt={lastItem.name} fill className="object-cover" sizes="48px" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{lastItem.name}</p>
              <p className="text-xs text-primary font-bold">
                {lastItem.price.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="w-full mt-3 h-8 text-xs"
            onClick={openCart}
          >
            Sepete git
          </Button>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// WishlistButton
// ---------------------------------------------------------------------------
function WishlistButton() {
  const { items } = useWishlistStore()
  return (
    <Link href="/wishlist" aria-label={`Favoriler (${items.length} ürün)`}>
      <Button variant="ghost" size="icon" className="relative">
        <Heart className="h-5 w-5" />
        {items.length > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1.5 -right-1.5 h-5 w-5 p-0 flex items-center justify-center text-[10px] font-bold"
          >
            {items.length}
          </Badge>
        )}
      </Button>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// UserMenu
// ---------------------------------------------------------------------------
function UserMenu({ user }: { user: User | null }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  if (!user) {
    return (
      <div className="hidden lg:flex items-center gap-2">
        <Link href="/auth/login">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <LogIn className="h-4 w-4" />
            Giriş
          </Button>
        </Link>
        <Link href="/auth/sign-up">
          <Button size="sm">Kayıt Ol</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="relative hidden lg:block" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full px-3 py-1.5 hover:bg-secondary transition-colors text-sm font-medium"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <UserCircle className="h-5 w-5 text-muted-foreground" />
        <span className="max-w-[100px] truncate">
          {user.user_metadata?.full_name ?? user.email?.split("@")[0]}
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          className="absolute top-full right-0 mt-2 w-52 bg-background rounded-xl shadow-xl border py-1 z-50"
          role="menu"
        >
          <div className="px-3 py-2 border-b mb-1">
            <p className="text-xs text-muted-foreground">Giriş yapıldı</p>
            <p className="text-sm font-medium truncate">{user.email}</p>
          </div>
          {[
            { href: "/account", label: "Hesabım", icon: UserCircle },
            { href: "/account?tab=orders", label: "Siparişlerim", icon: ShoppingCart },
            { href: "/wishlist", label: "Favorilerim", icon: Heart },
            { href: "/vendor-panel", label: "Satıcı Paneli", icon: Store },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-secondary transition-colors"
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              {label}
            </Link>
          ))}
          <Separator className="my-1" />
          <button
            role="menuitem"
            onClick={handleSignOut}
            className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-secondary transition-colors w-full text-left text-destructive"
          >
            <LogIn className="h-4 w-4" />
            Çıkış Yap
          </button>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------
export function Header() {
  const pathname = usePathname()
  const [megaMenuOpen, setMegaMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [expandedCat, setExpandedCat] = useState<string | null>(null)
  const megaRef = useRef<HTMLDivElement>(null)
  const megaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close mega menu on route change
  useEffect(() => {
    setMegaMenuOpen(false)
    setMobileMenuOpen(false)
    setMobileSearchOpen(false)
  }, [pathname])

  // Auth state
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const openMegaMenu = () => {
    if (megaTimerRef.current) clearTimeout(megaTimerRef.current)
    setMegaMenuOpen(true)
  }

  const closeMegaMenu = () => {
    megaTimerRef.current = setTimeout(() => setMegaMenuOpen(false), 80)
  }

  useEffect(() => {
    return () => { if (megaTimerRef.current) clearTimeout(megaTimerRef.current) }
  }, [])

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top bar */}
      <div className="border-b bg-secondary/50">
        <div className="container mx-auto px-4 h-8 flex items-center justify-between text-xs text-muted-foreground">
          <span>KKTC&apos;nin En Büyük Online Pazaryeri</span>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <CurrencySelector />
            <Link href="/seller-application" className="hover:text-foreground transition-colors hidden sm:block">
              Satıcı Ol
            </Link>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center gap-4">

          {/* Mobile hamburger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menüyü aç">
                <LayoutGrid className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0 overflow-y-auto">
              <SheetTitle asChild>
                <VisuallyHidden.Root>Gezinme Menüsü</VisuallyHidden.Root>
              </SheetTitle>
              <div className="flex items-center justify-between px-4 py-3 border-b bg-secondary/40">
                <Image
                  src="/images/kktc-marketin24-logo.png"
                  alt="KKTC Marketin24"
                  width={100}
                  height={100}
                  className="h-10 w-auto"
                />
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Mobile auth */}
              <div className="px-4 py-3 border-b">
                {user ? (
                  <div className="flex items-center gap-3">
                    <UserCircle className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.user_metadata?.full_name ?? user.email?.split("@")[0]}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Link href="/auth/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full" size="sm">Giriş</Button>
                    </Link>
                    <Link href="/auth/sign-up" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full" size="sm">Kayıt Ol</Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile category list */}
              <nav className="py-2" aria-label="Mobil kategori menüsü">
                {categories.map((cat) => {
                  const Icon = ICON_MAP[cat.icon] || Smartphone
                  const isExpanded = expandedCat === cat.id
                  return (
                    <div key={cat.id}>
                      <div className="flex items-center">
                        <Link
                          href={`/category/${cat.slug}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex flex-1 items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-secondary transition-colors"
                        >
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          {cat.name}
                        </Link>
                        {cat.subcategories && cat.subcategories.length > 0 && (
                          <button
                            onClick={() => setExpandedCat(isExpanded ? null : cat.id)}
                            className="px-3 py-3 hover:bg-secondary transition-colors"
                            aria-label={isExpanded ? "Kapat" : "Alt kategorileri göster"}
                          >
                            <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", isExpanded && "rotate-90")} />
                          </button>
                        )}
                      </div>
                      {isExpanded && cat.subcategories && (
                        <div className="pl-11 pr-4 pb-1 bg-secondary/30">
                          {cat.subcategories.map((sub) => (
                            <Link
                              key={sub.id}
                              href={`/category/${cat.slug}?sub=${sub.slug}`}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors border-b border-border/30 last:border-0"
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
                <Separator className="my-2" />
                <Link
                  href="/categories"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-primary hover:bg-secondary transition-colors"
                >
                  <LayoutGrid className="h-4 w-4" />
                  Tüm Kategoriler
                </Link>
              </nav>
            </SheetContent>
          </Sheet>

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

          {/* Desktop categories trigger */}
          <div
            className="hidden lg:block"
            onMouseEnter={openMegaMenu}
            onMouseLeave={closeMegaMenu}
            ref={megaRef}
          >
            <button
              onClick={() => setMegaMenuOpen((o) => !o)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                megaMenuOpen ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-foreground"
              )}
              aria-expanded={megaMenuOpen}
              aria-haspopup="menu"
            >
              <LayoutGrid className="h-4 w-4" />
              Kategoriler
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", megaMenuOpen && "rotate-180")} />
            </button>
          </div>

          {/* Search */}
          <div className="flex-1 hidden md:block max-w-xl">
            <SearchBar />
          </div>

          {/* Right icons */}
          <div className="ml-auto flex items-center gap-1">
            {/* Mobile search toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileSearchOpen((o) => !o)}
              aria-label="Arama"
            >
              <Search className="h-5 w-5" />
            </Button>

            <WishlistButton />
            <DynamicCartButton />
            <UserMenu user={user} />

            {/* Mobile user icon */}
            <Link href={user ? "/account" : "/auth/login"} className="lg:hidden">
              <Button variant="ghost" size="icon" aria-label="Hesap">
                <UserCircle className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile search bar */}
        {mobileSearchOpen && (
          <div className="pb-3 md:hidden">
            <SearchBar autoFocus />
          </div>
        )}
      </div>

      {/* MegaMenu */}
      {megaMenuOpen && (
        <div
          onMouseEnter={openMegaMenu}
          onMouseLeave={closeMegaMenu}
        >
          <MegaMenu onClose={() => setMegaMenuOpen(false)} />
        </div>
      )}

      {/* CartDrawer */}
      <CartDrawer />
    </header>
  )
}
