"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import {
  Link2, Plus, Copy, Download, ToggleLeft, ToggleRight,
  TrendingUp, MousePointerClick, Percent, CalendarDays, Trash2, QrCode,
} from "lucide-react"
import { toast } from "sonner"

// ── Types ────────────────────────────────────────────────────────────────────

type Product = { id: string; name: string }

type SmartLink = {
  id: string
  campaign_name: string
  source: string
  link_type: string
  product_id: string | null
  link_token: string
  short_url: string
  is_active: boolean
  created_at: string
  total_clicks: number
  conversions: number
  conversion_rate_pct: number
}

type Store = { id: string; slug: string; name: string }

// ── Constants ────────────────────────────────────────────────────────────────

const SOURCES = [
  { value: "instagram_bio",  label: "Instagram Bio" },
  { value: "instagram_post", label: "Instagram Post" },
  { value: "tiktok",         label: "TikTok" },
  { value: "facebook",       label: "Facebook" },
  { value: "whatsapp",       label: "WhatsApp" },
  { value: "other",          label: "Diğer" },
]

const SOURCE_LABELS: Record<string, string> = Object.fromEntries(
  SOURCES.map(s => [s.value, s.label])
)

const LINK_TYPES = [
  { value: "store",    label: "Mağaza Sayfası" },
  { value: "product",  label: "Belirli Ürün" },
  { value: "campaign", label: "Kampanya" },
]

const LINK_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  LINK_TYPES.map(t => [t.value, t.label])
)

// Source colors for the bar chart
const SOURCE_COLORS: Record<string, string> = {
  instagram_bio:  "#e1306c",
  instagram_post: "#c13584",
  tiktok:         "#010101",
  facebook:       "#1877f2",
  whatsapp:       "#25d366",
  other:          "#6b7280",
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function nanoid6() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  const arr = new Uint8Array(6)
  crypto.getRandomValues(arr)
  arr.forEach(n => { result += chars[n % chars.length] })
  return result
}

function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin
  return "https://kktc.marketin24.com"
}

// ── QR Dialog ────────────────────────────────────────────────────────────────

