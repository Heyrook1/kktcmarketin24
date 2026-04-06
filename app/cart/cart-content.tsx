"use client"

import Link from "next/link"
import Image from "next/image"
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight, Banknote, Store, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useCartStore } from "@/lib/store/cart-store"
import { formatPrice } from "@/lib/format"
import { getVendorById } from "@/lib/data/vendors"
import { cn } from "@/lib/utils"
import { CartDiscountPicker } from "@/components/cart/cart-discount-picker"

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

  const itemsByVendor  = getItemsByVendor()
  const totalPrice     = getTotalPrice()
  const discountAmount = getDiscountAmount()
  const finalPrice     = getFinalPrice()
  const totalItems     = items.reduce((sum, item) => sum + item.quantity, 0)
  const vendorCount    = Object.keys(itemsByVendor).length

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-secondary p-8 mb-6">
          <ShoppingBag className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Sepetiniz boş</h2>
        <p className="text-muted-foreground mb-6">Henüz sepetinize ürün eklemediniz</p>
        <Button asChild size="lg">
          <Link href="/urunler">
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

            <CartDiscountPicker
              subtotal={totalPrice}
              appliedCoupon={appliedCoupon}
              applyCoupon={applyCoupon}
              removeCoupon={removeCoupon}
            />

            <Separator />

            <div className="rounded-xl border bg-muted/40 p-3 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ara toplam ({totalItems} ürün)</span>
                <span className="font-medium tabular-nums">{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Kargo</span>
                <span className="text-emerald-600 font-medium">Ücretsiz</span>
              </div>
              {appliedCoupon && discountAmount > 0 && (
                <div className="flex justify-between text-sm text-emerald-700 dark:text-emerald-400">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 shrink-0" />
                    İndirim ({appliedCoupon.code})
                  </span>
                  <span className="font-medium tabular-nums">−{formatPrice(discountAmount)}</span>
                </div>
              )}
              {appliedCoupon?.type === "free_shipping" && discountAmount === 0 && (
                <div className="flex justify-between text-sm text-emerald-700 dark:text-emerald-400">
                  <span>Kargo (kupon)</span>
                  <span className="font-medium">Ücretsiz</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-baseline gap-2 pt-0.5">
                <span className="text-lg font-bold">Toplam</span>
                <span className={cn("text-xl font-bold tabular-nums", discountAmount > 0 && "text-emerald-700 dark:text-emerald-400")}>
                  {formatPrice(finalPrice)}
                </span>
              </div>
              {discountAmount > 0 && (
                <p className="text-[11px] text-center text-emerald-700 dark:text-emerald-400 font-medium">
                  {formatPrice(discountAmount)} tasarruf
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 pt-0">
            <Button className="w-full h-11 gap-2 font-semibold rounded-xl" size="lg" asChild>
              <Link href="/checkout">
                Siparişi Tamamla
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full h-9 text-sm rounded-xl" asChild>
              <Link href="/urunler">Alışverişe Devam Et</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
