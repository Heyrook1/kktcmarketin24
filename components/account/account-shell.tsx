"use client"

import { useState } from "react"
import {
  User, ShoppingBag, Tag, Gift, HeadphonesIcon,
  LogOut, ChevronRight, Star, MapPin, Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAccountStore } from "@/lib/store/account-store"
import { cn } from "@/lib/utils"

import { ProfileTab } from "./tabs/profile-tab"
import { OrdersTab } from "./tabs/orders-tab"
import { CouponsTab } from "./tabs/coupons-tab"
import { SupportTab } from "./tabs/support-tab"

type Tab = "profile" | "orders" | "coupons" | "support"

const TABS = [
  { id: "profile" as Tab, label: "Profilim", icon: User },
  { id: "orders" as Tab, label: "Siparişlerim", icon: ShoppingBag },
  { id: "coupons" as Tab, label: "Kupon & Hediyeler", icon: Tag },
  { id: "support" as Tab, label: "Destek", icon: HeadphonesIcon },
]

export function AccountShell() {
  const { profile, logout, orders, tickets } = useAccountStore()
  const [activeTab, setActiveTab] = useState<Tab>("profile")

  const openTickets = tickets.filter((t) => t.status === "open" || t.status === "in_progress").length
  const activeOrders = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled" && o.status !== "refunded").length

  const initials = profile
    ? `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase()
    : "?"

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Hesabım</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Profilinizi ve siparişlerinizi yönetin
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Sidebar ─────────────────────────────────────────────── */}
        <aside className="w-full lg:w-64 shrink-0 space-y-3">
          {/* Profile card */}
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold text-sm leading-tight truncate">
                  {profile?.firstName} {profile?.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Star className="h-3.5 w-3.5 text-amber-500" />
                <span><span className="font-semibold text-foreground">{profile?.loyaltyPoints.toLocaleString("tr-TR")}</span> puan</span>
              </div>
              <Badge variant="secondary" className="text-[10px] h-5">
                <Shield className="h-3 w-3 mr-1" />
                Dogrulandi
              </Badge>
            </div>
          </div>

          {/* Nav items */}
          <nav className="rounded-xl border bg-card overflow-hidden">
            {TABS.map((tab, i) => {
              const isActive = activeTab === tab.id
              const badge =
                tab.id === "orders" && activeOrders > 0 ? activeOrders :
                tab.id === "support" && openTickets > 0 ? openTickets : null

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors",
                    i !== 0 && "border-t",
                    isActive
                      ? "bg-primary/5 text-primary font-medium"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <tab.icon className={cn("h-4 w-4", isActive && "text-primary")} />
                    <span>{tab.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {badge != null && (
                      <Badge className="h-4 w-4 p-0 flex items-center justify-center text-[10px] rounded-full">
                        {badge}
                      </Badge>
                    )}
                    <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", isActive && "text-primary rotate-90")} />
                  </div>
                </button>
              )
            })}
          </nav>

          {/* Logout */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 justify-start gap-2"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Çıkış Yap
          </Button>
        </aside>

        {/* ── Main content ─────────────────────────────────────────── */}
        <main className="flex-1 min-w-0">
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "orders" && <OrdersTab />}
          {activeTab === "coupons" && <CouponsTab />}
          {activeTab === "support" && <SupportTab />}
        </main>
      </div>
    </div>
  )
}
