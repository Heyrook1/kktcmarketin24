"use client"

import { useState, useTransition, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft, Loader2, Save, Upload, X, Plus, ImagePlus,
  Tag, ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { categories } from "@/lib/data/categories"

// ── Spec fields that map directly to searchable tags ──────────────────────────
const SPEC_FIELDS = [
  { key: "brand",    label: "Marka",         placeholder: "örn. Samsung, Apple, Nike…" },
  { key: "model",    label: "Model",          placeholder: "örn. Galaxy S24, iPhone 15…" },
  { key: "color",    label: "Renk",           placeholder: "örn. Siyah, Beyaz, Kırmızı…" },
  { key: "storage",  label: "Depolama / Boyut", placeholder: "örn. 256GB, XL, 42mm…"   },
  { key: "material", label: "Malzeme",        placeholder: "örn. Deri, Pamuk, Alüminyum…" },
  { key: "gender",   label: "Cinsiyet",       placeholder: "örn. Kadın, Erkek, Unisex…"  },
] as const

type SpecKey = typeof SPEC_FIELDS[number]["key"]

interface FormState {
  name: string
  description: string
  price: string
  compare_price: string
  category_id: string
  subcategory: string
  specs: Record<SpecKey, string>
  stock: string
  is_active: boolean
  extraTags: string[]
  images: string[]
}

const INITIAL: FormState = {
  name: "", description: "", price: "", compare_price: "",
  category_id: "", subcategory: "",
  specs: { brand: "", model: "", color: "", storage: "", material: "", gender: "" },
  stock: "0", is_active: true,
  extraTags: [], images: [],
}

// ── Image Upload Widget ───────────────────────────────────────────────────────
function ImageUploader({
  images,
  onAdd,
  onRemove,
  uploading,
}: {
  images: string[]
  onAdd: (url: string) => void
  onRemove: (url: string) => void
  uploading: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploadingLocal, setUploadingLocal] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploadError(null)
    setUploadingLocal(true)
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload/product-image", { method: "POST", body: fd })
      const json = await res.json()
      if (!res.ok) { setUploadError(json.error ?? "Yükleme başarısız."); break }
      onAdd(json.url)
    }
    setUploadingLocal(false)
  }, [onAdd])

  return (
    <div className="space-y-3">
      {/* Existing images grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((url, i) => (
            <div key={url} className="relative group rounded-xl overflow-hidden border bg-muted aspect-square">
              <Image
                src={url}
                alt={`Ürün görseli ${i + 1}`}
                fill
                className="object-cover"
                sizes="120px"
              />
              {i === 0 && (
                <span className="absolute top-1 left-1 text-[10px] bg-primary text-primary-foreground rounded px-1.5 py-0.5 font-medium">
                  Ana
                </span>
              )}
              <button
                type="button"
                onClick={() => onRemove(url)}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80 hover:bg-background border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Görseli kaldır"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {/* Add more slot */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploadingLocal}
            className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          >
            {uploadingLocal ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Plus className="h-5 w-5" />
                <span className="text-[10px] font-medium">Ekle</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Empty state upload zone */}
      {images.length === 0 && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploadingLocal}
          className={cn(
            "w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 transition-colors",
            "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-foreground",
            uploadingLocal && "opacity-60 pointer-events-none"
          )}
        >
          {uploadingLocal ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : (
            <ImagePlus className="h-8 w-8" />
          )}
          <div className="text-center">
            <p className="text-sm font-medium">Görselleri yüklemek için tıklayın</p>
            <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, WebP — maks. 5 MB — çoklu seçim desteklenir</p>
          </div>
        </button>
      )}

      {uploadError && (
        <p className="text-xs text-destructive">{uploadError}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}

// ── Extra tag chip input ──────────────────────────────────────────────────────
function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState("")
  const add = () => {
    const v = input.trim().toLowerCase()
    if (v && !tags.includes(v)) onChange([...tags, v])
    setInput("")
  }
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Etiket ekle ve Enter'a basın…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add() } }}
          className="h-9 text-sm"
        />
        <Button type="button" size="sm" variant="outline" onClick={add} className="gap-1">
          <Plus className="h-3.5 w-3.5" />
          Ekle
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <Badge key={t} variant="secondary" className="gap-1 pr-1 text-xs">
              <Tag className="h-2.5 w-2.5" />
              {t}
              <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} className="ml-0.5 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function VendorProductNewPage() {
  const router = useRouter()
  const [form, setForm]    = useState<FormState>(INITIAL)
  const [error, setError]  = useState<string | null>(null)
  const [pending, startTx] = useTransition()

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const setSpec = (key: SpecKey, value: string) =>
    setForm((prev) => ({ ...prev, specs: { ...prev.specs, [key]: value } }))

  // Derive subcategories from selected main category
  const selectedCategory = categories.find((c) => c.id === form.category_id)
  const subcategories = selectedCategory?.subcategories ?? []

  // Build final tags: specs + subcategory + extra tags
  function buildTags(): string[] {
    const tags: string[] = []
    for (const { key } of SPEC_FIELDS) {
      const v = form.specs[key].trim()
      if (v) tags.push(`${key}:${v.toLowerCase()}`)
    }
    if (form.subcategory) tags.push(`sub:${form.subcategory}`)
    tags.push(...form.extraTags)
    return [...new Set(tags)]
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.name.trim())       return setError("Ürün adı zorunludur.")
    if (!form.category_id)       return setError("Kategori seçiniz.")
    if (Number(form.price) <= 0) return setError("Fiyat geçerli bir sayı olmalıdır.")

    const tags = buildTags()

    startTx(async () => {
      const res = await fetch("/api/vendor/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:            form.name.trim(),
          description:     form.description.trim(),
          price:           Number(form.price),
          compare_price:   form.compare_price ? Number(form.compare_price) : null,
          category_id:     form.category_id,
          stock:           Number(form.stock),
          is_active:       form.is_active,
          tags,
          image_url:       form.images[0] ?? null,
          images:          form.images,
        }),
      })

      const json = await res.json()
      if (!res.ok) { setError(json.error ?? "Ürün kaydedilemedi."); return }
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
          <p className="text-xs text-muted-foreground mt-0.5">
            Ürün bilgilerini doldurun, birden fazla görsel yükleyin ve arama etiketleri ekleyin
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Images ─────────────────────────────────────────────────────── */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              Ürün Görselleri
            </CardTitle>
            <CardDescription className="text-xs">
              İlk görsel ürün kartında ana görsel olarak kullanılır. Birden fazla görsel seçebilirsiniz.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUploader
              images={form.images}
              onAdd={(url) => set("images", [...form.images, url])}
              onRemove={(url) => set("images", form.images.filter((u) => u !== url))}
              uploading={pending}
            />
          </CardContent>
        </Card>

        {/* ── Basic info ──────────────────────────────────────────────────── */}
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
                placeholder="Ürün özellikleri, avantajları ve detayları…"
                rows={4}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Pricing & Stock ─────────────────────────────────────────────── */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Fiyat & Stok</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="price">Satış Fiyatı (₺) *</Label>
                <Input
                  id="price" type="number" min="0" step="0.01" placeholder="0.00"
                  value={form.price} onChange={(e) => set("price", e.target.value)} required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="compare_price">Karşılaştırma Fiyatı (₺)</Label>
                <Input
                  id="compare_price" type="number" min="0" step="0.01" placeholder="0.00"
                  value={form.compare_price} onChange={(e) => set("compare_price", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="stock">Stok Adedi</Label>
                <Input
                  id="stock" type="number" min="0" placeholder="0"
                  value={form.stock} onChange={(e) => set("stock", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Category ────────────────────────────────────────────────────── */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Kategori & Alt Kategori</CardTitle>
            <CardDescription className="text-xs">
              Ana kategori seçildikten sonra alt kategori seçenekleri görünür.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main category */}
            <div className="space-y-1.5">
              <Label>Ana Kategori *</Label>
              <Select
                value={form.category_id}
                onValueChange={(v) => {
                  set("category_id", v)
                  set("subcategory", "")   // reset subcategory when main changes
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subcategory — only shown when main is selected and has subs */}
            {subcategories.length > 0 && (
              <div className="space-y-1.5">
                <Label>Alt Kategori</Label>
                <Select value={form.subcategory} onValueChange={(v) => set("subcategory", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alt kategori seçin (opsiyonel)" />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories.map((s) => (
                      <SelectItem key={s.slug} value={s.slug}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Product Specs (brand, model, color, etc.) ───────────────────── */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ürün Özellikleri</CardTitle>
            <CardDescription className="text-xs">
              Bu alanlar arama filtreleri olarak kullanılır — alıcılar marka, renk ve model ile ürününüzü bulabilir.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SPEC_FIELDS.map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={`spec-${key}`}>{label}</Label>
                <Input
                  id={`spec-${key}`}
                  placeholder={placeholder}
                  value={form.specs[key]}
                  onChange={(e) => setSpec(key, e.target.value)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── Extra Tags ──────────────────────────────────────────────────── */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ek Etiketler</CardTitle>
            <CardDescription className="text-xs">
              Marka/model/renk dışında ek arama terimleri ekleyin (örn. &quot;su geçirmez&quot;, &quot;hediye&quot;, &quot;yeni&quot;).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TagInput tags={form.extraTags} onChange={(t) => set("extraTags", t)} />
          </CardContent>
        </Card>

        {/* ── Tag preview ─────────────────────────────────────────────────── */}
        {buildTags().length > 0 && (
          <div className="rounded-xl border bg-muted/30 px-4 py-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Oluşturulacak Etiketler</p>
            <div className="flex flex-wrap gap-1.5">
              {buildTags().map((t) => (
                <Badge key={t} variant="outline" className="text-xs font-mono">{t}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* ── Publish toggle ──────────────────────────────────────────────── */}
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
            {pending ? "Kaydediliyor…" : "Ürünü Kaydet"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/vendor-panel/products">Vazgeç</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
