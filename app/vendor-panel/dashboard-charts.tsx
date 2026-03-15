"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"

interface Props { storeId: string }

export function VendorDashboardCharts({ storeId }: Props) {
  const [salesData, setSalesData] = useState<{ month: string; revenue: number; orders: number }[]>([])
  const [trafficData, setTrafficData] = useState<{ date: string; views: number; visitors: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const [ordersRes, trafficRes] = await Promise.all([
        supabase
          .from("vendor_orders")
          .select("total, status, created_at")
          .eq("store_id", storeId),
        supabase
          .from("vendor_traffic")
          .select("page_views, unique_visitors, date")
          .eq("store_id", storeId)
          .order("date", { ascending: true })
          .limit(14),
      ])

      // Aggregate orders by month
      const monthMap: Record<string, { revenue: number; orders: number }> = {}
      for (const o of ordersRes.data ?? []) {
        const d = new Date(o.created_at)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        if (!monthMap[key]) monthMap[key] = { revenue: 0, orders: 0 }
        monthMap[key].orders += 1
        if (o.status === "delivered") monthMap[key].revenue += Number(o.total)
      }

      const MONTHS_TR = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"]
      const sales = Object.entries(monthMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([key, val]) => ({
          month: MONTHS_TR[parseInt(key.split("-")[1]) - 1],
          ...val,
        }))

      // Traffic
      const traffic = (trafficRes.data ?? []).map(t => ({
        date: new Date(t.date).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" }),
        views: t.page_views,
        visitors: t.unique_visitors,
      }))

      setSalesData(sales)
      setTrafficData(traffic)
      setLoading(false)
    }
    load()
  }, [storeId])

  const primaryColor = "#3b82f6"
  const accentColor  = "#0ea5e9"

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[0, 1].map(i => (
          <Card key={i} className="shadow-sm">
            <CardContent className="h-56 flex items-center justify-center">
              <span className="text-sm text-muted-foreground animate-pulse">Yükleniyor...</span>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const empty = (label: string) => (
    <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
      {label} için henüz veri yok.
    </div>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Revenue chart */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Aylık Gelir</CardTitle>
          <CardDescription className="text-xs">Son 6 ay — teslim edilen siparişler</CardDescription>
        </CardHeader>
        <CardContent>
          {salesData.length === 0 ? empty("Satış") : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={salesData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={primaryColor} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `₺${v}`} />
                <Tooltip formatter={(v: number) => [`₺${v.toLocaleString("tr-TR")}`, "Gelir"]} />
                <Area type="monotone" dataKey="revenue" stroke={primaryColor} strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Traffic chart */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Trafik</CardTitle>
          <CardDescription className="text-xs">Sayfa görüntülenme ve tekil ziyaretçi</CardDescription>
        </CardHeader>
        <CardContent>
          {trafficData.length === 0 ? empty("Trafik") : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trafficData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="views" name="Görüntülenme" fill={primaryColor} radius={[3, 3, 0, 0]} />
                <Bar dataKey="visitors" name="Ziyaretçi" fill={accentColor} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
