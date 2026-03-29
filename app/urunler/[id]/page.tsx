import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProductDetail } from "@/app/products/[id]/product-detail"
import { ProductGrid } from "@/components/product/product-grid"
import { normalizeCat } from "@/app/urunler/page"
import type { Product } from "@/lib/data/products"
import type { Vendor } from "@/lib/data/vendors"
import type { Category } from "@/lib/data/categories"
import { categories } from "@/lib/data/categories"

interface Props {
  params: Promise<{ id: string }>
}

export const revalidate = 3600

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

export default async function UrunlerDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: raw, error } = await supabase
    .from("vendor_products")
    .select(`
      id, name, description, price, compare_price,
      category, image_url, tags, is_active, stock, created_at, store_id,
      vendor_stores ( id, name, slug, description, logo_url, is_verified )
    `)
    .eq("id", id)
    .eq("is_active", true)
    .single()

  if (error || !raw) notFound()

  const storeRaw = Array.isArray(raw.vendor_stores) ? raw.vendor_stores[0] : raw.vendor_stores
  const categoryId = normalizeCat(raw.category)
  const catMeta = categories.find((c) => c.id === categoryId)

  const product: Product = {
    id:           raw.id,
    name:         raw.name,
    description:  raw.description ?? "",
    price:        Number(raw.price),
    comparePrice: raw.compare_price ? Number(raw.compare_price) : undefined,
    categoryId,
    image:        raw.image_url ?? "/placeholder.svg",
    images:       raw.image_url ? [raw.image_url] : [],
    tags:         (raw.tags as string[]) ?? [],
    vendorId:     raw.store_id,
    vendorName:   storeRaw?.name ?? "",
    stock:        raw.stock ?? 0,
    featured:     false,
    rating:       0,
    reviewCount:  0,
    createdAt:    raw.created_at,
    searchAliases:"",
  }

  const vendor: Vendor | undefined = storeRaw
    ? {
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
      }
    : undefined

  const category: Category | undefined = catMeta

  // Related products — same category, same store first
  const { data: relatedRaw } = await supabase
    .from("vendor_products")
    .select("id, name, price, compare_price, category, image_url, tags, stock, created_at, store_id")
    .eq("is_active", true)
    .neq("id", id)
    .eq("category", raw.category)
    .limit(8)

  const related: Product[] = (relatedRaw ?? []).map((p) => ({
    id:           p.id,
    name:         p.name,
    description:  "",
    price:        Number(p.price),
    comparePrice: p.compare_price ? Number(p.compare_price) : undefined,
    categoryId:   normalizeCat(p.category),
    image:        p.image_url ?? "/placeholder.svg",
    images:       p.image_url ? [p.image_url] : [],
    tags:         (p.tags as string[]) ?? [],
    vendorId:     p.store_id,
    vendorName:   "",
    stock:        p.stock ?? 0,
    featured:     false,
    rating:       0,
    reviewCount:  0,
    createdAt:    p.created_at,
    searchAliases:"",
  }))

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
