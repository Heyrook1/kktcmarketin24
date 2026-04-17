import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { ProductGrid } from "@/components/product/product-grid"
import { getCategoryBySlug, categories } from "@/lib/data/categories"
import { createClient } from "@/lib/supabase/server"
import { mapVendorProductRowToListProduct } from "@/lib/map-vendor-product-list"
import { isPublicCatalogProduct } from "@/lib/public-product-filter"
import type { Product } from "@/lib/data/products"

export const dynamic = "force-dynamic"

interface CategoryPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ sub?: string; sort?: string }>
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const category = getCategoryBySlug(slug)

  if (!category) return { title: "Kategori Bulunamadı" }

  return {
    title: `${category.name} | Marketin24`,
    description: category.description,
    openGraph: {
      title: `${category.name} - Marketin24`,
      description: category.description,
      images: [category.image],
    },
  }
}

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }))
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params
  const { sub, sort } = await searchParams
  const category = getCategoryBySlug(slug)

  if (!category) notFound()

  const supabase = await createClient()
  const { data: rawRows, error } = await supabase
    .from("vendor_products")
    .select(
      "id, name, description, price, compare_price, category, image_url, images, tags, stock, created_at, store_id, vendor_stores(id, name, slug)"
    )
    .eq("is_active", true)
    .gt("stock", 0)
    .eq("category", category.id)
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) console.error("[category/page] DB error:", error.message)

  let products: Product[] = (rawRows ?? [])
    .filter((row) =>
      isPublicCatalogProduct({ stock: row.stock, tags: row.tags, name: row.name })
    )
    .map((p) =>
      mapVendorProductRowToListProduct(p as Parameters<typeof mapVendorProductRowToListProduct>[0])
    )

  if (sub) {
    products = products.filter((p) => p.tags?.includes(sub))
  }

  switch (sort) {
    case "price-low":
      products = [...products].sort((a, b) => a.price - b.price)
      break
    case "price-high":
      products = [...products].sort((a, b) => b.price - a.price)
      break
    case "rating":
      products = [...products].sort((a, b) => b.rating - a.rating)
      break
    case "popular":
      products = [...products].sort((a, b) => b.reviewCount - a.reviewCount)
      break
    default:
      products = [...products].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
  }

  return (
    <div>
      <div className="relative h-48 md:h-64 w-full overflow-hidden">
        <Image
          src={category.image}
          alt={category.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto px-4 pb-6 md:pb-8">
            <nav className="flex items-center gap-2 text-sm text-white/80 mb-2">
              <Link href="/" className="hover:text-white transition-colors">
                Anasayfa
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/urunler" className="hover:text-white transition-colors">
                Ürünler
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-white">{category.name}</span>
            </nav>
            <h1 className="text-3xl md:text-4xl font-bold text-white">{category.name}</h1>
            <p className="text-white/80 mt-1 max-w-xl">{category.description}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-6">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground font-medium mr-1">Sırala:</span>
          {[
            { label: "En Yeni", value: undefined },
            { label: "Fiyat: Artan", value: "price-low" },
            { label: "Fiyat: Azalan", value: "price-high" },
            { label: "En Popüler", value: "popular" },
            { label: "En Yüksek Puan", value: "rating" },
          ].map(({ label, value }) => {
            const isActive = (sort ?? undefined) === value
            const href = value
              ? `/category/${slug}?sort=${value}${sub ? `&sub=${sub}` : ""}`
              : `/category/${slug}${sub ? `?sub=${sub}` : ""}`
            return (
              <Link
                key={label}
                href={href}
                className={`rounded-full px-3 py-1 border transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                {label}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <p className="text-sm text-muted-foreground mb-6">{products.length} ürün bulundu</p>

        <ProductGrid products={products} />

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Bu kategoride henüz ürün bulunmuyor.</p>
            <Link href="/urunler" className="text-primary hover:underline mt-2 inline-block">
              Tüm ürünlere göz at
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
