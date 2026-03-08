import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ProductDetail } from "./product-detail"
import { getProductById, products, getProductsByVendor, getProductsByCategory } from "@/lib/data/products"
import { getVendorById } from "@/lib/data/vendors"
import { getCategoryById } from "@/lib/data/categories"
import { ProductGrid } from "@/components/product/product-grid"

interface ProductPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params
  const product = getProductById(id)
  if (!product) return { title: "Ürün Bulunamadı" }
  return {
    title: product.name,
    description: product.description,
    openGraph: { title: product.name, description: product.description, images: product.images },
  }
}

export function generateStaticParams() {
  return products.map((product) => ({ id: product.id }))
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params
  const product = getProductById(id)
  if (!product) notFound()

  const vendor = getVendorById(product.vendorId)
  const category = getCategoryById(product.categoryId)

  // Related: same vendor first, then same category
  const vendorProducts = getProductsByVendor(product.vendorId).filter((p) => p.id !== product.id).slice(0, 4)
  const categoryProducts = vendorProducts.length < 4
    ? getProductsByCategory(product.categoryId)
        .filter((p) => p.id !== product.id && !vendorProducts.find((vp) => vp.id === p.id))
        .slice(0, 4 - vendorProducts.length)
    : []
  const related = [...vendorProducts, ...categoryProducts].slice(0, 4)

  return (
    <div className="container mx-auto px-4 py-8">
      <ProductDetail product={product} vendor={vendor} category={category} />

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold mb-6">{vendor?.name} Mağazasından Daha Fazlası</h2>
          <ProductGrid products={related} columns={4} />
        </section>
      )}
    </div>
  )
}

