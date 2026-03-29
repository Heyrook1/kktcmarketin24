import Link from "next/link"
import { ArrowRight, Sparkles, Clock, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProductGrid } from "@/components/product/product-grid"
import { createClient } from "@/lib/supabase/server"
import { normalizeCat } from "@/app/urunler/page"
import type { Product } from "@/lib/data/products"

/** Map a vendor_products DB row to the Product shape */
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
  const allImages = dbImages.length > 0 ? dbImages : p.image_url ? [p.image_url] : ["/placeholder.svg"]
  const stockCount = p.stock ?? 0
  return {
    id:           p.id,
    name:         p.name,
    slug:         p.id,
    description:  p.description ?? "",
    price:        Number(p.price),
    originalPrice: p.compare_price ? Number(p.compare_price) : undefined,
    images:       allImages,
    categoryId:   normalizeCat(p.category),
    vendorId:     p.store_id,
    rating:       0,
    reviewCount:  0,
    inStock:      stockCount > 0,
    stockCount,
    tags:         p.tags ?? [],
    featured:     false,
    createdAt:    p.created_at,
  }
}

interface ProductSectionProps {
  title: string
  description?: string
  viewAllHref?: string
  products: Product[]
  icon?: React.ReactNode
  badge?: string
}

function ProductSection({ title, description, viewAllHref, products, icon, badge }: ProductSectionProps) {
  if (products.length === 0) return null
  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 text-primary">
                {icon}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{title}</h2>
                {badge && (
                  <Badge variant="secondary" className="animate-pulse">
                    {badge}
                  </Badge>
                )}
              </div>
              {description && <p className="text-muted-foreground mt-0.5">{description}</p>}
            </div>
          </div>
          {viewAllHref && (
            <Button variant="ghost" asChild className="hidden sm:flex">
              <Link href={viewAllHref}>
                {"Tümünü Gör"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
        <ProductGrid products={products} showReviews showSizes showStock />
        {viewAllHref && (
          <div className="mt-6 sm:hidden">
            <Button variant="outline" className="w-full" asChild>
              <Link href={viewAllHref}>
                {"Tümünü Gör"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}

async function fetchProducts(opts: {
  orderBy?: string
  ascending?: boolean
  limit?: number
  hasSale?: boolean
}) {
  const supabase = await createClient()
  let query = supabase
    .from("vendor_products")
    .select("id, name, description, price, compare_price, category, image_url, images, tags, stock, created_at, store_id")
    .eq("is_active", true)
    .limit(opts.limit ?? 8)

  if (opts.hasSale) query = query.not("compare_price", "is", null)
  query = query.order(opts.orderBy ?? "created_at", { ascending: opts.ascending ?? false })

  const { data } = await query
  return (data ?? []).map((p) => toProduct(p as Parameters<typeof toProduct>[0]))
}

export async function FeaturedProducts() {
  const products = await fetchProducts({ hasSale: true, limit: 8 })
  return (
    <ProductSection
      title="Öne Çıkan Ürünler"
      description="En iyi satıcılarımızdan seçilmiş ürünler"
      viewAllHref="/urunler"
      icon={<Sparkles className="h-5 w-5" />}
      badge="Seçili"
      products={products}
    />
  )
}

export async function NewArrivals() {
  const products = await fetchProducts({ orderBy: "created_at", ascending: false, limit: 8 })
  return (
    <ProductSection
      title="Yeni Gelenler"
      description="Pazaryerimize yeni eklenen ürünler"
      viewAllHref="/urunler?sort=newest"
      icon={<Clock className="h-5 w-5" />}
      badge="Yeni"
      products={products}
    />
  )
}

export async function BestSellers() {
  const products = await fetchProducts({ orderBy: "view_count", ascending: false, limit: 8 })
  return (
    <ProductSection
      title="Çok Satanlar"
      description="Müşterilerimizin en çok tercih ettikleri"
      viewAllHref="/urunler?sort=popular"
      icon={<TrendingUp className="h-5 w-5" />}
      products={products}
    />
  )
}

export function PromoBanner() {
  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-accent p-8 md:p-12">
          <div className="relative z-10 max-w-lg">
            <span className="inline-block text-sm font-medium text-primary-foreground/80 mb-2">
              {"Özel Teklif"}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground">
              {"İlk Siparişinize %20 İndirim"}
            </h2>
            <p className="mt-2 text-primary-foreground/80">
              {"Herhangi bir satıcıdan alışveriş yapın ve ilk siparişinizde özel indirimlerden yararlanın. Sınırlı süre!"}
            </p>
            <Button size="lg" variant="secondary" className="mt-6" asChild>
              <Link href="/urunler">{"Hemen Alışveriş Yap"}</Link>
            </Button>
          </div>
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />
          <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-white/10" />
        </div>
      </div>
    </section>
  )
}
