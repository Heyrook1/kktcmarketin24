"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Package, ShoppingBag, Star,
  BarChart2, TrendingUp, Settings, LogOut, Store, Menu, X, Link2, CornerUpLeft,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const NAV = [
  { href: "/vendor-panel",          label: "Genel Bakış",   icon: LayoutDashboard },
  { href: "/vendor-panel/products", label: "Ürünler",       icon: Package },
  { href: "/vendor-panel/orders",   label: "Siparişler",    icon: ShoppingBag },
  { href: "/vendor-panel/returns",  label: "İadeler",       icon: CornerUpLeft },
  { href: "/vendor-panel/reviews",  label: "Yorumlar",      icon: Star },
  { href: "/vendor-panel/traffic",  label: "Trafik",        icon: BarChart2 },
  { href: "/vendor-panel/analytics",   label: "Satış Analizi", icon: TrendingUp },
  { href: "/vendor-panel/smart-links", label: "Smart Linkler", icon: Link2 },
  { href: "/vendor-panel/settings",    label: "Ayarlar",       icon: Settings },
]

export function VendorSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const NavLinks = () => (
    <nav className="flex flex-col gap-1 flex-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b bg-card px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">Satıcı Paneli</span>
          <Badge variant="secondary" className="text-[10px]">Test</Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-sidebar flex flex-col p-4 gap-4 z-50">
            <div className="flex items-center gap-2 pb-2 border-b border-sidebar-border">
              <Store className="h-5 w-5 text-sidebar-primary" />
              <span className="font-bold text-sidebar-foreground">Satıcı Paneli</span>
            </div>
            <NavLinks />
            <Button variant="ghost" size="sm" className="justify-start gap-3 text-destructive hover:text-destructive" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />Çıkış Yap
            </Button>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r bg-sidebar h-screen sticky top-0 p-4 gap-4">
        <div className="flex items-center gap-2 pb-3 border-b border-sidebar-border">
          <Store className="h-5 w-5 text-sidebar-primary" />
          <div>
            <p className="font-bold text-sm text-sidebar-foreground leading-tight">Satıcı Paneli</p>
            <Badge variant="secondary" className="text-[10px] mt-0.5">Test</Badge>
          </div>
        </div>
        <NavLinks />
        <div className="border-t border-sidebar-border pt-3">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />Çıkış Yap
          </Button>
        </div>
      </aside>
    </>
  )
}
