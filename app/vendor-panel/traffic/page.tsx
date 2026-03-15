"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { TrendingUp, Eye, Users } from "lucide-react"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"

export default function VendorTrafficPage() {
  const [storeId, setStoreId] = useState<string | null>(null)
  const [data, setData] = useState<{ date: string; views: number; visitors: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = "/auth/login"; return }

      const { data: store } = await supabase
        .from("vendor_stores").select("id").eq("owner_id", user.id).single()
      if (!store) { window.location.href = "/vendor-panel"; return }

      setStoreId(store.id)

      const { data: traffic } = await supabase
        .from("vendor_traffic")
        .select("*")
        .eq("store_id", store.id)
        .order("date", { ascending: true })
        .limit(30)

      const rows = (traffic ?? []).map(t => ({
        date: new Date(t.date).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" }),
        views: t.page_views,
        visitors: t.unique_visitors,
      }))
      setData(rows)
      setLoading(false)
    }
    load()
  }, [])

  const totalViews = data.reduce((s, d) => s + d.views, 0)
  const totalVisitors = data.reduce((s, d) => s + d.visitors, 0)
  const avgViews = data.length ? Math.round(totalViews / data.length) : 0

  const primaryColor = "#3b82f6"
  const accentColor  = "#0ea5e9"

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Trafik Analizi</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Son 30 gün sayfa istatistikleri</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Toplam Görüntülenme", value: totalViews.toLocaleString("tr-TR"), icon: Eye, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Tekil Ziyaretçi", value: totalVisitors.toLocaleString("tr-TR"), icon: Users, color: "text-violet-600", bg: "bg-violet-50" },
          { label: "Günlük Ort.", value: avgViews.toLocaleString("tr-TR"), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
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
      ) : data.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <TrendingUp className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">Henüz trafik verisi yok.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Görüntülenme Trendi</CardTitle>
              <CardDescription className="text-xs">Günlük sayfa görüntülenmeleri</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={primaryColor} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="views" name="Görüntülenme" stroke={primaryColor} strokeWidth={2} fill="url(#viewsGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Ziyaretçi Karşılaştırması</CardTitle>
              <CardDescription className="text-xs">Görüntülenme ve tekil ziyaretçi</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="views" name="Görüntülenme" fill={primaryColor} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="visitors" name="Ziyaretçi" fill={accentColor} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
