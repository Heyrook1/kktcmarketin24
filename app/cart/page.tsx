import type { Metadata } from "next"
import { CartContent } from "./cart-content"

export const metadata: Metadata = {
  title: "Alışveriş Sepeti",
  description: "Sepetinizi inceleyin ve ödemeye geçin",
}

export default function CartPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Alışveriş Sepeti</h1>
      <CartContent />
    </div>
  )
}
