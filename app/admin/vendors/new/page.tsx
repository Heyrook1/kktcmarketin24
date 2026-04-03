"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

type FormState = {
  email: string
  password: string
  storeName: string
  slug: string
  description: string
  location: string
  logo_url: string
  cover_url: string
  is_active: boolean
  is_verified: boolean
}

const INITIAL: FormState = {
  email: "",
  password: "",
  storeName: "",
  slug: "",
  description: "",
  location: "",
  logo_url: "",
  cover_url: "",
  is_active: true,
  is_verified: false,
}

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}

export default function AdminCreateVendorPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(INITIAL)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTx] = useTransition()

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.email.trim() || !form.email.includes("@")) {
      setError("Geçerli bir e-posta girin.")
      return
    }
    if (!form.password.trim() || form.password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.")
      return
    }
    if (!form.storeName.trim()) {
      setError("Mağaza adı zorunludur.")
      return
    }
    const slug = form.slug.trim() || slugify(form.storeName)
    if (!slug) {
      setError("Slug oluşturulamadı. Lütfen manuel girin.")
      return
    }

    startTx(async () => {
      const res = await fetch("/api/admin/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          password: form.password,
          store: {
            name: form.storeName.trim(),
            slug,
            description: form.description.trim() || null,
            location: form.location.trim() || null,
            logo_url: form.logo_url.trim() || null,
            cover_url: form.cover_url.trim() || null,
            is_active: form.is_active,
            is_verified: form.is_verified,
          },
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((json?.error as string) ?? "Vendor oluşturulamadı.")
        return
      }

      const storeId = json?.storeId as string | undefined
      if (!storeId) {
        setError("Başarıyla oluşturuldu ama storeId alınamadı.")
        return
      }

      router.push(`/admin/vendors/${storeId}`)
      router.refresh()
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Yeni Vendor Oluştur</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Owner/admin herhangi bir vendor hesabı oluşturabilir.</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Vendor Hesap Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Vendor E-posta</Label>
                <Input id="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="vendor@domain.com" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Şifre</Label>
                <Input id="password" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="••••••••" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="storeName">Mağaza Adı</Label>
                <Input
                  id="storeName"
                  value={form.storeName}
                  onChange={(e) => {
                    const next = e.target.value
                    set("storeName", next)
                    if (!form.slug.trim()) set("slug", slugify(next))
                  }}
                  placeholder="Örn. Demo Mağaza"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="demo-magaza" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea id="description" rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Mağazanızı anlatın..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="location">Konum</Label>
                <Input id="location" value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Örn. Lefkoşa, KKTC" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input id="logoUrl" value={form.logo_url} onChange={(e) => set("logo_url", e.target.value)} placeholder="https://.../logo.png" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="coverUrl">Kapak URL</Label>
                <Input id="coverUrl" value={form.cover_url} onChange={(e) => set("cover_url", e.target.value)} placeholder="https://.../cover.jpg" />
              </div>

              <div className="space-y-1.5 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-3 pt-6">
                  <div>
                    <Label>Aktif</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Mağaza ürün kartlarında görünür.</p>
                  </div>
                  <Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} />
                </div>
                <div className="flex items-center justify-between gap-3 pt-2">
                  <div>
                    <Label>Onaylı</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Verified rozetini etkiler.</p>
                  </div>
                  <Switch checked={form.is_verified} onCheckedChange={(v) => set("is_verified", v)} />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={pending}>
                {pending ? "Oluşturuluyor..." : "Vendor Oluştur"}
              </Button>
              <Button type="button" variant="secondary" disabled={pending} onClick={() => router.push("/admin/vendors")}>
                İptal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

