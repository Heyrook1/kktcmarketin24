import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ShoppingBag, Package, Star, TrendingUp,
  Users, ArrowRight, CircleDot, LifeBuoy,
} from "lucide-react"
import Link from "next/link"
import { VendorDashboardCharts } from "./dashboard-charts"
import {
  VENDOR_STATUS_COLORS,
  VENDOR_STATUS_LABELS,
  normalizeVendorOrderStatus,
} from "@/lib/order-status/vendor-status"

export default async function VendorDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/vendor-panel")

  const { data: stores } = await supabase
    .from("vendor_stores")
    .select("*")
    .eq("owner_id", user.id)

  const store = stores?.[0]

  if (!store) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4 p-8">
        <Package className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Mağazanız Bulunamadı</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          Henüz bir mağazanız yok. Satıcı başvurusu yaparak mağazanızı oluşturabilirsiniz.
        </p>
        <Button asChild><Link href="/seller-application">Satıcı Başvurusu Yap</Link></Button>
      </div>
    )
  }

  const storeIds = (stores ?? []).map((s) => s.id)

  const [ordersRes, productsRes, reviewsRes, trafficRes] = await Promise.all([
    storeIds.length
      ? supabase.from("vendor_orders").select("id, status, total, created_at").in("store_id", storeIds)
      : Promise.resolve({ data: [] as { id: string; status: string; total: number; created_at: string }[] }),
    supabase.from("vendor_products").select("id, is_active, stock").eq("store_id", store.id),
    supabase.from("vendor_reviews").select("id, rating").eq("store_id", store.id),
    supabase.from("vendor_traffic").select("page_views, unique_visitors, date")
      .eq("store_id", store.id).order("date", { ascending: false }).limit(7),
  ])

  const orders = ordersRes.data ?? []
  const products = productsRes.data ?? []
  const reviews = reviewsRes.data ?? []
  const traffic = trafficRes.data ?? []

  const totalRevenue = orders.filter(o => o.status === "delivered").reduce((s, o) => s + Number(o.total), 0)
  const pendingOrders = orders.filter((o) => normalizeVendorOrderStatus(o.status) === "confirmed").length
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "—"
  const totalVisitors = traffic.reduce((s, t) => s + t.unique_visitors, 0)

  const recentOrders = orders
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{store.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {store.location} &middot; {store.is_verified ? "Onaylı Satıcı" : "Onay Bekleniyor"}
          </p>
        </div>
        <Badge
          variant={store.is_active ? "default" : "secondary"}
          className="flex items-center gap-1.5 shrink-0"
        >
          <CircleDot className="h-3 w-3" />
          {store.is_active ? "Aktif" : "Pasif"}
        </Badge>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Toplam Gelir", value: `₺${totalRevenue.toLocaleString("tr-TR")}`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Bekleyen Sipariş", value: pendingOrders, icon: ShoppingBag, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Ürün Sayısı", value: products.length, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Haftalık Ziyaret", value: totalVisitors, icon: Users, color: "text-violet-600", bg: "bg-violet-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg} shrink-0`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold text-foreground leading-tight">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <VendorDashboardCharts storeId={store.id} />

      <Card className="shadow-sm border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Destek ve Mesaj Merkezi</p>
              <p className="text-xs text-muted-foreground">Admin ekibine sorunlarinizi iletebilirsiniz.</p>
            </div>
          </div>
          <Button asChild size="sm">
            <Link href="/vendor-panel/inbox">Destek Kutusunu Ac</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Recent orders + quick stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Son Siparişler</CardTitle>
              <CardDescription className="text-xs">En yeni 5 sipariş</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
              <Link href="/vendor-panel/orders">Tümü <ArrowRight className="h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground px-4 pb-4">Henüz sipariş yok.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Müşteri</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Tutar</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Durum</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground hidden sm:table-cell">Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => (
                    <tr key={order.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5 font-medium truncate max-w-[120px]">{(order as any).customer_name}</td>
                      <td className="px-4 py-2.5">₺{Number(order.total).toLocaleString("tr-TR")}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${VENDOR_STATUS_COLORS[normalizeVendorOrderStatus(order.status)]}`}>
                          {VENDOR_STATUS_LABELS[normalizeVendorOrderStatus(order.status)]}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">
                        {new Date(order.created_at).toLocaleDateString("tr-TR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Rating card */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Müşteri Puanı</CardTitle>
            <CardDescription className="text-xs">{reviews.length} yorum</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold text-foreground">{avgRating}</span>
              <Star className="h-6 w-6 text-amber-400 fill-amber-400 mb-1" />
            </div>
            <div className="w-full space-y-1.5">
              {[5, 4, 3, 2, 1].map(star => {
                const count = reviews.filter(r => r.rating === star).length
                const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-3 text-right text-muted-foreground">{star}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-muted-foreground">{count}</span>
                  </div>
                )
              })}
            </div>
            <Button asChild variant="outline" size="sm" className="w-full mt-2">
              <Link href="/vendor-panel/reviews">Yorumları Gör</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
