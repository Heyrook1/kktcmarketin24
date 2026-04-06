"use client"

import Link from "next/link"
import Image from "next/image"
import {
  ShoppingBag, Plus, Minus, Trash2, Sparkles, Truck, Package,
} from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCartStore } from "@/lib/store/cart-store"
import { formatPrice } from "@/lib/format"
import { getVendorById } from "@/lib/data/vendors"
import { cn } from "@/lib/utils"
import { CartDiscountPicker } from "@/components/cart/cart-discount-picker"

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    getTotalPrice,
    getTotalItems,
    getDiscountAmount,
    getFinalPrice,
    getItemsByVendor,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCartStore()

  const itemsByVendor = getItemsByVendor()
  const subtotal = getTotalPrice()
  const discount = getDiscountAmount()
  const total = getFinalPrice()
  const totalItems = getTotalItems()
  const vendorCount = Object.keys(itemsByVendor).length

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="flex flex-col w-full sm:max-w-lg p-0 gap-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-br from-primary/5 via-background to-background">
          <SheetTitle className="flex items-center gap-2 text-left">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-lg font-bold tracking-tight">Sepetim</span>
              <span className="text-xs font-normal text-muted-foreground">
                {totalItems} ürün
                {vendorCount > 1 ? ` · ${vendorCount} mağaza` : ""}
              </span>
            </span>
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 py-16">
            <div className="rounded-2xl bg-secondary/80 p-8 ring-1 ring-border/60">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-semibold text-base">Sepetiniz boş</h3>
              <p className="text-sm text-muted-foreground max-w-[240px] mx-auto">
                Beğendiğiniz ürünleri ekleyin; indirimler burada görünür.
              </p>
            </div>
            <Button onClick={closeCart} asChild className="rounded-xl">
              <Link href="/urunler">Alışverişe başla</Link>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 min-h-0">
              <div className="flex flex-col gap-5 px-6 py-4">
                {Object.entries(itemsByVendor).map(([vendorId, vendorItems]) => {
                  const vendor = getVendorById(vendorId)
                  const lineSum = vendorItems.reduce((s, i) => s + i.product.price * i.quantity, 0)
                  return (
                    <div
                      key={vendorId}
                      className="rounded-2xl border bg-card/50 shadow-sm overflow-hidden"
                    >
                      <div className="flex items-center justify-between gap-2 px-3 py-2.5 bg-muted/40 border-b">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="relative h-8 w-8 rounded-full overflow-hidden bg-secondary ring-2 ring-background shrink-0">
                            {vendor?.logo?.trim() ? (
                              <Image
                                src={vendor.logo}
                                alt={vendor.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                {(vendor?.name ?? "?").slice(0, 1)}
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-semibold truncate">{vendor?.name ?? "Mağaza"}</span>
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                          {formatPrice(lineSum)}
                        </span>
                      </div>

                      <div className="p-2 space-y-2">
                        {vendorItems.map(({ product, quantity }) => {
                          const img = product.images?.[0]
                          return (
                            <div
                              key={product.id}
                              className="flex gap-3 p-2 rounded-xl hover:bg-muted/30 transition-colors"
                            >
                              <Link
                                href={`/products/${product.id}`}
                                className="relative h-[72px] w-[72px] flex-shrink-0 rounded-lg overflow-hidden bg-secondary border"
                                onClick={closeCart}
                              >
                                {img ? (
                                  <Image
                                    src={img}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <Package className="h-8 w-8 text-muted-foreground/40" />
                                  </div>
                                )}
                              </Link>

                              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                <div>
                                  <Link
                                    href={`/products/${product.id}`}
                                    className="font-medium text-sm line-clamp-2 leading-snug hover:text-primary transition-colors"
                                    onClick={closeCart}
                                  >
                                    {product.name}
                                  </Link>
                                  <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                                    {formatPrice(product.price)} × {quantity}
                                  </p>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                  <div className="inline-flex items-center rounded-lg border bg-background h-8">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-none rounded-l-lg"
                                      onClick={() => updateQuantity(product.id, quantity - 1)}
                                      aria-label="Azalt"
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-8 text-center text-xs font-semibold tabular-nums">
                                      {quantity}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-none rounded-r-lg"
                                      onClick={() => updateQuantity(product.id, quantity + 1)}
                                      aria-label="Artır"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-sm font-bold tabular-nums">
                                      {formatPrice(product.price * quantity)}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                      onClick={() => removeItem(product.id)}
                                      aria-label="Kaldır"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-6 pt-4 pb-6 space-y-4 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.12)]">
              <CartDiscountPicker
                subtotal={subtotal}
                appliedCoupon={appliedCoupon}
                applyCoupon={applyCoupon}
                removeCoupon={removeCoupon}
              />

              <div className="rounded-2xl border bg-muted/30 p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ara toplam</span>
                  <span className="font-medium tabular-nums">{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && appliedCoupon && (
                  <div className="flex justify-between text-sm text-emerald-700 dark:text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 shrink-0" />
                      İndirim ({appliedCoupon.code})
                    </span>
                    <span className="font-medium tabular-nums">−{formatPrice(discount)}</span>
                  </div>
                )}
                {appliedCoupon?.type === "free_shipping" && discount === 0 && (
                  <div className="flex justify-between text-sm text-emerald-700 dark:text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 shrink-0" />
                      Kargo
                    </span>
                    <span className="font-medium">Ücretsiz</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-baseline gap-3">
                  <span className="text-base font-bold">Toplam</span>
                  <span
                    className={cn(
                      "text-xl font-bold tabular-nums tracking-tight",
                      discount > 0 && "text-emerald-700 dark:text-emerald-400",
                    )}
                  >
                    {formatPrice(total)}
                  </span>
                </div>
                {discount > 0 && (
                  <p className="text-[11px] text-center text-emerald-700/90 dark:text-emerald-400/90 font-medium">
                    {formatPrice(discount)} tasarruf
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button size="lg" className="w-full rounded-xl h-12 font-semibold shadow-md" asChild onClick={closeCart}>
                  <Link href="/checkout">Ödemeye geç</Link>
                </Button>
                <Button variant="outline" size="lg" className="w-full rounded-xl" asChild onClick={closeCart}>
                  <Link href="/cart">Sepeti detaylı gör</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
