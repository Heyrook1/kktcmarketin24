"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import {
  ShoppingBag, Truck, Check, AlertTriangle, Loader2,
  UserCircle, MapPin, Phone, MessageSquare, Banknote,
  ChevronDown, ArrowRight, Store, Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useCartStore } from "@/lib/store/cart-store"
import { formatPrice } from "@/lib/format"
import { getVendorById } from "@/lib/data/vendors"
import { cn } from "@/lib/utils"

const CITIES = ["Lefkoşa", "Girne", "Gazimağusa", "Güzelyurt", "İskele", "Lefke", "Diğer"] as const

interface CheckoutContentProps {
  user: User | null
  profile: Record<string, unknown> | null
}

type FormState = {
  fullName: string
  phone:    string
  address:  string
  city:     string
  notes:    string
}

type FieldErrors = Partial<Record<keyof FormState, string>>

export function CheckoutContent({ user, profile }: CheckoutContentProps) {
  const router = useRouter()
  const {
    items, cartId,
    getTotalPrice, getDiscountAmount, getFinalPrice,
    appliedCoupon, clearCart, getItemsByVendor,
  } = useCartStore()

  const profileName  = (profile?.full_name as string) ?? (user?.user_metadata?.full_name as string) ?? ""
  const profilePhone = (profile?.phone as string) ?? ""
  const profileCity  = (profile?.city  as string) ?? ""
  const profileAddr  = (profile?.address_line1 as string) ?? ""

  const [form, setForm] = useState<FormState>({
    fullName: profileName,
    phone:    profilePhone,
    address:  profileAddr,
    city:     CITIES.includes(profileCity as typeof CITIES[number]) ? profileCity : "",
    notes:    "",
  })
  const [errors, setErrors]           = useState<FieldErrors>({})
  const [submitting, setSubmitting]   = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const isLoggedIn = !!user

  function setField(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => { const n = { ...e }; delete n[field]; return n })
  }

  function validate(): boolean {
    const errs: FieldErrors = {}
    if (!form.fullName.trim()) errs.fullName = "Ad Soyad zorunludur."
    if (!form.phone.trim())    errs.phone    = "Telefon numarası zorunludur."
    else if (!/^[\d\s+\-()]{7,20}$/.test(form.phone)) errs.phone = "Geçerli bir telefon numarası girin."
    if (!form.address.trim()) errs.address  = "Teslimat adresi zorunludur."
    if (!form.city)           errs.city     = "Lütfen bir şehir seçin."
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setServerError(null)

    const payload = {
      fullName: form.fullName.trim(),
      phone:    form.phone.trim(),
      address:  form.address.trim(),
      city:     form.city,
      notes:    form.notes.trim(),
      cartId,
      items: items.map(({ product, quantity }) => ({
        product_id:   product.id,
        product_name: product.name,
        vendor_id:    product.vendorId,
        vendor_name:  getVendorById(product.vendorId)?.name ?? "Bilinmeyen Satıcı",
        store_id:     product.vendorId,
        price:        product.price,
        quantity,
        image_url:    product.images?.[0] ?? null,
      })),
    }

    try {
      const res  = await fetch("/api/checkout/place-order", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      })
      const data = await res.json() as { orderId?: string; error?: string }

      if (!res.ok) {
        setServerError(data.error ?? "Sipariş oluşturulamadı. Lütfen tekrar deneyin.")
        setSubmitting(false)
        return
      }

      clearCart()
      router.push(`/order-confirmation/${data.orderId}`)
    } catch {
      setServerError("Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.")
      setSubmitting(false)
    }
  }

  const itemsByVendor = getItemsByVendor()
  const subtotal      = getTotalPrice()
  const discount      = getDiscountAmount()
  const total         = getFinalPrice()
  const totalItems    = items.reduce((s, i) => s + i.quantity, 0)

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-secondary p-8 mb-6">
          <ShoppingBag className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Sepetiniz boş</h2>
        <p className="text-muted-foreground mb-6">Ödeme yapabilmek için sepetinize ürün ekleyin.</p>
        <Button asChild size="lg">
          <Link href="/urunler">
            Alışverişe Başla
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid gap-8 lg:grid-cols-3">

        {/* ── LEFT: Delivery form ── */}
        <div className="lg:col-span-2 space-y-5">

          {serverError && (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive">{serverError}</p>
            </div>
          )}

          {/* Contact */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <UserCircle className="h-4 w-4 text-primary" />
                İletişim Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <CheckoutField
                id="fullName" label="Ad Soyad" required
                placeholder="Ahmet Yılmaz"
                value={form.fullName}
                onChange={(v) => setField("fullName", v)}
                error={errors.fullName}
                icon={<UserCircle className="h-4 w-4" />}
              />
              <CheckoutField
                id="phone" label="Telefon" required type="tel"
                placeholder="05XX XXX XX XX"
                value={form.phone}
                onChange={(v) => setField("phone", v)}
                error={errors.phone}
                icon={<Phone className="h-4 w-4" />}
              />
            </CardContent>
          </Card>

          {/* Delivery address */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Teslimat Adresi
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <CheckoutField
                id="address" label="Adres" required
                placeholder="Atatürk Caddesi No:10, Daire:3"
                value={form.address}
                onChange={(v) => setField("address", v)}
                error={errors.address}
                icon={<MapPin className="h-4 w-4" />}
                multiline
              />
              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-sm font-medium">
                  Şehir <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <select
                    id="city"
                    value={form.city}
                    onChange={(e) => setField("city", e.target.value)}
                    className={cn(
                      "flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition",
                      !form.city && "text-muted-foreground",
                      errors.city && "border-destructive"
                    )}
                  >
                    <option value="" disabled>Şehir seçin</option>
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-sm font-medium flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                  Sipariş Notu <span className="text-muted-foreground text-xs">(opsiyonel)</span>
                </Label>
                <textarea
                  id="notes"
                  placeholder="Satıcıya not... (ör. kapı kodu, teslimat saati tercihi)"
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  maxLength={300}
                  rows={3}
                  className="flex w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition"
                />
                <p className="text-right text-xs text-muted-foreground">{form.notes.length}/300</p>
              </div>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Banknote className="h-4 w-4 text-emerald-600" />
                Ödeme Yöntemi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-4 border border-primary rounded-xl bg-primary/5">
                <Truck className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="font-medium text-sm">Kapıda Ödeme (COD)</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Siparişiniz teslim edildiğinde nakit veya kart ile ödeme yapabilirsiniz.
                  </p>
                </div>
                <Check className="h-5 w-5 text-primary ml-auto shrink-0" />
              </div>
              {!isLoggedIn && (
                <p className="text-xs text-destructive font-medium mt-3 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  Kapıda ödeme için giriş yapmanız zorunludur.{" "}
                  <a href="/auth/login?next=/checkout" className="underline">Giriş yap</a>
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── RIGHT: Order summary ── */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-primary" />
                Sipariş Özeti
                <Badge variant="secondary" className="ml-auto text-xs">{totalItems} ürün</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(itemsByVendor).map(([vendorId, vendorItems]) => {
                const vendor = getVendorById(vendorId)
                return (
                  <div key={vendorId}>
                    <div className="flex items-center gap-2 mb-2">
                      <Store className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs font-semibold text-muted-foreground">{vendor?.name ?? "Mağaza"}</span>
                    </div>
                    <ul className="space-y-2">
                      {vendorItems.map(({ product, quantity }) => (
                        <li key={product.id} className="flex items-center gap-2.5">
                          <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-secondary border flex-shrink-0">
                            {product.images?.[0] && (
                              <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{quantity} adet</p>
                          </div>
                          <span className="text-xs font-semibold whitespace-nowrap">{formatPrice(product.price * quantity)}</span>
                        </li>
                      ))}
                    </ul>
                    <Separator className="mt-3" />
                  </div>
                )
              })}

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Ara Toplam</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Kargo</span>
                  <span className="text-emerald-600 font-medium">Ücretsiz</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>İndirim {appliedCoupon ? `(${appliedCoupon.code})` : ""}</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-between font-bold text-base">
                <span>Toplam</span>
                <span className={cn(discount > 0 && "text-emerald-700")}>{formatPrice(total)}</span>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full h-12 rounded-xl gap-2 font-semibold text-base"
                disabled={submitting}
              >
                {submitting
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Sipariş Veriliyor...</>
                  : <>Sipariş Ver <ArrowRight className="h-4 w-4" /></>
                }
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Siparişinizi vererek{" "}
                <Link href="/terms" className="underline hover:text-foreground">Kullanım Koşulları</Link>
                {"'nı"} kabul etmiş olursunuz.
              </p>
            </CardContent>
          </Card>
        </div>

      </div>
    </form>
  )
}

function CheckoutField({
  id, label, required, placeholder, value, onChange, error, icon, type, multiline,
}: {
  id: string; label: string; required?: boolean; placeholder?: string
  value: string; onChange: (v: string) => void; error?: string
  icon?: React.ReactNode; type?: string; multiline?: boolean
}) {
  const base = cn(
    "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition",
    icon && "pl-9",
    error && "border-destructive"
  )
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {icon}
          </span>
        )}
        {multiline
          ? <textarea id={id} placeholder={placeholder} value={value}
              onChange={(e) => onChange(e.target.value)} rows={3}
              className={cn(base, "resize-none")} aria-invalid={!!error} />
          : <Input id={id} type={type ?? "text"} placeholder={placeholder} value={value}
              onChange={(e) => onChange(e.target.value)}
              className={base} aria-invalid={!!error} />
        }
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
