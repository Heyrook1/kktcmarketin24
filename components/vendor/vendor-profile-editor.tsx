"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Store, Image as ImageIcon, MapPin } from "lucide-react"

type VendorStore = {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  cover_url: string | null
  location: string | null
  is_active: boolean
  is_verified: boolean
}

export function VendorProfileEditor({ store }: { store: VendorStore }) {
  const [draft, setDraft] = useState(() => ({
    name: store.name ?? "",
    description: store.description ?? "",
    logo_url: store.logo_url ?? "",
    cover_url: store.cover_url ?? "",
    location: store.location ?? "",
    is_active: store.is_active,
  }))
  const [error, setError] = useState<string | null>(null)
  const [pending, startTx] = useTransition()

  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const payload = {
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      logo_url: draft.logo_url.trim() || null,
      cover_url: draft.cover_url.trim() || null,
      location: draft.location.trim() || null,
      is_active: draft.is_active,
    }

    if (!payload.name) {
      setError("Mağaza adı zorunludur.")
      return
    }

    startTx(async () => {
      const res = await fetch("/api/vendor/store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((json?.error as string) ?? "Mağaza güncellenemedi.")
        return
      }

      // Server Components should re-fetch the updated store data
      window.location.reload()
    })
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Store className="h-4 w-4 text-primary" />
          Mağaza Profilini Düzenle
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="storeName">Mağaza Adı</Label>
              <Input
                id="storeName"
                value={draft.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Örn. Demo Mağaza"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="storeSlug">Slug</Label>
              <Input id="storeSlug" value={store.slug} disabled />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location">
                <MapPin className="inline h-4 w-4 -mt-0.5 mr-1 text-muted-foreground" />
                Konum
              </Label>
              <Input
                id="location"
                value={draft.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Örn. Lefkoşa, KKTC"
              />
            </div>

            <div className="space-y-1.5 flex items-center justify-between gap-3 pt-6 md:pt-0">
              <div>
                <Label>Aktif</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Ürün kartlarında görünürlük</p>
              </div>
              <Switch checked={draft.is_active} onCheckedChange={(v) => set("is_active", v)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              rows={4}
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Mağazanızı kısaca anlatın…"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="logoUrl" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                Logo URL
              </Label>
              <Input
                id="logoUrl"
                value={draft.logo_url}
                onChange={(e) => set("logo_url", e.target.value)}
                placeholder="https://.../logo.png"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="coverUrl" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                Kapak URL
              </Label>
              <Input
                id="coverUrl"
                value={draft.cover_url}
                onChange={(e) => set("cover_url", e.target.value)}
                placeholder="https://.../cover.jpg"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={pending} className="gap-2">
              {pending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
            {store.is_verified ? (
              <Badge className="bg-emerald-100 text-emerald-800 gap-1">Onaylı Satıcı</Badge>
            ) : (
              <Badge variant="secondary">Onay Bekleniyor</Badge>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

