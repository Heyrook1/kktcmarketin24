"use client"

import { useMemo, useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type VendorMini = { id: string; name: string }

type ProductInput = {
  name: string
  description?: string | null
  price: number
  compare_price?: number | null
  category?: string
  category_id?: string
  image_url?: string | null
  images?: string[]
  tags?: string[]
  stock?: number
  is_active?: boolean
}

export function BulkProductsImport({ vendors }: { vendors: VendorMini[] }) {
  const [vendorId, setVendorId] = useState<string>(vendors[0]?.id ?? "")
  const [jsonText, setJsonText] = useState<string>(() => {
    const sample: ProductInput[] = [
      {
        name: "Demo Ürün",
        description: "Açıklama",
        price: 199.99,
        category: "electronics",
        tags: ["brand:samsung", "model:galaxy-s24"],
        stock: 10,
        is_active: true,
        images: ["https://example.com/1.jpg"],
      },
    ]
    return JSON.stringify(sample, null, 2)
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, startTx] = useTransition()

  const parsedPreview = useMemo(() => {
    try {
      const value = JSON.parse(jsonText)
      return Array.isArray(value) ? value.length : Array.isArray(value?.products) ? value.products.length : 0
    } catch {
      return 0
    }
  }, [jsonText])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!vendorId) {
      setError("Vendor seçin.")
      return
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      setError("JSON geçerli değil.")
      return
    }

    startTx(async () => {
      const res = await fetch(`/api/admin/vendors/${vendorId}/bulk-products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(parsed),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((json?.error as string) ?? "Toplu ürün ekleme başarısız.")
        return
      }

      const inserted = typeof json?.inserted === "number" ? json.inserted : undefined
      setSuccess(inserted != null ? `${inserted} ürün eklendi.` : "Ürünler eklendi.")
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Bulk Product Import</h1>
        <p className="text-sm text-muted-foreground mt-0.5">JSON array / {`{ products: [] }`} formatını kullanın.</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Ürünleri Toplu Ekle</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Vendor</Label>
              <Select value={vendorId} onValueChange={setVendorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Vendor seçin" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Tahmini ürün sayısı: <span className="font-medium text-foreground">{parsedPreview}</span>
              </div>
              <Button type="button" variant="secondary" onClick={() => setJsonText("")} disabled={pending}>
                Temizle
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label>JSON</Label>
              <Textarea
                rows={12}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder='[{"name":"...","price":1,"category":"..."}]'
              />
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg border border-emerald-300 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-800">
                {success}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={pending}>
                {pending ? "Ekleniyor..." : "Toplu Ekle"}
              </Button>
              <Button type="button" variant="secondary" disabled={pending} onClick={() => setJsonText((t) => t)}>
                Yardım
              </Button>
            </div>

            <Card className="bg-muted/20">
              <CardContent className="pt-4 text-xs text-muted-foreground space-y-2">
                <div>
                  Zorunlu alanlar: <b>name</b>, <b>price</b>, <b>category</b> (veya <b>category_id</b>).
                </div>
                <div>
                  İsteğe bağlı: <b>description</b>, <b>compare_price</b>, <b>stock</b>, <b>is_active</b>, <b>image_url</b>, <b>images</b>, <b>tags</b>.
                </div>
              </CardContent>
            </Card>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

