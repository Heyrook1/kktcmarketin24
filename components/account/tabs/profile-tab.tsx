"use client"

import { useState } from "react"
import { Save, MapPin, User, Phone, Calendar, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useAccountStore } from "@/lib/store/account-store"

export function ProfileTab() {
  const { profile, updateProfile } = useAccountStore()
  const [form, setForm] = useState({
    firstName: profile?.firstName ?? "",
    lastName: profile?.lastName ?? "",
    email: profile?.email ?? "",
    phone: profile?.phone ?? "",
    birthDate: profile?.birthDate ?? "",
    line1: profile?.address.line1 ?? "",
    line2: profile?.address.line2 ?? "",
    city: profile?.address.city ?? "",
    district: profile?.address.district ?? "",
    postalCode: profile?.address.postalCode ?? "",
  })
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!form.firstName.trim()) e.firstName = "Ad zorunludur."
    if (!form.lastName.trim()) e.lastName = "Soyad zorunludur."
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Geçerli bir e-posta girin."
    if (!form.phone.trim()) e.phone = "Telefon zorunludur."
    if (!form.line1.trim()) e.line1 = "Adres satırı zorunludur."
    if (!form.city.trim()) e.city = "Şehir zorunludur."
    return e
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    updateProfile({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      birthDate: form.birthDate,
      address: {
        line1: form.line1,
        line2: form.line2,
        city: form.city,
        district: form.district,
        postalCode: form.postalCode,
        country: "KKTC",
      },
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function field(id: keyof typeof form, label: string, placeholder: string, type = "text") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={id} className={errors[id] ? "text-destructive" : ""}>{label}</Label>
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          value={form[id]}
          onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))}
          className={errors[id] ? "border-destructive focus-visible:ring-destructive" : ""}
        />
        {errors[id] && <p className="text-xs text-destructive">{errors[id]}</p>}
      </div>
    )
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Personal info */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <User className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">Kisisel Bilgiler</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field("firstName", "Ad", "Adınız")}
          {field("lastName", "Soyad", "Soyadınız")}
        </div>
        {field("email", "E-posta", "ornek@email.com", "email")}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="phone" className={errors.phone ? "text-destructive" : ""}>
              <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />Telefon</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+90 5xx xxx xx xx"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className={errors.phone ? "border-destructive" : ""}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="birthDate">
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Dogum Tarihi</span>
            </Label>
            <Input
              id="birthDate"
              type="date"
              value={form.birthDate}
              onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Delivery address */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">Teslimat Adresi</h2>
          <span className="text-xs text-muted-foreground ml-auto">Siparislerde otomatik doldurulur</span>
        </div>
        {field("line1", "Adres Satiri 1", "Cadde, No, Daire")}
        {field("line2", "Adres Satiri 2 (opsiyonel)", "Bina adi, Kat vb.")}
        <div className="grid grid-cols-2 gap-4">
          {field("city", "Sehir", "Lefkosa")}
          {field("district", "Ilce", "Merkez")}
        </div>
        {field("postalCode", "Posta Kodu", "99010")}
      </div>

      <div className="flex justify-end">
        <Button type="submit" className="gap-2 min-w-[140px]">
          {saved ? (
            <><Check className="h-4 w-4" />Kaydedildi</>
          ) : (
            <><Save className="h-4 w-4" />Kaydet</>
          )}
        </Button>
      </div>
    </form>
  )
}
