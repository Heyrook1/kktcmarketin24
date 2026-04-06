"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import {
  User as UserIcon, ShoppingBag, Tag,
  HeadphonesIcon, LogOut, ChevronRight, Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

import { ProfileTab } from "./tabs/profile-tab"
import { OrdersTab } from "./tabs/orders-tab"
import { CouponsTab } from "./tabs/coupons-tab"
import { SupportTab } from "./tabs/support-tab"

type Tab = "profile" | "orders" | "coupons" | "support"

const TABS = [
  { id: "profile" as Tab,  label: "Profilim",        icon: UserIcon       },
  { id: "orders" as Tab,   label: "Siparişlerim",     icon: ShoppingBag    },
  { id: "coupons" as Tab,  label: "Kupon & Hediyeler",icon: Tag            },
  { id: "support" as Tab,  label: "Destek",           icon: HeadphonesIcon },
]

interface AccountShellProps {
  user: User
  profile: Record<string, unknown> | null
}

const VALID_TABS: Tab[] = ["profile", "orders", "coupons", "support"]

function tabFromSearchParams(searchParams: ReturnType<typeof useSearchParams>): Tab {
  const raw = searchParams.get("tab")
  if (raw && VALID_TABS.includes(raw as Tab)) return raw as Tab
  return "profile"
}

export function AccountShell({ user, profile }: AccountShellProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<Tab>(() => tabFromSearchParams(searchParams))
  const [loggingOut, setLoggingOut] = useState(false)

  const tabParam = searchParams.get("tab")
  useEffect(() => {
    const t = tabParam && VALID_TABS.includes(tabParam as Tab) ? (tabParam as Tab) : "profile"
    setActiveTab(t)
  }, [tabParam])

  const fullName = (profile?.full_name as string) ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Kullanıcı"

  const displayName = (profile?.display_name as string) ||
    user.user_metadata?.display_name ||
    fullName.split(" ")[0]

  const roleName = (profile?.roles as { name: string } | null)?.name ?? "customer"

  const initials = fullName
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()

  function goToTab(tab: Tab) {
    setActiveTab(tab)
    router.replace(`/account?tab=${tab}`, { scroll: false })
  }

  async function handleLogout() {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Hesabım</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Profilinizi ve siparişlerinizi yönetin
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 space-y-3">
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold text-sm leading-tight truncate">{fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground capitalize">{displayName}</span>
              <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                <Shield className="h-3 w-3" />
                {roleName === "admin" ? "Admin" : roleName === "vendor" ? "Satıcı" : "Müşteri"}
              </Badge>
            </div>
          </div>

          <nav className="rounded-xl border bg-card overflow-hidden">
            {TABS.map((tab, i) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => goToTab(tab.id)}
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
                  <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", isActive && "text-primary rotate-90")} />
                </button>
              )
            })}
          </nav>

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 justify-start gap-2"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <LogOut className="h-4 w-4" />
            {loggingOut ? "Çıkış yapılıyor…" : "Çıkış Yap"}
          </Button>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {activeTab === "profile"  && <ProfileTab user={user} profile={profile} />}
          {activeTab === "orders"   && <OrdersTab  userId={user.id} />}
          {activeTab === "coupons"  && <CouponsTab userId={user.id} />}
          {activeTab === "support"  && <SupportTab userId={user.id} />}
        </main>
      </div>
    </div>
  )
}
