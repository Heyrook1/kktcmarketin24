"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { SmartTagEditor } from "@/components/vendor/smart-tag-editor"
import Link from "next/link"

const CATEGORIES = [
  { id: "electronics",  label: "Elektronik" },
  { id: "fashion",      label: "Moda" },
  { id: "beauty",       label: "Güzellik" },
  { id: "sports",       label: "Spor & Outdoor" },
  { id: "home-garden",  label: "Ev & Bahçe" },
  { id: "kids-baby",    label: "Çocuk & Bebek" },
  { id: "groceries",    label: "Market & Gıda" },
  { id: "health",       label: "Sağlık & Wellness" },
  { id: "books",        label: "Kitap & Kırtasiye" },
  { id: "jewelry",      label: "Takı & Aksesuar" },
]

interface FormState {
  name: string
  description: string
  price: string
  compare_price: string
  category: string
  sku: string
  stock: string
  is_active: boolean
  tags: string[]
  image_url: string
}

const INITIAL: FormState = {
  name: "", description: "", price: "", compare_price: "",
  category: "", sku: "", stock: "0", is_active: true,
  tags: [], image_url: "",
}

export default function VendorProductNewPage() {
  const router = useRouter()
  const [form, setForm]     = useState<FormState>(INITIAL)
  const [error, setError]   = useState<string | null>(null)
  const [pending, startTx]  = useTransition()

  const set = (key: keyof FormState, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.name.trim())     return setError("Ürün adı zorunludur.")
    if (!form.category)        return setError("Kategori seçiniz.")
    if (Number(form.price) <= 0) return setError("Fiyat geçerli bir sayı olmalıdır.")

    startTx(async () => {
      const res = await fetch("/api/vendor/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:             form.name.trim(),
          description:      form.description.trim(),
          price:            Number(form.price),
          compare_price:    form.compare_price ? Number(form.compare_price) : null,
          category:         form.category,
          sku:              form.sku.trim() || null,
          stock:            Number(form.stock),
          is_active:        form.is_active,
          tags:             form.tags,
          image_url:        form.image_url.trim() || null,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? "Ürün kaydedilemedi.")
        return
      }
      router.push("/vendor-panel/products")
      router.refresh()
    })
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
          <Link href="/vendor-panel/products"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">Yeni Ürün Ekle</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Ürün bilgilerini doldurun ve akıllı etiketler ekleyin</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Temel Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Ürün Adı *</Label>
              <Input
                id="name"
                placeholder="örn. Samsung Galaxy S24 Ultra 256GB"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                placeholder="Ürün özellikleri, avantajları ve detayları..."
                rows={4}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="image_url">Görsel URL</Label>
              <Input
                id="image_url"
                type="url"
                placeholder="https://..."
                value={form.image_url}
                onChange={(e) => set("image_url", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Fiyat & Stok</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="price">Satış Fiyatı (₺) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="compare_price">Karşılaştırma Fiyatı (₺)</Label>
                <Input
                  id="compare_price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.compare_price}
                  onChange={(e) => set("compare_price", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="stock">Stok Adedi</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.stock}
                  onChange={(e) => set("stock", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sku">SKU / Barkod</Label>
                <Input
                  id="sku"
                  placeholder="Ürün kodu"
                  value={form.sku}
                  onChange={(e) => set("sku", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={form.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Kategori seçin" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Smart tags */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Akıllı Etiketler</CardTitle>
            <CardDescription className="text-xs">
              Etiketler ürününüzün arama sonuçlarında ve filtrelerde görünmesini sağlar.
              Kategori, marka, model ve özellik etiketleri ekleyin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SmartTagEditor
              value={form.tags}
              onChange={(tags) => set("tags", tags)}
              categorySlug={form.category}
            />
          </CardContent>
        </Card>

        {/* Active toggle */}
        <Card className="shadow-sm">
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Ürünü Yayınla</p>
              <p className="text-xs text-muted-foreground">Kapalıysa ürün müşterilere görünmez</p>
            </div>
            <Switch
              checked={form.is_active}
              onCheckedChange={(v) => set("is_active", v)}
              aria-label="Ürünü yayınla"
            />
          </CardContent>
        </Card>

        <div className="flex items-center gap-3 pb-8">
          <Button type="submit" disabled={pending} className="gap-2">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {pending ? "Kaydediliyor..." : "Ürünü Kaydet"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/vendor-panel/products">Vazgeç</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
