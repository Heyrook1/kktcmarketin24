"use client"

import { useState, useTransition, useRef, useCallback, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft, Loader2, Save, Upload, X, Plus, ImagePlus,
  Tag, Trash2
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

async function parseJsonResponse<T>(res: Response, context: string): Promise<T> {
  const contentType = res.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) return (await res.json()) as T

  const text = await res.text()
  const snippet = text.replace(/\s+/g, " ").slice(0, 220)
  throw new Error(`${context}. JSON bekleniyordu ama HTML/başka bir içerik geldi: ${snippet}`)
}

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
      try {
        const res = await fetch("/api/upload/product-image", { method: "POST", body: fd, credentials: "include" })
        const json = await parseJsonResponse<{ url?: string; error?: string }>(res, "Yükleme başarısız")

        if (!res.ok) { setUploadError(json.error ?? "Yükleme başarısız."); break }
        if (!json.url) { setUploadError("Yüklenen görsel için URL oluşturulamadı."); break }

        onAdd(json.url)
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Yükleme başarısız.")
        break
      }
    }
    setUploadingLocal(false)
  }, [onAdd])

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((url, i) => (
            <div key={url} className="relative group rounded-xl overflow-hidden border bg-muted aspect-square">
              <Image src={url} alt={`Ürün görseli ${i + 1}`} fill className="object-cover" sizes="120px" />
              {i === 0 && (
                <span className="absolute top-1 left-1 text-[10px] bg-primary text-primary-foreground rounded px-1.5 py-0.5 font-medium">
                  Ana
                </span>
              )}
              <button
                type="button" onClick={() => onRemove(url)}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80 hover:bg-background border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          <button
            type="button" onClick={() => inputRef.current?.click()} disabled={uploadingLocal}
            className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          >
            {uploadingLocal ? <Loader2 className="h-5 w-5 animate-spin" /> : (
              <><Plus className="h-5 w-5" /><span className="text-[10px] font-medium">Ekle</span></>
            )}
          </button>
        </div>
      )}

      {images.length === 0 && (
        <button
          type="button" onClick={() => inputRef.current?.click()} disabled={uploadingLocal}
          className={cn(
            "w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 transition-colors",
            "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-foreground",
            uploadingLocal && "opacity-60 pointer-events-none"
          )}
        >
          {uploadingLocal ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <ImagePlus className="h-8 w-8" />}
          <div className="text-center">
            <p className="text-sm font-medium">Görselleri yüklemek için tıklayın</p>
            <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, WebP — maks. 5 MB — çoklu seçim desteklenir</p>
          </div>
        </button>
      )}

      {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
    </div>
  )
}

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
          placeholder="Etiket ekle ve Enter'a basın…" value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add() } }}
          className="h-9 text-sm"
        />
        <Button type="button" size="sm" variant="outline" onClick={add} className="gap-1"><Plus className="h-3.5 w-3.5" />Ekle</Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <Badge key={t} variant="secondary" className="gap-1 pr-1 text-xs">
              <Tag className="h-2.5 w-2.5" />{t}
              <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} className="ml-0.5 hover:text-destructive"><X className="h-3 w-3" /></button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

