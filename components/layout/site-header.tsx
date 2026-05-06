"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useRef, useEffect, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  ShoppingCart, ChevronDown,
  LayoutGrid, X, Store, UserCircle, LogIn, Heart,
  Smartphone, Shirt, Home, Sparkles, Dumbbell, Baby,
  Watch, ShoppingBasket, BookOpen, ChevronRight,
  Bell, ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useCartStore } from "@/lib/store/cart-store"
import { useWishlistStore } from "@/lib/store/wishlist-store"
import { categories } from "@/lib/data/categories"
import { CartDrawer } from "@/components/cart/cart-drawer"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { CurrencyRatesSync } from "@/components/shared/currency-rates-sync"
import { extractRoleName } from "@/lib/extract-role-name"

const ICON_MAP: Record<string, React.ElementType> = {
  Smartphone, Shirt, Home, Sparkles, Dumbbell, Baby,
  Watch, ShoppingBasket, Heart, BookOpen,
}

function useHasMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}

// ---------------------------------------------------------------------------
// DynamicCartButton
// ---------------------------------------------------------------------------
function DynamicCartButton() {
  const mounted = useHasMounted()
  const { getTotalItems, openCart } = useCartStore()
  const totalItems = mounted ? getTotalItems() : 0
  const prevCount = useRef(totalItems)
  const [bumping, setBumping] = useState(false)
  const skipBumpAfterHydration = useRef(true)

  useEffect(() => {
    if (!mounted) return
    if (skipBumpAfterHydration.current) {
      skipBumpAfterHydration.current = false
      prevCount.current = totalItems
      return
    }
    if (totalItems > prevCount.current) {
      setBumping(true)
      const t = setTimeout(() => setBumping(false), 400)
      prevCount.current = totalItems
      return () => clearTimeout(t)
    }
    prevCount.current = totalItems
  }, [totalItems, mounted])

  return (
    <Button
      variant="ghost"
      className="relative flex items-center gap-2 h-10 px-2 lg:px-3 hover:bg-secondary/50 rounded-xl"
      onClick={openCart}
      aria-label="Sepet"
    >
      <div className="relative">
        <ShoppingCart className={cn("h-5 w-5 transition-transform duration-200", bumping && "scale-125")} />
        {totalItems > 0 && (
          <Badge className="absolute -top-2 -right-2 h-4 min-w-4 px-1 text-[10px] leading-none flex items-center justify-center bg-primary text-primary-foreground">
            {totalItems > 99 ? "99+" : totalItems}
          </Badge>
        )}
      </div>
      <span className="hidden lg:block text-sm font-medium">Sepetim</span>
    </Button>
  )
}

// ---------------------------------------------------------------------------
// WishlistButton
// ---------------------------------------------------------------------------
function WishlistButton() {
  const mounted = useHasMounted()
  const { items } = useWishlistStore()
  const count = mounted ? items.length : 0
  return (
    <Link href="/wishlist" aria-label="Favoriler">
      <Button variant="ghost" className="relative flex items-center gap-2 h-10 px-2 lg:px-3 hover:bg-secondary/50 rounded-xl">
        <div className="relative">
          <Heart className="h-5 w-5" />
          {count > 0 && (
            <Badge className="absolute -top-2 -right-2 h-4 min-w-4 px-1 text-[10px] leading-none flex items-center justify-center bg-primary text-primary-foreground">
              {count > 99 ? "99+" : count}
            </Badge>
          )}
        </div>
        <span className="hidden lg:block text-sm font-medium">Favorilerim</span>
      </Button>
    </Link>
  )
}

function CustomerMessageButton({ user }: { user: User | null }) {
  const href = user ? "/account?tab=orders" : "/login?next=/account%3Ftab%3Dorders"
  return (
    <Link href={href} aria-label="Mesajlar ve bildirimler">
      <Button variant="ghost" size="icon" className="relative h-9 w-9">
        <Bell className="h-5 w-5" />
      </Button>
    </Link>
  )
}

