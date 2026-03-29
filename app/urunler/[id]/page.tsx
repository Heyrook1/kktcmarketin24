import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProductDetail } from "@/app/products/[id]/product-detail"
import { ProductGrid } from "@/components/product/product-grid"
import { normalizeCat } from "@/app/urunler/page"
import { getVendorById } from "@/lib/data/vendors"
import { getCategoryById } from "@/lib/data/categories"
import type { Product } from "@/lib/data/products"

interface Props {
  params: Promise<{ id: string }>
}

export const revalidate = 60

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from("vendor_products")
    .select("name, description, image_url")
    .eq("id", id)
    .single()
  if (!data) return { title: "Ürün Bulunamadı | Marketin24" }
  return {
    title: `${data.name} | Marketin24`,
    description: data.description ?? undefined,
    openGraph: {
      title: data.name,
      description: data.description ?? undefined,
      images: data.image_url ? [data.image_url] : [],
    },
  }
}

/** Map a DB row → Product shape that ProductDetail / ProductGrid accept */
function toProduct(p: {
  id: string
  name: string
  description: string | null
  price: number
  compare_price: number | null
  category: string | null
  image_url: string | null
  images: string[] | null
  tags: string[] | null
  stock: number | null
  created_at: string
  store_id: string
}): Product {
  const dbImages: string[] = p.images?.length ? p.images : []
  const allImages = dbImages.length > 0
    ? dbImages
    : p.image_url
      ? [p.image_url]
      : ["/placeholder.svg"]

  return {
    id:           p.id,
    name:         p.name,
    slug:         p.id,                            // use UUID as slug for DB products
    description:  p.description ?? "",
    price:        Number(p.price),
    originalPrice: p.compare_price ? Number(p.compare_price) : undefined,
    images:       allImages,
    categoryId:   normalizeCat(p.category),
    vendorId:     p.store_id,
    rating:       0,
    reviewCount:  0,
    inStock:      (p.stock ?? 0) > 0,
    stockCount:   p.stock ?? 0,
    tags:         p.tags ?? [],
    featured:     false,
    createdAt:    p.created_at,
  }
}

export default async function UrunlerDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: raw, error } = await supabase
    .from("vendor_products")
    .select(`
      id, name, description, price, compare_price,
      category, image_url, images, tags, stock,
      is_active, created_at, store_id,
      vendor_stores ( id, name, slug, description, logo_url, is_verified )
    `)
    .eq("id", id)
    .eq("is_active", true)
    .single()

  if (error || !raw) notFound()

  // Increment view count (fire-and-forget)
  supabase.rpc("increment_product_views", { product_id: id }).then(() => {})

  const storeRaw = Array.isArray(raw.vendor_stores) ? raw.vendor_stores[0] : raw.vendor_stores

  const product = toProduct(raw as Parameters<typeof toProduct>[0])

  // Try to get vendor from static data first (has more detail); fall back to DB row
  const vendor = getVendorById(raw.store_id) ?? (storeRaw ? {
    id:           storeRaw.id,
    name:         storeRaw.name,
    slug:         storeRaw.slug,
    description:  storeRaw.description ?? "",
    logo:         storeRaw.logo_url ?? "",
    rating:       0,
    reviewCount:  0,
    productCount: 0,
    isVerified:   storeRaw.is_verified ?? false,
    createdAt:    "",
  } : undefined)

  const category = getCategoryById(product.categoryId)

  // Related products — same category, exclude current
  const { data: relatedRaw } = await supabase
    .from("vendor_products")
    .select("id, name, description, price, compare_price, category, image_url, images, tags, stock, created_at, store_id")
    .eq("is_active", true)
    .eq("category", raw.category)
    .neq("id", id)
    .limit(4)

  const related: Product[] = (relatedRaw ?? []).map((r) =>
    toProduct(r as Parameters<typeof toProduct>[0])
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <ProductDetail product={product} vendor={vendor} category={category} />
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold mb-6">
            {storeRaw?.name ? `${storeRaw.name} Mağazasından Daha Fazlası` : "Benzer Ürünler"}
          </h2>
          <ProductGrid products={related} columns={4} />
        </section>
      )}
    </div>
  )
}
