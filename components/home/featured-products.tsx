"use client"

import Link from "next/link"
import { ArrowRight, Sparkles, Clock, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProductGrid } from "@/components/product/product-grid"
import { getFeaturedProducts, getNewArrivals, getBestSellers } from "@/lib/data/products"
import { useT } from "@/lib/store/language-store"

interface ProductSectionProps {
  title: string
  description?: string
  viewAllHref?: string
  children: React.ReactNode
  icon?: React.ReactNode
  badge?: string
}

function ProductSection({ title, description, viewAllHref, children, icon, badge }: ProductSectionProps) {
  const t = useT()
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
            <Button variant="ghost" asChild className="hidden sm:flex cta-arrow">
              <Link href={viewAllHref}>
                {t.common.viewAll}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
        {children}
        {viewAllHref && (
          <div className="mt-6 sm:hidden">
            <Button variant="outline" className="w-full cta-arrow" asChild>
              <Link href={viewAllHref}>
                {t.common.viewAll}
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
  const t = useT()
  const products = getFeaturedProducts().slice(0, 8)
  return (
    <ProductSection
      title={t.products.featured}
      description={t.products.featuredDesc}
      viewAllHref="/products?featured=true"
      icon={<Sparkles className="h-5 w-5" />}
      badge={t.products.featuredBadge}
    >
      <ProductGrid products={products} showReviews showSizes showStock />
    </ProductSection>
  )
}

export function NewArrivals() {
  const t = useT()
  const products = getNewArrivals(8)
  return (
    <ProductSection
      title={t.products.newArrivals}
      description={t.products.newArrivalsDesc}
      viewAllHref="/products?sort=newest"
      icon={<Clock className="h-5 w-5" />}
      badge={t.products.newArrivalsBadge}
    >
      <ProductGrid products={products} showReviews showSizes showStock />
    </ProductSection>
  )
}

export function BestSellers() {
  const t = useT()
  const products = getBestSellers(8)
  return (
    <ProductSection
      title={t.products.bestSellers}
      description={t.products.bestSellersDesc}
      viewAllHref="/products?sort=popular"
      icon={<TrendingUp className="h-5 w-5" />}
    >
      <ProductGrid products={products} showReviews showSizes showStock />
    </ProductSection>
  )
}

export function PromoBanner() {
  const t = useT()
  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-accent p-8 md:p-12">
          <div className="relative z-10 max-w-lg">
            <span className="inline-block text-sm font-medium text-primary-foreground/80 mb-2">
              {t.promo.specialOffer}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground">
              {t.promo.firstOrder}
            </h2>
            <p className="mt-2 text-primary-foreground/80">
              {t.promo.firstOrderDesc}
            </p>
            <Button size="lg" variant="secondary" className="mt-6 cta-arrow" asChild>
              <Link href="/products">{t.promo.shopNow}</Link>
            </Button>
          </div>
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />
          <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-white/10" />
        </div>
      </div>
    </section>
  )
}
