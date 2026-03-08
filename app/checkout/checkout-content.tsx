"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ShoppingBag, CreditCard, Truck, ShieldCheck, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useCartStore } from "@/lib/store/cart-store"
import { formatPrice } from "@/lib/format"
import { getVendorById } from "@/lib/data/vendors"

export function CheckoutContent() {
  const router = useRouter()
  const { items, getTotalPrice, clearCart, getItemsByVendor } = useCartStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("card")

  const itemsByVendor = getItemsByVendor()
  const totalPrice = getTotalPrice()
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="rounded-full bg-secondary p-8 mb-6">
          <ShoppingBag className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Sepetiniz boş</h2>
        <p className="text-muted-foreground mb-6">
          Ödeme yapmadan önce ürün ekleyin
        </p>
        <Button asChild size="lg">
          <Link href="/products">Ürünleri İncele</Link>
        </Button>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate order processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Clear cart and redirect to success page
    clearCart()
    router.push("/checkout/success")
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">İletişim Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Ad</Label>
                  <Input id="firstName" placeholder="Ahmet" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Soyad</Label>
                  <Input id="lastName" placeholder="Yılmaz" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input id="email" type="email" placeholder="ahmet@ornek.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon Numarası</Label>
                <Input id="phone" type="tel" placeholder="+90 533 123 4567" required />
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Teslimat Adresi</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Adres</Label>
                <Input id="address" placeholder="Atatürk Caddesi No: 123" required />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Şehir</Label>
                  <Input id="city" placeholder="Lefkoşa" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Posta Kodu</Label>
                  <Input id="postalCode" placeholder="99010" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Ülke</Label>
                <Input id="country" placeholder="KKTC" defaultValue="KKTC" required />
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ödeme Yöntemi</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex-1 cursor-pointer flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Kredi / Banka Kartı</p>
                      <p className="text-sm text-muted-foreground">
                        Kartınızla güvenli ödeme yapın
                      </p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors mt-3">
                  <RadioGroupItem value="cod" id="cod" />
                  <Label htmlFor="cod" className="flex-1 cursor-pointer flex items-center gap-3">
                    <Truck className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Kapıda Ödeme</p>
                      <p className="text-sm text-muted-foreground">
                        Siparişinizi teslim alırken ödeyin
                      </p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {paymentMethod === "card" && (
                <div className="mt-6 grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Kart Numarası</Label>
                    <Input id="cardNumber" placeholder="1234 5678 9012 3456" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Son Kullanma</Label>
                      <Input id="expiry" placeholder="AA/YY" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input id="cvv" placeholder="123" required />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">Sipariş Özeti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Items by Vendor */}
              {Object.entries(itemsByVendor).map(([vendorId, vendorItems]) => {
                const vendor = getVendorById(vendorId)
                return (
                  <div key={vendorId} className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {vendor && (
                        <>
                          <div className="relative h-5 w-5 rounded-full overflow-hidden bg-secondary" style={{ position: "relative" }}>
                            <Image
                              src={vendor.logo}
                              alt={vendor.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <span>{vendor.name}</span>
                        </>
                      )}
                    </div>
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
                <span className="text-muted-foreground">
                  Ara Toplam ({totalItems} ürün)
                </span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Kargo</span>
                <span className="text-green-600">Ücretsiz</span>
              </div>

              <Separator />

              <div className="flex justify-between font-semibold text-lg">
                <span>Toplam</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <span>Güvenli ödeme - Verileriniz korunmaktadır</span>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  "İşleniyor..."
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Siparişi Tamamla
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  )
}