function QRDialog({ url, open, onClose }: { url: string; open: boolean; onClose: () => void }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !url) return
    setQrDataUrl(null)
    import("qrcode").then(QRCode => {
      QRCode.toDataURL(url, { width: 300, margin: 2, errorCorrectionLevel: "M" })
        .then(setQrDataUrl)
        .catch(() => toast.error("QR oluşturulamadı"))
    }).catch(() => toast.error("QR kütüphanesi yüklenemedi"))
  }, [open, url])

  function handleDownload() {
    if (!qrDataUrl) return
    const a = document.createElement("a")
    a.href = qrDataUrl
    a.download = "smart-link-qr.png"
    a.click()
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <QrCode className="h-4 w-4" /> QR Kod
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="QR Kod" className="rounded-lg border" width={240} height={240} />
          ) : (
            <div className="h-[240px] w-[240px] flex items-center justify-center rounded-lg border bg-muted">
              <span className="text-sm text-muted-foreground animate-pulse">Oluşturuluyor...</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground text-center break-all">{url}</p>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Kapat</Button>
          <Button size="sm" onClick={handleDownload} disabled={!qrDataUrl} className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> PNG İndir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Create Link Dialog ────────────────────────────────────────────────────────

type CreateDialogProps = {
  open: boolean
  onClose: () => void
  store: Store
  products: Product[]
  onCreated: (link: SmartLink) => void
}

function CreateLinkDialog({ open, onClose, store, products, onCreated }: CreateDialogProps) {
  const [form, setForm] = useState({
    campaign_name: "",
    source: "",
    link_type: "",
    product_id: "",
  })
  const [saving, setSaving] = useState(false)

  function reset() {
    setForm({ campaign_name: "", source: "", link_type: "", product_id: "" })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.campaign_name.trim() || !form.source || !form.link_type) {
      toast.error("Tüm zorunlu alanları doldurun")
      return
    }
    if (form.link_type === "product" && !form.product_id) {
      toast.error("Ürün seçin")
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const token = `${store.slug}-${nanoid6()}`
      const shortUrl = `${getBaseUrl()}/r/${token}`

      const payload = {
        store_id: store.id,
        link_token: token,
        link_type: form.link_type,
        product_id: form.link_type === "product" ? form.product_id : null,
        campaign_name: form.campaign_name.trim(),
        source: form.source,
        short_url: shortUrl,
        is_active: true,
      }

      const { data, error } = await supabase
        .from("smart_links")
        .insert(payload)
        .select()
        .single()

      if (error) throw error

      onCreated({
        ...data,
        total_clicks: 0,
        conversions: 0,
        conversion_rate_pct: 0,
      })
      toast.success("Smart Link oluşturuldu")
      reset()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bir hata oluştu"
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { reset(); onClose() } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Link2 className="h-4 w-4" /> Yeni Smart Link
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="campaign_name">Kampanya Adı <span className="text-destructive">*</span></Label>
            <Input
              id="campaign_name"
              placeholder="Örn: Yaz İndirimi 2025"
              value={form.campaign_name}
              onChange={e => setForm(p => ({ ...p, campaign_name: e.target.value }))}
              maxLength={80}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Kaynak <span className="text-destructive">*</span></Label>
            <Select value={form.source} onValueChange={v => setForm(p => ({ ...p, source: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Kaynak seçin" />
              </SelectTrigger>
              <SelectContent>
                {SOURCES.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Link Türü <span className="text-destructive">*</span></Label>
            <Select value={form.link_type} onValueChange={v => setForm(p => ({ ...p, link_type: v, product_id: "" }))}>
              <SelectTrigger>
                <SelectValue placeholder="Tür seçin" />
              </SelectTrigger>
              <SelectContent>
                {LINK_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.link_type === "product" && (
            <div className="space-y-1.5">
              <Label>Ürün <span className="text-destructive">*</span></Label>
              <Select value={form.product_id} onValueChange={v => setForm(p => ({ ...p, product_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Ürün seçin" />
                </SelectTrigger>
                <SelectContent>
                  {products.length === 0 ? (
                    <SelectItem value="none" disabled>Ürün bulunamadı</SelectItem>
                  ) : (
                    products.map(pr => (
                      <SelectItem key={pr.id} value={pr.id}>{pr.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground text-sm">Kisa URL formatı</p>
            <p className="font-mono break-all">
              {getBaseUrl()}/r/{store.slug}-xxxxxx
            </p>
          </div>

          <DialogFooter className="gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={() => { reset(); onClose() }}>
              Vazgec
            </Button>
            <Button type="submit" size="sm" disabled={saving} className="gap-1.5">
              {saving ? "Kaydediliyor..." : (
                <><Plus className="h-3.5 w-3.5" /> Link Oluştur</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SmartLinksPage() {
  const [store, setStore] = useState<Store | null>(null)
  const [links, setLinks] = useState<SmartLink[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [qrUrl, setQrUrl] = useState<string | null>(null)

  // ── Fetch data ───────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = "/auth/login"; return }

    const { data: storeData } = await supabase
      .from("vendor_stores")
      .select("id, slug, name")
      .eq("owner_id", user.id)
      .single()

    if (!storeData) { window.location.href = "/vendor-panel"; return }
    setStore(storeData)

    // Load smart_links joined with stats view
    const { data: linksData } = await supabase
      .from("smart_links")
      .select("id, campaign_name, source, link_type, product_id, link_token, short_url, is_active, created_at")
      .eq("store_id", storeData.id)
      .order("created_at", { ascending: false })

    // Load stats from view
    const { data: statsData } = await supabase
      .from("smart_link_stats")
      .select("link_id, total_clicks, conversions, conversion_rate_pct")
      .eq("store_id", storeData.id)

    const statsMap = new Map(
      (statsData ?? []).map(s => [s.link_id, s])
    )

    const merged: SmartLink[] = (linksData ?? []).map(l => {
      const stats = statsMap.get(l.id)
      return {
        ...l,
        total_clicks: Number(stats?.total_clicks ?? 0),
        conversions: Number(stats?.conversions ?? 0),
        conversion_rate_pct: Number(stats?.conversion_rate_pct ?? 0),
      }
    })

    setLinks(merged)

    // Load products for create form
    const { data: prodData } = await supabase
      .from("vendor_products")
      .select("id, name")
      .eq("store_id", storeData.id)
      .eq("is_active", true)
      .order("name")

    setProducts(prodData ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── Toggle active ────────────────────────────────────────────────────────

  async function toggleActive(linkId: string, current: boolean) {
    const supabase = createClient()
    const { error } = await supabase
      .from("smart_links")
      .update({ is_active: !current })
      .eq("id", linkId)

    if (error) { toast.error("Güncellenemedi"); return }

    setLinks(prev => prev.map(l => l.id === linkId ? { ...l, is_active: !current } : l))
    toast.success(current ? "Link devre dışı bırakıldı" : "Link aktifleştirildi")
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  async function deleteLink(linkId: string) {
    if (!confirm("Bu linki silmek istediğinizden emin misiniz?")) return
    const supabase = createClient()
    const { error } = await supabase.from("smart_links").delete().eq("id", linkId)
    if (error) { toast.error("Silinemedi"); return }
    setLinks(prev => prev.filter(l => l.id !== linkId))
    toast.success("Link silindi")
  }

  // ── Copy to clipboard ────────────────────────────────────────────────────

  function copyLink(url: string) {
    navigator.clipboard.writeText(url).then(() => toast.success("Link kopyalandı"))
  }

  // ── Analytics calculations ───────────────────────────────────────────────

  const totalClicks    = links.reduce((s, l) => s + l.total_clicks, 0)
  const totalConv      = links.reduce((s, l) => s + l.conversions, 0)
  const avgConvRate    = links.length
    ? Math.round(links.reduce((s, l) => s + l.conversion_rate_pct, 0) / links.length)
    : 0
  const activeLinks    = links.filter(l => l.is_active).length

  // Clicks by source (bar chart)
  const sourceMap: Record<string, number> = {}
  for (const l of links) {
    sourceMap[l.source] = (sourceMap[l.source] ?? 0) + l.total_clicks
  }
  const bySourceData = Object.entries(sourceMap)
    .sort(([, a], [, b]) => b - a)
    .map(([source, clicks]) => ({
      source: SOURCE_LABELS[source] ?? source,
      clicks,
      fill: SOURCE_COLORS[source] ?? "#6b7280",
    }))

  // Links created per week (line chart proxy — created_at spread)
  const weekMap: Record<string, number> = {}
  for (const l of links) {
    const d = new Date(l.created_at)
    const weekStart = new Date(d)
    weekStart.setDate(d.getDate() - d.getDay())
    const key = weekStart.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" })
    weekMap[key] = (weekMap[key] ?? 0) + l.total_clicks
  }
  const weeklyData = Object.entries(weekMap)
    .slice(-8)
    .map(([week, clicks]) => ({ week, clicks }))

  const primaryColor = "#3b82f6"

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Smart Linkler</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Sosyal medya kampanyaları için takip edilebilir kisa linkler
          </p>
        </div>
        <Button
          size="sm"
          className="gap-2"
          onClick={() => setShowCreate(true)}
          disabled={!store}
        >
          <Plus className="h-4 w-4" />
          Yeni Link
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Toplam Tıklanma", value: totalClicks.toLocaleString("tr-TR"), icon: MousePointerClick, color: "text-blue-600",   bg: "bg-blue-50" },
          { label: "Toplam Dönüşüm",  value: totalConv.toLocaleString("tr-TR"),   icon: TrendingUp,         color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Ort. Dönüşüm %",  value: `%${avgConvRate}`,                  icon: Percent,             color: "text-amber-600",   bg: "bg-amber-50" },
          { label: "Aktif Link",       value: `${activeLinks} / ${links.length}`, icon: CalendarDays,        color: "text-violet-600",  bg: "bg-violet-50" },
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

      {/* Charts */}
      {!loading && links.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Clicks by source */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Kaynağa Göre Tıklanma</CardTitle>
              <CardDescription className="text-xs">Hangi platformdan kaç tık geldi</CardDescription>
            </CardHeader>
            <CardContent>
              {bySourceData.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                  Henüz tıklanma verisi yok
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={bySourceData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="source" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="clicks" name="Tıklanma" radius={[3, 3, 0, 0]}>
                      {bySourceData.map((entry, i) => (
                        <rect key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Weekly clicks line */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Haftalık Tıklanma Trendi</CardTitle>
              <CardDescription className="text-xs">Son 8 hafta</CardDescription>
            </CardHeader>
            <CardContent>
              {weeklyData.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                  Henüz veri yok
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={weeklyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="clicks"
                      name="Tıklanma"
                      stroke={primaryColor}
                      strokeWidth={2}
                      dot={{ r: 3, fill: primaryColor }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Links Table */}
      {loading ? (
        <Card className="shadow-sm">
          <CardContent className="h-40 flex items-center justify-center">
            <span className="text-sm text-muted-foreground animate-pulse">Yükleniyor...</span>
          </CardContent>
        </Card>
      ) : links.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Link2 className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">Henüz smart link oluşturmadınız.</p>
            <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> İlk Linki Oluştur
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Linkler</CardTitle>
            <CardDescription className="text-xs">{links.length} link — {activeLinks} aktif</CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  {["Kampanya", "Kaynak", "Tür", "Tıklanma", "Dönüşüm", "Oran", "Tarih", "Aktif", ""].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {links.map(link => (
                  <tr key={link.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium line-clamp-1 max-w-[160px]">{link.campaign_name}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{link.link_token}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant="secondary" className="text-xs font-normal">
                        {SOURCE_LABELS[link.source] ?? link.source}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                      {LINK_TYPE_LABELS[link.link_type] ?? link.link_type}
                    </td>
                    <td className="px-4 py-3 font-semibold">{link.total_clicks.toLocaleString("tr-TR")}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">{link.conversions.toLocaleString("tr-TR")}</td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${link.conversion_rate_pct >= 5 ? "text-emerald-600" : "text-muted-foreground"}`}>
                        %{link.conversion_rate_pct}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(link.created_at).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(link.id, link.is_active)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title={link.is_active ? "Devre dışı bırak" : "Aktifleştir"}
                      >
                        {link.is_active
                          ? <ToggleRight className="h-5 w-5 text-emerald-600" />
                          : <ToggleLeft className="h-5 w-5" />
                        }
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Linki kopyala"
                          onClick={() => copyLink(link.short_url)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="QR Kod"
                          onClick={() => setQrUrl(link.short_url)}
                        >
                          <QrCode className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          title="Sil"
                          onClick={() => deleteLink(link.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Dialogs */}
      {store && (
        <CreateLinkDialog
          open={showCreate}
          onClose={() => setShowCreate(false)}
          store={store}
          products={products}
          onCreated={link => setLinks(prev => [link, ...prev])}
        />
      )}

      <QRDialog
        url={qrUrl ?? ""}
        open={!!qrUrl}
        onClose={() => setQrUrl(null)}
      />
    </div>
  )
}
