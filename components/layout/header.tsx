"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useRef, useEffect } from "react"
import {
  Search, ShoppingCart, Menu, ChevronDown, ChevronRight,
  Smartphone, Shirt, Home, Sparkles, Dumbbell, Baby,
  Watch, ShoppingBasket, Heart, BookOpen, ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useCartStore } from "@/lib/store/cart-store"
import { categories, type Category } from "@/lib/data/categories"
import { SearchBar } from "@/components/shared/search-bar"
import { CartDrawer } from "@/components/cart/cart-drawer"
import { LanguageSelector } from "@/components/shared/language-selector"
import { cn } from "@/lib/utils"

const ICON_MAP: Record<string, React.ElementType> = {
  Smartphone, Shirt, Home, Sparkles, Dumbbell, Baby, Watch, ShoppingBasket, Heart, BookOpen,
}

const MEGA_MENU_CATEGORIES = categories.slice(0, 6)

function MegaMenu({ onClose }: { onClose: () => void }) {
  const [activeCategory, setActiveCategory] = useState<Category>(MEGA_MENU_CATEGORIES[0])

  return (
    <div className="absolute top-full left-0 right-0 z-50 bg-background border-b shadow-2xl animate-mega-menu-in"
      onMouseLeave={onClose}
    >
      <div className="container mx-auto px-4">
        <div className="flex" style={{ minHeight: 340 }}>
          {/* Category list */}
          <div className="w-56 border-r py-3 flex-shrink-0">
            {MEGA_MENU_CATEGORIES.map((cat) => {
              const Icon = ICON_MAP[cat.icon] || Smartphone
              const isActive = activeCategory.id === cat.id
              return (
                <button
                  key={cat.id}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-all duration-150 group text-left",
                    isActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-foreground hover:bg-secondary"
                  )}
                  onMouseEnter={() => setActiveCategory(cat)}
                  onClick={() => onClose()}
                  asChild
                >
                  <Link href={`/category/${cat.slug}`} className="flex items-center gap-3 w-full">
                    <Icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
                    <span className="flex-1 truncate">{cat.name}</span>
                    <span className={cn("text-xs", isActive ? "text-primary-foreground/70" : "text-muted-foreground")}>
                      {cat.productCount}
                    </span>
                    <ChevronRight className={cn("h-3.5 w-3.5 flex-shrink-0", isActive ? "text-primary-foreground/70" : "text-muted-foreground/50")} />
                  </Link>
                </button>
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
              {/* Subcategories grid */}
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

              {/* Featured promo */}
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

export function Header() {
  const { getTotalItems, openCart } = useCartStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [megaMenuOpen, setMegaMenuOpen] = useState(false)
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState<string | null>(null)
  const megaMenuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const totalItems = getTotalItems()

  // Close mega menu on route change
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        megaMenuRef.current && !megaMenuRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setMegaMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Mobile menu trigger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menüyü aç</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[360px] p-0 overflow-y-auto">
              <div className="flex flex-col">
                {/* Mobile header */}
                <div className="flex items-center gap-3 p-4 border-b">
                  <Image src="/images/marketin24-logo.png" alt="Marketin24" width={120} height={40} className="h-8 w-auto" />
                </div>
                {/* Quick links */}
                <div className="px-4 py-3 border-b">
                  <Link href="/products" className="flex items-center gap-2 py-2 text-sm font-medium hover:text-primary" onClick={() => setMobileMenuOpen(false)}>Tüm Ürünler</Link>
                  <Link href="/vendors" className="flex items-center gap-2 py-2 text-sm font-medium hover:text-primary" onClick={() => setMobileMenuOpen(false)}>Satıcılar</Link>
                  <Link href="/compare" className="flex items-center gap-2 py-2 text-sm font-medium hover:text-primary" onClick={() => setMobileMenuOpen(false)}>Karşılaştır</Link>
                </div>
                {/* Mobile categories with collapsible subcategories */}
                <div className="px-4 py-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-2">Kategoriler</p>
                  {categories.map((cat) => {
                    const Icon = ICON_MAP[cat.icon] || Smartphone
                    const isOpen = mobileCategoryOpen === cat.id
                    return (
                      <div key={cat.id}>
                        <button
                          className="w-full flex items-center gap-3 py-2.5 text-sm hover:text-primary transition-colors"
                          onClick={() => setMobileCategoryOpen(isOpen ? null : cat.id)}
                        >
                          <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="flex-1 text-left">{cat.name}</span>
                          {cat.subcategories && (
                            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                          )}
                        </button>
                        {isOpen && cat.subcategories && (
                          <div className="pl-7 pb-2">
                            <Link href={`/category/${cat.slug}`} className="block py-1.5 text-sm text-primary font-medium" onClick={() => setMobileMenuOpen(false)}>
                              Tümünü gör
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
                <div className="mt-4 border-t p-4">
                  <LanguageSelector />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image src="/images/marketin24-logo.png" alt="Marketin24" width={150} height={50} className="h-10 w-auto" priority />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {/* Categories mega menu trigger */}
            <div className="relative" ref={megaMenuRef as React.RefObject<HTMLDivElement>}>
              <button
                ref={triggerRef}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  megaMenuOpen ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
                onMouseEnter={() => setMegaMenuOpen(true)}
                onClick={() => setMegaMenuOpen(!megaMenuOpen)}
              >
                <Menu className="h-4 w-4" />
                Kategoriler
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", megaMenuOpen && "rotate-180")} />
              </button>
            </div>
            <Link href="/products" className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              Tüm Ürünler
            </Link>
            <Link href="/vendors" className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              Satıcılar
            </Link>
            <Link href="/compare" className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              Karşılaştır
            </Link>
          </nav>

          {/* Search bar — desktop */}
          <div className="hidden lg:flex flex-1 max-w-md mx-4">
            <SearchBar />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Search — mobile */}
            <Sheet>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Search className="h-5 w-5" />
                  <span className="sr-only">Ara</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="top" className="h-auto">
                <div className="pt-6 pb-4">
                  <SearchBar autoFocus />
                </div>
              </SheetContent>
            </Sheet>
            <div className="hidden md:block">
              <LanguageSelector />
            </div>
            <Button variant="ghost" size="icon" className="relative" onClick={openCart}>
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <Badge variant="default" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {totalItems > 99 ? "99+" : totalItems}
                </Badge>
              )}
              <span className="sr-only">Sepet</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mega menu panel */}
      {megaMenuOpen && (
        <div onMouseEnter={() => setMegaMenuOpen(true)}>
          <MegaMenu onClose={() => setMegaMenuOpen(false)} />
        </div>
      )}

      <CartDrawer />
    </header>
  )
}
