import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductGrid } from "@/components/product/product-grid"
import { getFeaturedProducts, getNewArrivals, getBestSellers } from "@/lib/data/products"

interface ProductSectionProps {
  title: string
  description?: string
  viewAllHref?: string
  children: React.ReactNode
}

function ProductSection({ title, description, viewAllHref, children }: ProductSectionProps) {
  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">{title}</h2>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {viewAllHref && (
            <Button variant="ghost" asChild className="hidden sm:flex">
              <Link href={viewAllHref}>
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
        {children}
        {viewAllHref && (
          <div className="mt-6 sm:hidden">
            <Button variant="outline" className="w-full" asChild>
              <Link href={viewAllHref}>
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}

export function FeaturedProducts() {
  const products = getFeaturedProducts().slice(0, 8)

  return (
    <ProductSection
      title="Featured Products"
      description="Handpicked products from our top vendors"
      viewAllHref="/products?featured=true"
    >
      <ProductGrid products={products} />
    </ProductSection>
  )
}

export function NewArrivals() {
  const products = getNewArrivals(8)

  return (
    <ProductSection
      title="New Arrivals"
      description="The latest additions to our marketplace"
      viewAllHref="/products?sort=newest"
    >
      <ProductGrid products={products} />
    </ProductSection>
  )
}

export function BestSellers() {
  const products = getBestSellers(8)

  return (
    <ProductSection
      title="Best Sellers"
      description="Most loved by our customers"
      viewAllHref="/products?sort=popular"
    >
      <ProductGrid products={products} />
    </ProductSection>
  )
}

export function PromoBanner() {
  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-accent p-8 md:p-12">
          <div className="relative z-10 max-w-lg">
            <span className="inline-block text-sm font-medium text-primary-foreground/80 mb-2">
              Special Offer
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground">
              Get 20% Off Your First Order
            </h2>
            <p className="mt-2 text-primary-foreground/80">
              Shop from any vendor and enjoy exclusive discounts on your first purchase. Limited time only!
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="mt-6"
              asChild
            >
              <Link href="/products">Shop Now</Link>
            </Button>
          </div>
          {/* Decorative elements */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />
          <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-white/10" />
        </div>
      </div>
    </section>
  )
}
