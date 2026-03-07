"use client"

import Link from "next/link"
import Image from "next/image"
import { ShoppingBag, X, Plus, Minus, Trash2 } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCartStore } from "@/lib/store/cart-store"
import { formatPrice } from "@/lib/format"
import { getVendorById } from "@/lib/data/vendors"

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    getTotalPrice,
    getItemsByVendor,
  } = useCartStore()

  const itemsByVendor = getItemsByVendor()
  const totalPrice = getTotalPrice()

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="flex flex-col w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Shopping Cart ({items.length} {items.length === 1 ? "item" : "items"})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-12">
            <div className="rounded-full bg-secondary p-6">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold">Your cart is empty</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Add items to get started
              </p>
            </div>
            <Button onClick={closeCart} asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="flex flex-col gap-6 py-4">
                {Object.entries(itemsByVendor).map(([vendorId, vendorItems]) => {
                  const vendor = getVendorById(vendorId)
                  return (
                    <div key={vendorId}>
                      {/* Vendor Header */}
                      <div className="flex items-center gap-2 mb-3">
                        {vendor && (
                          <>
                            <div className="relative h-6 w-6 rounded-full overflow-hidden bg-secondary">
                              <Image
                                src={vendor.logo}
                                alt={vendor.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <span className="text-sm font-medium">{vendor.name}</span>
                          </>
                        )}
                      </div>

                      {/* Items */}
                      <div className="flex flex-col gap-3">
                        {vendorItems.map(({ product, quantity }) => (
                          <div
                            key={product.id}
                            className="flex gap-3 p-3 rounded-lg border bg-card"
                          >
                            {/* Image */}
                            <div className="relative h-20 w-20 flex-shrink-0 rounded-md overflow-hidden bg-secondary">
                              <Image
                                src={product.images[0]}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <Link
                                href={`/products/${product.id}`}
                                className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors"
                                onClick={closeCart}
                              >
                                {product.name}
                              </Link>
                              <p className="text-sm font-semibold mt-1">
                                {formatPrice(product.price)}
                              </p>

                              {/* Quantity controls */}
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() =>
                                      updateQuantity(product.id, quantity - 1)
                                    }
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-8 text-center text-sm font-medium">
                                    {quantity}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() =>
                                      updateQuantity(product.id, quantity + 1)
                                    }
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  onClick={() => removeItem(product.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            <Separator />

            {/* Footer */}
            <div className="flex flex-col gap-4 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{formatPrice(totalPrice)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Shipping and taxes calculated at checkout
              </p>
              <div className="flex flex-col gap-2">
                <Button size="lg" asChild onClick={closeCart}>
                  <Link href="/checkout">Proceed to Checkout</Link>
                </Button>
                <Button variant="outline" size="lg" asChild onClick={closeCart}>
                  <Link href="/cart">View Cart</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
