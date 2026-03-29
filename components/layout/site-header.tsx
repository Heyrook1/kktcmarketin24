"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useRef, useEffect, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  Search, ShoppingCart, ChevronDown,
  LayoutGrid, X, Store, UserCircle, LogIn, Heart,
  Smartphone, Shirt, Home, Sparkles, Dumbbell, Baby,
  Watch, ShoppingBasket, BookOpen, ChevronRight,
  Bell,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useCartStore } from "@/lib/store/cart-store"
import { useWishlistStore } from "@/lib/store/wishlist-store"
import { categories } from "@/lib/data/categories"
import { SearchBar } from "@/components/shared/search-bar"
import { CartDrawer } from "@/components/cart/cart-drawer"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { MegaMenu } from "@/components/layout/mega-menu"
import { LanguageSelector } from "@/components/shared/language-selector"

const ICON_MAP: Record<string, React.ElementType> = {
  Smartphone, Shirt, Home, Sparkles, Dumbbell, Baby,
  Watch, ShoppingBasket, Heart, BookOpen,
}

// ---------------------------------------------------------------------------
// DynamicCartButton
// ---------------------------------------------------------------------------
function DynamicCartButton() {
  const { getTotalItems, openCart } = useCartStore()
  const totalItems = getTotalItems()
  const prevCount = useRef(totalItems)
  const [bumping, setBumping] = useState(false)

  useEffect(() => {
    if (totalItems > prevCount.current) {
      setBumping(true)
      const t = setTimeout(() => setBumping(false), 400)
      prevCount.current = totalItems
      return () => clearTimeout(t)
    }
    prevCount.current = totalItems
  }, [totalItems])

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-9 w-9"
      onClick={openCart}
      aria-label="Sepet"
    >
      <ShoppingCart className={cn("h-5 w-5 transition-transform duration-200", bumping && "scale-125")} />
      {totalItems > 0 && (
        <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] leading-none flex items-center justify-center bg-primary text-primary-foreground">
          {totalItems > 99 ? "99+" : totalItems}
        </Badge>
      )}
    </Button>
  )
}

