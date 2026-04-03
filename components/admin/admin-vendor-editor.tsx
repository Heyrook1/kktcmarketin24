"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

type VendorStore = {
  id: string
  owner_id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  cover_url: string | null
  location: string | null
  is_active: boolean
  is_verified: boolean
}

export function AdminVendorEditor({ vendor }: { vendor: VendorStore }) {
  const [draft, setDraft] = useState(() => ({
    name: vendor.name ?? "",
    slug: vendor.slug ?? "",
    description: vendor.description ?? "",
    logo_url: vendor.logo_url ?? "",
    cover_url: vendor.cover_url ?? "",
    location: vendor.location ?? "",
    is_active: vendor.is_active,
    is_verified: vendor.is_verified,
  }))
  const [error, setError] = useState<string | null>(null)
  const [pending, startTx] = useTransition()

  function set<K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const payload = {
      name: draft.name.trim(),
      slug: draft.slug.trim(),
      description: draft.description.trim() || null,
      logo_url: draft.logo_url.trim() || null,
      cover_url: draft.cover_url.trim() || null,
      location: draft.location.trim() || null,
      is_active: draft.is_active,
      is_verified: draft.is_verified,
    }

    if (!payload.name) {
      setError("Mağaza adı zorunludur.")
      return
    }
    if (!payload.slug) {
      setError("Slug zorunludur.")
      return
    }

    startTx(async () => {
      const res = await fetch(`/api/admin/vendors/${vendor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((json?.error as string) ?? "Vendor güncellenemedi.")
        return
      }

      window.location.reload()
    })
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold">Mağaza Düzenle</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {vendor.id}
              </div>
            </div>
            {vendor.is_verified ? (
              <Badge className="bg-emerald-100 text-emerald-800">Onaylı</Badge>
            ) : (
              <Badge variant="secondary">Beklemede</Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Mağaza Adı</Label>
              <Input id="name" value={draft.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={draft.slug} onChange={(e) => set("slug", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Konum</Label>
              <Input id="location" value={draft.location} onChange={(e) => set("location", e.target.value)} />
            </div>
            <div className="space-y-1.5 flex items-center justify-between gap-3 pt-6 md:pt-0">
              <div>
                <Label>Aktif</Label>
              </div>
              <Switch checked={draft.is_active} onCheckedChange={(v) => set("is_active", v)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea id="description" rows={4} value={draft.description} onChange={(e) => set("description", e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input id="logo_url" value={draft.logo_url} onChange={(e) => set("logo_url", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cover_url">Kapak URL</Label>
              <Input id="cover_url" value={draft.cover_url} onChange={(e) => set("cover_url", e.target.value)} />
            </div>
            <div className="space-y-1.5 flex items-center justify-between gap-3 pt-6 md:pt-0">
              <div>
                <Label>Onaylı</Label>
              </div>
              <Switch checked={draft.is_verified} onCheckedChange={(v) => set("is_verified", v)} />
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
            <Button type="button" variant="secondary" disabled={pending} onClick={() => window.location.assign(`/admin/vendors/${vendor.id}`)}>
              Yenile
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

