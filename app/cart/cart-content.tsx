"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight, Tag, X, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
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

  const [couponInput, setCouponInput] = useState("")
  const [couponError, setCouponError] = useState("")
  const [couponLoading, setCouponLoading] = useState(false)

  const itemsByVendor = getItemsByVendor()
  const totalPrice = getTotalPrice()
  const discountAmount = getDiscountAmount()
  const finalPrice = getFinalPrice()
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const vendorCount = Object.keys(itemsByVendor).length

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
      <div className="flex flex-col items-center justify-center py-16">
        <div className="rounded-full bg-secondary p-8 mb-6">
          <ShoppingBag className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Sepetiniz boş</h2>
        <p className="text-muted-foreground mb-6">
          Henüz sepetinize ürün eklemediniz
        </p>
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
      {/* Cart Items */}
      <div className="lg:col-span-2 space-y-6">
        {/* Multi-vendor warning */}
        {vendorCount > 1 && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3">
            <svg className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
            <div className="text-sm">
              <p className="font-semibold text-amber-800 dark:text-amber-400">
                Bu ürünler {vendorCount} farklı satıcıdan — ayrı siparişler oluşturulacak
              </p>
              <p className="text-amber-700 dark:text-amber-500 mt-0.5 text-xs">
                Kapıda ödeme (COD) sisteminde her satıcı için ayrı bir sipariş ve teslimat gerçekleşir.
              </p>
            </div>
          </div>
        )}
        {Object.entries(itemsByVendor).map(([vendorId, vendorItems]) => {
          const vendor = getVendorById(vendorId)
          return (
            <Card key={vendorId}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  {vendor && (
                    <>
                      <div className="relative h-8 w-8 rounded-full overflow-hidden bg-secondary">
                        <Image
                          src={vendor.logo}
                          alt={vendor.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <CardTitle className="text-base">{vendor.name}</CardTitle>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {vendorItems.map(({ product, quantity }) => (
                  <div key={product.id} className="flex gap-4">
                    {/* Product Image */}
                    <Link
                      href={`/products/${product.id}`}
                      className="relative h-24 w-24 flex-shrink-0 rounded-lg overflow-hidden bg-secondary"
                    >
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </Link>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${product.id}`}
                        className="font-medium hover:text-primary transition-colors line-clamp-2"
                      >
                        {product.name}
                      </Link>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatPrice(product.price)} / adet
                      </p>

                      <div className="flex items-center justify-between mt-3">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1 border rounded-lg">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Item Total & Remove */}
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">
                            {formatPrice(product.price * quantity)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeItem(product.id)}
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

        {/* Clear Cart */}
        <div className="flex justify-end">
          <Button variant="outline" onClick={clearCart}>
            Sepeti Temizle
          </Button>
        </div>
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-1">
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle>Sipariş Özeti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Ara Toplam ({totalItems} ürün)
              </span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Kargo</span>
              <span className={appliedCoupon?.type === "free_shipping" ? "text-green-600 font-medium line-through text-muted-foreground" : "text-green-600 font-medium"}>
                Ücretsiz
              </span>
            </div>

            {/* Coupon applied */}
            {appliedCoupon && discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span className="flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" />
                  {appliedCoupon.code}
                </span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}
            {appliedCoupon?.type === "free_shipping" && (
              <div className="flex justify-between text-sm text-green-600">
                <span className="flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" />
                  {appliedCoupon.code}
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
                    placeholder="Kupon kodunu girin"
                    value={couponInput}
                    onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError("") }}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                    className="text-sm uppercase"
                    maxLength={20}
                  />
                  <Button
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
              <p className="text-xs text-green-600 text-right font-medium">
                {formatPrice(discountAmount)} tasarruf ettiniz!
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Vergiler ödeme sayfasında hesaplanacaktır
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" size="lg" asChild>
              <Link href="/checkout">
                {vendorCount > 1 ? `${vendorCount} Satıcı İçin Ödemeye Geç` : "Ödemeye Geç"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