export default function VendorProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [form, setForm]    = useState<FormState>(INITIAL)
  const [error, setError]  = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [pending, startTx] = useTransition()
  const [deleting, setDeleting] = useState(false)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const setSpec = (key: SpecKey, value: string) =>
    setForm((prev) => ({ ...prev, specs: { ...prev.specs, [key]: value } }))

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/vendor/products/${id}`, { credentials: "include", cache: "no-store" })
        const json = await parseJsonResponse<{ product?: any; error?: string }>(res, "Ürün yüklenemedi")
        if (!res.ok) throw new Error(json.error ?? "Ürün yüklenemedi")
        
        const p = json.product
        
        // Find category logic
        let categoryId = ""
        let subcat = ""
        // Categories have ids. p.category stored the name/slug. Let's try to infer if possible, 
        // fallback to setting both to generic strings but ideally we find the exact category
        // In the original form, category_id is selected, but submitted is category: form.category_id... Wait.
        // In POST, submit is category_id ... Wait, POST uses category = category_id or category text.
        
        const matchedMain = categories.find(c => c.id === p.category || c.name === p.category)
        if (matchedMain) {
          categoryId = matchedMain.id
        }

        const specsObj: Record<string, string> = { brand: "", model: "", color: "", storage: "", material: "", gender: "" }
        const extraTags: string[] = []

        if(p.tags && Array.isArray(p.tags)) {
            p.tags.forEach((tag: string) => {
                if (tag.startsWith("sub:")) {
                    subcat = tag.substring(4)
                } else if(tag.includes(":")) {
                    const [k, v] = tag.split(":")
                    if(k in specsObj) {
                        specsObj[k] = v
                    } else {
                        extraTags.push(tag)
                    }
                } else {
                    extraTags.push(tag)
                }
            })
        }

        setForm({
          name: p.name ?? "",
          description: p.description ?? "",
          price: p.price != null ? String(p.price) : "",
          compare_price: p.compare_price != null ? String(p.compare_price) : "",
          category_id: categoryId || p.category || "",
          subcategory: subcat,
          specs: specsObj as Record<SpecKey, string>,
          stock: p.stock != null ? String(p.stock) : "0",
          is_active: p.is_active ?? true,
          extraTags: extraTags,
          images: p.images ?? (p.image_url ? [p.image_url] : []),
        })
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  // Derive subcategories from selected main category
  const selectedCategory = categories.find((c) => c.id === form.category_id || c.name === form.category_id)
  const subcategories = selectedCategory?.subcategories ?? []

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
    if (Number(form.price) < 1) return setError("Fiyat en az ₺1 olmalıdır.")

    const tags = buildTags()

    startTx(async () => {
      try {
        const res = await fetch(`/api/vendor/products/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name:            form.name.trim(),
            description:     form.description.trim(),
            price:           Number(form.price),
            compare_price:   form.compare_price ? Number(form.compare_price) : null,
            category:        form.category_id,
            stock:           Number(form.stock),
            is_active:       form.is_active,
            tags,
            image_url:       form.images[0] ?? null,
            images:          form.images,
          }),
          credentials: "include",
        })

        const json = await parseJsonResponse<{ error?: string }>(res, "Ürün güncellenemedi")
        if (!res.ok) { setError(json.error ?? "Ürün güncellenemedi."); return }
        router.push("/vendor-panel/products")
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ürün güncellenemedi.")
      }
    })
  }

  async function handleDelete() {
    if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/vendor/products/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Silinemedi")
      router.push("/vendor-panel/products")
      router.refresh()
    } catch {
      setError("Ürün silinemedi.")
      setDeleting(false)
    }
  }

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
          <Link href="/vendor-panel/products"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">Ürünü Düzenle</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ürün detaylarını güncelleyin
          </p>
        </div>
        <div className="flex-1" />
        <Button disabled={deleting || pending} onClick={handleDelete} variant="destructive" size="sm" className="gap-2">
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Sil
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" /> Ürün Görselleri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUploader images={form.images} onAdd={(url) => set("images", [...form.images, url])} onRemove={(url) => set("images", form.images.filter((u) => u !== url))} uploading={pending} />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base">Temel Bilgiler</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="name">Ürün Adı *</Label><Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} required /></div>
            <div className="space-y-1.5"><Label htmlFor="description">Açıklama</Label><Textarea id="description" rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base">Fiyat & Stok</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label htmlFor="price">Satış Fiyatı (₺) *</Label><Input id="price" type="number" min="1" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} required /></div>
              <div className="space-y-1.5"><Label htmlFor="compare_price">Karşılaştırma Fiyatı (₺)</Label><Input id="compare_price" type="number" min="0" step="0.01" value={form.compare_price} onChange={(e) => set("compare_price", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label htmlFor="stock">Stok Adedi</Label><Input id="stock" type="number" min="0" value={form.stock} onChange={(e) => set("stock", e.target.value)} /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base">Kategori & Alt Kategori</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Ana Kategori *</Label>
              <Select value={form.category_id} onValueChange={(v) => { set("category_id", v); set("subcategory", "") }}>
                <SelectTrigger><SelectValue placeholder="Kategori seçin" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {subcategories.length > 0 && (
              <div className="space-y-1.5">
                <Label>Alt Kategori</Label>
                <Select value={form.subcategory} onValueChange={(v) => set("subcategory", v)}>
                  <SelectTrigger><SelectValue placeholder="Alt kategori seçin" /></SelectTrigger>
                  <SelectContent>
                    {subcategories.map((s) => <SelectItem key={s.slug} value={s.slug}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base">Ürün Özellikleri</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SPEC_FIELDS.map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1.5"><Label htmlFor={`spec-${key}`}>{label}</Label><Input id={`spec-${key}`} placeholder={placeholder} value={form.specs[key]} onChange={(e) => setSpec(key, e.target.value)} /></div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base">Ek Etiketler</CardTitle></CardHeader>
          <CardContent><TagInput tags={form.extraTags} onChange={(t) => set("extraTags", t)} /></CardContent>
        </Card>

        {buildTags().length > 0 && (
          <div className="rounded-xl border bg-muted/30 px-4 py-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Oluşturulacak Etiketler</p>
            <div className="flex flex-wrap gap-1.5">
              {buildTags().map((t) => <Badge key={t} variant="outline" className="text-xs font-mono">{t}</Badge>)}
            </div>
          </div>
        )}

        <Card className="shadow-sm">
          <CardContent className="pt-5 flex items-center justify-between">
            <div><p className="text-sm font-medium">Ürünü Yayınla</p></div>
            <Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} />
          </CardContent>
        </Card>

        <div className="flex items-center gap-3 pb-8">
          <Button type="submit" disabled={pending} className="gap-2">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Değişiklikleri Kaydet
          </Button>
          <Button type="button" variant="outline" asChild><Link href="/vendor-panel/products">Vazgeç</Link></Button>
        </div>
      </form>
    </div>
  )
}
