"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight, Tag, X, Check, Loader2, Banknote, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useCartStore } from "@/lib/store/cart-store"
import { formatPrice } from "@/lib/format"
import { getVendorById } from "@/lib/data/vendors"
import { cn } from "@/lib/utils"

export function CartContent() {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getDiscountAmount,
    getFinalPrice,
    getItemsByVendor,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCartStore()

  const [couponInput, setCouponInput]     = useState("")
  const [couponError, setCouponError]     = useState("")
  const [couponLoading, setCouponLoading] = useState(false)

  const itemsByVendor  = getItemsByVendor()
  const totalPrice     = getTotalPrice()
  const discountAmount = getDiscountAmount()
  const finalPrice     = getFinalPrice()
  const totalItems     = items.reduce((sum, item) => sum + item.quantity, 0)
  const vendorCount    = Object.keys(itemsByVendor).length

  async function handleApplyCoupon() {
    const code = couponInput.trim()
    if (!code) return
    setCouponLoading(true)
    setCouponError("")
    const result = await applyCoupon(code)
    setCouponLoading(false)
    if (!result.valid) {
      setCouponError(result.message)
    } else {
      setCouponInput("")
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-secondary p-8 mb-6">
          <ShoppingBag className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Sepetiniz boş</h2>
        <p className="text-muted-foreground mb-6">Henüz sepetinize ürün eklemediniz</p>
        <Button asChild size="lg">
          <Link href="/products">
            Alışverişe Başla
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Cart Items grouped by vendor */}
      <div className="lg:col-span-2 space-y-5">
        {Object.entries(itemsByVendor).map(([vendorId, vendorItems]) => {
          const vendor      = getVendorById(vendorId)
          const vendorTotal = vendorItems.reduce((s, i) => s + i.product.price * i.quantity, 0)
          return (
            <Card key={vendorId} className="overflow-hidden">
              <CardHeader className="pb-3 bg-secondary/30 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-background border overflow-hidden flex-shrink-0">
                      {vendor?.logo ? (
                        <Image src={vendor.logo} alt={vendor.name} width={36} height={36} className="object-cover" />
                      ) : (
                        <Store className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">{vendor?.name ?? "Mağaza"}</CardTitle>
                      <p className="text-xs text-muted-foreground">{vendorItems.length} ürün</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground">{formatPrice(vendorTotal)}</span>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                {vendorItems.map(({ product, quantity }) => (
                  <div key={product.id} className="flex gap-4">
                    <Link
                      href={`/products/${product.id}`}
                      className="relative h-24 w-24 flex-shrink-0 rounded-xl overflow-hidden bg-secondary border"
                    >
                      <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${product.id}`}
                        className="font-medium text-sm leading-snug hover:text-primary transition-colors line-clamp-2"
                      >
                        {product.name}
                      </Link>

                      {(product.selectedVariant || product.variant) && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {product.selectedVariant ?? product.variant}
                        </p>
                      )}

                      <p className="text-sm font-semibold text-primary mt-1">{formatPrice(product.price)}</p>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-0.5 border rounded-lg overflow-hidden h-8">
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8 rounded-none"
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                            aria-label="Azalt"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium select-none">{quantity}</span>
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8 rounded-none"
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            aria-label="Artır"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{formatPrice(product.price * quantity)}</span>
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeItem(product.id)}
                            aria-label={`${product.name} ürününü kaldır`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        })}

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={clearCart}>
            Sepeti Temizle
          </Button>
        </div>
      </div>

      {/* Order Summary sidebar */}
      <div className="lg:col-span-1">
        <Card className="sticky top-24">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Sipariş Özeti</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-3 py-2.5">
              <Banknote className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">Kapıda Ödeme</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-500">Teslimat sırasında nakit veya kart ile ödeyin</p>
              </div>
            </div>

            {vendorCount > 1 && (
              <div className="rounded-lg bg-secondary/60 border px-3 py-2 text-xs text-muted-foreground flex items-start gap-2">
                <Store className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>
                  <span className="font-medium text-foreground">{vendorCount} farklı mağaza</span> — her mağaza kendi paketini gönderir
                </span>
              </div>
            )}

            <Separator />

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ara Toplam ({totalItems} ürün)</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Kargo</span>
              <span className="text-emerald-600 font-medium">Ücretsiz</span>
            </div>

            {appliedCoupon && discountAmount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span className="flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" />{appliedCoupon.code}
                </span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}
            {appliedCoupon?.type === "free_shipping" && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" />{appliedCoupon.code}</span>
                <span>Ücretsiz kargo</span>
              </div>
            )}

            <Separator />

            {!appliedCoupon ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">İndirim Kodu</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Kupon kodunu girin"
                    value={couponInput}
                    onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError("") }}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                    className="text-sm uppercase"
                    maxLength={20}
                  />
                  <Button
                    variant="outline" size="sm"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponInput.trim()}
                    className="shrink-0"
                  >
                    {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Uygula"}
                  </Button>
                </div>
                {couponError && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <X className="h-3 w-3 shrink-0" />{couponError}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 px-3 py-2.5">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-emerald-800 dark:text-emerald-400">{appliedCoupon.code}</p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-500">{appliedCoupon.description}</p>
                  </div>
                </div>
                <button onClick={removeCoupon} className="text-emerald-700 hover:text-destructive transition-colors ml-2" aria-label="Kuponu kaldır">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <Separator />

            <div className="flex justify-between font-bold text-lg">
              <span>Toplam</span>
              <span className={cn(discountAmount > 0 && "text-emerald-700")}>{formatPrice(finalPrice)}</span>
            </div>
            {discountAmount > 0 && (
              <p className="text-xs text-emerald-600 text-right font-medium">{formatPrice(discountAmount)} tasarruf ettiniz!</p>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-2 pt-0">
            <Button className="w-full h-11 gap-2 font-semibold rounded-xl" size="lg" asChild>
              <Link href="/checkout">
                Siparişi Tamamla
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full h-9 text-sm rounded-xl" asChild>
              <Link href="/products">Alışverişe Devam Et</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
