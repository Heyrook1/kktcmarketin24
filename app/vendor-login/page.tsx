import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import {
  BarChart3, Package, Star, TrendingUp,
  ShieldCheck, Zap, Users, ArrowRight, Store,
} from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Satıcı Girişi | Marketin24",
  description:
    "Marketin24 satıcı panelinize giriş yapın. Ürünlerinizi yönetin, siparişlerinizi takip edin, satış analizlerinizi görüntüleyin.",
}

const FEATURES = [
  {
    icon: Package,
    title: "Ürün Yönetimi",
    desc: "Ürünlerinizi kolayca ekleyin, düzenleyin ve stok takibini yapın.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: BarChart3,
    title: "Satış Analitiği",
    desc: "Gelir, trafik ve dönüşüm verilerinizi gerçek zamanlı izleyin.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: Star,
    title: "Yorum Yönetimi",
    desc: "Müşteri yorumlarını görüntüleyin ve yanıtlayın.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: TrendingUp,
    title: "Mağaza İçgörüleri",
    desc: "Hangi ürünlerinizin en çok ilgi gördüğünü keşfedin.",
    color: "bg-violet-50 text-violet-600",
  },
  {
    icon: Users,
    title: "Müşteri Takibi",
    desc: "Ziyaretçi ve müşteri davranışlarını analiz edin.",
    color: "bg-rose-50 text-rose-600",
  },
  {
    icon: ShieldCheck,
    title: "Güvenli Panel",
    desc: "İki faktörlü doğrulama ile güvenli erişim.",
    color: "bg-sky-50 text-sky-600",
  },
]

export default async function VendorLoginPage() {
  // If already authenticated and has a store, go straight to panel
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: store } = await supabase
      .from("vendor_stores")
      .select("id")
      .eq("owner_id", user.id)
      .single()
    if (store) redirect("/vendor-panel")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-secondary/30">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left — text */}
            <div className="flex flex-col gap-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 w-fit">
                <Store className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Satıcı Merkezi</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground text-balance leading-tight">
                Mağazanızı Yönetin,{" "}
                <span className="text-primary">Satışlarınızı Büyütün</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                Marketin24 Satıcı Paneli ile ürünlerinizi listeleyin, siparişlerinizi yönetin,
                müşteri yorumlarını takip edin ve satış analizlerinizi inceleyin.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="gap-2 font-semibold" asChild>
                  <Link href="/auth/login?next=/vendor-panel">
                    <Zap className="h-4 w-4" />
                    Satıcı Girişi Yap
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="gap-2" asChild>
                  <Link href="/seller-application">
                    Satıcı Ol
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                Hesabınız yok mu?{" "}
                <Link href="/seller-application" className="text-primary font-medium hover:underline">
                  Satıcı başvurusu yapın
                </Link>
              </p>
            </div>

            {/* Right — dashboard preview mockup */}
            <div className="relative hidden lg:block">
              <div className="rounded-2xl border bg-background shadow-2xl overflow-hidden">
                {/* Mock header bar */}
                <div className="flex items-center gap-2 bg-secondary/60 px-4 py-3 border-b">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                  <span className="ml-3 text-xs text-muted-foreground font-mono">marketin24.com/vendor-panel</span>
                </div>
                {/* Mock stats */}
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Toplam Gelir", value: "₺48,250", change: "+12%", up: true },
                      { label: "Ürün Sayısı", value: "124", change: "+5", up: true },
                      { label: "Bekleyen Sipariş", value: "18", change: "-3", up: false },
                      { label: "Haftalık Ziyaret", value: "1,340", change: "+8%", up: true },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-xl border p-3 bg-background">
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                        <p className="text-xl font-bold text-foreground mt-0.5">{stat.value}</p>
                        <span className={`text-xs font-medium ${stat.up ? "text-emerald-600" : "text-red-500"}`}>
                          {stat.change}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* Mock chart bar */}
                  <div className="rounded-xl border p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-3">Haftalık Gelir</p>
                    <div className="flex items-end gap-1.5 h-16">
                      {[40, 65, 55, 80, 70, 90, 75].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t-sm bg-primary/20"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between mt-1">
                      {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((d) => (
                        <span key={d} className="text-[10px] text-muted-foreground">{d}</span>
                      ))}
                    </div>
                  </div>
                  {/* Mock recent order row */}
                  <div className="rounded-xl border divide-y">
                    {[
                      { name: "Ahmet Y.", amount: "₺240", status: "Teslim", color: "bg-emerald-100 text-emerald-700" },
                      { name: "Fatma K.", amount: "₺95",  status: "Kargoda", color: "bg-blue-100 text-blue-700" },
                      { name: "Mehmet S.", amount: "₺320", status: "Bekliyor", color: "bg-amber-100 text-amber-700" },
                    ].map((row) => (
                      <div key={row.name} className="flex items-center justify-between px-3 py-2">
                        <span className="text-xs font-medium text-foreground">{row.name}</span>
                        <span className="text-xs text-muted-foreground">{row.amount}</span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${row.color}`}>
                          {row.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-foreground">Panel Özellikleri</h2>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            Satıcı panelinizde ihtiyacınız olan her şey tek yerde.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="rounded-2xl border bg-background p-6 hover:shadow-md transition-shadow">
              <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${color} mb-4`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-primary/5">
        <div className="container mx-auto px-4 py-14 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">Hemen Başlayın</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Mevcut hesabınızla giriş yapın veya yeni bir satıcı hesabı oluşturun.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="gap-2 font-semibold" asChild>
              <Link href="/auth/login?next=/vendor-panel">
                <Zap className="h-4 w-4" />
                Giriş Yap
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/seller-application">Satıcı Başvurusu Yap</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
