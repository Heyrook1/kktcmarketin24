import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ProductDetail } from "./product-detail"
import { getProductById, products, getProductsByVendor } from "@/lib/data/products"
import { getVendorById } from "@/lib/data/vendors"
import { getCategoryById } from "@/lib/data/categories"
import { ProductGrid } from "@/components/product/product-grid"

interface ProductPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params
  const product = getProductById(id)

  if (!product) {
    return { title: "Product Not Found" }
  }

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.images,
    },
  }
}

export function generateStaticParams() {
  return products.map((product) => ({
    id: product.id,
  }))
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params
  const product = getProductById(id)

  if (!product) {
    notFound()
  }

  const vendor = getVendorById(product.vendorId)
  const category = getCategoryById(product.categoryId)
  
  // Get related products (same vendor, excluding current)
  const relatedProducts = getProductsByVendor(product.vendorId)
    .filter((p) => p.id !== product.id)
    .slice(0, 4)

  return (
    <div className="container mx-auto px-4 py-8">
      <ProductDetail product={product} vendor={vendor} category={category} />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6">More from {vendor?.name}</h2>
          <ProductGrid products={relatedProducts} columns={4} />
        </section>
      )}
    </div>
  )
}
