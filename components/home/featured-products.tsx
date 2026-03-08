import Link from "next/link"
import { ArrowRight, Sparkles, Clock, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProductGrid } from "@/components/product/product-grid"
import { getFeaturedProducts, getNewArrivals, getBestSellers } from "@/lib/data/products"

interface ProductSectionProps {
  title: string
  description?: string
  viewAllHref?: string
  children: React.ReactNode
  icon?: React.ReactNode
  badge?: string
}

function ProductSection({ title, description, viewAllHref, children, icon, badge }: ProductSectionProps) {
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
              {description && (
                <p className="text-muted-foreground mt-0.5">{description}</p>
              )}
            </div>
          </div>
          {viewAllHref && (
            <Button variant="ghost" asChild className="hidden sm:flex">
              <Link href={viewAllHref}>
                Tümünü Gör
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
                Tümünü Gör
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
      title="Öne Çıkan Ürünler"
      description="En iyi satıcılarımızdan seçilmiş ürünler"
      viewAllHref="/products?featured=true"
      icon={<Sparkles className="h-5 w-5" />}
      badge="Seçili"
    >
      <ProductGrid products={products} showReviews showSizes showStock />
    </ProductSection>
  )
}

export function NewArrivals() {
  const products = getNewArrivals(8)

  return (
    <ProductSection
      title="Yeni Gelenler"
      description="Pazaryerimize yeni eklenen ürünler"
      viewAllHref="/products?sort=newest"
      icon={<Clock className="h-5 w-5" />}
      badge="Yeni"
    >
      <ProductGrid products={products} showReviews showSizes showStock />
    </ProductSection>
  )
}

export function BestSellers() {
  const products = getBestSellers(8)

  return (
    <ProductSection
      title="Çok Satanlar"
      description="Müşterilerimizin en çok tercih ettikleri"
      viewAllHref="/products?sort=popular"
      icon={<TrendingUp className="h-5 w-5" />}
    >
      <ProductGrid products={products} showReviews showSizes showStock />
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
              Özel Teklif
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground">
              İlk Siparişinize %20 İndirim
            </h2>
            <p className="mt-2 text-primary-foreground/80">
              Herhangi bir satıcıdan alışveriş yapın ve ilk siparişinizde özel indirimlerden yararlanın. Sınırlı süre!
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="mt-6"
              asChild
            >
              <Link href="/products">Hemen Alışveriş Yap</Link>
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
