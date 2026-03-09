"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import {
  ShoppingBag, CreditCard, Truck, ShieldCheck,
  Check, AlertTriangle, UserCircle, Info, Loader2, Tag, X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { useCartStore } from "@/lib/store/cart-store"
import { formatPrice } from "@/lib/format"
import { getVendorById } from "@/lib/data/vendors"
import { useAccountStore } from "@/lib/store/account-store"
import type { Order } from "@/lib/store/account-store"
import { cn } from "@/lib/utils"

interface CheckoutContentProps {
  user: User | null
  profile: Record<string, unknown> | null
}

type FormState = {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  address2: string
  city: string
  district: string
  postalCode: string
  country: string
}

type FieldErrors = Partial<Record<keyof FormState, string>>

function splitName(full: string) {
  const parts = (full ?? "").trim().split(/\s+/)
  if (parts.length < 2) return { first: parts[0] ?? "", last: "" }
  return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1] }
}

export function CheckoutContent({ user, profile }: CheckoutContentProps) {
  const router = useRouter()
  const { items, getTotalPrice, getDiscountAmount, getFinalPrice, appliedCoupon, applyCoupon, removeCoupon, clearCart, getItemsByVendor } = useCartStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [errors, setErrors] = useState<FieldErrors>({})
  const [couponInput, setCouponInput] = useState("")
  const [couponError, setCouponError] = useState("")
  const [couponLoading, setCouponLoading] = useState(false)

  const { addOrder } = useAccountStore()

  const { first, last } = splitName((profile?.full_name as string) ?? (user?.user_metadata?.full_name as string) ?? "")

  const [form, setForm] = useState<FormState>({
    firstName:  first,
    lastName:   last,
    email:      user?.email ?? "",
    phone:      (profile?.phone         as string) ?? "",
    address:    (profile?.address_line1 as string) ?? "",
    address2:   (profile?.address_line2 as string) ?? "",
    city:       (profile?.city          as string) ?? "",
    district:   (profile?.district      as string) ?? "",
    postalCode: (profile?.postal_code   as string) ?? "",
    country:    (profile?.country       as string) ?? "KKTC",
  })

  // Track which fields were auto-filled from profile
  const [autoFilled] = useState<Set<keyof FormState>>(() => {
    const filled = new Set<keyof FormState>()
    if (!profile && !user) return filled
    if (first)                         filled.add("firstName")
    if (last)                          filled.add("lastName")
    if (user?.email)                   filled.add("email")
    if (profile?.phone)                filled.add("phone")
    if (profile?.address_line1)        filled.add("address")
    if (profile?.address_line2)        filled.add("address2")
    if (profile?.city)                 filled.add("city")
    if (profile?.district)             filled.add("district")
    if (profile?.postal_code)          filled.add("postalCode")
    return filled
  })

  const missingRequired: (keyof FormState)[] = (
    ["firstName", "lastName", "email", "phone", "address", "city", "postalCode"] as (keyof FormState)[]
  ).filter((k) => !form[k])

  const missingLabels: Record<keyof FormState, string> = {
    firstName: "Ad", lastName: "Soyad", email: "E-posta",
    phone: "Telefon", address: "Adres", address2: "Adres 2",
    city: "Şehir", district: "İlçe", postalCode: "Posta Kodu", country: "Ülke",
  }

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => { const n = { ...e }; delete n[field]; return n })
  }

  function validate(): boolean {
    const errs: FieldErrors = {}
    if (!form.firstName.trim())  errs.firstName  = "Ad zorunludur"
    if (!form.lastName.trim())   errs.lastName   = "Soyad zorunludur"
    if (!form.email.trim())      errs.email      = "E-posta zorunludur"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Geçerli bir e-posta girin"
    if (!form.phone.trim())      errs.phone      = "Telefon zorunludur"
    else if (!/^\+?[\d\s\-()]{7,20}$/.test(form.phone)) errs.phone = "Geçerli bir telefon numarası girin"
    if (!form.address.trim())    errs.address    = "Adres zorunludur"
    if (!form.city.trim())       errs.city       = "Şehir zorunludur"
    if (!form.postalCode.trim()) errs.postalCode = "Posta kodu zorunludur"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) {
      document.getElementById("contact-section")?.scrollIntoView({ behavior: "smooth", block: "start" })
      return
    }
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Build and persist the new order so it appears immediately in the customer panel
    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "pending",
      items: items.map(({ product, quantity }) => ({
        productId: product.id,
        productName: product.name,
        vendorName: getVendorById(product.vendorId)?.name ?? "Bilinmeyen Satıcı",
        imageUrl: product.images[0] ?? "",
        quantity,
        price: product.price,
      })),
      subtotal: totalPrice,
      shippingFee: 0,
      discount: discountAmount,
      total: finalPrice,
      couponCode: appliedCoupon?.code,
      deliveryAddress: {
        fullName: `${form.firstName} ${form.lastName}`,
        phone: form.phone,
        line1: form.address,
        city: form.city,
        district: form.district,
      },
      estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      statusHistory: [
        { status: "pending", timestamp: new Date().toISOString(), note: "Sipariş alındı" },
      ],
    }
    addOrder(newOrder)
    clearCart()
    router.push("/checkout/success")
  }

  const itemsByVendor = getItemsByVendor()
  const totalPrice = getTotalPrice()
  const discountAmount = getDiscountAmount()
  const finalPrice = getFinalPrice()
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  async function handleApplyCoupon() {
    const code = couponInput.trim()
    if (!code) return
    setCouponLoading(true)
    setCouponError("")
    await new Promise((r) => setTimeout(r, 600))
    const result = applyCoupon(code)
    setCouponLoading(false)
    if (!result.valid) {
      setCouponError(result.message)
    } else {
      setCouponInput("")
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="rounded-full bg-secondary p-8 mb-6">
          <ShoppingBag className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Sepetiniz boş</h2>
        <p className="text-muted-foreground mb-6">Ödeme yapmadan önce ürün ekleyin</p>
        <Button asChild size="lg">
          <Link href="/products">Ürünleri İncele</Link>
        </Button>
      </div>
    )
  }

  const autoFilledCount = autoFilled.size
  const isLoggedIn = !!user

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-5">

          {/* Auto-fill status banner */}
          {isLoggedIn && autoFilledCount > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
              <UserCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-primary">
                  {autoFilledCount} alan profilinizden otomatik dolduruldu
                </p>
                <p className="text-muted-foreground mt-0.5">
                  Bilgilerinizi güncellemek için{" "}
                  <Link href="/account" className="underline underline-offset-2 hover:text-primary transition-colors">
                    profilinize
                  </Link>{" "}
                  gidin.
                </p>
              </div>
            </div>
          )}

          {/* Missing fields banner */}
          {isLoggedIn && missingRequired.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-400">
                  Eksik bilgiler — lütfen tamamlayın
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {missingRequired.map((k) => (
                    <Badge key={k} variant="outline" className="text-xs border-amber-300 text-amber-700 dark:text-amber-400">
                      {missingLabels[k]}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!isLoggedIn && (
            <div className="flex items-start gap-3 rounded-xl border bg-secondary/60 px-4 py-3">
              <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                Daha hızlı ödeme için{" "}
                <Link href="/auth/login" className="font-medium text-primary underline underline-offset-2">
                  giriş yapın
                </Link>{" "}
                — adres bilgileriniz otomatik doldurulur.
              </p>
            </div>
          )}

          {/* Contact Information */}
          <Card id="contact-section">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">İletişim Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <FieldGroup
                  id="firstName" label="Ad" placeholder="Ahmet"
                  value={form.firstName} onChange={(v) => set("firstName", v)}
                  error={errors.firstName} autoFilled={autoFilled.has("firstName")}
                  required
                />
                <FieldGroup
                  id="lastName" label="Soyad" placeholder="Yılmaz"
                  value={form.lastName} onChange={(v) => set("lastName", v)}
                  error={errors.lastName} autoFilled={autoFilled.has("lastName")}
                  required
                />
              </div>
              <FieldGroup
                id="email" label="E-posta" placeholder="ahmet@ornek.com"
                type="email" value={form.email} onChange={(v) => set("email", v)}
                error={errors.email} autoFilled={autoFilled.has("email")}
                disabled={!!user}
                hint={user ? "E-posta adresiniz hesabınızdan alınmıştır." : undefined}
                required
              />
              <FieldGroup
                id="phone" label="Telefon" placeholder="+90 533 123 4567"
                type="tel" value={form.phone} onChange={(v) => set("phone", v)}
                error={errors.phone} autoFilled={autoFilled.has("phone")}
                required
              />
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Teslimat Adresi</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <FieldGroup
                id="address" label="Adres" placeholder="Atatürk Caddesi No: 123"
                value={form.address} onChange={(v) => set("address", v)}
                error={errors.address} autoFilled={autoFilled.has("address")}
                required
              />
              <FieldGroup
                id="address2" label="Adres Satırı 2 (opsiyonel)" placeholder="Bina adı, Kat, Daire"
                value={form.address2} onChange={(v) => set("address2", v)}
                autoFilled={autoFilled.has("address2")}
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <FieldGroup
                  id="city" label="Şehir" placeholder="Lefkoşa"
                  value={form.city} onChange={(v) => set("city", v)}
                  error={errors.city} autoFilled={autoFilled.has("city")}
                  required
                />
                <FieldGroup
                  id="district" label="İlçe" placeholder="Merkez"
                  value={form.district} onChange={(v) => set("district", v)}
                  autoFilled={autoFilled.has("district")}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <FieldGroup
                  id="postalCode" label="Posta Kodu" placeholder="99010"
                  value={form.postalCode} onChange={(v) => set("postalCode", v)}
                  error={errors.postalCode} autoFilled={autoFilled.has("postalCode")}
                  required
                />
                <FieldGroup
                  id="country" label="Ülke" placeholder="KKTC"
                  value={form.country} onChange={(v) => set("country", v)}
                  autoFilled={autoFilled.has("country")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Ödeme Yöntemi</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                <label className={cn(
                  "flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors",
                  paymentMethod === "card" ? "border-primary bg-primary/5" : "hover:bg-secondary/50"
                )}>
                  <RadioGroupItem value="card" id="card" />
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Kredi / Banka Kartı</p>
                    <p className="text-xs text-muted-foreground">Kartınızla güvenli ödeme yapın</p>
                  </div>
                </label>
                <label className={cn(
                  "flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors",
                  paymentMethod === "cod" ? "border-primary bg-primary/5" : "hover:bg-secondary/50"
                )}>
                  <RadioGroupItem value="cod" id="cod" />
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Kapıda Ödeme</p>
                    <p className="text-xs text-muted-foreground">Siparişinizi teslim alırken ödeyin</p>
                  </div>
                </label>
              </RadioGroup>

              {paymentMethod === "card" && (
                <div className="mt-5 grid gap-4">
                  <FieldGroup
                    id="cardNumber" label="Kart Numarası" placeholder="1234 5678 9012 3456"
                    value="" onChange={() => {}}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FieldGroup
                      id="expiry" label="Son Kullanma" placeholder="AA/YY"
                      value="" onChange={() => {}}
                    />
                    <FieldGroup
                      id="cvv" label="CVV" placeholder="123"
                      value="" onChange={() => {}}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Sipariş Özeti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(itemsByVendor).map(([vendorId, vendorItems]) => {
                const vendor = getVendorById(vendorId)
                return (
                  <div key={vendorId} className="space-y-2">
                    {vendor && (
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <div className="relative h-5 w-5 rounded-full overflow-hidden bg-secondary">
                          <Image src={vendor.logo} alt={vendor.name} fill className="object-cover" />
                        </div>
                        <span>{vendor.name}</span>
                      </div>
                    )}
                    {vendorItems.map(({ product, quantity }) => (
                      <div key={product.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground truncate max-w-[180px]">
                          {product.name} x{quantity}
                        </span>
                        <span>{formatPrice(product.price * quantity)}</span>
                      </div>
                    ))}
                  </div>
                )
              })}

              <Separator />

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ara Toplam ({totalItems} ürün)</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Kargo</span>
                <span className="text-green-600 font-medium">Ücretsiz</span>
              </div>

              {/* Applied coupon discount */}
              {appliedCoupon && discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5" />{appliedCoupon.code}
                  </span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              {appliedCoupon?.type === "free_shipping" && (
                <div className="flex justify-between text-sm text-green-600">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5" />{appliedCoupon.code}
                  </span>
                  <span>Ücretsiz kargo</span>
                </div>
              )}

              <Separator />

              {/* Coupon input */}
              {!appliedCoupon ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">İndirim Kodu</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Kupon kodu"
                      value={couponInput}
                      onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError("") }}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                      className="text-sm uppercase"
                      maxLength={20}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponInput.trim()}
                      className="shrink-0"
                    >
                      {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Uygula"}
                    </Button>
                  </div>
                  {couponError && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <X className="h-3 w-3 shrink-0" />{couponError}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 px-3 py-2.5">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-green-800 dark:text-green-400">{appliedCoupon.code}</p>
                      <p className="text-xs text-green-700 dark:text-green-500">{appliedCoupon.description}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-green-700 hover:text-red-500 transition-colors ml-2"
                    aria-label="Kuponu kaldır"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <Separator />

              <div className="flex justify-between font-semibold text-lg">
                <span>Toplam</span>
                <span className={cn(discountAmount > 0 && "text-green-700")}>{formatPrice(finalPrice)}</span>
              </div>
              {discountAmount > 0 && (
                <p className="text-xs text-right text-green-600 font-medium">
                  {formatPrice(discountAmount)} tasarruf ettiniz!
                </p>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                <ShieldCheck className="h-4 w-4 text-green-600 shrink-0" />
                <span>Güvenli ödeme — verileriniz korunmaktadır</span>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />İşleniyor…</>
                ) : (
                  <><Check className="mr-2 h-4 w-4" />Siparişi Tamamla</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  )
}

// ---- Reusable field component ----

interface FieldGroupProps {
  id: string
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  type?: string
  error?: string
  autoFilled?: boolean
  disabled?: boolean
  hint?: string
  required?: boolean
}

function FieldGroup({
  id, label, placeholder, value, onChange,
  type = "text", error, autoFilled, disabled, hint, required,
}: FieldGroupProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label htmlFor={id} className={cn(error && "text-red-600")}>
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
        {autoFilled && !error && (
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
            <Check className="h-2.5 w-2.5" />
            Otomatik
          </span>
        )}
      </div>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          "transition-colors",
          autoFilled && !error && "border-primary/40 bg-primary/5",
          error && "border-red-400 focus-visible:ring-red-400",
          disabled && "bg-secondary/50 text-muted-foreground cursor-not-allowed"
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      />
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-600 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 shrink-0" />{error}
        </p>
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}
