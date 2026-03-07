import type { Metadata } from "next"
import { CartContent } from "./cart-content"

export const metadata: Metadata = {
  title: "Shopping Cart",
  description: "Review your shopping cart and proceed to checkout",
}

export default function CartPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      <CartContent />
    </div>
  )
}
