import { Suspense } from "react"
import type { Metadata } from "next"
import { ProductsContent } from "./products-content"

export const metadata: Metadata = {
  title: "Tüm Ürünler",
  description: "Marketin24'te onaylı satıcılardan tüm ürünleri keşfedin",
}

export default function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Tüm Ürünler</h1>
        <p className="text-muted-foreground mt-1">
          Onaylı satıcılarımızdan ürünleri keşfedin
        </p>
      </div>
      <Suspense fallback={<div className="py-12 text-center text-muted-foreground">Ürünler yükleniyor...</div>}>
        <ProductsContent />
      </Suspense>
    </div>
  )
}