// ---------------------------------------------------------------------------
// WishlistButton
// ---------------------------------------------------------------------------
function WishlistButton() {
  const { items } = useWishlistStore()
  return (
    <Link href="/wishlist" aria-label="Favoriler">
      <Button variant="ghost" size="icon" className="relative h-9 w-9">
        <Heart className="h-5 w-5" />
        {items.length > 0 && (
          <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] leading-none flex items-center justify-center bg-red-500 text-white">
            {items.length > 99 ? "99+" : items.length}
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
  const router = useRouter()
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
    router.push("/")
    router.refresh()
  }

  if (!user) {
    return (
      <div className="hidden lg:flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/auth/login">
            <LogIn className="h-4 w-4 mr-1.5" />
            Giriş Yap
          </Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/auth/sign-up">Kayıt Ol</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-secondary transition-colors"
        aria-label="Hesabım"
      >
        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <UserCircle className="h-4 w-4 text-primary" />
        </div>
        <span className="hidden xl:block text-sm font-medium text-foreground max-w-[100px] truncate">
          {user.user_metadata?.full_name || user.email?.split("@")[0] || "Hesabım"}
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border bg-background shadow-xl py-1 z-50">
          <div className="px-3 py-2 border-b">
            <p className="text-xs text-muted-foreground">Giriş yapıldı</p>
            <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
          </div>
          <div className="py-1">
            {[
              { href: "/account", label: "Hesabım" },
              { href: "/account?tab=orders", label: "Siparişlerim" },
              { href: "/wishlist", label: "Favorilerim" },
              { href: "/account?tab=coupons", label: "Kuponlarım" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <Separator />
          <div className="py-1">
            <Link
              href="/vendor-panel"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
            >
              <Store className="h-3.5 w-3.5" />
              Satıcı Paneli
            </Link>
          </div>
          <Separator />
          <div className="py-1">
            <button
              onClick={handleSignOut}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Header
// ---------------------------------------------------------------------------
export function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [megaMenuOpen, setMegaMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedCat, setExpandedCat] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  // Stable reference so MegaMenu's useEffect doesn't re-fire on every render
  const closeMegaMenu = useCallback(() => setMegaMenuOpen(false), [])

  // Delayed close — gives the cursor time to travel from the trigger button
  // down into the absolute-positioned MegaMenu panel without it closing.
  const menuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleMenuWrapperEnter = useCallback(() => {
    if (menuCloseTimer.current) clearTimeout(menuCloseTimer.current)
    setMegaMenuOpen(true)
  }, [])
  const handleMenuWrapperLeave = useCallback(() => {
    if (menuCloseTimer.current) clearTimeout(menuCloseTimer.current)
    menuCloseTimer.current = setTimeout(() => setMegaMenuOpen(false), 180)
  }, [])

  useEffect(() => {
    setMegaMenuOpen(false)
    setMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <>
      <CartDrawer />
      <header
        className={cn(
          "sticky top-0 z-40 w-full bg-background transition-shadow duration-200",
          scrolled ? "shadow-md" : "border-b"
        )}
      >
        {/* Top bar */}
        <div className="border-b bg-secondary/30 px-4 py-1 hidden lg:block">
          <div className="container mx-auto flex items-center justify-between text-xs text-muted-foreground">
            <span>KKTC&apos;nin #1 Online Alışveriş Platformu</span>
            <div className="flex items-center gap-4">
              <Link href="/seller-application" className="hover:text-primary transition-colors">Satıcı Ol</Link>
              <Link href="/about" className="hover:text-primary transition-colors">Hakkımızda</Link>
              <Link href="/contact" className="hover:text-primary transition-colors">İletişim</Link>
              <LanguageSelector />
            </div>
          </div>
        </div>

        {/* Main nav */}
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center gap-4">
            {/* Mobile menu trigger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9 flex-shrink-0">
                  <LayoutGrid className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-0">
                <SheetTitle className="sr-only">Menü</SheetTitle>
                <div className="flex flex-col h-full">
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

                  {user ? (
                    <div className="px-4 py-3 border-b bg-primary/5">
                      <p className="text-sm font-medium">{user.user_metadata?.full_name || "Hesabım"}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  ) : (
                    <div className="flex gap-2 px-4 py-3 border-b">
                      <Button size="sm" className="flex-1" asChild>
                        <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>Giriş Yap</Link>
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" asChild>
                        <Link href="/auth/sign-up" onClick={() => setMobileMenuOpen(false)}>Kayıt Ol</Link>
                      </Button>
                    </div>
                  )}

                  <nav className="flex-1 overflow-y-auto py-2">
                    {categories.map((cat) => {
                      const Icon = ICON_MAP[cat.icon] || Smartphone
                      const isExpanded = expandedCat === cat.id
                      return (
                        <div key={cat.id}>
                          <button
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary transition-colors"
                            onClick={() => setExpandedCat(isExpanded ? null : cat.id)}
                          >
                            <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="flex-1 text-left font-medium">{cat.name}</span>
                            <ChevronRight className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", isExpanded && "rotate-90")} />
                          </button>
                          {isExpanded && cat.subcategories && (
                            <div className="pl-11 pr-4 pb-1 bg-secondary/30">
                              <Link
                                href={`/products?category=${cat.slug}`}
                                className="block py-1.5 text-sm font-semibold text-primary"
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                Tümünü Gör
                              </Link>
                              {cat.subcategories.map((sub) => (
                                <Link
                                  key={sub.id}
                                  href={`/products?category=${cat.slug}&sub=${sub.slug}`}
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
                  </nav>

                  <div className="border-t py-2">
                    {[
                      { href: "/seller-application", label: "Satıcı Ol", icon: Store },
                      { href: "/account", label: "Hesabım", icon: UserCircle },
                    ].map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
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

            {/* Desktop categories trigger — wraps both button and panel so
                there's no hover gap between them */}
            <div
              className="hidden lg:block relative"
              onMouseEnter={handleMenuWrapperEnter}
              onMouseLeave={handleMenuWrapperLeave}
            >
              <button
                onClick={() => setMegaMenuOpen((v) => !v)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                  megaMenuOpen
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-secondary"
                )}
                aria-expanded={megaMenuOpen}
                aria-label="Kategoriler"
              >
                <LayoutGrid className="h-4 w-4" />
                Kategoriler
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", megaMenuOpen && "rotate-180")} />
              </button>

              {megaMenuOpen && (
                <MegaMenu onClose={closeMegaMenu} />
              )}
            </div>

            {/* Search */}
            <div className="flex-1 min-w-0 max-w-2xl">
              <SearchBar />
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <WishlistButton />
              <DynamicCartButton />
              <UserMenu user={user} />
            </div>
          </div>
        </div>

        {/* Mega menu */}
      </header>
    </>
  )
}
