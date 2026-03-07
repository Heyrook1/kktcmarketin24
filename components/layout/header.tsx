"use client"

import Link from "next/link"
import Image from "next/image"
import { Search, ShoppingCart, Menu, X, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { useCartStore } from "@/lib/store/cart-store"
import { categories } from "@/lib/data/categories"
import { SearchBar } from "@/components/shared/search-bar"
import { CartDrawer } from "@/components/cart/cart-drawer"
import { LanguageSelector } from "@/components/shared/language-selector"
import { useState } from "react"

export function Header() {
  const { getTotalItems, openCart } = useCartStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const totalItems = getTotalItems()

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
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[350px]">
              <div className="flex flex-col gap-6 pt-6">
                <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <Image
                    src="/images/marketin24-logo.png"
                    alt="Marketin24"
                    width={120}
                    height={40}
                    className="h-8 w-auto"
                  />
                </Link>
                <nav className="flex flex-col gap-2">
                  <Link
                    href="/products"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Tüm Ürünler
                  </Link>
                  <Link
                    href="/compare"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Karşılaştır
                  </Link>
                  {categories.slice(0, 8).map((category) => (
                    <Link
                      key={category.id}
                      href={`/category/${category.slug}`}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {category.name}
                    </Link>
                  ))}
                </nav>
                <div className="mt-4 border-t pt-4">
                  <LanguageSelector />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/images/marketin24-logo.png"
              alt="Marketin24"
              width={150}
              height={50}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/products"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Tüm Ürünler
            </Link>
            <Link
              href="/compare"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Karşılaştır
            </Link>
            {categories.slice(0, 4).map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {category.name}
              </Link>
            ))}
          </nav>

          {/* Search - Desktop */}
          <div className="hidden lg:flex flex-1 max-w-md mx-4">
            <SearchBar />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search - Mobile */}
            <Sheet>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Search className="h-5 w-5" />
                  <span className="sr-only">Search</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="top" className="h-auto">
                <div className="pt-6 pb-4">
                  <SearchBar autoFocus />
                </div>
              </SheetContent>
            </Sheet>

            {/* Language Selector - Desktop */}
            <div className="hidden md:block">
              <LanguageSelector />
            </div>

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={openCart}
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <Badge
                  variant="default"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {totalItems > 99 ? "99+" : totalItems}
                </Badge>
              )}
              <span className="sr-only">Shopping cart</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer />
    </header>
  )
}
