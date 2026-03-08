import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { ProductGrid } from "@/components/product/product-grid"
import { getCategoryBySlug, categories } from "@/lib/data/categories"
import { getProductsByCategory } from "@/lib/data/products"

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const category = getCategoryBySlug(slug)

  if (!category) {
    return { title: "Category Not Found" }
  }

  return {
    title: category.name,
    description: category.description,
    openGraph: {
      title: `${category.name} - Marketin24`,
      description: category.description,
      images: [category.image],
    },
  }
}

export function generateStaticParams() {
  return categories.map((category) => ({
    slug: category.slug,
  }))
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const category = getCategoryBySlug(slug)

  if (!category) {
    notFound()
  }

  const products = getProductsByCategory(category.id)

  return (
    <div>
      {/* Hero Banner */}
      <div className="relative h-48 md:h-64 w-full overflow-hidden" style={{ position: "relative" }}>
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
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-white/80 mb-2">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/products" className="hover:text-white transition-colors">
                Products
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-white">{category.name}</span>
            </nav>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              {category.name}
            </h1>
            <p className="text-white/80 mt-1 max-w-xl">
              {category.description}
            </p>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            {products.length} {products.length === 1 ? "product" : "products"} found
          </p>
        </div>

        <ProductGrid products={products} />

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No products found in this category yet.
            </p>
            <Link
              href="/products"
              className="text-primary hover:underline mt-2 inline-block"
            >
              Browse all products
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
