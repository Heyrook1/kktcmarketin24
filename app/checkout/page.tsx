import type { Metadata } from "next"
import { CheckoutContent } from "./checkout-content"

export const metadata: Metadata = {
  title: "Ödeme",
  description: "Siparişinizi güvenle tamamlayın",
}

export default function CheckoutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Ödeme</h1>
      <CheckoutContent />
    </div>
  )
}