function MobileAccountButton({ user }: { user: User | null }) {
  const href = user ? "/account" : "/login?next=/account"
  return (
    <Link href={href} aria-label={user ? "Hesabım" : "Giriş Yap"}>
      <Button variant="ghost" size="icon" className="relative h-9 w-9">
        <UserCircle className="h-5 w-5" />
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
  const [isVendor, setIsVendor] = useState(false)
  const [roleName, setRoleName] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) {
      setIsVendor(false)
      setRoleName(null)
      return
    }
    const supabase = createClient()
    supabase
      .from("vendor_stores")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle()
      .then(({ data }) => setIsVendor(!!data))
    supabase
      .from("profiles")
      .select("roles(name)")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        const role = extractRoleName(data?.roles)
        setRoleName(role)
      })
  }, [user])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  if (!user) {
    return (
      <div className="hidden lg:flex items-center gap-2">
        <Button variant="ghost" className="h-10 px-2 lg:px-3 hover:bg-secondary/50 rounded-xl flex items-center gap-2" asChild>
          <Link href="/login">
            <UserCircle className="h-5 w-5 text-foreground" />
            <div className="flex flex-col items-start text-left">
              <span className="text-[10px] leading-tight text-muted-foreground">Giriş Yap</span>
              <span className="text-sm font-medium leading-tight">veya Üye Ol</span>
            </div>
          </Link>
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
          {isVendor && (
            <>
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
            </>
          )}
          {(roleName === "admin" || roleName === "super_admin") && (
            <>
              <Separator />
              <div className="py-1">
                <Link
                  href="/admin/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Admin Paneli
                </Link>
                {roleName === "super_admin" && (
                  <Link
                    href="/super-admin"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                  >
                    <Store className="h-3.5 w-3.5" />
                    Super Admin
                  </Link>
                )}
              </div>
            </>
          )}
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

import { Search } from "lucide-react"

function HeaderSearch() {
  const [query, setQuery] = useState("")
  const router = useRouter()
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full mx-auto flex items-center">
      <input
        type="search"
        placeholder="Ürün, kategori veya marka arayın..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full h-11 pl-4 pr-12 rounded-xl bg-secondary/40 border border-border/50 focus:border-primary focus:bg-background focus:ring-1 focus:ring-primary transition-all text-sm outline-none"
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-lg text-primary hover:bg-primary/10 transition-colors"
      >
        <Search className="h-4 w-4" />
      </button>
    </form>
  )
}

export function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [mobileIsVendor, setMobileIsVendor] = useState(false)
  const [mobileRoleName, setMobileRoleName] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedCat, setExpandedCat] = useState<string | null>(null)
  const [mobileAccountOpen, setMobileAccountOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileMenuOpen) return
    setExpandedCat(null)
    setMobileAccountOpen(false)
  }, [mobileMenuOpen])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) {
      setMobileIsVendor(false)
      setMobileRoleName(null)
      return
    }
    const supabase = createClient()
    supabase
      .from("vendor_stores")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle()
      .then(({ data }) => setMobileIsVendor(!!data))
    supabase
      .from("profiles")
      .select("roles(name)")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        const role = extractRoleName(data?.roles)
        setMobileRoleName(role)
      })
  }, [user])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <>
      <CurrencyRatesSync />
      <CartDrawer />
      <header
        className={cn(
          "sticky top-0 z-40 w-full bg-background transition-shadow duration-200",
          scrolled ? "shadow-md" : "border-b"
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between gap-4">
            
            {/* Left side: Mobile Menu + Logo + Tagline */}
            <div className="flex items-center gap-3">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden h-9 w-9 flex-shrink-0"
                  >
                    <LayoutGrid className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] p-0">
                  <SheetTitle className="sr-only">Menü</SheetTitle>
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between px-4 py-3 border-b bg-secondary/40">
                      <div className="flex items-center tracking-tighter">
                        <span className="font-extrabold text-2xl text-[#1e3a8a] dark:text-blue-400">marketin</span>
                        <span className="font-extrabold text-2xl text-[#60a5fa]">24</span>
                      </div>
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
                          <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Giriş Yap</Link>
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
                                  href={`/urunler?category=${cat.slug}`}
                                  className="block py-1.5 text-sm font-semibold text-primary"
                                  onClick={() => setMobileMenuOpen(false)}
                                >
                                  Tümünü Gör
                                </Link>
                                {cat.subcategories.map((sub) => (
                                  <Link
                                    key={sub.id}
                                    href={`/urunler?category=${cat.slug}&sub=${sub.slug}`}
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

                    {!expandedCat && (
                      <div className="border-t py-2">
                        {user && (
                          <>
                            <button
                              type="button"
                              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary transition-colors"
                              onClick={() => setMobileAccountOpen((v) => !v)}
                              aria-expanded={mobileAccountOpen}
                              aria-controls="mobile-account-links"
                            >
                              <UserCircle className="h-4 w-4 text-muted-foreground" />
                              <span className="flex-1 text-left">Hesabım</span>
                              <ChevronRight
                                className={cn(
                                  "h-4 w-4 text-muted-foreground transition-transform",
                                  mobileAccountOpen && "rotate-90"
                                )}
                              />
                            </button>
                            {mobileAccountOpen && (
                              <div id="mobile-account-links" className="pl-11 pr-4 pb-2 bg-secondary/30">
                                <Link
                                  href="/account"
                                  className="block py-2 text-sm text-foreground hover:text-primary transition-colors"
                                  onClick={() => setMobileMenuOpen(false)}
                                >
                                  Hesabım
                                </Link>
                                <Link
                                  href="/account?tab=orders"
                                  className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                  onClick={() => setMobileMenuOpen(false)}
                                >
                                  Siparişlerim
                                </Link>
                                <Link
                                  href="/wishlist"
                                  className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                  onClick={() => setMobileMenuOpen(false)}
                                >
                                  Favorilerim
                                </Link>
                              </div>
                            )}
                          </>
                        )}
                        {mobileIsVendor && (
                          <Link
                            href="/vendor-panel"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Store className="h-4 w-4 text-muted-foreground" />
                            Satıcı Paneli
                          </Link>
                        )}
                        {(mobileRoleName === "admin" || mobileRoleName === "super_admin") && (
                          <Link
                            href="/admin/dashboard"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                            Admin Paneli
                          </Link>
                        )}
                        {mobileRoleName === "super_admin" && (
                          <Link
                            href="/super-admin"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                            Super Admin
                          </Link>
                        )}
                        {[
                          { href: "/vendor-login", label: "Satıcı Girişi", icon: Store },
                          { href: "/seller-application", label: "Satıcı Ol", icon: Store },
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
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              <Link href="/" className="flex items-center gap-3 flex-shrink-0">
                <div className="flex items-center tracking-tighter hover:opacity-90 transition-opacity drop-shadow-sm">
                  <span className="font-black text-[28px] sm:text-3xl text-primary">marketin</span>
                  <span className="font-black text-[28px] sm:text-3xl text-foreground">24</span>
                </div>
              </Link>
            </div>

            {/* Middle: Main Search Bar */}
            <div className="hidden md:block flex-1 max-w-3xl px-4 lg:px-8">
              <HeaderSearch />
            </div>

            {/* Right side: Actions */}
            <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
              <div className="md:hidden">
                <Link href="/search">
                  <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Ara">
                    <Search className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
              
              <div className="flex items-center gap-1 lg:gap-2">
                <div className="hidden md:block">
                  <UserMenu user={user} />
                </div>
                <div className="hidden md:block">
                  <WishlistButton />
                </div>
                <DynamicCartButton />
                <div className="md:hidden">
                  <MobileAccountButton user={user} />
                </div>
              </div>
            </div>
          </div>
        </div>

      </header>
    </>
  )
}
