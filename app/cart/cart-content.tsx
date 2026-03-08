"use client"

import Link from "next/link"
import Image from "next/image"
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useCartStore } from "@/lib/store/cart-store"
import { formatPrice } from "@/lib/format"
import { getVendorById } from "@/lib/data/vendors"

export function CartContent() {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getItemsByVendor,
  } = useCartStore()

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
        {Object.entries(itemsByVendor).map(([vendorId, vendorItems]) => {
          const vendor = getVendorById(vendorId)
          return (
            <Card key={vendorId}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  {vendor && (
                    <>
                      <div className="relative h-8 w-8 rounded-full overflow-hidden bg-secondary" style={{ position: "relative" }}>
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
                      className="relative h-24 w-24 flex-shrink-0 rounded-lg overflow-hidden bg-secondary block"
                      style={{ position: "relative" }}
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
              <span className="text-green-600">Ücretsiz</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Toplam</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Vergiler ödeme sayfasında hesaplanacaktır
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" size="lg" asChild>
              <Link href="/checkout">
                Ödemeye Geç
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
