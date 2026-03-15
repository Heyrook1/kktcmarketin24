"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { TrendingUp, ShoppingBag, Package, BarChart2 } from "lucide-react"
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"

type Order = { status: string; total: number; items_count: number; created_at: string }

export default function VendorAnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = "/auth/login"; return }

      const { data: store } = await supabase
        .from("vendor_stores").select("id").eq("owner_id", user.id).single()
      if (!store) { window.location.href = "/vendor-panel"; return }

      const { data } = await supabase
        .from("vendor_orders")
        .select("status, total, items_count, created_at")
        .eq("store_id", store.id)

      setOrders((data ?? []).map(o => ({ ...o, total: Number(o.total) })))
      setLoading(false)
    }
    load()
  }, [])

  // Monthly revenue aggregation
  const MONTHS_TR = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"]
  const monthMap: Record<string, { revenue: number; orders: number; items: number }> = {}
  for (const o of orders) {
    const d = new Date(o.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    if (!monthMap[key]) monthMap[key] = { revenue: 0, orders: 0, items: 0 }
    monthMap[key].orders += 1
    monthMap[key].items += o.items_count
    if (o.status === "delivered") monthMap[key].revenue += o.total
  }
  const monthlyData = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, val]) => ({ month: MONTHS_TR[parseInt(key.split("-")[1]) - 1], ...val }))

  // Status breakdown for pie
  const STATUS_LABELS: Record<string, string> = {
    pending: "Bekliyor", confirmed: "Onaylandı", shipped: "Kargoda",
    delivered: "Teslim", cancelled: "İptal", refunded: "İade",
  }
  const PIE_COLORS = ["#3b82f6","#10b981","#8b5cf6","#f59e0b","#ef4444","#6b7280"]
  const statusData = Object.entries(
    orders.reduce<Record<string, number>>((acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1
      return acc
    }, {})
  ).map(([status, count], i) => ({ name: STATUS_LABELS[status] ?? status, value: count, color: PIE_COLORS[i % PIE_COLORS.length] }))

  const totalRevenue = orders.filter(o => o.status === "delivered").reduce((s, o) => s + o.total, 0)
  const totalOrders = orders.length
  const convRate = totalOrders ? Math.round((orders.filter(o => o.status === "delivered").length / totalOrders) * 100) : 0

  const primaryColor = "#3b82f6"
  const accentColor  = "#10b981"

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Satış Analizi</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Satış performansınız ve gelir dağılımı</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Toplam Gelir", value: `₺${totalRevenue.toLocaleString("tr-TR")}`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Toplam Sipariş", value: totalOrders, icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Ort. Sipariş", value: totalOrders ? `₺${Math.round(totalRevenue / totalOrders).toLocaleString("tr-TR")}` : "—", icon: Package, color: "text-violet-600", bg: "bg-violet-50" },
          { label: "Teslim Oranı", value: `%${convRate}`, icon: BarChart2, color: "text-amber-600", bg: "bg-amber-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="shadow-sm">
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

      {loading ? (
        <Card className="shadow-sm">
          <CardContent className="h-64 flex items-center justify-center">
            <span className="text-sm text-muted-foreground animate-pulse">Yükleniyor...</span>
          </CardContent>
        </Card>
      ) : orders.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <BarChart2 className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">Henüz satış verisi yok.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue area chart */}
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Aylık Gelir ve Sipariş</CardTitle>
              <CardDescription className="text-xs">Son 6 ay</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={primaryColor} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `₺${v}`} />
                  <Tooltip formatter={(v: number, name: string) => [name === "revenue" ? `₺${v.toLocaleString("tr-TR")}` : v, name === "revenue" ? "Gelir" : "Sipariş"]} />
                  <Area type="monotone" dataKey="revenue" stroke={primaryColor} strokeWidth={2} fill="url(#revGrad2)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status pie */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Sipariş Dağılımı</CardTitle>
              <CardDescription className="text-xs">Duruma göre</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false}>
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly orders bar */}
          <Card className="lg:col-span-3 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Aylık Sipariş Sayısı</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="orders" name="Sipariş" fill={accentColor} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
