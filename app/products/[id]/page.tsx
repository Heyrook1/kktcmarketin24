import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ProductDetail } from "./product-detail"
import {
  getProductById, products,
  getProductsByVendor, getProductsByCategory,
} from "@/lib/data/products"
import { getVendorById } from "@/lib/data/vendors"
import { getCategoryById } from "@/lib/data/categories"
import { ProductGrid } from "@/components/product/product-grid"
import { createClient } from "@/lib/supabase/server"
import { normalizeCat } from "@/lib/normalize-product-category"
import type { Product } from "@/lib/data/products"

export const dynamic = "force-dynamic"

interface ProductPageProps {
  params: Promise<{ id: string }>
}

/** Map a vendor_products DB row to the Product shape */
async function getProductFromDB(id: string): Promise<Product | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("vendor_products")
    .select("id, name, description, price, compare_price, category, image_url, images, tags, stock, created_at, store_id, vendor_stores(id,name,slug)")
    .eq("id", id)
    .maybeSingle()

  if (error || !data) return null

  const dbImages: string[] = (data.images as string[] | null) ?? []
  const allImages = dbImages.length > 0
    ? dbImages
    : data.image_url ? [data.image_url] : ["/placeholder.svg"]
  const stockCount = typeof data.stock === "number" ? data.stock : 0

  return {
    id:           data.id,
    name:         data.name,
    slug:         data.id,
    description:  data.description ?? "",
    price:        Number(data.price),
    originalPrice: data.compare_price ? Number(data.compare_price) : undefined,
    images:       allImages,
    categoryId:   normalizeCat(data.category ?? "other"),
    vendorId:     data.store_id,
    rating:       0,
    reviewCount:  0,
    inStock:      stockCount > 0,
    stockCount,
    tags:         (data.tags as string[]) ?? [],
    featured:     false,
    createdAt:    data.created_at,
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params
  const staticProduct = getProductById(id)
  if (staticProduct) {
    return {
      title: staticProduct.name,
      description: staticProduct.description,
      openGraph: { title: staticProduct.name, description: staticProduct.description, images: staticProduct.images },
    }
  }
  // Fall back to DB
  const dbProduct = await getProductFromDB(id)
  if (!dbProduct) return { title: "Ürün Bulunamadı" }
  return {
    title: `${dbProduct.name} | Marketin24`,
    description: dbProduct.description,
    openGraph: { title: dbProduct.name, description: dbProduct.description, images: dbProduct.images },
  }
}

export function generateStaticParams() {
  return products.map((product) => ({ id: product.id }))
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params

  // 1. Try static mock data first (legacy IDs like "tz-001")
  const staticProduct = getProductById(id)
  if (staticProduct) {
    const vendor   = getVendorById(staticProduct.vendorId)
    const category = getCategoryById(staticProduct.categoryId)
    const vendorProducts  = getProductsByVendor(staticProduct.vendorId).filter((p) => p.id !== id).slice(0, 4)
    const categoryProducts = vendorProducts.length < 4
      ? getProductsByCategory(staticProduct.categoryId)
          .filter((p) => p.id !== id && !vendorProducts.find((vp) => vp.id === p.id))
          .slice(0, 4 - vendorProducts.length)
      : []
    const related = [...vendorProducts, ...categoryProducts].slice(0, 4)
    return (
      <div className="container mx-auto px-4 py-8">
        <ProductDetail product={staticProduct} vendor={vendor} category={category} />
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-bold mb-6">{vendor?.name} Mağazasından Daha Fazlası</h2>
            <ProductGrid products={related} columns={4} />
          </section>
        )}
      </div>
    )
  }

  // 2. Fall back to Supabase for DB products (UUID IDs)
  const product = await getProductFromDB(id)
  if (!product) notFound()

  // Increment view count
  const supabase = await createClient()
  supabase.rpc("increment_product_views", { product_id: id }).then(() => {})

  // Related DB products — same category
  const { data: relatedRaw } = await supabase
    .from("vendor_products")
    .select("id, name, description, price, compare_price, category, image_url, images, tags, stock, created_at, store_id")
    .eq("is_active", true)
    .eq("category", product.categoryId)
    .neq("id", id)
    .limit(4)

  const related: Product[] = await Promise.all(
    (relatedRaw ?? []).map((r) => getProductFromDB(r.id).then((p) => p!))
  ).then((arr) => arr.filter(Boolean) as Product[])

  const vendor   = getVendorById(product.vendorId)
  const category = getCategoryById(product.categoryId)

  return (
    <div className="container mx-auto px-4 py-8">
      <ProductDetail product={product} vendor={vendor} category={category} />
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold mb-6">Benzer Ürünler</h2>
          <ProductGrid products={related} columns={4} />
        </section>
      )}
    </div>
  )
}

