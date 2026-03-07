"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Grid3X3, ShoppingCart, User } from "lucide-react"
import { useCartStore } from "@/lib/store/cart-store"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/products", icon: Grid3X3, label: "Products" },
  { href: "/cart", icon: ShoppingCart, label: "Cart", showBadge: true },
]

export function MobileNav() {
  const pathname = usePathname()
  const { getTotalItems } = useCartStore()
  const totalItems = getTotalItems()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors relative",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {item.showBadge && totalItems > 0 && (
                  <Badge
                    variant="default"
                    className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-[10px]"
                  >
                    {totalItems > 9 ? "9+" : totalItems}
                  </Badge>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
