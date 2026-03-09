"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Heart, LayoutGrid, ShoppingCart, UserCircle } from "lucide-react"
import { useCartStore } from "@/lib/store/cart-store"
import { useWishlistStore } from "@/lib/store/wishlist-store"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", icon: Home, label: "Ana Sayfa" },
  { href: "/categories", icon: LayoutGrid, label: "Kategoriler" },
  { href: "/wishlist", icon: Heart, label: "Favoriler", showWishlistBadge: true },
  { href: "/account", icon: UserCircle, label: "Hesabim" },
  { href: "/cart", icon: ShoppingCart, label: "Sepet", showBadge: true },
]

export function MobileNav() {
  const pathname = usePathname()
  const { getTotalItems } = useCartStore()
  const { items: wishlistItems } = useWishlistStore()
  const totalItems = getTotalItems()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-lg transition-colors relative",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {item.showBadge && totalItems > 0 && (
                  <Badge variant="default" className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-[10px]">
                    {totalItems > 9 ? "9+" : totalItems}
                  </Badge>
                )}
                {item.showWishlistBadge && wishlistItems.length > 0 && (
                  <Badge variant="default" className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-[10px]">
                    {wishlistItems.length > 9 ? "9+" : wishlistItems.length}
                  </Badge>
                )}
              </div>
              <span className="text-[10px] font-medium leading-none">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
