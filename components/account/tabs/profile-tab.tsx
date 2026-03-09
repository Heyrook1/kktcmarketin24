"use client"

import { useState } from "react"
import type { User } from "@supabase/supabase-js"
import { Save, MapPin, UserIcon, Phone, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

interface ProfileTabProps {
  user: User
  profile: Record<string, unknown> | null
}

export function ProfileTab({ user, profile }: ProfileTabProps) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const [form, setForm] = useState({
    full_name:     (profile?.full_name     as string) ?? user.user_metadata?.full_name ?? "",
    display_name:  (profile?.display_name  as string) ?? "",
    phone:         (profile?.phone         as string) ?? "",
    address_line1: (profile?.address_line1 as string) ?? "",
    address_line2: (profile?.address_line2 as string) ?? "",
    city:          (profile?.city          as string) ?? "",
    district:      (profile?.district      as string) ?? "",
    postal_code:   (profile?.postal_code   as string) ?? "",
  })

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase
      .from("profiles")
      .update(form)
      .eq("id", user.id)
    setSaving(false)
    if (err) { setError(err.message); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function field(
    id: keyof typeof form,
    label: string,
    placeholder: string,
    opts?: { type?: string; disabled?: boolean; hint?: string; colSpan?: boolean }
  ) {
    return (
      <div className={opts?.colSpan ? "sm:col-span-2 space-y-1.5" : "space-y-1.5"}>
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          type={opts?.type ?? "text"}
          placeholder={placeholder}
          value={form[id]}
          onChange={(e) => set(id, e.target.value)}
          disabled={opts?.disabled}
          className={opts?.disabled ? "bg-secondary/50 text-muted-foreground" : ""}
        />
        {opts?.hint && <p className="text-xs text-muted-foreground">{opts.hint}</p>}
      </div>
    )
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Personal info */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <UserIcon className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">Kişisel Bilgiler</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field("full_name",    "Ad Soyad",       "Ad Soyad")}
          {field("display_name", "Kullanıcı Adı",  "kullaniciadı")}
          <div className="space-y-1.5">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              value={user.email ?? ""}
              disabled
              className="bg-secondary/50 text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">E-postayı değiştirmek için destek bölümüne yazın.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                Telefon
              </span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+90 542 000 0000"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Delivery address */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">Teslimat Adresi</h2>
          <span className="text-xs text-muted-foreground ml-auto">Siparişlerde otomatik doldurulur</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field("address_line1", "Adres Satırı 1",              "Cadde, No, Daire",  { colSpan: true })}
          {field("address_line2", "Adres Satırı 2 (opsiyonel)", "Bina adı, Kat vb.", { colSpan: true })}
          {field("city",          "Şehir",                       "Lefkoşa")}
          {field("district",      "İlçe",                        "Merkez")}
          {field("postal_code",   "Posta Kodu",                  "99010")}
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} className="gap-2 min-w-[140px]">
          {saving
            ? <><Loader2 className="h-4 w-4 animate-spin" />Kaydediliyor…</>
            : saved
            ? <><Check className="h-4 w-4" />Kaydedildi</>
            : <><Save className="h-4 w-4" />Kaydet</>}
        </Button>
      </div>
    </form>
  )
}
